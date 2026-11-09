import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://sitestack:sitestack_dev_password@localhost:5432/sitestack";

export async function runMigrations(): Promise<void> {
  const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    console.log("Enabling PostGIS extension and running SiteStack schema migrations...");
    await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;

    await sql`
      CREATE TABLE IF NOT EXISTS parcels (
        id VARCHAR(64) PRIMARY KEY,
        account_id VARCHAR(64) NOT NULL UNIQUE,
        county_fips VARCHAR(10) NOT NULL,
        county_name VARCHAR(128) NOT NULL,
        jurisdiction VARCHAR(128) NOT NULL,
        address TEXT NOT NULL,
        zip_code VARCHAR(16) NOT NULL,
        zoning_code VARCHAR(128) NOT NULL,
        land_use_code VARCHAR(128) NOT NULL,
        lot_sqft INTEGER NOT NULL,
        assessed_value INTEGER NOT NULL,
        tod_status VARCHAR(64) NOT NULL,
        nearest_station TEXT NOT NULL,
        distance_to_transit_miles DOUBLE PRECISION NOT NULL,
        chesapeake_critical_area BOOLEAN NOT NULL DEFAULT FALSE,
        base_allowable_far DOUBLE PRECISION NOT NULL DEFAULT 2.5,
        max_height_feet INTEGER NOT NULL DEFAULT 75,
        centroid geometry(Point, 4326) NOT NULL,
        boundary geometry(Geometry, 4326) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_parcels_centroid_gist ON parcels USING GIST (centroid);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_parcels_boundary_gist ON parcels USING GIST (boundary);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feasibility_runs (
        id VARCHAR(64) PRIMARY KEY,
        parcel_id VARCHAR(64) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
        total_units INTEGER NOT NULL,
        allowable_far DOUBLE PRECISION NOT NULL,
        tod_bonus_applied BOOLEAN NOT NULL DEFAULT TRUE,
        transit_score INTEGER NOT NULL,
        walk_score INTEGER NOT NULL,
        pro_forma_json JSONB NOT NULL,
        agent_steps_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS capital_stacks (
        id VARCHAR(64) PRIMARY KEY,
        parcel_id VARCHAR(64) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
        feasibility_run_id VARCHAR(64) NOT NULL REFERENCES feasibility_runs(id) ON DELETE CASCADE,
        lihtc_type VARCHAR(64) NOT NULL,
        lihtc_equity INTEGER NOT NULL,
        md_dhcd_gap_financing INTEGER NOT NULL,
        senior_debt INTEGER NOT NULL,
        pilot_tax_savings INTEGER NOT NULL,
        sponsor_equity INTEGER NOT NULL,
        total_development_cost INTEGER NOT NULL,
        dscr_year_1 DOUBLE PRECISION NOT NULL,
        projected_irr DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stakeholder_leads (
        id VARCHAR(64) PRIMARY KEY,
        parcel_id VARCHAR(64) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
        role VARCHAR(64) NOT NULL,
        organization_name VARCHAR(256) NOT NULL,
        contact_name VARCHAR(128) NOT NULL,
        contact_email VARCHAR(256) NOT NULL,
        intent_type VARCHAR(64) NOT NULL,
        household_ami_pct INTEGER,
        voucher_type VARCHAR(64),
        proposed_units INTEGER,
        notes TEXT NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'MATCHED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    console.log("PostGIS schema migrations completed successfully.");
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
}

