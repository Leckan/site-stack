import type {
  AgentReasoningStep,
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
  ProFormaCalculationResult,
} from "@sitestack/ts-types";
import {
  boolean,
  customType,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Custom Drizzle PostGIS geometry(Point, 4326) column type.
 */
export const postgisPoint4326 = customType<{
  data: GeoJsonPoint | string;
  driverData: string;
}>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value: GeoJsonPoint | string): string {
    if (typeof value === "string") return value;
    const [lng, lat] = value.coordinates;
    return `SRID=4326;POINT(${lng} ${lat})`;
  },
  fromDriver(value: string): GeoJsonPoint | string {
    return value;
  },
});

/**
 * Custom Drizzle PostGIS geometry(Geometry, 4326) column type for Polygon / MultiPolygon parcel boundaries.
 */
export const postgisBoundary4326 = customType<{
  data: GeoJsonPolygon | GeoJsonMultiPolygon | string;
  driverData: string;
}>({
  dataType() {
    return "geometry(Geometry, 4326)";
  },
  toDriver(value: GeoJsonPolygon | GeoJsonMultiPolygon | string): string {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  },
  fromDriver(value: string): GeoJsonPolygon | GeoJsonMultiPolygon | string {
    return value;
  },
});

export const parcels = pgTable("parcels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  accountId: varchar("account_id", { length: 64 }).notNull().unique(),
  countyFips: varchar("county_fips", { length: 10 }).notNull(),
  countyName: varchar("county_name", { length: 128 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }).notNull(),
  address: text("address").notNull(),
  zipCode: varchar("zip_code", { length: 16 }).notNull(),
  zoningCode: varchar("zoning_code", { length: 128 }).notNull(),
  landUseCode: varchar("land_use_code", { length: 128 }).notNull(),
  lotSqft: integer("lot_sqft").notNull(),
  assessedValue: integer("assessed_value").notNull(),
  todStatus: varchar("tod_status", { length: 64 }).notNull(),
  nearestStation: text("nearest_station").notNull(),
  distanceToTransitMiles: doublePrecision("distance_to_transit_miles").notNull(),
  chesapeakeCriticalArea: boolean("chesapeake_critical_area").notNull().default(false),
  baseAllowableFar: doublePrecision("base_allowable_far").notNull().default(2.5),
  maxHeightFeet: integer("max_height_feet").notNull().default(75),
  centroid: postgisPoint4326("centroid").notNull(),
  boundary: postgisBoundary4326("boundary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const feasibilityRuns = pgTable("feasibility_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  parcelId: varchar("parcel_id", { length: 64 })
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull().default("COMPLETED"),
  totalUnits: integer("total_units").notNull(),
  allowableFar: doublePrecision("allowable_far").notNull(),
  todBonusApplied: boolean("tod_bonus_applied").notNull().default(true),
  transitScore: integer("transit_score").notNull(),
  walkScore: integer("walk_score").notNull(),
  proFormaJson: jsonb("pro_forma_json").$type<ProFormaCalculationResult>().notNull(),
  agentStepsJson: jsonb("agent_steps_json").$type<AgentReasoningStep[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const capitalStacks = pgTable("capital_stacks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  parcelId: varchar("parcel_id", { length: 64 })
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  feasibilityRunId: varchar("feasibility_run_id", { length: 64 })
    .notNull()
    .references(() => feasibilityRuns.id, { onDelete: "cascade" }),
  lihtcType: varchar("lihtc_type", { length: 64 }).notNull(),
  lihtcEquity: integer("lihtc_equity").notNull(),
  mdDhcdGapFinancing: integer("md_dhcd_gap_financing").notNull(),
  seniorDebt: integer("senior_debt").notNull(),
  pilotTaxSavings: integer("pilot_tax_savings").notNull(),
  sponsorEquity: integer("sponsor_equity").notNull(),
  totalDevelopmentCost: integer("total_development_cost").notNull(),
  dscrYear1: doublePrecision("dscr_year_1").notNull(),
  projectedIrr: doublePrecision("projected_irr").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stakeholderLeads = pgTable("stakeholder_leads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  parcelId: varchar("parcel_id", { length: 64 })
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 64 }).notNull(),
  organizationName: varchar("organization_name", { length: 256 }).notNull(),
  contactName: varchar("contact_name", { length: 128 }).notNull(),
  contactEmail: varchar("contact_email", { length: 256 }).notNull(),
  intentType: varchar("intent_type", { length: 64 }).notNull(),
  householdAmiPct: integer("household_ami_pct"),
  voucherType: varchar("voucher_type", { length: 64 }),
  proposedUnits: integer("proposed_units"),
  notes: text("notes").notNull(),
  status: varchar("status", { length: 64 }).notNull().default("MATCHED"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

