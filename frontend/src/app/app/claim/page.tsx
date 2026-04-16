"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api, type ClaimResult } from "@/lib/api";
import { IconLoader2, IconShieldCheck, IconShieldOff, IconAlertTriangle, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { type ShiftRecord } from "@/lib/api";

const SIGNAL_LABELS: Record<string, string> = {
  weather: "Weather", activity: "App Activity", rank: "Rank Drop",
  shift: "Shift Impact", disruption: "Disruption",
};

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  weather: "Rainfall above threshold at your pincode",
  activity: "Reduced delivery app activity during shift",
  rank: "Rank drop caused by weather disruption",
  shift: "Shift duration and timing within coverage window",
  disruption: "Area-wide disruption index for your zone",
};

const DECISION_LABEL: Record<string, string> = {
  APPROVED: "Payout approved",
  REJECTED: "No payout this time",
  REVIEW: "Under review",
};

function ClaimResultCard({ result, onReset }: { result: ClaimResult; onReset: () => void }) {
  const { scoring, decision, payout } = result;
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-1">Claim</p>
          <p className="font-sans font-black text-base leading-none">{result.claim_id}</p>
          <p className="font-mono text-[10px] text-foreground/40 mt-1">{result.shift_id}</p>
        </div>
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-1">Conditions met</p>
          <p className="font-sans font-black text-2xl leading-none">
            {scoring.signals_triggered}<span className="text-foreground/45 text-sm font-normal"> / 5</span>
          </p>
        </div>
        <div className={`rounded-2xl p-4 col-span-2 md:col-span-1 ${payout.eligible ? "bg-accent/15 border border-accent/30" : "bg-foreground/5 border border-foreground/10"}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/50 mb-1">Payout</p>
          {payout.eligible
            ? <p className="font-sans font-black text-2xl leading-none text-accent">₹{payout.final_amount.toFixed(0)}</p>
            : <p className="font-sans font-black text-base leading-none text-foreground/50">None</p>
          }
        </div>
      </div>

      {/* Conditions + Decision row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/45 mb-3">
            Conditions met: {scoring.signals_triggered} of 5
          </p>
          <div className="space-y-2">
            {Object.entries(scoring.signals).map(([key, triggered]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-foreground/70">{SIGNAL_LABELS[key] ?? key}</span>
                <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                  triggered ? "text-accent bg-accent/15" : "text-foreground/40 bg-foreground/[0.08]"
                }`}>
                  {triggered ? "✓ Met" : "✗ Not met"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">Result</p>
            {decision.requires_manual_review && <IconAlertTriangle size={13} className="text-yellow-400" />}
          </div>
          <div className="flex items-center gap-2 mb-3">
            {payout.eligible
              ? <IconShieldCheck size={20} className="text-accent" />
              : <IconShieldOff size={20} className="text-foreground/40" />
            }
            <span className={`font-sans font-black text-lg ${
              decision.decision === "APPROVED" ? "text-accent"
              : decision.decision === "REJECTED" ? "text-red-400"
              : "text-yellow-400"
            }`}>{DECISION_LABEL[decision.decision] ?? decision.decision}</span>
          </div>
          <p className="text-foreground/60 text-sm leading-relaxed">{decision.reason}</p>
          {payout.eligible && (
            <div className="mt-4 pt-4 border-t border-foreground/[0.08]">
              <p className="font-mono text-[9px] text-foreground/45 uppercase tracking-widest mb-1">
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

      {/* Missing conditions explanation */}
      {!payout.eligible && (
        <div className="bg-foreground/[0.05] border border-foreground/[0.10] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconAlertTriangle size={13} className="text-foreground/40 shrink-0" />
            <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">What was missing?</p>
          </div>
          <p className="text-sm text-foreground/60 mb-4">
            <span className="text-foreground/80 font-semibold">{scoring.signals_triggered} out of 5</span> conditions were met. All 5 need to be met for a payout.
          </p>
          <div className="space-y-2">
            {Object.entries(scoring.signals).map(([key, triggered]) => (
              <div key={key} className={`flex items-start gap-3 py-2 border-b border-foreground/[0.06] last:border-0 ${triggered ? "opacity-40" : ""}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${triggered ? "bg-accent" : "bg-foreground/25"}`} />
                <div>
                  <span className="text-sm font-medium text-foreground/70">{SIGNAL_LABELS[key] ?? key}</span>
                  {!triggered && <p className="font-mono text-[10px] text-foreground/40 mt-0.5">{SIGNAL_DESCRIPTIONS[key]}</p>}
                </div>
                {triggered && <span className="ml-auto font-mono text-[9px] text-accent tracking-widest uppercase shrink-0">✓ met</span>}
                {!triggered && <span className="ml-auto font-mono text-[9px] text-foreground/35 tracking-widest uppercase shrink-0">✗ not met</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReset}
        className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase text-foreground/55 hover:text-foreground/75 transition-colors cursor-pointer">
        <IconArrowLeft size={11} /> Evaluate Another
      </button>
    </div>
  );
}

function ClaimForm() {
  const { riderId } = useRider();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastShift = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("shiftshield_last_shift") ?? "null")
    : null;
  const [form, setForm] = useState({
    shift_id: searchParams.get("shift_id") ?? lastShift?.shift_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [history, setHistory] = useState<ClaimResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => { if (!riderId) router.push("/app"); }, [riderId, router]);

  useEffect(() => {
    if (!riderId) return;
    api.claim.history(riderId)
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
    api.shift.history(riderId)
      .then((data) => setShiftHistory(Array.isArray(data) ? data : []))
      .catch(() => setShiftHistory([]));
  }, [riderId, result]); // re-fetch after a new evaluation


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError(""); setLoading(true);
    try {
      setResult(await api.claim.evaluate({
        shift_id: form.shift_id.trim().toUpperCase(),
        rider_id: riderId,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally { setLoading(false); }
  }

  if (result) return (
    <div className="min-h-screen flex flex-col">
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">Result</h1>
          <p className="font-mono text-[10px] text-foreground/50 tracking-widest mt-0.5">Claim</p>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-5">
        <ClaimResultCard result={result} onReset={() => setResult(null)} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">Evaluate</h1>
          <p className="font-mono text-[10px] text-foreground/50 tracking-widest mt-0.5">Claim</p>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-5">

      {/* Claim history */}
      <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
        <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-4">Claim History</p>
        {historyLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-foreground/[0.12]">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-28 bg-foreground/8 rounded animate-pulse" />
                  <div className="h-2 w-20 bg-foreground/6 rounded animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3 w-12 bg-foreground/8 rounded animate-pulse" />
                  <div className="h-2 w-16 bg-foreground/6 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-foreground/55 text-sm">No claims evaluated yet.</p>
        ) : (
          <div className="space-y-1">
            {history.map((c) => (
              <div key={c.claim_id} className="flex items-center justify-between py-3.5 border-b border-foreground/[0.12] last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.payout.eligible ? "bg-accent" : "bg-foreground/30"}`} />
                  <div>
                    <p className="font-mono text-sm text-foreground/75">{c.shift_id}</p>
                    <p className="font-mono text-xs text-foreground/45">
                      {new Date(c.evaluated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {c.claim_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-bold ${c.payout.eligible ? "text-accent" : "text-foreground/45"}`}>
                    {c.payout.eligible ? `₹${c.payout.final_amount.toFixed(0)}` : "—"}
                  </p>
                  <p className={`font-mono text-[9px] uppercase tracking-widest ${
                    c.decision.decision === "APPROVED" ? "text-accent/90"
                    : c.decision.decision === "REJECTED" ? "text-red-400/90"
                    : "text-yellow-400/90"
                  }`}>{c.decision.decision}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-1">Evaluate a Claim</p>
              <p className="text-foreground/60 text-sm leading-relaxed">
                Enter your shift ID to check payout eligibility based on weather and activity signals.
              </p>
            </div>
            <IconShieldCheck size={22} className="text-foreground/20 shrink-0" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="font-mono text-xs tracking-widest uppercase text-foreground/55 block mb-1">Shift ID</label>
              <input value={form.shift_id}
                onChange={(e) => { setAutoFilled(false); setForm({ shift_id: e.target.value }); }}
                placeholder="SHF-XXXXXXXX" required
                className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/50 text-sm font-mono" />
              {/* Recent ended shift chips */}
              {shiftHistory.filter(s => s.status === "ENDED").slice(0, 3).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {shiftHistory.filter(s => s.status === "ENDED").slice(0, 3).map(s => (
                    <button key={s.shift_id} type="button"
                      onClick={() => { setForm({ shift_id: s.shift_id }); setAutoFilled(true); }}
                      className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded-lg border border-foreground/15 text-foreground/45 hover:border-accent/40 hover:text-accent transition-all cursor-pointer">
                      {s.shift_id}
                    </button>
                  ))}
                </div>
              )}
              {autoFilled && (
                <p className="flex items-center gap-1 font-mono text-[9px] text-accent/80 tracking-wide mt-1.5">
                  <IconCheck size={9} /> Selected from history
                </p>
              )}
            </div>
            {error && <p className="text-red-400 font-mono text-[10px]">{error}</p>}
            <button type="submit" disabled={loading || !form.shift_id}
              className="primary-btn py-2.5 disabled:opacity-40">
              {loading ? <IconLoader2 size={14} className="animate-spin" /> : "Run Evaluation"}
            </button>
          </form>
        </div>

        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
          <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-3">Signals scored</p>
          <div className="space-y-3">
            {["M1 Weather signal", "M2 App activity", "M3 Rank drop", "M4 Shift impact", "M5 Disruption index"].map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="font-mono text-[10px] text-foreground/45 shrink-0 mt-0.5">0{i+1}</span>
                <p className="text-foreground/65 text-xs leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
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
