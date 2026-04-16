"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconShieldDollar,
  IconLayoutDashboard,
  IconActivity,
  IconFileCheck,
  IconCalculator,
  IconLogout,
  IconChevronRight,
  IconUser,
} from "@tabler/icons-react";
import { useRider } from "./RiderProvider";

const NAV = [
  { href: "/app",        label: "Dashboard", Icon: IconLayoutDashboard, disabled: false },
  { href: "/app/shift",  label: "Shift",     Icon: IconActivity,        disabled: false },
  { href: "/app/claim",  label: "Claim",     Icon: IconFileCheck,       disabled: false },
  { href: "/app/quote",  label: "Quote",     Icon: IconCalculator,      disabled: false },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { riderId, profile, clearRider } = useRider();

  if (!riderId) return null;

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 h-screen sticky top-0 flex-col border-r border-foreground/[0.12] bg-foreground/[0.03]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-foreground/[0.12]">
          <Link
            href="/app"
            className="flex items-center gap-2.5 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
            <IconShieldDollar size={20} color="#00aaff" aria-hidden />
            <span className="font-sans font-black text-lg leading-none tracking-tight">
              Shift<span className="text-accent">Shield</span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="App navigation">
          <p className="font-mono text-[10px] tracking-widest uppercase text-foreground/35 px-3 mb-3">Menu</p>
          {NAV.map(({ href, label, Icon, disabled }) => {
            const active = pathname === href;
            if (disabled) return (
              <div key={href} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent opacity-30 cursor-not-allowed select-none">
                <Icon size={16} />
                <span className="text-base">{label}</span>
                <span className="ml-auto font-mono text-[10px] tracking-widest uppercase border border-foreground/20 rounded px-1.5 py-0.5">soon</span>
              </div>
            );
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "border border-transparent text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
                }`}>
                <Icon size={16} />
                <span className="text-base font-medium">{label}</span>
                {active && <IconChevronRight size={13} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Rider info + logout */}
        <div className="px-3 pb-4 space-y-2 border-t border-foreground/[0.12] pt-4">
          <Link href="/app/profile"
            className="block px-3 py-4 rounded-xl bg-foreground/5 border border-foreground/[0.12] hover:border-accent/25 hover:bg-accent/[0.04] transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-foreground/40">Rider</p>
              <IconUser size={11} className="text-foreground/25 group-hover:text-accent/60 transition-colors" />
            </div>
            <p className="font-sans font-bold text-base text-foreground/75 leading-none truncate mb-1">
              {profile?.name ?? "—"}
            </p>
            <p className="font-mono text-xs text-foreground/40 tracking-widest truncate">{riderId}</p>
          </Link>
          <button onClick={clearRider}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/45 hover:text-foreground/70 hover:bg-foreground/5 transition-all cursor-pointer text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <IconLogout size={15} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-foreground/10 flex"
        aria-label="Mobile navigation">
        {NAV.filter(n => !n.disabled).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                active ? "text-accent" : "text-foreground/45 hover:text-foreground/65"
              }`}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
        <Link href="/app/profile"
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors ${
            pathname === "/app/profile" ? "text-accent" : "text-foreground/45 hover:text-foreground/65"
          }`}>
          <IconUser size={17} />
          Profile
        </Link>
      </nav>
    </>
  );
}
