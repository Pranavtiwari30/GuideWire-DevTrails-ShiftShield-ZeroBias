"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift } from "@/lib/api";
import {
  IconActivity,
  IconCalculator,
  IconFileCheck,
  IconShieldCheck,
  IconShieldOff,
  IconLoader2,
  IconArrowRight,
  IconUser,
  IconMapPin,
  IconBike,
} from "@tabler/icons-react";

type Tab = "login" | "register";

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await api.rider.register({ ...form, upi_id: form.upi_id || undefined });
      onRiderId(res.rider_id);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[75vh]">
      {/* Left — branding */}
      <div className="bg-foreground text-background rounded-2xl p-8 flex flex-col justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-6">ShiftShield</p>
          <h1 className="font-sans font-black text-5xl leading-[0.95] tracking-tight mb-6">
            Get covered.<br />
            <span className="text-background/25 font-light">Before it rains.</span>
          </h1>
          <p className="text-background/45 text-sm leading-relaxed max-w-xs">
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
                <span className="text-background/40 text-sm">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="bg-foreground text-background rounded-2xl overflow-hidden flex flex-col">
        <div className="flex border-b border-background/10">
          {(["login", "register"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-4 font-mono text-[9px] tracking-widest uppercase cursor-pointer transition-colors border-b-2 ${
                tab === t ? "text-accent border-accent" : "text-background/30 border-transparent hover:text-background/50"
              }`}>
              {t === "login" ? "Have an ID" : "New Rider"}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-2">Rider ID</label>
                <input value={loginId} onChange={(e) => setLoginId(e.target.value)}
                  placeholder="RDR-XXXXXXXX" required
                  className="w-full bg-background/10 border border-background/15 rounded-xl px-4 py-3 text-background placeholder:text-background/20 focus:outline-none focus:border-accent/50 text-sm font-mono tracking-wider" />
              </div>
              {loginError && <p className="text-red-400 font-mono text-[10px]">{loginError}</p>}
              <button type="submit" disabled={loginLoading || !loginId.trim()}
                className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm">
                {loginLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Enter App <IconArrowRight size={14} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Full Name", placeholder: "Ravi Kumar", full: true },
                  { key: "phone", label: "Phone", placeholder: "9876543210", full: false },
                  { key: "pincode", label: "Pincode", placeholder: "600042", full: false },
                  { key: "city", label: "City", placeholder: "Chennai", full: false },
                  { key: "upi_id", label: "UPI ID (optional)", placeholder: "ravi@upi", full: false },
                ].map(({ key, label, placeholder, full }) => (
                  <div key={key} className={full ? "col-span-2" : ""}>
                    <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">{label}</label>
                    <input value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} required={key !== "upi_id"}
                      className="w-full bg-background/10 border border-background/15 rounded-xl px-4 py-2.5 text-background placeholder:text-background/20 focus:outline-none focus:border-accent/50 text-sm" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "zone_type", label: "Zone", options: [["metro_core","Metro Core"],["metro_suburb","Metro Suburb"],["tier2","Tier 2"],["rural","Rural"]] },
                  { key: "vehicle_type", label: "Vehicle", options: [["bike","Bike"],["scooter","Scooter"],["cycle","Cycle"],["car","Car"]] },
                ].map(({ key, label, options }) => (
                  <div key={key}>
                    <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">{label}</label>
                    <select value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-background/10 border border-background/15 rounded-xl px-4 py-2.5 text-background focus:outline-none focus:border-accent/50 text-sm">
                      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {regError && <p className="text-red-400 font-mono text-[10px]">{regError}</p>}
              <button type="submit" disabled={regLoading}
                className="primary-btn w-full justify-center py-3 disabled:opacity-40 text-sm">
                {regLoading ? <IconLoader2 size={15} className="animate-spin" /> : <>Register <IconArrowRight size={14} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const { riderId, profile } = useRider();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      {/* Top row — rider + shift status side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rider card */}
        <div className="bg-foreground text-background rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="font-mono text-[9px] tracking-widest uppercase text-background/30">Rider</p>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
          </div>
          <h2 className="font-sans font-black text-xl leading-none mb-1">{profile?.name ?? riderId}</h2>
          <p className="font-mono text-[9px] text-background/35 tracking-widest mb-4">{riderId}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { Icon: IconMapPin, val: profile?.city ?? "—" },
              { Icon: IconBike, val: profile?.vehicle_type ?? "—" },
              { Icon: IconUser, val: profile?.zone_type?.replace("_"," ") ?? "—" },
            ].map(({ Icon, val }) => (
              <div key={val} className="bg-background/8 rounded-xl p-2.5 flex flex-col gap-1.5">
                <Icon size={12} className="text-accent" />
                <p className="text-xs text-background/75 capitalize leading-none">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shift status card */}
        <div className={`rounded-2xl p-5 transition-all ${
          shiftLoading ? "bg-foreground/5 border border-foreground/8 animate-pulse"
          : activeShift ? "bg-foreground text-background"
          : "bg-foreground/5 border border-foreground/10"
        }`}>
          {shiftLoading ? <div className="h-full min-h-[120px]" /> : activeShift ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <p className="font-mono text-[9px] tracking-widest uppercase text-background/35">Live Coverage</p>
                </div>
                <IconShieldCheck size={18} className="text-accent" />
              </div>
              <p className="font-sans font-black text-xl leading-none mb-1">{activeShift.shift_id}</p>
              <p className="font-mono text-[9px] text-background/35 tracking-widest mb-4">
                PIN {activeShift.pincode} · {new Date(activeShift.shift_start).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
              </p>
              <Link href="/app/shift"
                className="flex items-center gap-1.5 text-accent font-mono text-[9px] tracking-widest uppercase hover:opacity-70 transition-opacity">
                Manage <IconArrowRight size={11} />
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30">No Coverage</p>
                <IconShieldOff size={18} className="text-foreground/20" />
              </div>
              <p className="text-foreground/65 text-sm mb-4">No active shift. Start one to activate coverage.</p>
              <Link href="/app/shift"
                className="flex items-center gap-1.5 text-accent font-mono text-[9px] tracking-widest uppercase hover:opacity-70 transition-opacity">
                Start Shift <IconArrowRight size={11} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick actions — 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/app/shift", label: "Shift", desc: activeShift ? "Active · manage" : "Start coverage", Icon: IconActivity, active: !!activeShift },
          { href: "/app/claim", label: "Claim", desc: "Evaluate payout", Icon: IconFileCheck, active: false },
          { href: "/app/quote", label: "Quote", desc: "Get premium", Icon: IconCalculator, active: false },
        ].map(({ href, label, desc, Icon, active }) => (
          <Link key={href} href={href}
            className={`rounded-2xl p-4 border flex flex-col gap-3 transition-all group hover:border-foreground/25 ${
              active ? "bg-foreground text-background border-foreground" : "border-foreground/10"
            }`}>
            <div className="flex items-center justify-between">
              <Icon size={16} className={active ? "text-accent" : "text-foreground/35 group-hover:text-foreground/55 transition-colors"} />
              <IconArrowRight size={12} className={active ? "text-background/30" : "text-foreground/20 group-hover:text-foreground/40 transition-colors"} />
            </div>
            <div>
              <p className={`font-sans font-bold text-sm ${active ? "text-background" : "text-foreground/70"}`}>{label}</p>
              <p className={`text-xs mt-0.5 ${active ? "text-background/55" : "text-foreground/55"}`}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-foreground text-background rounded-2xl p-5">
        <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-4">How Coverage Works</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Start a Shift", body: "Tap shift before you head out. Coverage activates instantly for your pincode." },
            { step: "02", title: "Ride Normally", body: "We monitor hyper-local weather and app signals in the background. No action needed." },
            { step: "03", title: "Trigger Detected", body: "Heavy rain, rank drop, or disruption? Our ML pipeline scores your shift in real-time." },
            { step: "04", title: "Payout to UPI", body: "Claim is auto-evaluated. Eligible payouts hit your UPI before the shift ends." },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-2">
              <span className="font-mono text-[9px] text-accent tracking-widest">{step}</span>
              <p className="font-sans font-black text-sm leading-tight">{title}</p>
              <p className="text-sm text-background/65 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage tiers + signals side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Payout tiers */}
        <div className="border border-foreground/10 rounded-2xl p-5">
          <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-3">Payout Tiers</p>
          <div className="space-y-2.5">
            {[
              { label: "Rain > 10mm/hr", amount: "₹50", color: "text-accent" },
              { label: "Rank drop > 20%", amount: "₹40", color: "text-amber-600" },
              { label: "App downtime > 30min", amount: "₹60", color: "text-orange-400" },
              { label: "Multi-signal disruption", amount: "₹100", color: "text-red-400" },
            ].map(({ label, amount, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-foreground/70 text-sm">{label}</span>
                <span className={`font-mono font-bold text-sm ${color}`}>{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ML signals */}
        <div className="border border-foreground/10 rounded-2xl p-5">
          <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-3">ML Signals Monitored</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "M1", name: "Weather Score" },
              { label: "M2", name: "App Activity" },
              { label: "M3", name: "Rank Drop" },
              { label: "M4", name: "Shift Impact" },
              { label: "M5", name: "Disruption Index" },
            ].map(({ label, name }) => (
              <div key={label} className="flex items-center gap-2.5 bg-foreground/5 rounded-xl px-3 py-2">
                <span className="font-mono text-[9px] text-accent shrink-0">{label}</span>
                <span className="text-foreground/75 text-sm">{name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 bg-accent/8 border border-accent/20 rounded-xl px-3 py-2 col-span-2">
              <span className="font-mono text-[9px] text-accent shrink-0">AI</span>
              <span className="text-foreground/75 text-sm">Ensemble confidence scoring</span>
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
