"use client";

import type { ConstructionType, ProFormaParameters } from "@sitestack/ts-types";
import {
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { Badge, Switch } from "@/components/ui/primitives";
import {
  MARYLAND_SEED_PARCELS,
  calculateInteractiveProForma,
  evaluateMarylandTod,
  getParcelByIdOrDefault,
} from "@/lib/proforma-engine";
import { useSiteStackStore } from "@/lib/store";

export default function ProFormaMassingStudioPage() {
  const routeParams = useParams<{ id: string }>();
  const parcelId = routeParams?.id ?? "parcel-ss-bonifant";

  const {
    selectedParcel,
    proFormaParams,
    selectParcel,
    updateProFormaParams,
  } = useSiteStackStore();

  useEffect(() => {
    if (parcelId && selectedParcel.id !== parcelId) {
      selectParcel(parcelId);
    }
  }, [parcelId, selectParcel, selectedParcel.id]);

  const activeParcel = useMemo(
    () => getParcelByIdOrDefault(parcelId || selectedParcel.id),
    [parcelId, selectedParcel.id]
  );

  const todQualification = useMemo(
    () => evaluateMarylandTod(activeParcel),
    [activeParcel]
  );

  const proForma = useMemo(
    () => calculateInteractiveProForma(activeParcel, proFormaParams),
    [activeParcel, proFormaParams]
  );

  const baseStories = Math.max(3, Math.round(activeParcel.maxHeightFeet / 11));
  const bonusStories = Math.max(0, proForma.stories - baseStories);

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-3.5rem)]">
      {/* LEFT PANE: Interactive 3D Procedural Massing Block Studio */}
      <section className="flex flex-1 flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400">
                SDAT #{activeParcel.accountId}
              </span>
              <Badge variant="emerald">
                {todQualification.qualified ? "HB 538 TOD Preemption" : "Base Zoning"}
              </Badge>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">{activeParcel.address}</h1>
            <p className="text-xs text-slate-400">
              {activeParcel.countyName} • {activeParcel.zoningCode} • Lot{" "}
              {activeParcel.lotSqft.toLocaleString()} sqft
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Switch Maryland Parcel"
              value={activeParcel.id}
              onChange={(e) => selectParcel(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {MARYLAND_SEED_PARCELS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address.split(",")[0]} ({p.countyName})
                </option>
              ))}
            </select>
            <Link
              href="/explore"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to Map
            </Link>
          </div>
        </div>

        {/* Procedural 3D Isometric Building Massing Canvas */}
        <div className="relative my-4 flex flex-1 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6 overflow-hidden">
          <svg
            viewBox="0 0 640 440"
            className="h-full max-h-[420px] w-full"
            role="img"
            aria-label={`Procedural 3D massing block showing ${proForma.stories} stories and ${proForma.totalUnits} total units`}
          >
            <defs>
              <pattern id="massing-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="rgba(51, 65, 85, 0.3)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="640" height="440" fill="url(#massing-grid)" />

            {/* Parcel Lot Boundary Pad */}
            <polygon
              points="150,350 340,280 500,340 310,410"
              fill="rgba(16, 185, 129, 0.12)"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text x="325" y="428" textAnchor="middle" fill="#94a3b8" fontSize="11">
              SDAT Parcel Envelope ({activeParcel.lotSqft.toLocaleString()} sqft • Effective FAR{" "}
              {proForma.effectiveFar}x)
            </text>

            {/* Stacked Procedural Floors (Podium + Market + Affordable + HB 538 Bonus Stories) */}
            {Array.from({ length: Math.min(16, proForma.stories) }).map((_, floorIdx) => {
              const storyHeightPx = 15;
              const baseY = 345 - floorIdx * storyHeightPx;
              const isBonusFloor = floorIdx >= baseStories;
              const isAffordableFloor =
                floorIdx > 0 &&
                floorIdx <= Math.ceil((proForma.stories * proFormaParams.targetAmiMixPct) / 100);
              const isParkingPodium = floorIdx === 0 && proForma.parkingSpaces > 0;

              const leftFaceFill = isBonusFloor
                ? "rgba(16, 185, 129, 0.85)"
                : isAffordableFloor
                  ? "rgba(14, 165, 233, 0.82)"
                  : isParkingPodium
                    ? "rgba(100, 116, 139, 0.85)"
                    : "rgba(51, 65, 85, 0.85)";

              const rightFaceFill = isBonusFloor
                ? "rgba(5, 150, 105, 0.9)"
                : isAffordableFloor
                  ? "rgba(2, 132, 199, 0.88)"
                  : isParkingPodium
                    ? "rgba(71, 85, 105, 0.9)"
                    : "rgba(30, 41, 59, 0.92)";

              const roofFill = isBonusFloor
                ? "#34d399"
                : isAffordableFloor
                  ? "#38bdf8"
                  : "#64748b";

              return (
                <g key={floorIdx}>
                  {/* Left Isometric Wall */}
                  <polygon
                    points={`210,${baseY} 325,${baseY + 42} 325,${baseY + 42 - storyHeightPx} 210,${baseY - storyHeightPx}`}
                    fill={leftFaceFill}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                  {/* Right Isometric Wall */}
                  <polygon
                    points={`325,${baseY + 42} 440,${baseY} 440,${baseY - storyHeightPx} 325,${baseY + 42 - storyHeightPx}`}
                    fill={rightFaceFill}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                  {/* Roof Cap on Top Floor */}
                  {floorIdx === Math.min(16, proForma.stories) - 1 && (
                    <polygon
                      points={`210,${baseY - storyHeightPx} 325,${baseY - 42 - storyHeightPx} 440,${baseY - storyHeightPx} 325,${baseY + 42 - storyHeightPx}`}
                      fill={roofFill}
                      fillOpacity="0.9"
                      stroke="#f8fafc"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 3D Massing Legend Overlay */}
          <div className="absolute left-4 top-4 rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs space-y-1.5 backdrop-blur">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Procedural Massing Stack
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              HB 538 Bonus Stories (+{bonusStories} fl / +{todQualification.heightBonusFeet} ft)
            </div>
            <div className="flex items-center gap-2 text-sky-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
              AMI Income-Restricted Units ({proForma.affordableUnits} units)
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-600" />
              Market-Rate Residential ({proForma.marketRateUnits} units)
            </div>
          </div>
        </div>

        {/* Bottom Architectural & Yield Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] text-slate-400">Total Entitled Yield</div>
            <div className="text-lg font-bold text-white">{proForma.totalUnits} Units</div>
            <div className="text-[11px] text-emerald-400">
              {proForma.affordableUnits} Affordable • {proForma.marketRateUnits} Market
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] text-slate-400">Gross Building Area</div>
            <div className="text-lg font-bold text-white">
              {proForma.grossBuildingAreaSqft.toLocaleString()} GSF
            </div>
            <div className="text-[11px] text-slate-400">
              FAR {proForma.effectiveFar} • {proForma.stories} Stories ({proForma.buildingHeightFeet} ft)
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] text-slate-400">Structured Parking</div>
            <div className="text-lg font-bold text-white">{proForma.parkingSpaces} Spaces</div>
            <div className="text-[11px] text-slate-400">
              ${(proForma.parkingCostUsd / 1_000_000).toFixed(2)}M Podium Cost
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] text-slate-400">Year-1 Net Operating Income</div>
            <div className="text-lg font-bold text-emerald-400">
              ${(proForma.netOperatingIncomeAnnualUsd / 1_000_000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-slate-400">
              Yield on Cost {proForma.capitalStack.yieldOnCostPct}%
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANE: Real-Time Pro-Forma Sliders & Blended Capital Stack Modeler */}
      <section className="flex w-full lg:w-[540px] shrink-0 flex-col bg-slate-950 p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              Interactive Capital Stack & Underwriting Controls
            </h2>
            <p className="text-xs text-slate-400">
              Adjust AMI mix, structural framing, and parking ratio to model real-time LIHTC & DHCD feasibility
            </p>
          </div>
          <Badge variant="emerald">DSCR {proForma.capitalStack.dscrYear1.toFixed(2)}x</Badge>
        </div>

        {/* Interactive Parameter Sliders (conforming to modern-web-guidance: slider) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-5">
          {/* Slider 1: Target AMI Mix */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="slider-ami-mix" className="font-semibold text-slate-200">
                Target Affordable Unit Mix (% at &le; {proFormaParams.weightedAmiTier}% AMI)
              </label>
              <span className="font-mono font-bold text-emerald-400">
                {proFormaParams.targetAmiMixPct}% ({proForma.affordableUnits} units)
              </span>
            </div>
            <input
              id="slider-ami-mix"
              type="range"
              min={15}
              max={100}
              step={5}
              value={proFormaParams.targetAmiMixPct}
              aria-valuetext={`${proFormaParams.targetAmiMixPct} percent affordable units`}
              style={
                {
                  "--attr-min": 15,
                  "--attr-max": 100,
                  "--control-value": proFormaParams.targetAmiMixPct,
                } as React.CSSProperties
              }
              onChange={(e) =>
                updateProFormaParams({ targetAmiMixPct: Number(e.target.value) })
              }
              className="sitestack-slider"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>15% (HB 538 Statutory Floor)</span>
              <span>50% Mixed-Income</span>
              <span>100% LIHTC Affordable</span>
            </div>
          </div>

          {/* Slider 2: Parking Ratio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="slider-parking-ratio" className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-sky-400" />
                Off-Street Parking Ratio (Spaces / Unit)
              </label>
              <span className="font-mono font-bold text-sky-400">
                {proFormaParams.parkingRatioPerUnit.toFixed(2)} ({proForma.parkingSpaces} spaces)
              </span>
            </div>
            <input
              id="slider-parking-ratio"
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={proFormaParams.parkingRatioPerUnit}
              aria-valuetext={`${proFormaParams.parkingRatioPerUnit.toFixed(2)} parking spaces per unit`}
              style={
                {
                  "--attr-min": 0,
                  "--attr-max": 1.5,
                  "--control-value": proFormaParams.parkingRatioPerUnit,
                } as React.CSSProperties
              }
              onChange={(e) =>
                updateProFormaParams({ parkingRatioPerUnit: Number(e.target.value) })
              }
              className="sitestack-slider"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.00 (Tier-1 TOD Full Waiver)</span>
              <span>0.50 Transit-Reduced</span>
              <span>1.50 Suburban Baseline</span>
            </div>
          </div>

          {/* Construction Type Selector (Type V vs Type III vs Type I) */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-200">
              Structural Framing System (IBC Construction Type)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "TYPE_V_WOOD", label: "Type V-A Wood", cost: "$265/GSF" },
                  { id: "TYPE_III_PODIUM", label: "Type III Podium", cost: "$310/GSF" },
                  { id: "TYPE_I_CONCRETE", label: "Type I High-Rise", cost: "$375/GSF" },
                ] as Array<{ id: ConstructionType; label: string; cost: string }>
              ).map((item) => {
                const active = proFormaParams.constructionType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateProFormaParams({ constructionType: item.id })}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      active
                        ? "border-emerald-500 bg-emerald-950/40 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.cost}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weighted AMI Tier & Statutory Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
              <label htmlFor="switch-tod-bonus" className="text-xs font-medium text-slate-200 cursor-pointer">
                Apply HB 538 TOD Bonus
              </label>
              <Switch
                id="switch-tod-bonus"
                checked={proFormaParams.useTodBonus}
                onCheckedChange={(checked) => updateProFormaParams({ useTodBonus: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
              <label htmlFor="switch-pilot" className="text-xs font-medium text-slate-200 cursor-pointer">
                County PILOT Tax Abatement
              </label>
              <Switch
                id="switch-pilot"
                checked={proFormaParams.pilotAbatementEnabled}
                onCheckedChange={(checked) =>
                  updateProFormaParams({ pilotAbatementEnabled: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Blended Capital Stack & Key Financial Outputs */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Blended Capital Stack & Returns
            </h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Projected IRR: {proForma.capitalStack.projectedIrrPct}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[10px] text-slate-400">Total Development Cost</div>
              <div className="text-base font-bold text-white">
                ${(proForma.totalDevelopmentCostUsd / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-slate-500">
                ${Math.round(proForma.totalDevelopmentCostUsd / proForma.totalUnits).toLocaleString()}/unit
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[10px] text-slate-400">MD DHCD Gap Financing</div>
              <div className="text-base font-bold text-sky-400">
                ${(proForma.capitalStack.mdDhcdGapFinancingUsd / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-slate-500">RHW + County HIF Subordinate</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[10px] text-slate-400">Sponsor IRR (15-Yr)</div>
              <div className="text-base font-bold text-emerald-400">
                {proForma.capitalStack.projectedIrrPct}%
              </div>
              <div className="text-[10px] text-slate-500">
                DSCR {proForma.capitalStack.dscrYear1.toFixed(2)}x (&ge; 1.20x)
              </div>
            </div>
          </div>

          {/* Capital Stack Tranche Breakdown Bars */}
          <div className="space-y-2 text-xs">
            {[
              {
                label: `Senior Permanent Debt (DSCR ${proForma.capitalStack.dscrYear1.toFixed(2)}x)`,
                amount: proForma.capitalStack.seniorDebtUsd,
                color: "bg-slate-400",
              },
              {
                label: `${proForma.capitalStack.lihtcType.replace(/_/g, " ")} Tax Credit Equity`,
                amount: proForma.capitalStack.lihtcEquityUsd,
                color: "bg-emerald-500",
              },
              {
                label: "Maryland DHCD Rental Housing Works (RHW) Gap Loan",
                amount: proForma.capitalStack.mdDhcdGapFinancingUsd,
                color: "bg-sky-500",
              },
              {
                label: "Sponsor / Deferred Developer Fee Equity",
                amount: proForma.capitalStack.sponsorEquityUsd,
                color: "bg-amber-500",
              },
            ].map((tranche) => {
              const pct = Math.min(
                100,
                Math.round((tranche.amount / Math.max(1, proForma.totalDevelopmentCostUsd)) * 100)
              );
              return (
                <div key={tranche.label} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{tranche.label}</span>
                    <span className="font-mono font-semibold text-white">
                      ${(tranche.amount / 1_000_000).toFixed(2)}M ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${tranche.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-Year Pro-Forma Cash Flow Schedule (conforming to modern-web-guidance: responsive-table) */}
        <div className="space-y-2">
          <h3
            id="cashflow-table-caption"
            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            30-Year Operating Cash Flow Projection (Selected Milestones)
          </h3>
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="cashflow-table-caption"
            className="table-wrapper rounded-xl border border-slate-800"
          >
            <table
              className="sitestack-table text-left text-xs"
              style={
                {
                  "--label-2": '"Effective Gross Income"',
                  "--label-3": '"Operating Expenses"',
                  "--label-4": '"Net Operating Income"',
                  "--label-5": '"Net Cash Flow"',
                } as React.CSSProperties
              }
            >
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">EGI</th>
                  <th className="px-3 py-2">OpEx</th>
                  <th className="px-3 py-2">NOI</th>
                  <th className="px-3 py-2">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {proForma.thirtyYearCashFlows
                  .filter((row) => [1, 5, 10, 15, 20, 25, 30].includes(row.year))
                  .map((row) => (
                    <tr key={row.year} className="hover:bg-slate-900/50">
                      <th className="px-3 py-2 font-mono font-semibold text-white">
                        Year {row.year}
                      </th>
                      <td className="px-3 py-2 font-mono text-slate-300">
                        ${(row.egi / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-400">
                        ${(row.opex / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="px-3 py-2 font-mono text-emerald-400">
                        ${(row.noi / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-sky-300">
                        ${(row.netCashFlow / 1_000_000).toFixed(2)}M
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

