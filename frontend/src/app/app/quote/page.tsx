"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api, type PremiumQuote } from "@/lib/api";
import { IconLoader2, IconShieldCheck, IconArrowLeft } from "@tabler/icons-react";

const TIER_COLOR: Record<string, string> = {
  LOW: "text-emerald-400", MEDIUM: "text-yellow-400", HIGH: "text-red-400",
};

export default function QuotePage() {
  const { riderId, profile } = useRider();
  const router = useRouter();
  const [form, setForm] = useState({ pincode: "", zone_type: "metro_suburb", vehicle_type: "bike", coverage_days: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<PremiumQuote | null>(null);

  useEffect(() => { if (!riderId) router.push("/app"); }, [riderId, router]);
  useEffect(() => {
    if (profile) setForm((f) => ({
      ...f,
      pincode: profile.pincode || f.pincode,
      zone_type: profile.zone_type || f.zone_type,
      vehicle_type: profile.vehicle_type || f.vehicle_type,
    }));
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError(""); setLoading(true);
    try { setQuote(await api.premium.quote({ ...form, rider_id: riderId })); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-1">Premium</p>
          <h1 className="font-sans font-black text-2xl tracking-tight leading-none">
            {quote ? "Your Quote" : "Get a Quote"}
          </h1>
        </div>
        {quote && (
          <button onClick={() => setQuote(null)}
            className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-foreground/35 hover:text-foreground/60 transition-colors cursor-pointer">
            <IconArrowLeft size={11} /> New Quote
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Form — always visible */}
        <div className={`bg-foreground text-background rounded-2xl p-5 ${quote ? "md:col-span-1" : "md:col-span-2"}`}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">Pincode</label>
              <input value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="600042" required maxLength={6}
                className="w-full bg-background/10 border border-background/15 rounded-lg px-3 py-2 text-background placeholder:text-background/20 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-widest" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "zone_type", label: "Zone", options: [["metro_core","Metro Core"],["metro_suburb","Metro Suburb"],["tier2","Tier 2"],["rural","Rural"]] },
                { key: "vehicle_type", label: "Vehicle", options: [["bike","Bike"],["scooter","Scooter"],["cycle","Cycle"],["car","Car"]] },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">{label}</label>
                  <select value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-background/10 border border-background/15 rounded-lg px-3 py-2 text-background focus:outline-none focus:border-accent/50 text-sm">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">Coverage Days</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 7].map((d) => (
                  <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, coverage_days: d }))}
                    className={`py-2 rounded-lg border font-mono text-sm font-bold transition-colors cursor-pointer ${
                      form.coverage_days === d ? "border-accent/60 text-accent bg-accent/10" : "border-background/20 text-background/35 hover:border-background/40"
                    }`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 font-mono text-[10px]">{error}</p>}
            <button type="submit" disabled={loading || form.pincode.length !== 6}
              className="primary-btn py-2.5 w-full justify-center disabled:opacity-40">
              {loading ? <IconLoader2 size={14} className="animate-spin" /> : "Get Quote"}
            </button>
          </form>
        </div>

        {/* Quote result */}
        {quote ? (
          <div className="md:col-span-2 space-y-3">
            {/* Top stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-foreground text-background rounded-2xl p-4 col-span-1">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-background/30">Premium</p>
                  <IconShieldCheck size={14} className="text-accent" />
                </div>
                <p className="font-sans font-black text-3xl leading-none">₹{quote.premium_inr}</p>
                <p className="font-mono text-[9px] text-background/30 mt-1">{quote.coverage_days}d coverage</p>
              </div>
              <div className="bg-foreground text-background rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-2">Max Payout</p>
                <p className="font-sans font-black text-3xl leading-none text-accent">₹{quote.max_payout_inr}</p>
              </div>
              <div className="bg-foreground text-background rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-2">Risk Tier</p>
                <p className={`font-sans font-black text-3xl leading-none ${TIER_COLOR[quote.disruption_tier] ?? "text-background"}`}>
                  {quote.disruption_tier}
                </p>
              </div>
            </div>
            {/* Breakdown */}
            <div className="bg-foreground text-background rounded-2xl p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-3">Breakdown</p>
              <div className="space-y-2">
                {[
                  ["Base daily rate", `₹${quote.breakdown.base_daily}`],
                  ["Vehicle multiplier", `${quote.breakdown.vehicle_multiplier}×`],
                  ["Risk multiplier", `${quote.breakdown.risk_multiplier}×`],
                  ["Coverage days", `${quote.coverage_days}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-background/45">{label}</span>
                    <span className="font-mono text-background/65">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-background/10">
                  <span className="text-background/60 font-medium">Total</span>
                  <span className="font-mono font-bold text-accent">₹{quote.premium_inr}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-5">
            <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-3">Coverage Tiers</p>
            <div className="space-y-3">
              {[["1 day", "₹9–15", "Up to ₹200"], ["3 days", "₹20–35", "Up to ₹450"], ["7 days", "₹40–65", "Up to ₹800"]].map(([days, price, payout]) => (
                <div key={days} className="flex items-center justify-between">
                  <span className="text-foreground/45 text-sm">{days}</span>
                  <div className="text-right">
                    <span className="font-mono text-xs text-foreground/60">{price}</span>
                    <span className="font-mono text-[9px] text-foreground/30 block">{payout}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
