import type { Metadata } from "next";
import { TopNavigation } from "@/components/ui/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteStack — Maryland Housing Entitlement, 3D Massing & Capital Stack Platform",
  description:
    "Enterprise multi-sided housing development, land entitlement (MD HB 538), and LIHTC/DHCD capital-matching platform powered by Google ADK, FastMCP, and Google Maps Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col">
        <TopNavigation />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

