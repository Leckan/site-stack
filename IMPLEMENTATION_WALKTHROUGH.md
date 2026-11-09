# SiteStack — Enterprise Implementation Walkthrough

## 1. Architecture Overview

**SiteStack** is a production-grade, multi-sided housing development, land entitlement, and capital-matching platform focused on Maryland (with nationwide scalability). The platform operationalizes the **Maryland Housing Expansion and Affordability Act of 2024 (HB 538)** alongside **4%/9% LIHTC**, **Maryland DHCD Rental Housing Works (RHW)** gap financing, and **Google Maps Platform Photorealistic 3D Tiles**.

```mermaid
flowchart LR
    subgraph Client["Next.js 15 App Router (apps/web)"]
        Explore["/explore\n@vis.gl/react-google-maps\n+ Deck.gl GeoJsonLayer\n+ 3D Tiles Toggle"]
        Studio["/pro-forma/[id]\n3D Procedural Massing\n+ Real-Time LIHTC Sliders"]
        Dash["/dashboard\nMulti-Sided Portal\n(Landowner, Dev, Planner, Renter)"]
    end

    subgraph Orchestrator["Google ADK Service (services/adk-orchestrator)"]
        Sup["DevelopmentFeasibilityCoordinator\n(Vertex AI gemini-1.5-pro)"]
        ZA["ZoningEntitlementAgent"]
        FA["FinancialProFormaAgent"]
        TA["TransitSiteImpactAgent"]
        Sup --> ZA
        Sup --> FA
        Sup --> TA
    end

    subgraph MCP["FastMCP Server (services/mcp-server)"]
        T1["get_parcel_spatial_record\n(MD SDAT / MDP ArcGIS)"]
        T2["check_maryland_tod_qualification\n(MD HB 538 Statutory Engine)"]
        T3["get_hud_safmr_limits\n(HUD SAFMR & AMI Caps)"]
        T4["compute_transit_isochrone\n(Google Routes Matrix v2 / GTFS-RT)"]
    end

    subgraph Data["Data Layer (packages/database)"]
        PG[("PostgreSQL 16 + PostGIS\n(parcels, feasibility_runs,\ncapital_stacks, stakeholder_leads)")]
        Redis[("Redis 7 Cache")]
    end

    Explore <-->|"SSE Live Stream"| Sup
    Studio <-->|"Real-Time Underwriting"| Sup
    ZA --> T1
    ZA --> T2
    FA --> T3
    TA --> T4
    Sup --> PG
    Sup --> Redis
```

---

## 2. Monorepo Module Inventory

| Module Path | Tech Stack | Responsibilities |
| :--- | :--- | :--- |
| `packages/ts-types` | TypeScript 5.7, GeoJSON | Shared geospatial, statutory HB 538, HUD SAFMR, capital stack, and ADK streaming contracts |
| `packages/database` | Drizzle ORM, PostgreSQL 16, PostGIS 3.4 | Spatial schemas (`geometry(Point, 4326)`, `geometry(Geometry, 4326)`), migrations, and Maryland seed script |
| `services/mcp-server` | Python 3.12+, `fastmcp`, `httpx`, `pydantic`, `shapely` | FastMCP SSE Server exposing 4 spatial/regulatory tools for Maryland SDAT, HB 538 TOD, HUD SAFMR, and transit isochrones |
| `services/adk-orchestrator` | Python 3.12+, `google-adk`, FastAPI, `sse-starlette` | `DevelopmentFeasibilityCoordinator` supervisor + 3 specialized sub-agents streaming SSE/WebSocket steps |
| `apps/web` | Next.js 15, React 19, `@vis.gl/react-google-maps`, Deck.gl, Radix UI, Zustand, Tailwind CSS | Interactive Geospatial Discovery Canvas (`/explore`), 3D Massing & Pro-Forma Studio (`/pro-forma/[id]`), and Multi-Sided Portal (`/dashboard`) |

---

## 3. Environment Variable Requirements

Copy `.env.example` to `.env` at the repository root:

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL 16 + PostGIS connection string | `postgresql://sitestack:sitestack_dev_password@localhost:5432/sitestack` |
| `REDIS_URL` | Redis instance URL for caching MCP & ADK runs | `redis://localhost:6379/0` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps Platform Browser API Key (or Maps Demo Key) | Falls back to interactive SVG/Deck.gl spatial canvas when unset |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Cloud Map ID required for `AdvancedMarkerElement` | `DEMO_MAP_ID` |
| `GOOGLE_MAPS_API_KEY` | Server-side key for Google Routes API `computeRouteMatrix` | Falls back to MTA GTFS-RT multimodal corridor model when unset |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID for Vertex AI `google.adk` execution | `sitestack-md-enterprise` |
| `GOOGLE_CLOUD_LOCATION` | GCP Region for Vertex AI | `us-east4` |
| `ADK_MODEL_NAME` | Gemini model used by ADK agents | `gemini-1.5-pro` |
| `HUD_API_TOKEN` | Optional HUD User API Bearer token for live SAFMR lookup | Falls back to verified Maryland DHCD/HUD Metro FMR schedules |

---

## 4. Local Development & Verification Commands

### Step 1: Start Local Infrastructure (PostGIS & Redis)
```bash
docker compose up -d postgres redis
```

### Step 2: Run PostGIS Schema Migrations & Seed Maryland Parcels
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### Step 3: Run FastMCP Server & Google ADK Orchestrator
```bash
# Terminal 1 — FastMCP SSE Server (Port 8001)
cd services/mcp-server
uv sync --all-extras
uv run python server.py

# Terminal 2 — Google ADK Multi-Agent Orchestrator (Port 8002)
cd services/adk-orchestrator
uv sync --all-extras
uv run python main.py
```

### Step 4: Launch Next.js 15 Web Application (Port 3000)
```bash
pnpm dev
```

### Step 5: Execute Full Automated Test & Build Suites
```bash
# TypeScript Monorepo Tests, Typecheck & Production Build
pnpm test
pnpm typecheck
pnpm build

# Python FastMCP & Google ADK Test Suites
cd services/mcp-server && uv run pytest -v
cd ../adk-orchestrator && uv run pytest -v
```

---

## 5. Deploying to Google Cloud Run

Each service includes a production `Dockerfile` ready for serverless deployment on **Google Cloud Run**:

```bash
# 1. Deploy FastMCP Server
gcloud run deploy sitestack-mcp-server \
  --source ./services/mcp-server \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars="PORT=8001"

# 2. Deploy Google ADK Multi-Agent Orchestrator
gcloud run deploy sitestack-adk-orchestrator \
  --source ./services/adk-orchestrator \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=sitestack-md-enterprise,GOOGLE_CLOUD_LOCATION=us-east4,ADK_MODEL_NAME=gemini-1.5-pro"

# 3. Deploy Next.js 15 Web Frontend
gcloud run deploy sitestack-web \
  --source ./apps/web \
  --region us-east4 \
  --allow-unauthenticated
```

