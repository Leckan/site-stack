import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export * from "./schema/index.js";
export * from "./seed-data.js";

export function createDatabaseClient(connectionString?: string) {
  const url =
    connectionString ??
    process.env.DATABASE_URL ??
    "postgresql://sitestack:sitestack_dev_password@localhost:5432/sitestack";
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

