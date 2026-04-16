"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift, type ClaimResult, type ShiftRecord } from "@/lib/api";
import {
  IconActivity,
  IconFileCheck,
  IconShieldCheck,
  IconShieldOff,
  IconLoader2,
  IconArrowRight,
  IconMapPin,
  IconCopy,
  IconCheck,
  IconArrowLeft,
  IconPhone,
} from "@tabler/icons-react";

type Tab = "login" | "register" | "forgot";

function RiderIdModal({ riderId, onConfirm }: { riderId: string; onConfirm: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(riderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowManualCopy(true);
      setCopied(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="bg-foreground/[0.07] border border-foreground/[0.15] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <p className="font-mono text-xs tracking-widest uppercase text-foreground/35 mb-6">Registration Complete</p>
        <h2 className="font-sans font-black text-xl leading-tight mb-1">Save your Rider ID</h2>
        <p className="text-foreground/50 text-sm mb-6 leading-relaxed">
          This is your only login credential. There is no password recovery — if you lose this ID, your account cannot be accessed.
        </p>

        {/* ID display */}
        <div className="bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-4 flex items-center justify-between mb-3">
          <span className="font-mono text-lg font-bold tracking-widest text-accent">{riderId}</span>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer
              border-foreground/15 text-foreground/45 hover:border-accent/50 hover:text-accent">
            {copied
              ? <><IconCheck size={11} className="text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              : <><IconCopy size={11} /><span>Copy</span></>
            }
          </button>
        </div>

        {showManualCopy && (
          <div className="mb-3">
            <p className="font-mono text-[9px] text-yellow-400/80 tracking-wide mb-1.5">Clipboard unavailable — select and copy manually:</p>
            <input readOnly value={riderId} onFocus={(e) => e.target.select()}
              className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-lg px-3 py-2 text-foreground font-mono text-sm tracking-widest cursor-text" />
          </div>
        )}
        <p className="font-mono text-[9px] text-foreground/30 tracking-wide mb-6">
          Screenshot this screen or save it somewhere safe.
        </p>

        <button onClick={onConfirm} disabled={!copied}
          className="primary-btn w-full justify-center py-3 disabled:opacity-30 transition-opacity">
          I&apos;ve saved it — Enter App
        </button>
        {!copied && (
          <p className="font-mono text-[9px] text-background/25 text-center mt-2 tracking-wide">Copy the ID first to continue</p>
        )}
      </div>
    </div>
  );
}

function OnboardingView({ onRiderId }: { onRiderId: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>("login");
  const [loginId, setLoginId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", pincode: "", city: "",
    zone_type: "metro_suburb", vehicle_type: "bike", upi_id: "",
  });
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [pendingRiderId, setPendingRiderId] = useState<string | null>(null);
  const [zoneDetecting, setZoneDetecting] = useState(false);
  const [zoneAutoDetected, setZoneAutoDetected] = useState(false);

  // Forgot ID flow
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotStep, setForgotStep] = useState<"phone" | "otp">("phone");
  const [forgotMasked, setForgotMasked] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [recoveredId, setRecoveredId] = useState<{ rider_id: string; name: string } | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(""); setForgotLoading(true);
    try {
      const res = await api.rider.forgotId(forgotPhone.trim());
      setForgotMasked(res.masked_phone);
      setForgotStep("otp");
      setResendCountdown(60);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally { setForgotLoading(false); }
  }

  async function handleResendOtp() {
    setForgotError(""); setForgotLoading(true);
    try {
      await api.rider.forgotId(forgotPhone.trim());
      setResendCountdown(60);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally { setForgotLoading(false); }
  }

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(""); setForgotLoading(true);
    try {
      const res = await api.rider.verifyOtp(forgotPhone.trim(), forgotOtp.trim());
      setRecoveredId(res);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Verification failed");
    } finally { setForgotLoading(false); }
  }

  function resetForgot() {
    setForgotPhone(""); setForgotOtp(""); setForgotStep("phone");
    setForgotMasked(""); setForgotError(""); setResendCountdown(0);
    setRecoveredId(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await api.rider.get(loginId.trim().toUpperCase());
      onRiderId(loginId.trim().toUpperCase());
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Rider not found");
    } finally {
      setLoginLoading(false);
    }
  }

  const METRO_CORE = ["chennai","mumbai","delhi","bangalore","bengaluru","kolkata","hyderabad","pune","ahmedabad","new delhi"];
  const METRO_SUBURB = ["navi mumbai","thane","gurgaon","gurugram","noida","faridabad","ghaziabad","secunderabad"];
  const TIER2 = ["coimbatore","lucknow","jaipur","bhopal","indore","nagpur","patna","visakhapatnam","vadodara","surat","chandigarh","kochi","bhubaneswar","mysore","mysuru"];

  function detectZoneFromLocation(district: string, city: string): string {
    const loc = (district + " " + city).toLowerCase();
    if (METRO_CORE.some(m => loc.includes(m))) return "metro_core";
    if (METRO_SUBURB.some(m => loc.includes(m))) return "metro_suburb";
    if (TIER2.some(m => loc.includes(m))) return "tier2";
    return "rural";
  }

  async function handlePincodeChange(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: clean }));
    setZoneAutoDetected(false);
    if (clean.length === 6) {
      setZoneDetecting(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        const data = await res.json();
        if (data[0]?.Status === "Success" && data[0].PostOffice?.[0]) {
          const po = data[0].PostOffice[0];
          const zone = detectZoneFromLocation(po.District ?? "", po.Division ?? "");
          setForm((f) => ({ ...f, zone_type: zone }));
          setZoneAutoDetected(true);
        }
      } catch { /* silent fail — user keeps current selection */ }
      finally { setZoneDetecting(false); }
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await api.rider.register({ ...form, upi_id: form.upi_id || undefined });
      setPendingRiderId(res.rider_id);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  if (pendingRiderId) return (
    <RiderIdModal riderId={pendingRiderId} onConfirm={() => onRiderId(pendingRiderId)} />
  );

  return (
    <div className="min-h-screen flex items-center p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Left — branding */}
      <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-8 flex flex-col justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase text-foreground/35 mb-6">ShiftShield</p>
          <h1 className="font-sans font-black text-5xl leading-[0.95] tracking-tight mb-6">
            Get covered.<br />
            <span className="text-foreground/25 font-light">Before it rains.</span>
          </h1>
          <p className="text-foreground/50 text-sm leading-relaxed max-w-xs">
            Parametric micro-insurance for gig delivery riders. Coverage activates in one tap. Payouts hit your UPI before the rain stops.
          </p>
        </div>
        <div className="space-y-3 mt-8">
          {[
            ["₹5/shift", "Sub-₹10 premiums, no yearly commitment"],
            ["Pincode-level", "Hyper-local weather triggers, not city-wide"],
            ["Zero claims", "Automatic payout when conditions are met"],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
              <div>
                <span className="font-sans font-bold text-sm">{title} </span>
                <span className="text-foreground/45 text-sm">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex border-b border-foreground/[0.08]">
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); resetForgot(); }}
              className={`flex-1 py-4 font-mono text-xs tracking-widest uppercase cursor-pointer transition-colors border-b-2 ${
                tab === t ? "text-accent border-accent" : "text-foreground/30 border-transparent hover:text-foreground/50"
              }`}>
              {t === "login" ? "Have an ID" : "New Rider"}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          {tab === "login" && !recoveredId ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-2">Rider ID</label>
                <input value={loginId} onChange={(e) => setLoginId(e.target.value)}
                  placeholder="RDR-XXXXXXXX" required
                  className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-wider" />
              </div>
              {loginError && <p className="text-red-400 font-mono text-[10px]">{loginError}</p>}
              <button type="submit" disabled={loginLoading || !loginId.trim()}
                className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm">
                {loginLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Enter App <IconArrowRight size={14} /></>}
              </button>
              <button type="button" onClick={() => setTab("forgot")}
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-foreground/35 hover:text-accent transition-colors cursor-pointer mt-1">
                <IconPhone size={10} /> Forgot your Rider ID?
              </button>
            </form>
          ) : tab === "forgot" || recoveredId ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => { setTab("login"); resetForgot(); }}
                  className="text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer">
                  <IconArrowLeft size={14} />
                </button>
                <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">
                  {recoveredId ? "ID Recovered" : "Recover Rider ID"}
                </p>
              </div>

              {/* Recovered state */}
              {recoveredId ? (
                <div className="space-y-4">
                  <p className="text-foreground/60 text-sm">Welcome back, <span className="text-foreground font-semibold">{recoveredId.name}</span>. Your Rider ID is:</p>
                  <div className="bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-4 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold tracking-widest text-accent">{recoveredId.rider_id}</span>
                  </div>
                  <button onClick={() => onRiderId(recoveredId.rider_id)}
                    className="primary-btn w-full justify-center py-3 text-sm">
                    Enter App <IconArrowRight size={14} />
                  </button>
                </div>
              ) : forgotStep === "phone" ? (
                /* Step 1 — phone */
                <form onSubmit={handleForgotSend} className="space-y-3">
                  <p className="text-foreground/55 text-sm leading-relaxed">Enter the phone number you registered with.</p>
                  <div>
                    <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-2">Phone Number</label>
                    <input value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210" required maxLength={10} pattern="\d{10}"
                      className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-wider" />
                  </div>
                  {forgotError && <p className="text-red-400 font-mono text-[10px]">{forgotError}</p>}
                  <button type="submit" disabled={forgotLoading || forgotPhone.length !== 10}
                    className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm">
                    {forgotLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Send OTP <IconArrowRight size={14} /></>}
                  </button>
                </form>
              ) : (
                /* Step 2 — OTP */
                <form onSubmit={handleForgotVerify} className="space-y-3">
                  <p className="text-foreground/55 text-sm leading-relaxed">OTP sent to <span className="text-foreground font-mono">{forgotMasked}</span>.</p>
                  <div>
                    <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-2">Enter OTP</label>
                    <input value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456" required maxLength={6} pattern="\d{6}"
                      className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-[0.3em]" />
                  </div>
                  {forgotError && <p className="text-red-400 font-mono text-[10px]">{forgotError}</p>}
                  <button type="submit" disabled={forgotLoading || forgotOtp.length !== 6}
                    className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm">
                    {forgotLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Verify & Recover <IconArrowRight size={14} /></>}
                  </button>
                  <button type="button" onClick={handleResendOtp} disabled={resendCountdown > 0 || forgotLoading}
                    className="font-mono text-[10px] tracking-widest uppercase text-foreground/35 hover:text-foreground/55 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Full Name", placeholder: "Ravi Kumar", full: true },
                  { key: "phone", label: "Phone", placeholder: "9876543210", full: false },
                  { key: "city", label: "City", placeholder: "Chennai", full: false },
                  { key: "upi_id", label: "UPI ID (optional)", placeholder: "ravi@upi", full: false },
                ].map(({ key, label, placeholder, full }) => (
                  <div key={key} className={full ? "sm:col-span-2" : ""}>
                    <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-1.5">{label}</label>
                    <input value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} required={key !== "upi_id"}
                      className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm" />
                  </div>
                ))}
                {/* Pincode — separate with auto-detect */}
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-1.5">
                    Pincode {zoneDetecting && <span className="text-foreground/35 normal-case tracking-normal font-normal">detecting zone...</span>}
                  </label>
                  <input value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="600042" required maxLength={6} pattern="\d{6}"
                    className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-widest" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "zone_type", label: "Zone", options: [["metro_core","Metro Core"],["metro_suburb","Metro Suburb"],["tier2","Tier 2"],["rural","Rural"]] },
                  { key: "vehicle_type", label: "Vehicle", options: [["bike","Bike"],["scooter","Scooter"],["cycle","Cycle"],["car","Car"]] },
                ].map(({ key, label, options }) => (
                  <div key={key}>
                    <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-1.5">
                      {label}
                      {key === "zone_type" && zoneAutoDetected && (
                        <span className="ml-1.5 text-accent/70 normal-case tracking-normal font-normal text-[9px]">auto-detected</span>
                      )}
                    </label>
                    <select value={form[key as keyof typeof form]}
                      onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); if (key === "zone_type") setZoneAutoDetected(false); }}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent/50 text-sm">
                      {options.map(([v, l]) => <option key={v} value={v} className="bg-zinc-900 text-foreground">{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {regError && <p className="text-red-400 font-mono text-[10px]">{regError}</p>}
              <button type="submit" disabled={regLoading}
                className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm mt-2">
                {regLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Register <IconArrowRight size={14} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

function DashboardView() {
  const { riderId, profile } = useRider();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimResult[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [shiftHistoryLoading, setShiftHistoryLoading] = useState(true);
  const [showAllClaims, setShowAllClaims] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const fetchActiveShift = useCallback(async () => {
    if (!riderId) return;
    try {
      setActiveShift(await api.shift.active(riderId));
    } catch {
      setActiveShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, [riderId]);

  useEffect(() => { fetchActiveShift(); }, [fetchActiveShift]);

  useEffect(() => {
    if (!riderId) return;
    api.claim.history(riderId)
      .then((data) => setClaims(Array.isArray(data) ? data : []))
      .catch(() => setClaims([]))
      .finally(() => setClaimsLoading(false));
    api.shift.history(riderId)
      .then((data) => setShiftHistory(Array.isArray(data) ? data : []))
      .catch(() => setShiftHistory([]))
      .finally(() => setShiftHistoryLoading(false));
  }, [riderId]);

  const totalPayout = claims.filter(c => c.payout.eligible).reduce((s, c) => s + c.payout.final_amount, 0);
  const approvedCount = claims.filter(c => c.decision.decision === "APPROVED").length;

  function parseUTC(s: string) {
    return new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z");
  }

  function formatDuration(startStr: string) {
    const mins = Math.floor((now - parseUTC(startStr).getTime()) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Page header ────────────────────────────────── */}
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">Dashboard</h1>
          <p className="font-mono text-base text-foreground/50 tracking-widest mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        {shiftLoading ? null : activeShift ? (
          <Link href="/app/shift" className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/15 transition-colors">
            <span className="w-1 h-1 rounded-full bg-accent animate-pulse shrink-0" />
            Live · PIN {activeShift.pincode}
          </Link>
        ) : (
          <Link href="/app/shift" className="font-mono text-xs tracking-widest uppercase text-foreground/30 bg-foreground/5 border border-foreground/10 rounded-full px-3 py-1.5 hover:text-foreground/50 transition-colors">
            No Coverage
          </Link>
        )}
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-5">

        {/* Active shift banner */}
        {!shiftLoading && activeShift && (
          <div className="bg-accent/[0.08] border border-accent/20 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              <div>
                <p className="font-sans font-bold text-base leading-none">Coverage Active</p>
                <p className="font-mono text-xs text-foreground/50 mt-1 tracking-widest">
                  {activeShift.shift_id} · PIN {activeShift.pincode} · {formatDuration(activeShift.shift_start)} running
                </p>
              </div>
            </div>
            <Link href="/app/shift"
              className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase text-accent hover:text-accent/70 transition-colors shrink-0">
              Manage <IconArrowRight size={11} />
            </Link>
          </div>
        )}

        {/* KPI row — 4 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1 · Active Shift */}
          <div className={`rounded-2xl p-6 border transition-all ${
            shiftLoading ? "bg-foreground/[0.07] border-foreground/[0.12] animate-pulse"
            : activeShift ? "bg-accent/[0.08] border-accent/25"
            : "bg-foreground/[0.07] border-foreground/[0.12]"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Active Shift</p>
              {activeShift ? <IconShieldCheck size={13} className="text-accent" /> : <IconShieldOff size={13} className="text-foreground/40" />}
            </div>
            {shiftLoading ? <div className="h-7 w-24 bg-foreground/10 rounded animate-pulse" /> : (
              <>
                <p className={`font-sans font-black text-xl leading-none ${activeShift ? "text-accent" : "text-foreground/45"}`}>
                  {activeShift ? activeShift.shift_id.slice(4) : "Inactive"}
                </p>
                <p className="font-mono text-xs mt-2 text-foreground/45">
                  {activeShift ? `PIN ${activeShift.pincode} · ${parseUTC(activeShift.shift_start).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : "Start a shift to activate"}
                </p>
              </>
            )}
          </div>

          {/* 2 · Total Claims */}
          <div className="bg-foreground/[0.07] rounded-2xl p-6 border border-foreground/[0.12]">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Claims</p>
              <IconFileCheck size={13} className="text-foreground/40" />
            </div>
            {claimsLoading ? <div className="h-7 w-12 bg-foreground/10 rounded animate-pulse" /> : (
              <>
                <p className="font-sans font-black text-3xl leading-none">{claims.length}</p>
                <p className="font-mono text-xs mt-2 text-foreground/45">{approvedCount} approved</p>
              </>
            )}
          </div>

          {/* 3 · Total Payout */}
          <div className="bg-foreground/[0.07] rounded-2xl p-6 border border-foreground/[0.12]">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Earned</p>
              <IconActivity size={13} className="text-foreground/40" />
            </div>
            {claimsLoading ? <div className="h-7 w-16 bg-foreground/10 rounded animate-pulse" /> : (
              <>
                <p className="font-sans font-black text-3xl leading-none text-accent">₹{totalPayout.toFixed(0)}</p>
                <p className="font-mono text-xs mt-2 text-foreground/45">{claims.filter(c => c.payout.eligible).length} eligible</p>
              </>
            )}
          </div>

          {/* 4 · Zone */}
          <div className="bg-foreground/[0.07] rounded-2xl p-6 border border-foreground/[0.12]">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Zone</p>
              <IconMapPin size={13} className="text-foreground/40" />
            </div>
            {!profile ? <div className="h-7 w-20 bg-foreground/10 rounded animate-pulse" /> : (
              <>
                <p className="font-sans font-bold text-base leading-none capitalize">{profile.zone_type?.replace("_"," ") ?? "—"}</p>
                <p className="font-mono text-xs mt-2 text-foreground/45 capitalize">{profile.vehicle_type} · {profile.city}</p>
              </>
            )}
          </div>
        </div>

        {/* Middle — Recent Shifts + Recent Claims */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Shifts */}
          <div className="border border-foreground/[0.12] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Recent Shifts</p>
              <Link href="/app/shift" className="font-mono text-xs tracking-widest uppercase text-accent/60 hover:text-accent transition-colors flex items-center gap-1">
                View all <IconArrowRight size={10} />
              </Link>
            </div>
            {shiftHistoryLoading ? (
              <div className="space-y-px">
                {[1,2,3].map(i => (
                  <div key={i} className="flex justify-between py-3.5 border-b border-foreground/[0.12]">
                    <div className="space-y-2"><div className="h-3 w-28 bg-foreground/8 rounded animate-pulse" /><div className="h-2 w-20 bg-foreground/5 rounded animate-pulse" /></div>
                    <div className="h-4 w-14 bg-foreground/8 rounded-full animate-pulse self-center" />
                  </div>
                ))}
              </div>
            ) : shiftHistory.length === 0 ? (
              <div className="space-y-3 py-1">
                <p className="text-foreground/50 text-sm">No shifts yet.</p>
                <Link href="/app/shift"
                  className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-accent/70 hover:text-accent bg-accent/[0.06] border border-accent/15 rounded-xl px-3 py-2 transition-colors">
                  Start a shift to activate coverage <IconArrowRight size={10} />
                </Link>
              </div>
            ) : (
              <div>
                {shiftHistory.slice(0,5).map(s => {
                  const start = parseUTC(s.shift_start);
                  const end = s.shift_end ? parseUTC(s.shift_end) : null;
                  const durMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
                  return (
                    <div key={s.shift_id} className="flex items-center justify-between py-3.5 border-b border-foreground/[0.12] last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === "ACTIVE" ? "bg-accent animate-pulse" : "bg-foreground/25"}`} />
                        <div>
                          <p className="font-mono text-sm text-foreground/70">{s.shift_id}</p>
                          <p className="font-mono text-xs text-foreground/45">PIN {s.pincode} · {start.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          s.status === "ACTIVE" ? "text-accent bg-accent/10" : "text-foreground/45 bg-foreground/8"
                        }`}>{s.status}</span>
                        {durMin !== null && <p className="font-mono text-[9px] text-foreground/40 mt-0.5">{durMin}m</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Claims */}
          <div className="border border-foreground/[0.12] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/45">Recent Claims</p>
              <Link href="/app/claim" className="font-mono text-xs tracking-widest uppercase text-accent/60 hover:text-accent transition-colors flex items-center gap-1">
                Evaluate <IconArrowRight size={10} />
              </Link>
            </div>
            {claimsLoading ? (
              <div className="space-y-px">
                {[1,2,3].map(i => (
                  <div key={i} className="flex justify-between py-3.5 border-b border-foreground/[0.12]">
                    <div className="space-y-2"><div className="h-3 w-28 bg-foreground/8 rounded animate-pulse" /><div className="h-2 w-20 bg-foreground/5 rounded animate-pulse" /></div>
                    <div className="space-y-1.5 items-end flex flex-col"><div className="h-3 w-10 bg-foreground/8 rounded animate-pulse" /><div className="h-2 w-14 bg-foreground/5 rounded animate-pulse" /></div>
                  </div>
                ))}
              </div>
            ) : claims.length === 0 ? (
              <div className="space-y-3 py-1">
                <p className="text-foreground/50 text-sm">No claims yet.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Start Shift","End Shift","Evaluate"].map((step,i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="font-mono text-xs tracking-widest uppercase text-foreground/55 bg-foreground/5 border border-foreground/10 rounded-lg px-2 py-1">{step}</span>
                      {i < 2 && <IconArrowRight size={9} className="text-foreground/35 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {(showAllClaims ? claims : claims.slice(0,5)).map(c => (
                  <div key={c.claim_id} className="flex items-center justify-between py-3.5 border-b border-foreground/[0.12] last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.payout.eligible ? "bg-accent" : "bg-foreground/25"}`} />
                      <div>
                        <p className="font-mono text-sm text-foreground/70">{c.shift_id}</p>
                        <p className="font-mono text-xs text-foreground/45">{new Date(c.evaluated_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-bold ${c.payout.eligible ? "text-accent" : "text-foreground/45"}`}>
                        {c.payout.eligible ? `₹${c.payout.final_amount.toFixed(0)}` : "—"}
                      </p>
                      <p className={`font-mono text-[9px] uppercase tracking-widest ${
                        c.decision.decision === "APPROVED" ? "text-accent/80"
                        : c.decision.decision === "REJECTED" ? "text-red-400/80"
                        : "text-yellow-400/80"
                      }`}>{c.decision.decision}</p>
                    </div>
                  </div>
                ))}
                {claims.length > 5 && (
                  <button onClick={() => setShowAllClaims(!showAllClaims)}
                    className="font-mono text-xs tracking-widest uppercase text-foreground/45 hover:text-foreground/65 cursor-pointer pt-2">
                    {showAllClaims ? "Show less" : `+${claims.length - 5} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom — Coverage Summary + ML signals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-foreground/[0.12] rounded-2xl p-6">
            <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-5">Coverage Summary</p>
            <div className="space-y-4">
              {[
                ["Premium", "from ₹2/shift", "text-accent"],
                ["Max payout per shift", "₹200", "text-foreground/70"],
                ["Coverage window", "1 shift", "text-foreground/70"],
                ["Payout trigger", "All 5 signals", "text-foreground/70"],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/60">{label}</span>
                  <span className={`font-mono font-bold text-sm ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-foreground/[0.12] rounded-2xl p-6">
            <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-5">Signals Monitored</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "M1", name: "Weather Score" },
                { label: "M2", name: "App Activity" },
                { label: "M3", name: "Rank Drop" },
                { label: "M4", name: "Shift Impact" },
                { label: "M5", name: "Disruption Index" },
              ].map(({ label, name }) => (
                <div key={label} className="flex items-center gap-3 bg-foreground/[0.05] rounded-xl px-4 py-3">
                  <span className="font-mono text-xs text-accent shrink-0">{label}</span>
                  <span className="text-sm text-foreground/70">{name}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 bg-accent/[0.08] border border-accent/15 rounded-xl px-4 py-3 col-span-2">
                <span className="font-mono text-xs text-accent shrink-0">AI</span>
                <span className="text-sm text-foreground/70">Ensemble confidence scoring</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AppPage() {
  const { riderId, setRiderId } = useRider();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated) return null;
  if (!riderId) return <OnboardingView onRiderId={setRiderId} />;
  return <DashboardView />;
}
