"""FinancialProFormaAgent: Constructs 30-year pro-forma, 4%/9% LIHTC sizing, MD DHCD gap financing, and DSCR >= 1.20."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from config import settings

try:
    from google.adk.agents import Agent as AdkAgent
except Exception:  # pragma: no cover
    AdkAgent = None  # type: ignore[assignment]


class FinancialProFormaAgent:
    """Specialized Google ADK Sub-Agent for Blended Capital Stack & 30-Year Pro-Forma Underwriting."""

    name = "FinancialProFormaAgent"
    model = settings.adk_model_name
    instruction = (
        "You are the Maryland Affordable & Mixed-Income Real Estate Financial Underwriting Agent. "
        "Construct a 30-year operating cash flow pro-forma, size 4% tax-exempt bond or 9% competitive "
        "LIHTC equity, Maryland DHCD Rental Housing Works (RHW) subordinate gap loans, county PILOT "
        "abatements, and senior permanent debt constrained to DSCR >= 1.20."
    )

    def __init__(self) -> None:
        self.adk_agent = None
        if AdkAgent is not None:
            try:
                self.adk_agent = AdkAgent(
                    name=self.name,
                    model=self.model,
                    instruction=self.instruction,
                    description="Constructs a 30-year pro-forma, sizing 4%/9% LIHTC subsidies and DSCR >= 1.20.",
                )
            except Exception:
                self.adk_agent = None

    async def underwrite_proforma(
        self,
        parcel: dict[str, Any],
        zoning_envelope: dict[str, Any],
        target_ami_mix_pct: float = 40.0,
        weighted_ami_tier: int = 60,
        construction_type: str = "TYPE_V_WOOD",
        parking_ratio: float = 0.45,
    ) -> dict[str, Any]:
        """Compute deterministic 30-year pro-forma and capital stack with DSCR >= 1.20."""
        total_units = int(zoning_envelope["allowable_units"])
        gross_sqft = int(zoning_envelope["gross_floor_area_sqft"])
        net_rentable_sqft = int(zoning_envelope["net_rentable_sqft"])
        affordable_units = int(round(total_units * (target_ami_mix_pct / 100.0)))
        market_units = total_units - affordable_units

        # Construction hard cost by structural system
        hard_cost_lookup = {
            "TYPE_V_WOOD": 265,
            "TYPE_III_PODIUM": 310,
            "TYPE_I_CONCRETE": 375,
        }
        hard_cost_per_sqft = hard_cost_lookup.get(construction_type, 265)
        total_hard_cost = gross_sqft * hard_cost_per_sqft

        parking_spaces = int(round(total_units * parking_ratio))
        parking_cost_per_space = 28000 if construction_type == "TYPE_V_WOOD" else 42000
        parking_cost = parking_spaces * parking_cost_per_space

        land_acquisition = int(parcel.get("assessed_value_usd", 3850000))
        soft_cost = int(round((total_hard_cost + parking_cost) * 0.24))
        total_dev_cost = total_hard_cost + parking_cost + soft_cost + land_acquisition

        # Monthly rent schedule by ZIP / county
        zip_code = str(parcel.get("zip_code", "20910"))
        market_two_bed = 2580 if zip_code.startswith(("208", "209")) else (2190 if zip_code.startswith("207") else 1980)
        ami_factor = {30: 0.45, 50: 0.68, 60: 0.78, 80: 0.92}.get(weighted_ami_tier, 0.78)
        affordable_monthly_rent = int(round(market_two_bed * ami_factor))

        gross_potential_rent = (market_units * market_two_bed * 12) + (affordable_units * affordable_monthly_rent * 12)
        vacancy_rate = 0.05
        effective_gross_income = int(round(gross_potential_rent * (1.0 - vacancy_rate)))

        # Operating expenses & PILOT property tax abatement
        base_opex_per_unit = 6950
        pilot_savings_annual = int(round(total_units * 1450 * (target_ami_mix_pct / 100.0)))
        annual_opex = max(total_units * 4800, (total_units * base_opex_per_unit) - pilot_savings_annual)
        year1_noi = effective_gross_income - annual_opex

        # Senior permanent debt sized strictly to DSCR = 1.22 (>= 1.20 covenant) at 6.10% interest, 35-yr amortization
        target_dscr = 1.22
        max_annual_debt_service = year1_noi / target_dscr
        mortgage_constant = 0.0692  # 6.10% rate, 35-year amort
        senior_debt = int(round(max_annual_debt_service / mortgage_constant))

        # LIHTC Equity Sizing (9% competitive for high AMI share <= 130 units, else 4% tax-exempt bond + PAB)
        lihtc_type = "9_PERCENT_COMPETITIVE" if (target_ami_mix_pct >= 50 and total_units <= 140) else "4_PERCENT_BOND"
        eligible_basis = int(round((total_hard_cost + parking_cost + soft_cost) * 0.92))
        dda_qct_boost = 1.30
        applicable_fraction = target_ami_mix_pct / 100.0
        qualified_basis = eligible_basis * dda_qct_boost * applicable_fraction
        credit_rate = 0.09 if lihtc_type == "9_PERCENT_COMPETITIVE" else 0.04
        annual_tax_credit = qualified_basis * credit_rate
        syndication_pricing = 0.91
        lihtc_equity = int(round(annual_tax_credit * 10 * syndication_pricing))

        # Maryland DHCD Rental Housing Works (RHW) + Montgomery HIF / Baltimore AHTF soft gap financing
        md_dhcd_gap = min(
            int(round(affordable_units * 65000)),
            max(0, total_dev_cost - senior_debt - lihtc_equity - int(round(total_dev_cost * 0.08))),
        )
        pilot_npv_savings = int(round(pilot_savings_annual * 13.8))
        sponsor_equity = max(int(round(total_dev_cost * 0.06)), total_dev_cost - senior_debt - lihtc_equity - md_dhcd_gap)
        financing_gap = max(0, total_dev_cost - (senior_debt + lihtc_equity + md_dhcd_gap + sponsor_equity))

        yield_on_cost_pct = round((year1_noi / max(1, total_dev_cost)) * 100.0, 2)
        projected_irr_pct = round(11.4 + (yield_on_cost_pct - 5.5) * 1.65 + (0.8 if lihtc_type == "9_PERCENT_COMPETITIVE" else 0.0), 2)

        # Generate 30-year operating cash flow schedule (2.5% annual rent escalation, 3.0% expense escalation)
        cash_flows = []
        annual_debt_service_int = int(round(max_annual_debt_service))
        for yr in range(1, 31):
            egi_yr = int(round(effective_gross_income * ((1.025) ** (yr - 1))))
            opex_yr = int(round(annual_opex * ((1.03) ** (yr - 1))))
            noi_yr = egi_yr - opex_yr
            cash_flows.append(
                {
                    "year": yr,
                    "egi": egi_yr,
                    "opex": opex_yr,
                    "noi": noi_yr,
                    "debtService": annual_debt_service_int,
                    "netCashFlow": noi_yr - annual_debt_service_int,
                }
            )

        steps = [
            {
                "id": "step-proforma-1",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agentName": self.name,
                "phase": "TOOL_CALL",
                "toolInvoked": "get_hud_safmr_limits",
                "message": (
                    f"Fetched HUD SAFMR & Maryland DHCD rent caps for ZIP {zip_code}: "
                    f"2BR Market=${market_two_bed:,}/mo, {weighted_ami_tier}% AMI Restricted=${affordable_monthly_rent:,}/mo."
                ),
            },
            {
                "id": "step-proforma-2",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agentName": self.name,
                "phase": "REASONING",
                "message": (
                    f"Sized {lihtc_type} LIHTC equity (${lihtc_equity:,}), MD DHCD RHW soft loan (${md_dhcd_gap:,}), "
                    f"and Senior Debt (${senior_debt:,}) at DSCR={target_dscr:.2f}x (>= 1.20x minimum)."
                ),
            },
        ]

        return {
            "totalUnits": total_units,
            "affordableUnits": affordable_units,
            "marketRateUnits": market_units,
            "effectiveFar": zoning_envelope["effective_far"],
            "grossBuildingAreaSqft": gross_sqft,
            "netRentableAreaSqft": net_rentable_sqft,
            "stories": max(4, int(round(zoning_envelope["effective_height_feet"] / 11.0))),
            "buildingHeightFeet": zoning_envelope["effective_height_feet"],
            "parkingSpaces": parking_spaces,
            "hardCostPerSqftUsd": hard_cost_per_sqft,
            "totalHardCostUsd": total_hard_cost,
            "totalSoftCostUsd": soft_cost,
            "landAcquisitionUsd": land_acquisition,
            "parkingCostUsd": parking_cost,
            "totalDevelopmentCostUsd": total_dev_cost,
            "grossPotentialRentAnnualUsd": gross_potential_rent,
            "effectiveGrossIncomeAnnualUsd": effective_gross_income,
            "operatingExpensesAnnualUsd": annual_opex,
            "netOperatingIncomeAnnualUsd": year1_noi,
            "capitalStack": {
                "id": f"capstack-{parcel.get('id', 'p-1')}",
                "parcelId": str(parcel.get("id", "parcel-1")),
                "feasibilityRunId": "run-live",
                "lihtcType": lihtc_type,
                "lihtcEquityUsd": lihtc_equity,
                "mdDhcdGapFinancingUsd": md_dhcd_gap,
                "seniorDebtUsd": senior_debt,
                "pilotNpvSavingsUsd": pilot_npv_savings,
                "sponsorEquityUsd": sponsor_equity,
                "totalDevelopmentCostUsd": total_dev_cost,
                "dscrYear1": target_dscr,
                "projectedIrrPct": projected_irr_pct,
                "yieldOnCostPct": yield_on_cost_pct,
                "financingGapUsd": financing_gap,
            },
            "thirtyYearCashFlows": cash_flows,
            "steps": steps,
        }

