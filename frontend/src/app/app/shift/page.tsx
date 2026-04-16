"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift, type ShiftRecord } from "@/lib/api";
import {
  IconShieldCheck, IconShieldOff, IconLoader2,
  IconMapPin, IconClock, IconArrowRight, IconX, IconAlertTriangle,
} from "@tabler/icons-react";

export default function ShiftPage() {
  const { riderId } = useRider();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    if (!riderId) return;
    try { setActiveShift(await api.shift.active(riderId)); }
    catch { setActiveShift(null); }
    finally { setLoading(false); }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) { router.push("/app"); return; }
    fetchActive();
    api.shift.history(riderId)
      .then((data) => setShiftHistory(Array.isArray(data) ? data : []))
      .catch(() => setShiftHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [riderId, router, fetchActive]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError(""); setSuccess(""); setStartLoading(true);
    try {
      setActiveShift(await api.shift.start({ rider_id: riderId, pincode }));
      setSuccess("Coverage activated.");
      setPincode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start shift");
    } finally { setStartLoading(false); }
  }

  async function handleEnd() {
    if (!riderId || !activeShift) return;
    setError(""); setSuccess(""); setEndLoading(true);
    try {
      const ended = { shift_id: activeShift.shift_id, pincode: activeShift.pincode, shift_start: activeShift.shift_start };
      await api.shift.end({ shift_id: activeShift.shift_id, rider_id: riderId });
      localStorage.setItem("shiftshield_last_shift", JSON.stringify(ended));
      router.push(`/app/claim?shift_id=${ended.shift_id}&pincode=${ended.pincode}&shift_start=${encodeURIComponent(ended.shift_start)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end shift");
    } finally { setEndLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <IconLoader2 size={20} className="animate-spin text-foreground/30" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Page header bar ── */}
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">
            {activeShift ? "Coverage Active" : "Start Coverage"}
          </h1>
          <p className="font-mono text-[10px] text-foreground/50 tracking-widest mt-0.5">Shift</p>
        </div>
        {activeShift && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/50">Live</span>
          </div>
        )}
      </header>

      <div className="flex-1 p-6 space-y-5">

      {/* ── Forgotten shift warning ───────────────────── */}
      {!loading && activeShift && (() => {
        const ageHours = (Date.now() - new Date(activeShift.shift_start.endsWith("Z") || activeShift.shift_start.includes("+") ? activeShift.shift_start : activeShift.shift_start + "Z").getTime()) / 3600000;
        return ageHours > 8 ? (
          <div className="bg-yellow-400/10 border border-yellow-400/25 rounded-2xl px-5 py-4 flex items-start gap-3">
            <IconAlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-sans font-bold text-sm text-yellow-300 leading-none mb-1">Shift running for {Math.floor(ageHours)}h — did you forget to end it?</p>
              <p className="font-mono text-xs text-yellow-400/60 tracking-wide">
                A long-running shift dilutes your weather signals. End the shift now to evaluate your claim accurately.
              </p>
            </div>
          </div>
        ) : null;
      })()}

      {/* ── Shift history ─────────────────────────────── */}
      <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
        <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-4">Shift History</p>
        {historyLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-foreground/[0.12]">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-28 bg-foreground/8 rounded animate-pulse" />
                  <div className="h-2 w-20 bg-foreground/6 rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-14 bg-foreground/8 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : shiftHistory.length === 0 ? (
          <p className="text-foreground/55 text-sm">No shifts yet.</p>
        ) : (
          <div className="space-y-1">
            {shiftHistory.map((s) => {
              const start = new Date(s.shift_start.endsWith("Z") || s.shift_start.includes("+") ? s.shift_start : s.shift_start + "Z");
              const end = s.shift_end ? new Date(s.shift_end.endsWith("Z") || s.shift_end.includes("+") ? s.shift_end : s.shift_end + "Z") : null;
              const durMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
              return (
                <div key={s.shift_id} className="flex items-center justify-between py-3.5 border-b border-foreground/[0.12] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === "ACTIVE" ? "bg-accent animate-pulse" : "bg-foreground/30"}`} />
                    <div>
                      <p className="font-mono text-sm text-foreground/75">{s.shift_id}</p>
                      <p className="font-mono text-xs text-foreground/45">
                        PIN {s.pincode} · {start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-xs uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      s.status === "ACTIVE" ? "text-accent bg-accent/10" : "text-foreground/55 bg-foreground/8"
                    }`}>{s.status}</span>
                    {durMin !== null && (
                      <p className="font-mono text-[9px] text-foreground/45 mt-1">{durMin}m</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeShift ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Main shift card */}
          <div className="md:col-span-2 bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-1">{activeShift.shift_id}</p>
                <p className="font-sans font-black text-2xl leading-none">Shift Protected</p>
              </div>
              <IconShieldCheck size={24} className="text-accent" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-foreground/[0.06] rounded-xl p-3">
                <IconMapPin size={12} className="text-accent mb-2" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-0.5">Pincode</p>
                <p className="font-sans font-bold text-base">{activeShift.pincode}</p>
              </div>
              <div className="bg-foreground/[0.06] rounded-xl p-3">
                <IconClock size={12} className="text-accent mb-2" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-0.5">Started</p>
                <p className="font-sans font-bold text-base">
                  {new Date(activeShift.shift_start.endsWith("Z") || activeShift.shift_start.includes("+") ? activeShift.shift_start : activeShift.shift_start + "Z").toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            {(error || success) && (
              <p className={`font-mono text-[10px] mb-3 ${error ? "text-red-400" : "text-emerald-400"}`}>
                {error || success}
              </p>
            )}
            {confirmingEnd ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-foreground/55 tracking-widest uppercase">End shift?</span>
                <button onClick={handleEnd} disabled={endLoading}
                  className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer">
                  {endLoading ? <IconLoader2 size={12} className="animate-spin" /> : "Confirm end"}
                </button>
                <button onClick={() => setConfirmingEnd(false)} disabled={endLoading}
                  className="font-mono text-[9px] text-foreground/45 hover:text-foreground/65 tracking-widest uppercase cursor-pointer transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmingEnd(true)}
                className="flex items-center gap-2 bg-foreground/[0.08] hover:bg-foreground/10 border border-foreground/10 text-foreground rounded-xl px-4 py-2 text-sm font-medium transition-colors cursor-pointer">
                <IconX size={14} /> End Shift
              </button>
            )}
          </div>

          {/* Side actions */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/app/claim?shift_id=${activeShift.shift_id}&pincode=${activeShift.pincode}&shift_start=${encodeURIComponent(activeShift.shift_start)}`}
              className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5 flex flex-col gap-3 hover:border-accent/30 hover:bg-accent/[0.05] transition-all group flex-1">
              <IconArrowRight size={16} className="text-accent" />
              <div>
                <p className="font-sans font-bold text-sm">Evaluate Claim</p>
                <p className="font-mono text-[9px] text-foreground/40 mt-0.5">Check payout eligibility</p>
              </div>
            </Link>
            <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5 flex-1">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-2">Coverage</p>
              <p className="text-foreground/55 text-xs leading-relaxed">
                Parametric triggers monitor rainfall at pincode {activeShift.pincode} in real-time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Start shift form */}
          <div className="md:col-span-2 bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-1">No Active Coverage</p>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  Enter your current pincode to activate parametric shift coverage.
                </p>
              </div>
              <IconShieldOff size={22} className="text-foreground/20 shrink-0" />
            </div>
            <form onSubmit={handleStart} className="space-y-3">
              <div>
                <label className="font-mono text-xs tracking-widest uppercase text-foreground/55 block mb-1.5">Pincode</label>
                <input value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="600042" required maxLength={6} pattern="\d{6}"
                  className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-widest" />
              </div>
              {(error || success) && (
                <p className={`font-mono text-[10px] ${error ? "text-red-400" : "text-emerald-400"}`}>{error || success}</p>
              )}
              <button type="submit" disabled={startLoading || pincode.length !== 6}
                className="primary-btn py-2.5 disabled:opacity-40">
                {startLoading ? <IconLoader2 size={14} className="animate-spin" /> : <>Activate Coverage <IconArrowRight size={14} /></>}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
            <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-4">How it works</p>
            <div className="space-y-3">
              {[
                "Enter your pincode to define your coverage zone",
                "ShiftShield monitors rainfall at that pincode in real-time",
                "If thresholds are met, payout triggers automatically",
              ].map((step, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="font-mono text-[10px] text-foreground/45 mt-0.5 shrink-0">0{i + 1}</span>
                  <p className="text-foreground/65 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
