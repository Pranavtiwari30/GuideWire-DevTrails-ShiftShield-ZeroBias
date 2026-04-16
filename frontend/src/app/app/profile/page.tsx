"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api } from "@/lib/api";
import { IconLoader2, IconCheck, IconUser, IconLogout, IconTrash } from "@tabler/icons-react";

const ZONE_OPTIONS = [
  ["metro_core", "Metro Core"],
  ["metro_suburb", "Metro Suburb"],
  ["tier2", "Tier 2"],
  ["rural", "Rural"],
] as const;

const VEHICLE_OPTIONS = [
  ["bike", "Bike"],
  ["scooter", "Scooter"],
  ["cycle", "Cycle"],
  ["car", "Car"],
] as const;

export default function ProfilePage() {
  const { riderId, profile, refreshProfile, clearRider } = useRider();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", phone: "", pincode: "", city: "",
    zone_type: "metro_suburb", vehicle_type: "bike", upi_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!riderId) { router.push("/app"); return; }
  }, [riderId, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        name:         profile.name ?? "",
        phone:        profile.phone ?? "",
        pincode:      profile.pincode ?? "",
        city:         profile.city ?? "",
        zone_type:    profile.zone_type ?? "metro_suburb",
        vehicle_type: profile.vehicle_type ?? "bike",
        upi_id:       profile.upi_id ?? "",
      });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError(""); setLoading(true); setSaved(false);
    try {
      await api.rider.update(riderId, {
        name:         form.name     || undefined,
        phone:        form.phone    || undefined,
        pincode:      form.pincode  || undefined,
        city:         form.city     || undefined,
        zone_type:    form.zone_type,
        vehicle_type: form.vehicle_type,
        upi_id:       form.upi_id   || undefined,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!riderId) return;
    setDeleteLoading(true);
    try {
      await api.rider.delete(riderId);
      clearRider();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-5 border-b border-foreground/[0.12] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-sans font-black text-xl leading-none tracking-tight">Profile</h1>
          <p className="font-mono text-[10px] text-foreground/50 tracking-widest mt-0.5">Account</p>
        </div>
        <IconUser size={16} className="text-foreground/30" />
      </header>

      <div className="flex-1 p-6 space-y-5">
        {/* Rider ID — read only */}
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
          <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-2">Rider ID</p>
          <p className="font-mono text-lg font-bold text-accent tracking-widest">{riderId}</p>
          <p className="font-mono text-[10px] text-foreground/35 mt-1">Your unique login credential — cannot be changed.</p>
        </div>

        {/* Editable fields */}
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-6">
          <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-5">Edit Details</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "name",    label: "Full Name",       placeholder: "Ravi Kumar",   full: true },
                { key: "phone",   label: "Phone",           placeholder: "9876543210",   full: false },
                { key: "pincode", label: "Pincode",         placeholder: "600042",       full: false },
                { key: "city",    label: "City",            placeholder: "Chennai",      full: false },
                { key: "upi_id",  label: "UPI ID",          placeholder: "ravi@upi",     full: false },
              ].map(({ key, label, placeholder, full }) => (
                <div key={key} className={full ? "sm:col-span-2" : ""}>
                  <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 text-sm"
                  />
                </div>
              ))}
              {[
                { key: "zone_type",    label: "Zone",    options: ZONE_OPTIONS },
                { key: "vehicle_type", label: "Vehicle", options: VEHICLE_OPTIONS },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className="font-mono text-xs tracking-widest uppercase text-foreground/45 block mb-1.5">{label}</label>
                  <select
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-foreground/[0.06] border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent/50 text-sm">
                    {options.map(([v, l]) => (
                      <option key={v} value={v} className="bg-zinc-900 text-foreground">{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 font-mono text-[10px]">{error}</p>}

            <button type="submit" disabled={loading}
              className="primary-btn py-2.5 disabled:opacity-40">
              {loading
                ? <IconLoader2 size={14} className="animate-spin" />
                : saved
                  ? <><IconCheck size={14} className="text-emerald-400" /> Saved</>
                  : "Save Changes"
              }
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-0.5">Session</p>
            <p className="text-sm text-foreground/55">Log out of your ShiftShield account</p>
          </div>
          <button onClick={clearRider}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-foreground/15 text-foreground/50 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.05] transition-all cursor-pointer text-sm font-medium">
            <IconLogout size={14} />
            Log out
          </button>
        </div>

        {/* Delete account */}
        <div className="bg-foreground/[0.07] border border-foreground/[0.12] rounded-2xl p-5">
          <p className="font-mono text-xs tracking-widest uppercase text-foreground/45 mb-0.5">Danger Zone</p>
          <p className="text-sm text-foreground/55 mb-4">Permanently delete your account and all data — shifts, claims, and profile.</p>
          {deleteConfirm ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-400/80 font-mono">Are you sure? This cannot be undone.</p>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer text-sm font-medium disabled:opacity-40">
                {deleteLoading ? <IconLoader2 size={13} className="animate-spin" /> : <IconTrash size={13} />}
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(false)} disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-foreground/15 text-foreground/45 hover:text-foreground/65 transition-all cursor-pointer text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-foreground/15 text-foreground/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.05] transition-all cursor-pointer text-sm font-medium">
              <IconTrash size={14} />
              Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
