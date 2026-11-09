import { describe, expect, it } from "vitest";
import type { MarylandCountyFips, ParcelRecord, ProFormaParameters } from "./index";

describe("@sitestack/ts-types contract validation", () => {
  it("validates Maryland county FIPS codes and parcel structure", () => {
    const fips: MarylandCountyFips = "24031";
    const sampleParams: ProFormaParameters = {
      targetAmiMixPct: 40,
      weightedAmiTier: 60,
      constructionType: "TYPE_V_WOOD",
      parkingRatioPerUnit: 0.5,
      useTodBonus: true,
      pilotAbatementEnabled: true,
    };

    expect(fips).toBe("24031");
    expect(sampleParams.useTodBonus).toBe(true);
    expect(sampleParams.weightedAmiTier).toBe(60);
  });

  it("supports GeoJSON Point and Polygon coordinates on ParcelRecord", () => {
    const parcel: Partial<ParcelRecord> = {
      accountId: "13-00984210",
      countyFips: "24031",
      todStatus: "DIRECT_TOD_BONUS",
      centroid: {
        type: "Point",
        coordinates: [-77.0261, 38.9944],
      },
    };
    expect(parcel.centroid?.coordinates).toEqual([-77.0261, 38.9944]);
  });
});

