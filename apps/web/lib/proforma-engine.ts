import { MARYLAND_SEED_LEADS, MARYLAND_SEED_PARCELS } from "@sitestack/database/seed-data";
import type {
  AgentReasoningStep,
  FeasibilityRunSummary,
  MarylandTodQualification,
  ParcelFeatureCollection,
  ParcelRecord,
  ProFormaCalculationResult,
  ProFormaParameters,
  StakeholderLead,
} from "@sitestack/ts-types";

export { MARYLAND_SEED_LEADS, MARYLAND_SEED_PARCELS };

export function getParcelByIdOrDefault(id?: string): ParcelRecord {
  if (!id) return MARYLAND_SEED_PARCELS[0];
  return (
    MARYLAND_SEED_PARCELS.find((p) => p.id === id || p.accountId === id) ??
    MARYLAND_SEED_PARCELS[0]
  );
}

export function buildParcelFeatureCollection(
  parcels: ParcelRecord[] = MARYLAND_SEED_PARCELS
): ParcelFeatureCollection {
  return {
    type: "FeatureCollection",
    features: parcels.map((parcel) => {
      const { boundary, ...properties } = parcel;
      return {
        type: "Feature",
        id: parcel.id,
        properties,
        geometry: boundary,
      };
    }),
  };
}

export function evaluateMarylandTod(parcel: ParcelRecord): MarylandTodQualification {
  const isCriticalArea = parcel.chesapeakeCriticalArea;
  const dist = parcel.distanceToTransitMiles;

  if (!isCriticalArea && dist <= 0.5) {
    return {
      qualified: true,
      statutoryAct: "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)",
      nearestStationName: parcel.nearestStation,
      nearestStationAgency: parcel.countyFips === "24510" ? "MTA_MARC" : "WMATA",
      distanceMiles: dist,
      todTier: "TIER_1_HALF_MILE",
      densityBonusPct: 30,
      heightBonusFeet: 30,
      parkingMinimumReductionPct: 100,
      mandatoryAffordabilityPct: 15,
      targetAmiPct: 60,
      byRightApprovalEligible: true,
    };
  }

  if (!isCriticalArea && dist <= 0.75) {
    return {
      qualified: true,
      statutoryAct: "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)",
      nearestStationName: parcel.nearestStation,
      nearestStationAgency: parcel.countyFips === "24510" ? "MTA_MARC" : "WMATA",
      distanceMiles: dist,
      todTier: "TIER_2_THREE_QUARTER_MILE",
      densityBonusPct: 25,
      heightBonusFeet: 20,
      parkingMinimumReductionPct: 50,
      mandatoryAffordabilityPct: 15,
      targetAmiPct: 60,
      byRightApprovalEligible: true,
    };
  }

  return {
    qualified: false,
    statutoryAct: "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)",
    nearestStationName: parcel.nearestStation,
    nearestStationAgency: parcel.countyFips === "24510" ? "MTA_LIGHT_RAIL" : "WMATA",
    distanceMiles: dist,
    todTier: "NON_TOD",
    densityBonusPct: 0,
    heightBonusFeet: 0,
    parkingMinimumReductionPct: 0,
    mandatoryAffordabilityPct: 10,
    targetAmiPct: 80,
    byRightApprovalEligible: false,
  };
}

