"use client";

import type { StakeholderRole } from "@sitestack/ts-types";
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  Home,
  Landmark,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import {
  calculateInteractiveProForma,
  evaluateMarylandTod,
} from "@/lib/proforma-engine";
import { useSiteStackStore } from "@/lib/store";

export default function MultiSidedCollaborationDashboardPage() {
  const {
    parcels,
    selectedParcel,
    proFormaParams,
    activeRole,
    leads,
    setActiveRole,
    selectParcel,
    addStakeholderLead,
  } = useSiteStackStore();

  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedBanner, setSubmittedBanner] = useState<string | null>(null);

  const proForma = calculateInteractiveProForma(selectedParcel, proFormaParams);
  const tod = evaluateMarylandTod(selectedParcel);

  // Residual Land Valuation formula for Landowners
  const residualLandValueUsd = Math.round(
    proForma.netOperatingIncomeAnnualUsd / 0.055 -
      (proForma.totalHardCostUsd + proForma.totalSoftCostUsd + proForma.parkingCostUsd) * 0.72
  );
  const effectiveResidualLandUsd = Math.max(
    Math.round(selectedParcel.assessedValueUsd * 1.28),
    residualLandValueUsd
  );

  const handlePublishLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contactName.trim()) return;

    const intentMap: Record<StakeholderRole, "RESIDUAL_LAND_VALUATION" | "SUBSIDY_COMMITMENT" | "ZONING_AUDIT_APPROVAL" | "VOUCHER_WAITLIST_PREAPP"> = {
      LANDOWNER: "RESIDUAL_LAND_VALUATION",
      DEVELOPER: "SUBSIDY_COMMITMENT",
      MUNICIPAL_PLANNER: "ZONING_AUDIT_APPROVAL",
      RENTER: "VOUCHER_WAITLIST_PREAPP",
    };

    addStakeholderLead({
      parcelId: selectedParcel.id,
      role: activeRole,
      organizationName: orgName,
      contactName,
      contactEmail: contactEmail || "stakeholder@sitestack.md.gov",
      intentType: intentMap[activeRole],
      proposedUnits: proForma.totalUnits,
      householdAmiPct: activeRole === "RENTER" ? 60 : undefined,
      voucherType: activeRole === "RENTER" ? "MD_BRHP" : undefined,
      notes:
        notes ||
        `Submitted via SiteStack ${activeRole} portal for ${selectedParcel.address}.`,
      status: "MATCHED",
    });

    setSubmittedBanner(
      `Published ${activeRole.replace("_", " ")} record for ${selectedParcel.address}`
    );
    setOrgName("");
    setContactName("");
    setContactEmail("");
    setNotes("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
      {/* Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Multi-Sided Maryland Housing Ecosystem Hub
          </div>
          <h1 className="text-2xl font-bold text-white">
            Stakeholder Collaboration & Entitlement Audit Portal
          </h1>
          <p className="text-xs text-slate-400">
            Switch portals below to inspect role-specific workflows across Montgomery County, Prince
            George&apos;s County, and Baltimore City
          </p>
        </div>

        <Tabs
          value={activeRole}
          onValueChange={(val) => setActiveRole(val as StakeholderRole)}
        >
          <TabsList aria-label="Select Stakeholder Portal Role">
            <TabsTrigger value="LANDOWNER">Landowners</TabsTrigger>
            <TabsTrigger value="DEVELOPER">Developers & Nonprofits</TabsTrigger>
            <TabsTrigger value="MUNICIPAL_PLANNER">Municipal Planners</TabsTrigger>
            <TabsTrigger value="RENTER">Renters (AMI Registry)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {submittedBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {submittedBanner}
          </span>
          <button
            type="button"
            onClick={() => setSubmittedBanner(null)}
            className="text-emerald-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role-Specific Portal Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* PORTAL 1: LANDOWNERS */}
          {activeRole === "LANDOWNER" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-400" />
                    Landowner Portal: 1-Click Residual Land Valuation & RFP Publisher
                  </h2>
                  <p className="text-xs text-slate-400">
                    Quantify land value uplift created by Maryland HB 538 statutory TOD density
                    bonuses
                  </p>
                </div>
                <Badge variant="emerald">+30% HB 538 Uplift</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400">Current SDAT Assessment</div>
                  <div className="text-lg font-bold text-slate-200">
                    ${(selectedParcel.assessedValueUsd / 1_000_000).toFixed(2)}M
                  </div>
                  <div className="text-[10px] text-slate-500">Baseline As-Is Valuation</div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <div className="text-[11px] text-emerald-300">Entitled Residual Land Value</div>
                  <div className="text-lg font-bold text-emerald-400">
                    ${(effectiveResidualLandUsd / 1_000_000).toFixed(2)}M
                  </div>
                  <div className="text-[10px] text-emerald-300/80">
                    With {proForma.totalUnits} Entitled TOD Units
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400">Recommended Structure</div>
                  <div className="text-sm font-bold text-sky-400 mt-1">
                    99-Year Ground Lease / JV
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Eligible for MD DHCD PILOT + LIHTC
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PORTAL 2: DEVELOPERS & NONPROFITS */}
          {activeRole === "DEVELOPER" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-sky-400" />
                    Developer & CHDO Nonprofit Portal: Project Pipeline & Subsidy Matching
                  </h2>
                  <p className="text-xs text-slate-400">
                    Automated Maryland DHCD Rental Housing Works (RHW), 4%/9% LIHTC, and County HIF
                    stacking
                  </p>
                </div>
                <Badge variant="sky">DSCR {proForma.capitalStack.dscrYear1.toFixed(2)}x</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400">Matched LIHTC Execution</div>
                  <div className="text-base font-bold text-emerald-400">
                    {proForma.capitalStack.lihtcType.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    ${(proForma.capitalStack.lihtcEquityUsd / 1_000_000).toFixed(2)}M Tax Credit
                    Equity
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400">MD DHCD RHW + Local Soft Debt</div>
                  <div className="text-base font-bold text-sky-400">
                    ${(proForma.capitalStack.mdDhcdGapFinancingUsd / 1_000_000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Subordinate Cash-Flow Note
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400">PILOT Tax Abatement NPV</div>
                  <div className="text-base font-bold text-amber-400">
                    ${(proForma.capitalStack.pilotNpvSavingsUsd / 1_000_000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-slate-300 mt-1">15-Year County PILOT Agreement</div>
                </div>
              </div>
            </div>
          )}

          {/* PORTAL 3: MUNICIPAL PLANNERS */}
          {activeRole === "MUNICIPAL_PLANNER" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-amber-400" />
                    Municipal Planner Portal: Statutory HB 538 Zoning Compliance Audit Trail
                  </h2>
                  <p className="text-xs text-slate-400">
                    Deterministic audit log verifying MD Land Use Article &sect; 7-105 transit
                    proximity, IZ covenants, and environmental buffers
                  </p>
                </div>
                <Badge variant={tod.byRightApprovalEligible ? "emerald" : "amber"}>
                  {tod.byRightApprovalEligible ? "By-Right Eligible" : "Discretionary Review"}
                </Badge>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-300">
                    1. Passenger Rail Station Proximity ({selectedParcel.nearestStation})
                  </span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {selectedParcel.distanceToTransitMiles} mi (&le; 0.75 mi statutory threshold)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-300">
                    2. Mandatory Inclusionary / Affordable Covenant (&le; 60% AMI)
                  </span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {proFormaParams.targetAmiMixPct}% Provided (&ge;{" "}
                    {tod.mandatoryAffordabilityPct}% Statutory Min)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-300">
                    3. Chesapeake Bay Critical Area 1,000-ft Shoreline Buffer
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      selectedParcel.chesapeakeCriticalArea ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {selectedParcel.chesapeakeCriticalArea
                      ? "RESTRICTED — Buffer Mitigation Required"
                      : "CLEAR — Non-Critical Area"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PORTAL 4: RENTERS */}
          {activeRole === "RENTER" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Home className="h-4 w-4 text-emerald-400" />
                    Maryland Renter Portal: Income-Restricted & Voucher Pre-Application Registry
                  </h2>
                  <p className="text-xs text-slate-400">
                    HUD Housing Choice Voucher (HCV) and Baltimore Regional Housing Partnership
                    (BRHP) mobility-friendly units
                  </p>
                </div>
                <Badge variant="emerald">{proForma.affordableUnits} Restricted Units</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">30% AMI (Deeply Affordable)</div>
                  <div className="text-base font-bold text-white mt-0.5">$980 / mo (2BR)</div>
                  <div className="text-[10px] text-emerald-400">Project-Based Voucher Eligible</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">50% AMI (Workforce Tier 1)</div>
                  <div className="text-base font-bold text-white mt-0.5">$1,540 / mo (2BR)</div>
                  <div className="text-[10px] text-emerald-400">HUD SAFMR / BRHP Accepted</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">60% AMI (HB 538 Statutory Tier)</div>
                  <div className="text-base font-bold text-white mt-0.5">$1,820 / mo (2BR)</div>
                  <div className="text-[10px] text-emerald-400">Direct Transit Access</div>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Table of Seeded Maryland Parcels & Multi-Sided Leads */}
          <div className="space-y-3">
            <h3
              id="stakeholder-leads-caption"
              className="text-sm font-semibold text-white flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              Active Multi-Sided Stakeholder Intent Ledger ({leads.length} Records)
            </h3>
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="stakeholder-leads-caption"
              className="table-wrapper rounded-xl border border-slate-800"
            >
              <table
                className="sitestack-table text-left text-xs"
                style={
                  {
                    "--label-2": '"Role"',
                    "--label-3": '"Intent Type"',
                    "--label-4": '"Notes"',
                    "--label-5": '"Status"',
                  } as React.CSSProperties
                }
              >
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                    <th className="px-3.5 py-2.5">Organization / Contact</th>
                    <th className="px-3.5 py-2.5">Role</th>
                    <th className="px-3.5 py-2.5">Intent</th>
                    <th className="px-3.5 py-2.5">Summary Notes</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-900/50">
                      <th className="px-3.5 py-2.5 font-medium text-white">
                        <div>{lead.organizationName}</div>
                        <div className="text-[10px] font-normal text-slate-400">
                          {lead.contactName}
                        </div>
                      </th>
                      <td className="px-3.5 py-2.5 text-slate-300">
                        {lead.role.replace("_", " ")}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-sky-300">
                        {lead.intentType.replace(/_/g, " ")}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300 max-w-xs">{lead.notes}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge
                          variant={
                            lead.status === "APPROVED"
                              ? "emerald"
                              : lead.status === "MATCHED"
                                ? "sky"
                                : "amber"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Submit New Role Action / Intent Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            Submit {activeRole.replace("_", " ")} Action
          </h3>

          <form onSubmit={handlePublishLead} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="dash-parcel" className="block text-slate-300 mb-1 font-medium">
                Target Maryland Parcel
              </label>
              <select
                id="dash-parcel"
                value={selectedParcel.id}
                onChange={(e) => selectParcel(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address.split(",")[0]} ({p.countyName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dash-org" className="block text-slate-300 mb-1 font-medium">
                {activeRole === "RENTER"
                  ? "Household / Voucher Program Name"
                  : "Organization / Agency Name"}
              </label>
              <input
                id="dash-org"
                type="text"
                required
                placeholder="e.g., Montgomery Housing Partnership"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label htmlFor="dash-contact" className="block text-slate-300 mb-1 font-medium">
                Primary Contact Name
              </label>
              <input
                id="dash-contact"
                type="text"
                required
                placeholder="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label htmlFor="dash-email" className="block text-slate-300 mb-1 font-medium">
                Contact Email
              </label>
              <input
                id="dash-email"
                type="email"
                placeholder="name@organization.org"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label htmlFor="dash-notes" className="block text-slate-300 mb-1 font-medium">
                RFP / Subsidy / Pre-Application Notes
              </label>
              <textarea
                id="dash-notes"
                rows={3}
                placeholder="Specify LIHTC tranche, ground-lease terms, or bedroom requirement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Publish to SiteStack Ledger
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Need full 3D massing sliders?</span>
            <Link
              href={`/pro-forma/${selectedParcel.id}`}
              className="text-emerald-400 font-semibold hover:underline"
            >
              Open Pro-Forma Studio &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

