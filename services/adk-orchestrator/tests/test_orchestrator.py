"""Automated tests for Google ADK Multi-Agent Orchestrator & FastAPI SSE/REST routes."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from agents.supervisor import DevelopmentFeasibilityCoordinator
from main import app


@pytest.mark.asyncio
async def test_coordinator_feasibility_silver_spring() -> None:
    coordinator = DevelopmentFeasibilityCoordinator()
    parcel = {
        "id": "parcel-ss-1",
        "account_id": "13-00984210",
        "county_fips": "24031",
        "zip_code": "20910",
        "zoning_code": "CR-3.0 C-2.0 R-2.75 H-90 T",
        "lot_sqft": 42500,
        "assessed_value_usd": 3850000,
        "nearest_station": "Silver Spring Transit Center",
        "distance_to_transit_miles": 0.28,
        "chesapeake_critical_area": False,
        "base_allowable_far": 3.0,
        "max_height_feet": 90,
    }
    res = await coordinator.run_feasibility(parcel, target_ami_mix_pct=40.0, weighted_ami_tier=60)
    assert res["status"] == "COMPLETED"
    assert res["todBonusApplied"] is True
    assert res["allowableFar"] == 3.9
    assert res["totalUnits"] > 100
    assert res["proForma"]["capitalStack"]["dscrYear1"] >= 1.20
    assert len(res["proForma"]["thirtyYearCashFlows"]) == 30
    assert len(res["steps"]) >= 6


@pytest.mark.asyncio
async def test_fastapi_health_and_evaluate_endpoints() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        health = await client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        eval_resp = await client.post(
            "/api/feasibility/evaluate",
            json={
                "id": "parcel-hy-1",
                "account_id": "16-1894021",
                "county_fips": "24033",
                "zip_code": "20782",
                "lot_sqft": 54000,
                "distance_to_transit_miles": 0.21,
                "target_ami_mix_pct": 50.0,
            },
        )
        assert eval_resp.status_code == 200
        body = eval_resp.json()
        assert body["accountId"] == "16-1894021"
        assert body["proForma"]["capitalStack"]["dscrYear1"] >= 1.20