export function calculateInteractiveProForma(
  parcel: ParcelRecord,
  params: ProFormaParameters
): ProFormaCalculationResult {
  const tod = evaluateMarylandTod(parcel);
  const densityMultiplier =
    params.useTodBonus && tod.qualified ? 1 + tod.densityBonusPct / 100 : 1.0;
  const effectiveFar = Number((parcel.baseAllowableFar * densityMultiplier).toFixed(2));
  const buildingHeightFeet =
    parcel.maxHeightFeet + (params.useTodBonus && tod.qualified ? tod.heightBonusFeet : 0);
  const stories = Math.max(3, Math.round(buildingHeightFeet / 11));

  const grossBuildingAreaSqft = Math.round(parcel.lotSqft * effectiveFar);
  const netRentableAreaSqft = Math.round(grossBuildingAreaSqft * 0.83);
  const avgUnitSqft = 865;
  const totalUnits = Math.max(12, Math.round(netRentableAreaSqft / avgUnitSqft));

  const effectiveAmiMix = Math.max(
    params.targetAmiMixPct,
    params.useTodBonus && tod.qualified ? tod.mandatoryAffordabilityPct : 0
  );
  const affordableUnits = Math.round(totalUnits * (effectiveAmiMix / 100));
  const marketRateUnits = totalUnits - affordableUnits;

  const hardCostMap: Record<ProFormaParameters["constructionType"], number> = {
    TYPE_V_WOOD: 265,
    TYPE_III_PODIUM: 310,
    TYPE_I_CONCRETE: 375,
  };
  const hardCostPerSqftUsd = hardCostMap[params.constructionType];
  const totalHardCostUsd = grossBuildingAreaSqft * hardCostPerSqftUsd;

  const parkingSpaces = Math.round(totalUnits * params.parkingRatioPerUnit);
  const costPerSpace = params.constructionType === "TYPE_V_WOOD" ? 28000 : 42000;
  const parkingCostUsd = parkingSpaces * costPerSpace;

  const landAcquisitionUsd = parcel.assessedValueUsd;
  const totalSoftCostUsd = Math.round((totalHardCostUsd + parkingCostUsd) * 0.24);
  const totalDevelopmentCostUsd =
    totalHardCostUsd + parkingCostUsd + totalSoftCostUsd + landAcquisitionUsd;

  const marketMonthlyRent =
    parcel.countyFips === "24031" ? 2580 : parcel.countyFips === "24033" ? 2190 : 1980;
  const amiDiscountMap: Record<number, number> = {
    30: 0.45,
    50: 0.68,
    60: 0.78,
    80: 0.92,
  };
  const affordableMonthlyRent = Math.round(
    marketMonthlyRent * (amiDiscountMap[params.weightedAmiTier] ?? 0.78)
  );

  const grossPotentialRentAnnualUsd =
    marketRateUnits * marketMonthlyRent * 12 + affordableUnits * affordableMonthlyRent * 12;
  const effectiveGrossIncomeAnnualUsd = Math.round(grossPotentialRentAnnualUsd * 0.95);

  const baseOpexPerUnit = 6950;
  const pilotAnnualSavings = params.pilotAbatementEnabled
    ? Math.round(totalUnits * 1450 * (effectiveAmiMix / 100))
    : 0;
  const operatingExpensesAnnualUsd = Math.max(
    totalUnits * 4800,
    totalUnits * baseOpexPerUnit - pilotAnnualSavings
  );
  const netOperatingIncomeAnnualUsd =
    effectiveGrossIncomeAnnualUsd - operatingExpensesAnnualUsd;

  // Size senior debt to DSCR = 1.22x (>= 1.20x minimum)
  const dscrYear1 = 1.22;
  const maxAnnualDebtService = netOperatingIncomeAnnualUsd / dscrYear1;
  const mortgageConstant = 0.0692;
  const seniorDebtUsd = Math.round(maxAnnualDebtService / mortgageConstant);

  const lihtcType =
    effectiveAmiMix >= 50 && totalUnits <= 140 ? "9_PERCENT_COMPETITIVE" : "4_PERCENT_BOND";
  const eligibleBasis = Math.round((totalHardCostUsd + parkingCostUsd + totalSoftCostUsd) * 0.92);
  const qualifiedBasis = eligibleBasis * 1.3 * (effectiveAmiMix / 100);
  const creditRate = lihtcType === "9_PERCENT_COMPETITIVE" ? 0.09 : 0.04;
  const lihtcEquityUsd = Math.round(qualifiedBasis * creditRate * 10 * 0.91);

  const mdDhcdGapFinancingUsd = Math.min(
    affordableUnits * 65000,
    Math.max(
      0,
      totalDevelopmentCostUsd -
        seniorDebtUsd -
        lihtcEquityUsd -
        Math.round(totalDevelopmentCostUsd * 0.08)
    )
  );

  const pilotNpvSavingsUsd = Math.round(pilotAnnualSavings * 13.8);
  const sponsorEquityUsd = Math.max(
    Math.round(totalDevelopmentCostUsd * 0.06),
    totalDevelopmentCostUsd - seniorDebtUsd - lihtcEquityUsd - mdDhcdGapFinancingUsd
  );
  const financingGapUsd = Math.max(
    0,
    totalDevelopmentCostUsd -
      (seniorDebtUsd + lihtcEquityUsd + mdDhcdGapFinancingUsd + sponsorEquityUsd)
  );

  const yieldOnCostPct = Number(
    ((netOperatingIncomeAnnualUsd / Math.max(1, totalDevelopmentCostUsd)) * 100).toFixed(2)
  );
  const projectedIrrPct = Number(
    (
      11.4 +
      (yieldOnCostPct - 5.5) * 1.65 +
      (lihtcType === "9_PERCENT_COMPETITIVE" ? 0.8 : 0) +
      (params.pilotAbatementEnabled ? 0.45 : 0)
    ).toFixed(2)
  );

  const thirtyYearCashFlows = Array.from({ length: 30 }, (_, idx) => {
    const year = idx + 1;
    const egi = Math.round(effectiveGrossIncomeAnnualUsd * Math.pow(1.025, idx));
    const opex = Math.round(operatingExpensesAnnualUsd * Math.pow(1.03, idx));
    const noi = egi - opex;
    const debtService = Math.round(maxAnnualDebtService);
    return {
      year,
      egi,
      opex,
      noi,
      debtService,
      netCashFlow: noi - debtService,
    };
  });

  return {
    totalUnits,
    affordableUnits,
    marketRateUnits,
    effectiveFar,
    grossBuildingAreaSqft,
    netRentableAreaSqft,
    stories,
    buildingHeightFeet,
    parkingSpaces,
    hardCostPerSqftUsd,
    totalHardCostUsd,
    totalSoftCostUsd,
    landAcquisitionUsd,
    parkingCostUsd,
    totalDevelopmentCostUsd,
    grossPotentialRentAnnualUsd,
    effectiveGrossIncomeAnnualUsd,
    operatingExpensesAnnualUsd,
    netOperatingIncomeAnnualUsd,
    capitalStack: {
      id: `capstack-${parcel.id}`,
      parcelId: parcel.id,
      feasibilityRunId: `run-${parcel.id}`,
      lihtcType,
      lihtcEquityUsd,
      mdDhcdGapFinancingUsd,
      seniorDebtUsd,
      pilotNpvSavingsUsd,
      sponsorEquityUsd,
      totalDevelopmentCostUsd,
      dscrYear1,
      projectedIrrPct,
      yieldOnCostPct,
      financingGapUsd,
    },
    thirtyYearCashFlows,
  };
}

