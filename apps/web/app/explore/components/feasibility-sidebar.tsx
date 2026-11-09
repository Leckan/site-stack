"use client";

import type {
  AgentReasoningStep,
  FeasibilityRunSummary,
  ParcelRecord,
} from "@sitestack/ts-types";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Building,
  CheckCircle2,
  Cpu,
  DollarSign,
  Play,
  ShieldAlert,
  Sparkles,
  Train,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/primitives";

interface FeasibilitySidebarProps {
  parcel: ParcelRecord;
  feasibilityRun: FeasibilityRunSummary;
  streamingSteps: AgentReasoningStep[];
  isStreaming: boolean;
  onRunFeasibility: () => void;
}

export function FeasibilitySidebar({
  parcel,
  feasibilityRun,
  streamingSteps,
  isStreaming,
  onRunFeasibility,
}: FeasibilitySidebarProps) {
  const { proForma, todQualification } = feasibilityRun;

  return (
    <aside className="flex h-[calc(100vh-3.5rem)] w-full lg:w-[440px] shrink-0 flex-col border-l border-slate-800 bg-slate-950 overflow-y-auto">
      {/* Parcel Header */}
      <div className="border-b border-slate-800 p-4 space-y-3 bg-slate-900/40">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-slate-400">
            SDAT #{parcel.accountId} • FIPS {parcel.countyFips}
          </span>
          <Badge
            variant={
              parcel.todStatus === "DIRECT_TOD_BONUS"
                ? "emerald"
                : parcel.todStatus === "STANDARD_INFILL"
                  ? "amber"
                  : "rose"
            }
          >
            {parcel.todStatus.replace(/_/g, " ")}
          </Badge>
        </div>

        <div>
          <h2 className="text-base font-bold text-white">{parcel.address}</h2>
          <p className="text-xs text-slate-400">
            {parcel.jurisdiction} • Zoning: <span className="text-slate-200">{parcel.zoningCode}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
            <div className="text-[10px] text-slate-400">Lot Area</div>
            <div className="text-xs font-semibold text-white">
              {parcel.lotSqft.toLocaleString()} sf
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
            <div className="text-[10px] text-slate-400">SDAT Assessment</div>
            <div className="text-xs font-semibold text-white">
              ${(parcel.assessedValueUsd / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
            <div className="text-[10px] text-slate-400">Transit Dist</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Train className="h-3 w-3" />
              {parcel.distanceToTransitMiles} mi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onRunFeasibility}
            disabled={isStreaming}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            {isStreaming ? "Streaming ADK Agents..." : "Re-Run ADK Feasibility"}
          </button>
          <Link
            href={`/pro-forma/${parcel.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
          >
            3D Pro-Forma Studio
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Statutory HB 538 Preemption Card */}
      <div className="border-b border-slate-800 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            MD HB 538 Statutory Preemption
          </h3>
          <span className="text-[11px] font-medium text-emerald-400">
            {todQualification.todTier.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2">
            <div className="text-sm font-bold text-emerald-300">
              +{todQualification.densityBonusPct}%
            </div>
            <div className="text-[10px] text-slate-400">Density Bonus</div>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2">
            <div className="text-sm font-bold text-emerald-300">
              +{todQualification.heightBonusFeet} ft
            </div>
            <div className="text-[10px] text-slate-400">Height Uplift</div>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2">
            <div className="text-sm font-bold text-emerald-300">
              -{todQualification.parkingMinimumReductionPct}%
            </div>
            <div className="text-[10px] text-slate-400">Parking Waiver</div>
          </div>
        </div>

        {parcel.chesapeakeCriticalArea && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            Chesapeake Bay Critical Area 100-ft shoreline buffer active; statutory TOD preemption restricted.
          </div>
        )}
      </div>

      {/* Synthesized Yield & Capital Stack Snapshot */}
      <div className="border-b border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-sky-400" />
          Entitled Envelope & Financial Synthesis
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5">
            <div className="text-[10px] text-slate-400">Allowable Yield</div>
            <div className="text-sm font-bold text-white">
              {proForma.totalUnits} Units{" "}
              <span className="text-xs font-normal text-emerald-400">
                ({proForma.affordableUnits} IZ)
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Effective FAR {proForma.effectiveFar} • {proForma.stories} Stories
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5">
            <div className="text-[10px] text-slate-400">Total Dev Cost (TDC)</div>
            <div className="text-sm font-bold text-white">
              ${(proForma.totalDevelopmentCostUsd / 1_000_000).toFixed(2)}M
            </div>
            <div className="text-[10px] text-slate-500">
              DSCR {proForma.capitalStack.dscrYear1.toFixed(2)}x • IRR{" "}
              {proForma.capitalStack.projectedIrrPct}%
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>{proForma.capitalStack.lihtcType.replace(/_/g, " ")} Equity:</span>
            <span className="font-mono font-semibold text-emerald-400">
              ${(proForma.capitalStack.lihtcEquityUsd / 1_000_000).toFixed(2)}M
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Maryland DHCD RHW Gap Loan:</span>
            <span className="font-mono font-semibold text-sky-400">
              ${(proForma.capitalStack.mdDhcdGapFinancingUsd / 1_000_000).toFixed(2)}M
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Senior Perm Debt (DSCR 1.22x):</span>
            <span className="font-mono font-semibold text-slate-100">
              ${(proForma.capitalStack.seniorDebtUsd / 1_000_000).toFixed(2)}M
            </span>
          </div>
        </div>
      </div>

      {/* Live Google ADK Multi-Agent Reasoning Stream */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            Google ADK Live Agent Trace (SSE)
          </h3>
          {isStreaming ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
              <Activity className="h-3 w-3 animate-pulse" />
              Streaming...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Synchronized
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {streamingSteps.map((step) => (
            <div
              key={step.id}
              className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  {step.agentName}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                  {step.phase}
                </span>
              </div>
              {step.toolInvoked && (
                <div className="text-[11px] font-mono text-sky-400">
                  MCP Tool → {step.toolInvoked}()
                </div>
              )}
              <p className="text-slate-300 leading-relaxed">{step.message}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

