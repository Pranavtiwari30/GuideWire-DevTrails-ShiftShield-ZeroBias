"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift } from "@/lib/api";
import {
  IconShieldCheck, IconShieldOff, IconLoader2,
  IconMapPin, IconClock, IconArrowRight, IconX,
} from "@tabler/icons-react";

export default function ShiftPage() {
  const { riderId } = useRider();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchActive = useCallback(async () => {
    if (!riderId) return;
    try { setActiveShift(await api.shift.active(riderId)); }
    catch { setActiveShift(null); }
    finally { setLoading(false); }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) { router.push("/app"); return; }
    fetchActive();
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
      await api.shift.end({ shift_id: activeShift.shift_id, rider_id: riderId });
      setSuccess("Shift ended.");
      setActiveShift(null);
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
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-1">Shift</p>
          <h1 className="font-sans font-black text-2xl tracking-tight leading-none">
            {activeShift ? "Coverage Active" : "Start Coverage"}
          </h1>
        </div>
        {activeShift && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/40">Live</span>
          </div>
        )}
      </div>

      {activeShift ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Main shift card */}
          <div className="md:col-span-2 bg-foreground text-background rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">{activeShift.shift_id}</p>
                <p className="font-sans font-black text-2xl leading-none">Shift Protected</p>
              </div>
              <IconShieldCheck size={24} className="text-accent" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-background/8 rounded-xl p-3">
                <IconMapPin size={12} className="text-accent mb-2" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-0.5">Pincode</p>
                <p className="font-sans font-bold text-base">{activeShift.pincode}</p>
              </div>
              <div className="bg-background/8 rounded-xl p-3">
                <IconClock size={12} className="text-accent mb-2" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-0.5">Started</p>
                <p className="font-sans font-bold text-base">
                  {new Date(activeShift.shift_start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            {(error || success) && (
              <p className={`font-mono text-[10px] mb-3 ${error ? "text-red-400" : "text-emerald-400"}`}>
                {error || success}
              </p>
            )}
            <button onClick={handleEnd} disabled={endLoading}
              className="flex items-center gap-2 bg-background/10 hover:bg-background/15 border border-background/15 text-background rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer">
              {endLoading ? <IconLoader2 size={14} className="animate-spin" /> : <IconX size={14} />}
              End Shift
            </button>
          </div>

          {/* Side actions */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/app/claim?shift_id=${activeShift.shift_id}&pincode=${activeShift.pincode}&shift_start=${encodeURIComponent(activeShift.shift_start)}`}
              className="bg-foreground text-background rounded-2xl p-5 flex flex-col gap-3 hover:opacity-90 transition-opacity group flex-1">
              <IconArrowRight size={16} className="text-accent" />
              <div>
                <p className="font-sans font-bold text-sm">Evaluate Claim</p>
                <p className="font-mono text-[9px] text-background/35 mt-0.5">Check payout eligibility</p>
              </div>
            </Link>
            <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex-1">
              <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-2">Coverage</p>
              <p className="text-foreground/50 text-xs leading-relaxed">
                Parametric triggers monitor rainfall at pincode {activeShift.pincode} in real-time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Start shift form */}
          <div className="md:col-span-2 bg-foreground text-background rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">No Active Coverage</p>
                <p className="text-background/50 text-sm leading-relaxed max-w-xs">
                  Enter your current pincode to activate parametric shift coverage.
                </p>
              </div>
              <IconShieldOff size={22} className="text-background/20 shrink-0" />
            </div>
            <form onSubmit={handleStart} className="space-y-3">
              <div>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">Pincode</label>
                <input value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="600042" required maxLength={6} pattern="\d{6}"
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-3 py-2 text-background placeholder:text-background/20 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-widest" />
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
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-5">
            <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-3">How it works</p>
            <div className="space-y-3">
              {[
                "Enter your pincode to define your coverage zone",
                "ShiftShield monitors rainfall at that pincode in real-time",
                "If thresholds are met, payout triggers automatically",
              ].map((step, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="font-mono text-[9px] text-foreground/25 mt-0.5 shrink-0">0{i + 1}</span>
                  <p className="text-foreground/45 text-xs leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
