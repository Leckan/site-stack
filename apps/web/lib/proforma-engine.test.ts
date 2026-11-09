import { describe, expect, it } from "vitest";
import {
  MARYLAND_SEED_PARCELS,
  buildFeasibilityRunSummary,
  calculateInteractiveProForma,
  evaluateMarylandTod,
} from "./proforma-engine";

describe("@sitestack/web proforma & statutory HB 538 engine", () => {
  it("awards 30% density bonus and 100% parking waiver to Tier 1 Silver Spring TOD parcel", () => {
    const silverSpring = MARYLAND_SEED_PARCELS[0];
    const tod = evaluateMarylandTod(silverSpring);

    expect(tod.qualified).toBe(true);
    expect(tod.todTier).toBe("TIER_1_HALF_MILE");
    expect(tod.densityBonusPct).toBe(30);
    expect(tod.parkingMinimumReductionPct).toBe(100);
  });

  it("blocks statutory TOD bonus on Chesapeake Bay Critical Area parcel", () => {
    const criticalParcel = MARYLAND_SEED_PARCELS.find((p) => p.chesapeakeCriticalArea)!;
    const tod = evaluateMarylandTod(criticalParcel);
    expect(tod.qualified).toBe(false);
    expect(tod.densityBonusPct).toBe(0);
  });

  it("recalculates 30-year cash flows and maintains DSCR >= 1.20 when sliders change", () => {
    const parcel = MARYLAND_SEED_PARCELS[0];
    const typeV = calculateInteractiveProForma(parcel, {
      targetAmiMixPct: 40,
      weightedAmiTier: 60,
      constructionType: "TYPE_V_WOOD",
      parkingRatioPerUnit: 0.2,
      useTodBonus: true,
      pilotAbatementEnabled: true,
    });
    const typeI = calculateInteractiveProForma(parcel, {
      targetAmiMixPct: 60,
      weightedAmiTier: 50,
      constructionType: "TYPE_I_CONCRETE",
      parkingRatioPerUnit: 0.8,
      useTodBonus: true,
      pilotAbatementEnabled: false,
    });

    expect(typeV.capitalStack.dscrYear1).toBeGreaterThanOrEqual(1.2);
    expect(typeI.totalDevelopmentCostUsd).toBeGreaterThan(typeV.totalDevelopmentCostUsd);
    expect(typeV.thirtyYearCashFlows).toHaveLength(30);

    const runSummary = buildFeasibilityRunSummary(parcel, {
      targetAmiMixPct: 40,
      weightedAmiTier: 60,
      constructionType: "TYPE_V_WOOD",
      parkingRatioPerUnit: 0.25,
      useTodBonus: true,
      pilotAbatementEnabled: true,
    });
    expect(runSummary.steps.length).toBeGreaterThanOrEqual(5);
  });
});

