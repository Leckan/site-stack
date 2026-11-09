import { ArrowRight, Building2, Calculator, Compass, Layers, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { MARYLAND_SEED_PARCELS } from "@/lib/proforma-engine";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-8 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Maryland Housing Expansion & Affordability Act of 2024 (HB 538)
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            SiteStack: Autonomous Land Entitlement, 3D Massing & Blended Capital Stack Engine
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Powered by Google Agent Development Kit (<code className="text-emerald-300">google.adk</code>) on Vertex AI,
            FastMCP spatial servers (Maryland SDAT/MDP, HUD SAFMR, MTA GTFS-RT), and Google Maps Platform Photorealistic
            3D Tiles with Deck.gl overlays.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Compass className="h-4 w-4" />
              Launch Geospatial Discovery Canvas
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pro-forma/parcel-ss-bonifant"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <Calculator className="h-4 w-4" />
              Open 3D Massing & Pro-Forma Studio
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <Layers className="h-4 w-4" />
              Multi-Sided Stakeholder Hub
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Compass className="h-4 w-4" />
            1. Geospatial TOD Discovery (/explore)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive `@vis.gl/react-google-maps` + Photorealistic 3D Tiles toggle + Deck.gl `GeoJsonLayer` coloring
            Maryland parcels by HB 538 statutory TOD eligibility and streaming live ADK agent reasoning.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Building2 className="h-4 w-4" />
            2. Pro-Forma & Massing Studio (/pro-forma/[id])
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time 3D procedural building massing envelope paired with interactive AMI Mix, Construction Type (Type V
            vs. Type I), and Parking Ratio sliders sizing 4%/9% LIHTC, MD DHCD gap loans, and DSCR &ge; 1.20x.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4" />
            3. Multi-Sided Collaboration (/dashboard)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role-based portals for Landowners (Residual Land Valuation & RFPs), Developers (Subsidy Pipeline), Municipal
            Planners (HB 538 Audit Trail), and Renters (Income-Restricted Voucher Pre-Application).
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Seeded Maryland Priority Parcels (PostGIS)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MARYLAND_SEED_PARCELS.map((parcel) => (
            <Link
              key={parcel.id}
              href={`/pro-forma/${parcel.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-emerald-500/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">SDAT #{parcel.accountId}</span>
                <span
                  className={
                    parcel.todStatus === "DIRECT_TOD_BONUS"
                      ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                      : parcel.todStatus === "STANDARD_INFILL"
                        ? "rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                        : "rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300"
                  }
                >
                  {parcel.todStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div className="font-semibold text-sm text-white group-hover:text-emerald-300">
                {parcel.address}
              </div>
              <div className="text-xs text-slate-400">
                {parcel.countyName} • {parcel.zoningCode} • {parcel.lotSqft.toLocaleString()} sqft
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

