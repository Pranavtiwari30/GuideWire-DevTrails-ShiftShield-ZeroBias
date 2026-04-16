"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type PremiumQuote } from "@/lib/api";
import { IconLoader2, IconShieldCheck, IconArrowRight, IconCalculator } from "@tabler/icons-react";

const VEHICLE_LABELS: Record<string, string> = {
  bike: "Bike", scooter: "Scooter", cycle: "Cycle", car: "Car",
};
const ZONE_LABELS: Record<string, string> = {
  metro_core: "Metro Core", metro_suburb: "Metro Suburb", tier2: "Tier 2", rural: "Rural",
};
const ZONE_RISK: Record<string, string> = {
  metro_core: "High rainfall density",
  metro_suburb: "Moderate rainfall density",
  tier2: "Variable weather patterns",
  rural: "Lower disruption frequency",
};

export default function QuotePage() {
  const { riderId, profile } = useRider();
  const router = useRouter();
  const [quote, setQuote] = useState<PremiumQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!riderId) { router.push("/app"); return; }
    if (!profile) return;
    api.premium.quote({
      rider_id: riderId,
      pincode: profile.pincode,
      zone_type: profile.zone_type,
      vehicle_type: profile.vehicle_type,
      coverage_days: 1,
    })
      .then(setQuote)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quote"))
      .finally(() => setLoading(false));
  }, [riderId, profile, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">Quote</h1>
          <p className="font-mono text-[10px] text-foreground/50 tracking-widest mt-0.5">Coverage</p>
        </div>
        <IconCalculator size={16} className="text-foreground/30" />
      </header>

      <div className="flex-1 p-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <IconLoader2 size={20} className="animate-spin text-foreground/30" />
          </div>
        ) : error ? (
          <p className="text-red-400 font-mono text-sm">{error}</p>
        ) : quote ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-2">Per Shift</p>
                <p className="font-sans font-black text-3xl leading-none text-accent">
                  ₹{quote.premium_inr.toFixed(2)}
                </p>
                <p className="font-mono text-[10px] text-foreground/40 mt-1.5">base premium</p>
              </div>
              <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-2">Max Payout</p>
                <p className="font-sans font-black text-3xl leading-none">
                  ₹{quote.max_payout_inr.toFixed(0)}
                </p>
                <p className="font-mono text-[10px] text-foreground/40 mt-1.5">when all 5 signals trigger</p>
              </div>
              <div className="bg-accent/[0.06] border border-accent/20 rounded-2xl p-5 col-span-2 md:col-span-1">
                <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-2">Your Zone</p>
                <p className="font-sans font-bold text-base leading-none">
                  {ZONE_LABELS[quote.zone_type] ?? quote.zone_type}
                </p>
                <p className="font-mono text-[10px] text-foreground/40 mt-1.5">
                  {ZONE_RISK[quote.zone_type] ?? quote.disruption_tier}
                </p>
              </div>
            </div>

            {/* Breakdown + signals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-4">Pricing Breakdown</p>
                <div className="space-y-1">
                  {[
                    ["Base daily rate", `₹${quote.breakdown.base_daily.toFixed(2)}`],
                    [`Vehicle (${VEHICLE_LABELS[quote.vehicle_type] ?? quote.vehicle_type})`, `×${quote.breakdown.vehicle_multiplier.toFixed(1)}`],
                    [`Zone risk (${quote.disruption_tier})`, `×${quote.breakdown.risk_multiplier.toFixed(1)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-foreground/[0.07]">
                      <span className="text-sm text-foreground/55">{label}</span>
                      <span className="font-mono text-sm font-bold">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3">
                    <span className="font-sans font-bold text-base">Your rate</span>
                    <span className="font-sans font-black text-xl text-accent">₹{quote.premium_inr.toFixed(2)}/shift</span>
                  </div>
                </div>
              </div>

              <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-4">What Triggers Payout</p>
                <div className="space-y-3">
                  {[
                    ["M1 Weather",      "Rainfall above threshold at your pincode"],
                    ["M2 App Activity", "Reduced delivery orders during shift"],
                    ["M3 Rank Drop",    "Your rank fell due to weather disruption"],
                    ["M4 Shift Impact", "Shift timing within coverage window"],
                    ["M5 Disruption",   "Area-wide disruption index triggered"],
                  ].map(([label, desc], i) => (
                    <div key={i} className="flex gap-3">
                      <span className="font-mono text-[10px] text-foreground/35 mt-0.5 shrink-0 w-4">0{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground/70">{label}</p>
                        <p className="font-mono text-[10px] text-foreground/40 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-foreground/35 mt-4 pt-4 border-t border-foreground/[0.08]">
                  All 5 signals must trigger for full payout.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-accent/[0.06] border border-accent/20 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IconShieldCheck size={14} className="text-accent" />
                  <p className="font-sans font-bold text-base leading-none">Ready to activate coverage?</p>
                </div>
                <p className="font-mono text-xs text-foreground/45 tracking-wide">
                  ₹{quote.premium_inr.toFixed(2)} is deducted automatically when your shift starts.
                </p>
              </div>
              <Link href="/app/shift"
                className="flex items-center gap-2 bg-accent text-background font-mono text-xs tracking-widest uppercase px-5 py-3 rounded-xl hover:bg-accent/90 transition-colors shrink-0 font-bold">
                Start Shift <IconArrowRight size={13} />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
