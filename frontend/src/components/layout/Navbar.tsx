"use client";

import ScrollLink from "@/components/ScrollLink";
import { IconLogin2, IconShieldDollar, IconUserPlus } from "@tabler/icons-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Link from "next/link";
import { useRef, useState } from "react";

gsap.registerPlugin(DrawSVGPlugin);

const NAV_LINKS = [
	{ href: "#problem", label: "Problem" },
	{ href: "#how", label: "How It Works" },
	{ href: "#pillars", label: "Differentiators" },
	{ href: "#market", label: "Market" },
];

export default function Navbar() {
	const [mobileOpen, setMobileOpen] = useState(false);

	const hLine1 = useRef<SVGLineElement>(null);
	const hLine2 = useRef<SVGLineElement>(null);
	const hLine3 = useRef<SVGLineElement>(null);
	const xLine1 = useRef<SVGLineElement>(null);
	const xLine2 = useRef<SVGLineElement>(null);

	// Set initial DrawSVG state on mount
	useGSAP(
		() => {
			gsap.set([xLine1.current, xLine2.current], { drawSVG: "0%" });
			gsap.set([hLine1.current, hLine2.current, hLine3.current], { drawSVG: "100%" });
		},
		{ dependencies: [] },
	);

	// Animate between hamburger ↔ X on toggle
	useGSAP(
		() => {
			const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
			if (mobileOpen) {
				tl.to(hLine2.current, { drawSVG: "50% 50%", duration: 0.18 })
					.to([hLine1.current, hLine3.current], { drawSVG: "0%", duration: 0.22 }, "<0.04")
					.to([xLine1.current, xLine2.current], { drawSVG: "100%", duration: 0.28, stagger: 0.06 }, "-=0.08");
			} else {
				tl.to([xLine1.current, xLine2.current], { drawSVG: "0%", duration: 0.2, stagger: 0.04 })
					.to([hLine1.current, hLine3.current], { drawSVG: "100%", duration: 0.24, stagger: 0.05 }, "-=0.06")
					.to(hLine2.current, { drawSVG: "100%", duration: 0.2 }, "-=0.1");
			}
		},
		{ dependencies: [mobileOpen] },
	);

	return (
		<header className="fixed top-4 left-4 right-4 z-999">
			{/* Desktop / main bar */}
			<div className="max-w-4xl mx-auto bg-foreground/80 backdrop-blur-md text-background pl-6 pr-1.5 py-1.5 rounded-2xl flex items-center justify-between gap-8">
				<Link
					href={"/"}
					className="text-2xl flex items-center select-none active:scale-97 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
					Shift
					<IconShieldDollar color="#00aaff" aria-hidden="true" />
					<span className="text-accent">hield</span>
				</Link>

				{/* Desktop nav — hidden on mobile */}
				<nav aria-label="Main navigation" className="hidden md:block">
					<div className="absolute top-1/2 left-1/2 -translate-1/2 flex items-center justify-center gap-6">
						{NAV_LINKS.map(({ href, label }) => (
							<ScrollLink
								key={href}
								href={href}
								className="text-sm hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
								{label}
							</ScrollLink>
						))}
					</div>
				</nav>

				{/* Desktop auth — hidden on mobile */}
				<div className="hidden md:flex items-center justify-center gap-2 bg-background text-foreground rounded-xl pl-4 p-1">
					<button className="flex items-center gap-1 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
						<IconUserPlus size={18} aria-hidden="true" />
						Sign Up
					</button>
					<button className="bg-foreground text-background rounded-[0.55rem] px-4 py-1.5 flex items-center gap-1 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
						<IconLogin2 size={18} aria-hidden="true" />
						Log In
					</button>
				</div>

				{/* Hamburger — visible on mobile only */}
				<button
					className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-background text-foreground cursor-pointer active:scale-97 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					onClick={() => setMobileOpen((o) => !o)}
					aria-label={mobileOpen ? "Close menu" : "Open menu"}
					aria-expanded={mobileOpen}>
					<svg
						viewBox="0 0 20 20"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						aria-hidden="true">
						<line ref={hLine1} x1="3" y1="5" x2="17" y2="5" />
						<line ref={hLine2} x1="3" y1="10" x2="17" y2="10" />
						<line ref={hLine3} x1="3" y1="15" x2="17" y2="15" />
						<line ref={xLine1} x1="4" y1="4" x2="16" y2="16" />
						<line ref={xLine2} x1="16" y1="4" x2="4" y2="16" />
					</svg>
				</button>
			</div>

			{/* Mobile dropdown */}
			<div
				className={`md:hidden max-w-4xl mx-auto mt-2 bg-foreground/90 backdrop-blur-md text-background rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${
					mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
				}`}>
				<nav aria-label="Mobile navigation">
					<ul className="flex flex-col px-6 pt-4 pb-2 gap-1">
						{NAV_LINKS.map(({ href, label }) => (
							<li key={href}>
								<ScrollLink
									href={href}
									onClick={() => setMobileOpen(false)}
									className="block text-sm py-2 hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
									{label}
								</ScrollLink>
							</li>
						))}
					</ul>
				</nav>
				<div className="flex items-center gap-2 px-6 pb-4 pt-2 border-t border-background/10">
					<button className="flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl text-sm">
						<IconUserPlus size={17} aria-hidden="true" />
						Sign Up
					</button>
					<button className="flex-1 bg-background text-foreground rounded-xl py-2 flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm font-medium">
						<IconLogin2 size={17} aria-hidden="true" />
						Log In
					</button>
				</div>
			</div>
		</header>
	);
}
