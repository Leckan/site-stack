"use client";

import type { StakeholderRole } from "@sitestack/ts-types";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useSiteStackStore } from "@/lib/store";

const ROLES: Array<{ role: StakeholderRole; title: string; subtitle: string }> = [
  {
    role: "DEVELOPER",
    title: "Developer / Nonprofit CHDO",
    subtitle: "Underwrite 4%/9% LIHTC capital stacks, MD DHCD RHW subsidies & 3D massing.",
  },
  {
    role: "LANDOWNER",
    title: "Parcel Landowner / Faith-Based Institution",
    subtitle: "Run 1-click residual land valuations & publish joint-venture development RFPs.",
  },
  {
    role: "MUNICIPAL_PLANNER",
    title: "Municipal / County Planner (M-NCPPC / DOP)",
    subtitle: "Audit statutory HB 538 TOD density bonuses, parking waivers & Critical Area buffers.",
  },
  {
    role: "RENTER",
    title: "Maryland Renter / Voucher Holder (HCV / BRHP)",
    subtitle: "Pre-apply for 30%–80% AMI transit-oriented units across Montgomery, PG & Baltimore.",
  },
];

export default function SignInOnboardingPage() {
  const router = useRouter();
  const { activeRole, setActiveRole } = useSiteStackStore();
  const [email, setEmail] = useState("architect@sitestack.md.gov");
  const [organization, setOrganization] = useState("Chesapeake Community Housing Partners");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SiteStack Enterprise Onboarding</h1>
            <p className="text-xs text-slate-400">
              Select your Maryland housing ecosystem role to configure your workspace
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((item) => {
              const selected = activeRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setActiveRole(item.role)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-emerald-500 bg-emerald-950/30 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-xs font-semibold">{item.title}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1">
                Work / Municipal Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="auth-org" className="block text-xs font-medium text-slate-300 mb-1">
                Organization / Jurisdiction
              </label>
              <input
                id="auth-org"
                type="text"
                autoComplete="organization"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Continue as {activeRole.replace("_", " ")}
          </button>
        </form>
      </div>
    </div>
  );
}

