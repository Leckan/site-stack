"""DevelopmentFeasibilityCoordinator: Supervisor agent coordinating parallel sub-agents and resolving conflicts."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, AsyncGenerator
import uuid

from agents.proforma_agent import FinancialProFormaAgent
from agents.transit_agent import TransitSiteImpactAgent
from agents.zoning_agent import ZoningEntitlementAgent
from config import settings

try:
    from google.adk.agents import Agent as AdkAgent
except Exception:  # pragma: no cover
    AdkAgent = None  # type: ignore[assignment]


class DevelopmentFeasibilityCoordinator:
    """Supervisor Google ADK Agent coordinating parallel Zoning, Transit, and Pro-Forma sub-agents."""

    name = "DevelopmentFeasibilityCoordinator"
    model = settings.adk_model_name

    def __init__(self) -> None:
        self.zoning_agent = ZoningEntitlementAgent()
        self.proforma_agent = FinancialProFormaAgent()
        self.transit_agent = TransitSiteImpactAgent()
        self.adk_supervisor = None

        if AdkAgent is not None:
            try:
                sub_agents = [
                    a
                    for a in (
                        self.zoning_agent.adk_agent,
                        self.proforma_agent.adk_agent,
                        self.transit_agent.adk_agent,
                    )
                    if a is not None
                ]
                self.adk_supervisor = AdkAgent(
                    name=self.name,
                    model=self.model,
                    instruction=(
                        "Coordinate parallel execution of ZoningEntitlementAgent, TransitSiteImpactAgent, "
                        "and FinancialProFormaAgent for Maryland housing entitlement and capital stack feasibility."
                    ),
                    sub_agents=sub_agents,
                )
            except Exception:
                self.adk_supervisor = None

    async def run_feasibility(
        self,
        parcel: dict[str, Any],
        target_ami_mix_pct: float = 40.0,
        weighted_ami_tier: int = 60,
        construction_type: str = "TYPE_V_WOOD",
        parking_ratio: float | None = None,
    ) -> dict[str, Any]:
        """Execute parallel sub-agent evaluation, resolve statutory/environmental conflicts, and return deterministic payload."""
        run_id = f"run-{uuid.uuid4().hex[:8]}"

        # Execute Zoning and Transit sub-agents in parallel
        zoning_res, transit_res = await asyncio.gather(
            self.zoning_agent.evaluate_parcel(parcel),
            self.transit_agent.evaluate_site_impact(parcel),
        )

        # Supervisor conflict resolution:
        # 1. If parcel is Tier-1 TOD under MD HB 538, automatically reduce parking ratio unless overridden
        effective_parking_ratio = (
            parking_ratio
            if parking_ratio is not None
            else (0.15 if zoning_res["parking_minimum_reduction_pct"] == 100 else 0.55)
        )
        # 2. Enforce statutory minimum 15% affordable units at <=60% AMI when claiming HB 538 TOD bonus
        resolved_ami_mix = max(
            float(target_ami_mix_pct),
            float(zoning_res["mandatory_affordability_pct"]),
        )

        proforma_res = await self.proforma_agent.underwrite_proforma(
            parcel=parcel,
            zoning_envelope=zoning_res,
            target_ami_mix_pct=resolved_ami_mix,
            weighted_ami_tier=weighted_ami_tier,
            construction_type=construction_type,
            parking_ratio=effective_parking_ratio,
        )

        conflict_step = {
            "id": "step-supervisor-conflict",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agentName": self.name,
            "phase": "CONFLICT_RESOLUTION",
            "message": (
                f"Supervisor reconciled HB 538 parking preemption ({zoning_res['parking_minimum_reduction_pct']}% waiver -> "
                f"{effective_parking_ratio:.2f} spaces/unit) and locked {resolved_ami_mix:.0f}% AMI covenant "
                f"to maximize MD DHCD QAP points ({transit_res['md_dhcd_qap_transit_points']}/20)."
            ),
        }

        synthesis_step = {
            "id": "step-supervisor-synthesis",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agentName": self.name,
            "phase": "COMPLETED",
            "message": (
                f"Feasibility Run {run_id} complete: {proforma_res['totalUnits']} units "
                f"({proforma_res['affordableUnits']} affordable), "
                f"TDC=${proforma_res['totalDevelopmentCostUsd']:,}, "
                f"DSCR={proforma_res['capitalStack']['dscrYear1']:.2f}x, "
                f"Projected IRR={proforma_res['capitalStack']['projectedIrrPct']:.2f}%."
            ),
        }

        all_steps = [
            *zoning_res["steps"],
            *transit_res["steps"],
            conflict_step,
            *proforma_res["steps"],
            synthesis_step,
        ]

        proforma_clean = {k: v for k, v in proforma_res.items() if k != "steps"}

        return {
            "runId": run_id,
            "parcelId": str(parcel.get("id", "parcel-ss-1")),
            "accountId": str(parcel.get("account_id", "13-00984210")),
            "status": "COMPLETED",
            "totalUnits": proforma_res["totalUnits"],
            "allowableFar": zoning_res["effective_far"],
            "todBonusApplied": zoning_res["qualified_tod"],
            "todQualification": {
                "qualified": zoning_res["qualified_tod"],
                "statutoryAct": "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)",
                "nearestStationName": str(parcel.get("nearest_station", "Silver Spring Transit Center")),
                "nearestStationAgency": "WMATA",
                "distanceMiles": float(parcel.get("distance_to_transit_miles", 0.28)),
                "todTier": zoning_res["tod_tier"],
                "densityBonusPct": zoning_res["density_bonus_pct"],
                "heightBonusFeet": zoning_res["height_bonus_feet"],
                "parkingMinimumReductionPct": zoning_res["parking_minimum_reduction_pct"],
                "mandatoryAffordabilityPct": zoning_res["mandatory_affordability_pct"],
                "targetAmiPct": 60,
                "byRightApprovalEligible": zoning_res["qualified_tod"],
            },
            "transitScore": transit_res["transit_score"],
            "walkScore": transit_res["walk_score"],
            "chesapeakeBayCriticalArea": transit_res["chesapeake_bay_critical_area"],
            "proForma": proforma_clean,
            "steps": all_steps,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

    async def stream_feasibility_steps(
        self,
        parcel: dict[str, Any],
        target_ami_mix_pct: float = 40.0,
        weighted_ami_tier: int = 60,
        construction_type: str = "TYPE_V_WOOD",
        parking_ratio: float | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Yield step-by-step agent reasoning events followed by the final deterministic summary."""
        result = await self.run_feasibility(
            parcel=parcel,
            target_ami_mix_pct=target_ami_mix_pct,
            weighted_ami_tier=weighted_ami_tier,
            construction_type=construction_type,
            parking_ratio=parking_ratio,
        )
        for step in result["steps"]:
            yield {"event": "agent_step", "data": step}
            await asyncio.sleep(0.05)

        yield {"event": "feasibility_result", "data": result}

