import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  extensionsFilters: ["postgis"],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://sitestack:sitestack_dev_password@localhost:5432/sitestack",
  },
});

