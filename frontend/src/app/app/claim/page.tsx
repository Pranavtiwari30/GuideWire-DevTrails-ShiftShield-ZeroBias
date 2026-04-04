"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api, type ClaimResult } from "@/lib/api";
import { IconLoader2, IconShieldCheck, IconShieldOff, IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";

const SIGNAL_LABELS: Record<string, string> = {
  weather: "Weather", activity: "App Activity", rank: "Rank Drop",
  shift: "Shift Impact", disruption: "Disruption",
};

function ClaimResultCard({ result, onReset }: { result: ClaimResult; onReset: () => void }) {
  const { scoring, decision, payout } = result;
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-foreground text-background rounded-2xl p-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">Claim</p>
          <p className="font-sans font-black text-base leading-none">{result.claim_id}</p>
          <p className="font-mono text-[9px] text-background/25 mt-1">{result.shift_id}</p>
        </div>
        <div className="bg-foreground text-background rounded-2xl p-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">Confidence</p>
          <p className="font-sans font-black text-2xl leading-none">
            {(scoring.confidence_score * 100).toFixed(0)}<span className="text-background/30 text-sm font-normal">%</span>
          </p>
        </div>
        <div className="bg-foreground text-background rounded-2xl p-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">ML Score</p>
          <p className="font-sans font-black text-2xl leading-none">
            {(scoring.ml_raw_score * 100).toFixed(0)}<span className="text-background/30 text-sm font-normal">%</span>
          </p>
        </div>
        <div className={`rounded-2xl p-4 ${payout.eligible ? "bg-accent/15 border border-accent/30" : "bg-foreground/5 border border-foreground/10"}`}>
          <p className="font-mono text-[9px] uppercase tracking-widest text-foreground/30 mb-1">Payout</p>
          {payout.eligible
            ? <p className="font-sans font-black text-2xl leading-none text-accent">₹{payout.final_amount.toFixed(0)}</p>
            : <p className="font-sans font-black text-base leading-none text-foreground/30">None</p>
          }
        </div>
      </div>

      {/* Signals + Decision row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-foreground text-background rounded-2xl p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-3">
            Signals ({scoring.signals_triggered}/5)
          </p>
          <div className="space-y-2">
            {Object.entries(scoring.signals).map(([key, triggered]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-background/60">{SIGNAL_LABELS[key] ?? key}</span>
                <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                  triggered ? "text-accent bg-accent/15" : "text-background/25 bg-background/8"
                }`}>
                  {triggered ? "triggered" : "none"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-foreground text-background rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-background/30">Decision</p>
            {decision.requires_manual_review && <IconAlertTriangle size={13} className="text-yellow-400" />}
          </div>
          <div className="flex items-center gap-2 mb-3">
            {payout.eligible
              ? <IconShieldCheck size={20} className="text-accent" />
              : <IconShieldOff size={20} className="text-background/30" />
            }
            <span className={`font-sans font-black text-lg ${
              decision.decision === "APPROVED" ? "text-accent"
              : decision.decision === "REJECTED" ? "text-red-400"
              : "text-yellow-400"
            }`}>{decision.decision}</span>
          </div>
          <p className="text-background/45 text-sm leading-relaxed">{decision.reason}</p>
          {payout.eligible && (
            <div className="mt-4 pt-4 border-t border-background/10">
              <p className="font-mono text-[9px] text-background/30 uppercase tracking-widest mb-1">
                ₹{payout.base_amount} × {payout.disruption_multiplier}x = <span className="text-accent">₹{payout.final_amount}</span>
              </p>
              {payout.upi_ref && (
                <p className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase">
                  {payout.upi_ref} · {payout.transfer_status}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <button onClick={onReset}
        className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-foreground/35 hover:text-foreground/60 transition-colors cursor-pointer">
        <IconArrowLeft size={11} /> Evaluate Another
      </button>
    </div>
  );
}

function ClaimForm() {
  const { riderId } = useRider();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    shift_id: searchParams.get("shift_id") ?? "",
    pincode: searchParams.get("pincode") ?? "",
    shift_start: searchParams.get("shift_start") ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => { if (!riderId) router.push("/app"); }, [riderId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError(""); setLoading(true);
    try {
      setResult(await api.claim.evaluate({
        shift_id: form.shift_id.trim().toUpperCase(),
        rider_id: riderId,
        pincode: form.pincode.trim(),
        shift_start: form.shift_start || new Date().toISOString(),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally { setLoading(false); }
  }

  if (result) return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-1">Claim</p>
        <h1 className="font-sans font-black text-2xl tracking-tight leading-none">Result</h1>
      </div>
      <ClaimResultCard result={result} onReset={() => setResult(null)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-1">Claim</p>
        <h1 className="font-sans font-black text-2xl tracking-tight leading-none">Evaluate</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-foreground text-background rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "shift_id", label: "Shift ID", placeholder: "SHF-XXXXXXXX" },
              { key: "pincode", label: "Pincode", placeholder: "600042" },
              { key: "shift_start", label: "Shift Start (optional)", placeholder: new Date().toISOString().slice(0, 19) },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">{label}</label>
                <input value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} required={key !== "shift_start"}
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-3 py-2 text-background placeholder:text-background/20 focus:outline-none focus:border-accent/50 text-sm font-mono" />
              </div>
            ))}
            {error && <p className="text-red-400 font-mono text-[10px]">{error}</p>}
            <button type="submit" disabled={loading || !form.shift_id || !form.pincode}
              className="primary-btn py-2.5 disabled:opacity-40">
              {loading ? <IconLoader2 size={14} className="animate-spin" /> : "Run Evaluation"}
            </button>
          </form>
        </div>

        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-5">
          <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-3">Pipeline</p>
          <div className="space-y-3">
            {["M1 Weather signal scored", "M2 App activity verified", "M3 Rank drop detected", "M4 Shift impact assessed", "M5 Disruption checked"].map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="font-mono text-[9px] text-foreground/25 shrink-0 mt-0.5">0{i+1}</span>
                <p className="text-foreground/40 text-xs leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><IconLoader2 size={20} className="animate-spin text-foreground/30" /></div>}>
      <ClaimForm />
    </Suspense>
  );
}