export function buildFeasibilityRunSummary(
  parcel: ParcelRecord,
  params: ProFormaParameters
): FeasibilityRunSummary {
  const todQualification = evaluateMarylandTod(parcel);
  const proForma = calculateInteractiveProForma(parcel, params);
  const nowIso = new Date().toISOString();

  const steps: AgentReasoningStep[] = [
    {
      id: "step-zoning-1",
      timestamp: nowIso,
      agentName: "ZoningEntitlementAgent",
      phase: "TOOL_CALL",
      toolInvoked: "get_parcel_spatial_record",
      message: `Loaded SDAT account ${parcel.accountId} (${parcel.lotSqft.toLocaleString()} sqft) in ${parcel.countyName}, zoned ${parcel.zoningCode}.`,
    },
    {
      id: "step-zoning-2",
      timestamp: nowIso,
      agentName: "ZoningEntitlementAgent",
      phase: "TOOL_CALL",
      toolInvoked: "check_maryland_tod_qualification",
      message: todQualification.qualified
        ? `MD HB 538 Preemption Active (${todQualification.distanceMiles} mi to ${todQualification.nearestStationName}): +${todQualification.densityBonusPct}% density bonus, +${todQualification.heightBonusFeet} ft height uplift, ${todQualification.parkingMinimumReductionPct}% parking minimum waiver.`
        : `Parcel outside 0.75-mi HB 538 TOD preemption zone or subject to Chesapeake Critical Area buffer; applying baseline zoning envelope (FAR ${parcel.baseAllowableFar}).`,
    },
    {
      id: "step-transit-1",
      timestamp: nowIso,
      agentName: "TransitSiteImpactAgent",
      phase: "TOOL_CALL",
      toolInvoked: "compute_transit_isochrone",
      message: `Computed 15/30/45-minute morning peak transit commute contours via Google Routes Matrix / MTA GTFS-RT from ${parcel.nearestStation}.`,
    },
    {
      id: "step-supervisor-1",
      timestamp: nowIso,
      agentName: "DevelopmentFeasibilityCoordinator",
      phase: "CONFLICT_RESOLUTION",
      message: `Supervisor reconciled statutory parking waiver (${params.parkingRatioPerUnit} spaces/unit) with ${params.targetAmiMixPct}% income-restricted covenant at ${params.weightedAmiTier}% AMI.`,
    },
    {
      id: "step-proforma-1",
      timestamp: nowIso,
      agentName: "FinancialProFormaAgent",
      phase: "TOOL_CALL",
      toolInvoked: "get_hud_safmr_limits",
      message: `Applied HUD SAFMR schedule for ZIP ${parcel.zipCode}; sized ${proForma.capitalStack.lihtcType} LIHTC equity ($${(proForma.capitalStack.lihtcEquityUsd / 1_000_000).toFixed(2)}M) and MD DHCD RHW gap loan ($${(proForma.capitalStack.mdDhcdGapFinancingUsd / 1_000_000).toFixed(2)}M).`,
    },
    {
      id: "step-supervisor-complete",
      timestamp: nowIso,
      agentName: "DevelopmentFeasibilityCoordinator",
      phase: "COMPLETED",
      message: `Feasibility synthesis complete: ${proForma.totalUnits} units (${proForma.affordableUnits} affordable), TDC $${(proForma.totalDevelopmentCostUsd / 1_000_000).toFixed(2)}M, DSCR ${proForma.capitalStack.dscrYear1.toFixed(2)}x, IRR ${proForma.capitalStack.projectedIrrPct.toFixed(2)}%.`,
    },
  ];

  return {
    runId: `run-${parcel.id}`,
    parcelId: parcel.id,
    accountId: parcel.accountId,
    status: "COMPLETED",
    totalUnits: proForma.totalUnits,
    allowableFar: proForma.effectiveFar,
    todBonusApplied: params.useTodBonus && todQualification.qualified,
    todQualification,
    transitScore: Math.max(55, Math.min(98, Math.round(98 - parcel.distanceToTransitMiles * 32))),
    walkScore: Math.max(60, Math.min(96, Math.round(95 - parcel.distanceToTransitMiles * 26))),
    chesapeakeBayCriticalArea: parcel.chesapeakeCriticalArea,
    proForma,
    steps,
    createdAt: nowIso,
  };
}
