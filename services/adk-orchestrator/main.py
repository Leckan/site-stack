"""FastAPI + SSE / WebSocket Streaming Server for SiteStack Google ADK Multi-Agent Orchestrator."""

from __future__ import annotations

import json
import os
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agents.supervisor import DevelopmentFeasibilityCoordinator
from config import settings

app = FastAPI(
    title="SiteStack Google ADK Multi-Agent Orchestrator",
    version="1.0.0",
    description="Coordinates ZoningEntitlementAgent, FinancialProFormaAgent, and TransitSiteImpactAgent on Vertex AI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

coordinator = DevelopmentFeasibilityCoordinator()


class FeasibilityRequest(BaseModel):
    """Input payload for running or streaming an ADK feasibility analysis."""

    id: str = Field(default="parcel-ss-1")
    account_id: str = Field(default="13-00984210")
    county_fips: str = Field(default="24031")
    address: str = Field(default="8400 Bonifant St, Silver Spring, MD 20910")
    zip_code: str = Field(default="20910")
    zoning_code: str = Field(default="CR-3.0 C-2.0 R-2.75 H-90 T")
    lot_sqft: int = Field(default=42500)
    assessed_value_usd: int = Field(default=3850000)
    nearest_station: str = Field(default="Silver Spring Transit Center (WMATA Red / MARC / Purple Line)")
    distance_to_transit_miles: float = Field(default=0.28)
    chesapeake_critical_area: bool = Field(default=False)
    base_allowable_far: float = Field(default=3.0)
    max_height_feet: int = Field(default=90)
    target_ami_mix_pct: float = Field(default=40.0)
    weighted_ami_tier: int = Field(default=60)
    construction_type: str = Field(default="TYPE_V_WOOD")
    parking_ratio: float | None = Field(default=None)


@app.get("/health")
async def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "sitestack-adk-orchestrator",
        "model": settings.adk_model_name,
        "agents": [
            coordinator.name,
            coordinator.zoning_agent.name,
            coordinator.proforma_agent.name,
            coordinator.transit_agent.name,
        ],
    }


@app.post("/api/feasibility/evaluate")
async def evaluate_feasibility(req: FeasibilityRequest) -> dict[str, Any]:
    """Run synchronous multi-agent feasibility orchestration and return deterministic JSON."""
    return await coordinator.run_feasibility(
        parcel=req.model_dump(),
        target_ami_mix_pct=req.target_ami_mix_pct,
        weighted_ami_tier=req.weighted_ami_tier,
        construction_type=req.construction_type,
        parking_ratio=req.parking_ratio,
    )


@app.post("/api/feasibility/stream")
async def stream_feasibility(req: FeasibilityRequest) -> EventSourceResponse:
    """Stream real-time ADK agent reasoning tokens, tool invocations, and final synthesis over SSE."""

    async def event_generator():
        async for item in coordinator.stream_feasibility_steps(
            parcel=req.model_dump(),
            target_ami_mix_pct=req.target_ami_mix_pct,
            weighted_ami_tier=req.weighted_ami_tier,
            construction_type=req.construction_type,
            parking_ratio=req.parking_ratio,
        ):
            yield {
                "event": item["event"],
                "data": json.dumps(item["data"]),
            }

    return EventSourceResponse(event_generator())


@app.websocket("/ws/feasibility")
async def websocket_feasibility(websocket: WebSocket) -> None:
    """WebSocket endpoint streaming step-by-step ADK agent reasoning in real time."""
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        payload = json.loads(raw) if raw else {}
        req = FeasibilityRequest(**payload)
        async for item in coordinator.stream_feasibility_steps(
            parcel=req.model_dump(),
            target_ami_mix_pct=req.target_ami_mix_pct,
            weighted_ami_tier=req.weighted_ami_tier,
            construction_type=req.construction_type,
            parking_ratio=req.parking_ratio,
        ):
            await websocket.send_json(item)
        await websocket.close()
    except WebSocketDisconnect:
        return


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8002")), reload=False)

