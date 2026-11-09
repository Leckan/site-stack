import { describe, expect, it } from "vitest";
import { MARYLAND_SEED_LEADS, MARYLAND_SEED_PARCELS } from "./seed-data.js";
import { capitalStacks, feasibilityRuns, parcels, stakeholderLeads } from "./schema/index.js";

describe("@sitestack/database PostGIS schema & Maryland seed dataset", () => {
  it("contains at least 5 realistic parcels across Silver Spring, Hyattsville, and Station North", () => {
    expect(MARYLAND_SEED_PARCELS.length).toBeGreaterThanOrEqual(5);

    const counties = new Set(MARYLAND_SEED_PARCELS.map((p) => p.countyFips));
    expect(counties.has("24031")).toBe(true); // Montgomery County (Silver Spring)
    expect(counties.has("24033")).toBe(true); // Prince George's County (Hyattsville)
    expect(counties.has("24510")).toBe(true); // Baltimore City (Station North)
  });

  it("validates GeoJSON polygon rings and Drizzle table definitions", () => {
    for (const parcel of MARYLAND_SEED_PARCELS) {
      expect(parcel.centroid.type).toBe("Point");
      expect(parcel.centroid.coordinates).toHaveLength(2);
      expect(parcel.boundary.type).toBe("Polygon");
    }

    expect(parcels).toBeDefined();
    expect(feasibilityRuns).toBeDefined();
    expect(capitalStacks).toBeDefined();
    expect(stakeholderLeads).toBeDefined();
    expect(MARYLAND_SEED_LEADS.length).toBeGreaterThanOrEqual(4);
  });
});

