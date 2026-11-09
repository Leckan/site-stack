import postgres from "postgres";
import { runMigrations } from "./migrate.js";
import { MARYLAND_SEED_LEADS, MARYLAND_SEED_PARCELS } from "./seed-data.js";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://sitestack:sitestack_dev_password@localhost:5432/sitestack";

export async function seedDatabase(): Promise<void> {
  await runMigrations();
  const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 });

  try {
    console.log(`Seeding ${MARYLAND_SEED_PARCELS.length} Maryland parcels into PostGIS...`);

    for (const p of MARYLAND_SEED_PARCELS) {
      const centroidGeoJson = JSON.stringify(p.centroid);
      const boundaryGeoJson = JSON.stringify(p.boundary);

      await sql`
        INSERT INTO parcels (
          id,
          account_id,
          county_fips,
          county_name,
          jurisdiction,
          address,
          zip_code,
          zoning_code,
          land_use_code,
          lot_sqft,
          assessed_value,
          tod_status,
          nearest_station,
          distance_to_transit_miles,
          chesapeake_critical_area,
          base_allowable_far,
          max_height_feet,
          centroid,
          boundary
        ) VALUES (
          ${p.id},
          ${p.accountId},
          ${p.countyFips},
          ${p.countyName},
          ${p.jurisdiction},
          ${p.address},
          ${p.zipCode},
          ${p.zoningCode},
          ${p.landUseCode},
          ${p.lotSqft},
          ${p.assessedValueUsd},
          ${p.todStatus},
          ${p.nearestStation},
          ${p.distanceToTransitMiles},
          ${p.chesapeakeCriticalArea},
          ${p.baseAllowableFar},
          ${p.maxHeightFeet},
          ST_SetSRID(ST_GeomFromGeoJSON(${centroidGeoJson}), 4326),
          ST_SetSRID(ST_GeomFromGeoJSON(${boundaryGeoJson}), 4326)
        )
        ON CONFLICT (id) DO UPDATE SET
          zoning_code = EXCLUDED.zoning_code,
          assessed_value = EXCLUDED.assessed_value,
          tod_status = EXCLUDED.tod_status,
          centroid = EXCLUDED.centroid,
          boundary = EXCLUDED.boundary;
      `;
    }

    console.log(`Seeding ${MARYLAND_SEED_LEADS.length} multi-sided stakeholder leads...`);
    for (const lead of MARYLAND_SEED_LEADS) {
      await sql`
        INSERT INTO stakeholder_leads (
          id,
          parcel_id,
          role,
          organization_name,
          contact_name,
          contact_email,
          intent_type,
          household_ami_pct,
          voucher_type,
          proposed_units,
          notes,
          status
        ) VALUES (
          ${lead.id},
          ${lead.parcelId},
          ${lead.role},
          ${lead.organizationName},
          ${lead.contactName},
          ${lead.contactEmail},
          ${lead.intentType},
          ${lead.householdAmiPct ?? null},
          ${lead.voucherType ?? null},
          ${lead.proposedUnits ?? null},
          ${lead.notes},
          ${lead.status}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          notes = EXCLUDED.notes;
      `;
    }

    const [{ count }] = await sql<[{ count: string }]>`
      SELECT COUNT(*)::text AS count FROM parcels WHERE ST_IsValid(boundary);
    `;
    console.log(`PostGIS seed verified: ${count} valid spatial parcels indexed.`);
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}

