"use client";

import { Building2, Calculator, Compass, Layers, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteStackStore } from "@/lib/store";
import { Badge, cn } from "./primitives";

export function TopNavigation() {
  const pathname = usePathname();
  const { selectedParcel, activeRole } = useSiteStackStore();

  const navLinks = [
    {
      href: "/explore",
      label: "Geospatial Canvas",
      icon: Compass,
    },
    {
      href: `/pro-forma/${selectedParcel.id}`,
      label: "Pro-Forma & 3D Massing",
      icon: Calculator,
    },
    {
      href: "/dashboard",
      label: "Multi-Sided Portal",
      icon: Layers,
    },
    {
      href: "/sign-in",
      label: "Stakeholder Auth",
      icon: UserCheck,
    },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/explore" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">SiteStack</span>
            <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              MD HB 538 Engine
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href.startsWith("/pro-forma") && pathname?.startsWith("/pro-forma"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="emerald" className="hidden sm:inline-flex">
          <ShieldCheck className="h-3 w-3" />
          Vertex AI ADK + FastMCP Ready
        </Badge>
        <Badge variant="sky" className="hidden lg:inline-flex">
          Role: {activeRole.replace("_", " ")}
        </Badge>
      </div>
    </header>
  );
}

