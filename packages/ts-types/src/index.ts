import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";

export type MarylandCountyFips =
  | "24031" // Montgomery County
  | "24033" // Prince George's County
  | "24510" // Baltimore City
  | "24005" // Baltimore County
  | "24003" // Anne Arundel County
  | "24027"; // Howard County

export type TodTierStatus =
  | "DIRECT_TOD_BONUS"
  | "STANDARD_INFILL"
  | "ENVIRONMENTAL_RESTRICTION";

export type ConstructionType = "TYPE_V_WOOD" | "TYPE_III_PODIUM" | "TYPE_I_CONCRETE";

export type StakeholderRole =
  | "LANDOWNER"
  | "DEVELOPER"
  | "MUNICIPAL_PLANNER"
  | "RENTER";

export interface GeoJsonPoint extends Point {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoJsonPolygon extends Polygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface GeoJsonMultiPolygon extends MultiPolygon {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
}

export interface MarylandTodQualification {
  qualified: boolean;
  statutoryAct: "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)";
  nearestStationName: string;
  nearestStationAgency: "WMATA" | "MTA_MARC" | "MTA_METRO" | "MTA_LIGHT_RAIL" | "MTA_PURPLE_LINE";
  distanceMiles: number;
  todTier: "TIER_1_HALF_MILE" | "TIER_2_THREE_QUARTER_MILE" | "NON_TOD";
  densityBonusPct: number;
  heightBonusFeet: number;
  parkingMinimumReductionPct: number;
  mandatoryAffordabilityPct: number;
  targetAmiPct: number;
  byRightApprovalEligible: boolean;
}

export interface ParcelRecord {
  id: string;
  accountId: string;
  countyFips: MarylandCountyFips;
  countyName: string;
  jurisdiction: string;
  address: string;
  zipCode: string;
  zoningCode: string;
  landUseCode: string;
  lotSqft: number;
  assessedValueUsd: number;
  todStatus: TodTierStatus;
  centroid: GeoJsonPoint;
  boundary: GeoJsonPolygon | GeoJsonMultiPolygon;
  nearestStation: string;
  distanceToTransitMiles: number;
  chesapeakeCriticalArea: boolean;
  baseAllowableFar: number;
  maxHeightFeet: number;
}

export type ParcelFeature = Feature<GeoJsonPolygon | GeoJsonMultiPolygon, Omit<ParcelRecord, "boundary">>;
export type ParcelFeatureCollection = FeatureCollection<
  GeoJsonPolygon | GeoJsonMultiPolygon,
  Omit<ParcelRecord, "boundary">
>;

export interface HudSafmrSchedule {
  zipCode: string;
  fiscalYear: number;
  metroAreaName: string;
  areaMedianIncome4Person: number;
  safmrByBedroom: {
    studio: number;
    oneBed: number;
    twoBed: number;
    threeBed: number;
    fourBed: number;
  };
  amiMaxRentsByTier: {
    ami30: { studio: number; oneBed: number; twoBed: number; threeBed: number };
    ami50: { studio: number; oneBed: number; twoBed: number; threeBed: number };
    ami60: { studio: number; oneBed: number; twoBed: number; threeBed: number };
    ami80: { studio: number; oneBed: number; twoBed: number; threeBed: number };
  };
}

export interface CapitalStackTranche {
  id: string;
  parcelId: string;
  feasibilityRunId: string;
  lihtcType: "4_PERCENT_BOND" | "9_PERCENT_COMPETITIVE" | "NONE";
  lihtcEquityUsd: number;
  mdDhcdGapFinancingUsd: number;
  seniorDebtUsd: number;
  pilotNpvSavingsUsd: number;
  sponsorEquityUsd: number;
  totalDevelopmentCostUsd: number;
  dscrYear1: number;
  projectedIrrPct: number;
  yieldOnCostPct: number;
  financingGapUsd: number;
}

export interface ProFormaParameters {
  targetAmiMixPct: number; // % of units income-restricted (e.g., 25% to 100%)
  weightedAmiTier: 30 | 50 | 60 | 80;
  constructionType: ConstructionType;
  parkingRatioPerUnit: number;
  useTodBonus: boolean;
  pilotAbatementEnabled: boolean;
}

export interface ProFormaCalculationResult {
  totalUnits: number;
  affordableUnits: number;
  marketRateUnits: number;
  effectiveFar: number;
  grossBuildingAreaSqft: number;
  netRentableAreaSqft: number;
  stories: number;
  buildingHeightFeet: number;
  parkingSpaces: number;
  hardCostPerSqftUsd: number;
  totalHardCostUsd: number;
  totalSoftCostUsd: number;
  landAcquisitionUsd: number;
  parkingCostUsd: number;
  totalDevelopmentCostUsd: number;
  grossPotentialRentAnnualUsd: number;
  effectiveGrossIncomeAnnualUsd: number;
  operatingExpensesAnnualUsd: number;
  netOperatingIncomeAnnualUsd: number;
  capitalStack: CapitalStackTranche;
  thirtyYearCashFlows: Array<{
    year: number;
    egi: number;
    opex: number;
    noi: number;
    debtService: number;
    netCashFlow: number;
  }>;
}

export interface AgentReasoningStep {
  id: string;
  timestamp: string;
  agentName:
    | "DevelopmentFeasibilityCoordinator"
    | "ZoningEntitlementAgent"
    | "FinancialProFormaAgent"
    | "TransitSiteImpactAgent";
  phase: "TOOL_CALL" | "REASONING" | "CONFLICT_RESOLUTION" | "SYNTHESIS" | "COMPLETED";
  toolInvoked?: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface FeasibilityRunSummary {
  runId: string;
  parcelId: string;
  accountId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  totalUnits: number;
  allowableFar: number;
  todBonusApplied: boolean;
  todQualification: MarylandTodQualification;
  transitScore: number;
  walkScore: number;
  chesapeakeBayCriticalArea: boolean;
  proForma: ProFormaCalculationResult;
  steps: AgentReasoningStep[];
  createdAt: string;
}

export interface StakeholderLead {
  id: string;
  parcelId: string;
  role: StakeholderRole;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  intentType:
    | "RFP_SUBMISSION"
    | "RESIDUAL_LAND_VALUATION"
    | "SUBSIDY_COMMITMENT"
    | "ZONING_AUDIT_APPROVAL"
    | "VOUCHER_WAITLIST_PREAPP";
  householdAmiPct?: number;
  voucherType?: "HUD_HCV" | "MD_BRHP" | "PROJECT_BASED" | "NONE";
  proposedUnits?: number;
  notes: string;
  status: "NEW" | "MATCHED" | "UNDER_REVIEW" | "APPROVED";
  createdAt: string;
}

