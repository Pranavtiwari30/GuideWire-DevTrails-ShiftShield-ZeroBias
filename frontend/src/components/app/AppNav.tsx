"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import {
	IconShieldDollar,
	IconLayoutDashboard,
	IconActivity,
	IconFileCheck,
	IconCalculator,
	IconArrowLeft,
	IconLock,
} from "@tabler/icons-react";
import { useRider } from "./RiderProvider";

const NAV = [
	{ href: "/app", label: "Dashboard", Icon: IconLayoutDashboard },
	{ href: "/app/shift", label: "Shift", Icon: IconActivity },
	{ href: "/app/claim", label: "Claim", Icon: IconFileCheck },
	{ href: "/app/quote", label: "Quote", Icon: IconCalculator },
] as const;

const PROTECTED = ["/app/shift", "/app/claim", "/app/quote"];

export function AppNav() {
	const pathname = usePathname();
	const { riderId, clearRider } = useRider();
	const [toast, setToast] = useState(false);

	const handleProtectedClick = useCallback((e: React.MouseEvent, href: string) => {
		if (!riderId && PROTECTED.includes(href)) {
			e.preventDefault();
			setToast(true);
			setTimeout(() => setToast(false), 2500);
		}
	}, [riderId]);

	return (
		<>
			{/* Login-gated toast */}
			{toast && (
				<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-foreground/[0.07] border border-foreground/[0.15] backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
					<IconLock size={12} className="text-foreground/50 shrink-0" />
					<span className="font-mono text-xs tracking-wide text-foreground/70">Log in or register to access this page.</span>
				</div>
			)}

			{/* Same fixed pill as landing Navbar */}
			<header className="fixed top-4 left-4 right-4 z-999">
				<div className="max-w-4xl mx-auto bg-foreground/80 backdrop-blur-md text-background pl-6 pr-1.5 py-1.5 rounded-2xl flex items-center justify-between gap-8">
					<Link
						href="/app"
						className="text-2xl flex items-center select-none active:scale-97 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg shrink-0">
						Shift
						<IconShieldDollar color="#00aaff" aria-hidden />
						<span className="text-accent">hield</span>
					</Link>

					{/* Centered nav — desktop only */}
					<nav className="hidden md:block" aria-label="App navigation">
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-6">
							{NAV.map(({ href, label }) => {
								const active = pathname === href;
								return (
									<Link
										key={href}
										href={href}
										onClick={(e) => handleProtectedClick(e, href)}
										className={`text-sm transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 ${
											active ? "text-accent font-medium opacity-100" : "hover:opacity-70"
										}`}>
										{label}
									</Link>
								);
							})}
						</div>
					</nav>

					{/* Right side pill */}
					<div className="hidden md:flex items-center bg-background text-foreground rounded-xl overflow-hidden shrink-0">
						{riderId && (
							<>
								<span className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 px-3 py-2">
									{riderId}
								</span>
								<div className="w-px h-4 bg-foreground/10 shrink-0" />
								<button
									onClick={clearRider}
									className="text-sm px-3 py-1.5 cursor-pointer hover:bg-foreground/6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-medium">
									Switch
								</button>
								<div className="w-px h-4 bg-foreground/10 shrink-0" />
							</>
						)}
						<Link
							href="/"
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-foreground/6 transition-colors active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-medium">
							<IconArrowLeft size={15} aria-hidden />
							Home
						</Link>
					</div>

					{/* Mobile: just show Home link as pill */}
					<div className="md:hidden flex items-center">
						<Link
							href="/"
							className="bg-background text-foreground rounded-xl px-3 py-1.5 text-sm flex items-center gap-1.5 active:scale-97 duration-300 select-none">
							<IconArrowLeft size={15} aria-hidden />
							Home
						</Link>
					</div>
				</div>
			</header>

			{/* Mobile bottom nav */}
			<nav
				className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-foreground/10 flex"
				aria-label="Mobile navigation">
				{NAV.map(({ href, label, Icon }) => {
					const active = pathname === href;
					return (
						<Link
							key={href}
							href={href}
							onClick={(e) => handleProtectedClick(e, href)}
							className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 font-mono text-[8px] tracking-widest uppercase transition-colors ${
								active ? "text-accent" : "text-foreground/30 hover:text-foreground/55"
							}`}>
							<Icon size={17} />
							{label}
						</Link>
					);
				})}
			</nav>
		</>
	);
}
