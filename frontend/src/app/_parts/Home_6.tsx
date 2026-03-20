"use client";
import { useGSAP } from "@gsap/react";
import {
	IconBuildingBank,
	IconDeviceMobileCheck,
	IconTrendingUp,
} from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const marketStats = [
	{
		num: "15M+",
		label: "Delivery Riders in India",
		desc: "Across India's leading food and grocery delivery platforms — the primary user base for ShiftShield's first phase.",
	},
	{
		num: "₹900Cr",
		label: "Annual Premium Potential",
		desc: "At ₹5 per shift, 2 shifts per day, 30 coverage days per rider per year.",
	},
	{
		num: "40%",
		label: "Income Lost Per Disruption",
		desc: "Riders lose an average of 40% of daily earnings during weather or platform disruptions.",
	},
];

const whyNow = [
	{
		icon: IconTrendingUp,
		title: "Gig Economy at Scale",
		desc: "India's gig economy is growing 30% year-on-year. The unprotected workforce has never been larger or more reachable.",
	},
	{
		icon: IconDeviceMobileCheck,
		title: "UPI Infrastructure",
		desc: "Instant UPI settlement makes real-time parametric payouts operationally possible for the first time.",
	},
	{
		icon: IconBuildingBank,
		title: "IRDAI Sandbox",
		desc: "Regulatory sandbox for parametric products is now open, creating a clear path to a compliant product launch.",
	},
];

export default function Home_6() {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

			gsap.from(".market-header", {
				opacity: 0,
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 78%",
				},
			});
			gsap.from(".market-stat", {
				opacity: 0,
				y: 40,
				stagger: 0.12,
				duration: 0.65,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".market-stat",
					start: "top 85%",
				},
			});
			gsap.from(".whynow-card", {
				opacity: 0,
				y: 40,
				stagger: 0.12,
				duration: 0.65,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".whynow-card",
					start: "top 85%",
				},
			});
		},
		{ scope: containerRef }
	);

	return (
		<section
			id="market"
			ref={containerRef}
			className="scroll-mt-24 px-4 md:px-10 py-4"
		>
			<div className="container mx-auto max-w-6xl flex flex-col gap-4">
				{/* Market — giant stacked numbers */}
				<div className="rounded-3xl bg-foreground text-background p-10 md:p-16">
					<div className="market-header mb-14">
						<p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mb-5">
							Market Opportunity
						</p>
						<h2 className="font-sans font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
							The gap is real.
							<br />
							<span className="text-background/30 font-light">The market is massive.</span>
						</h2>
					</div>

					<div className="flex flex-col">
						{marketStats.map((m, i) => (
							<div
								key={i}
								className="market-stat flex flex-col md:flex-row md:items-center gap-6 md:gap-12 py-10 border-t border-background/8"
							>
								<div className="font-sans font-black text-6xl md:text-8xl leading-none text-accent tracking-tight shrink-0 md:w-80">
									{m.num}
								</div>
								<div>
									<p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mb-3">
										{m.label}
									</p>
									<p className="text-background/45 text-sm leading-relaxed max-w-md">
										{m.desc}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Why Now — divided columns, no card boxes */}
				<div className="rounded-3xl border border-foreground/10 p-10 md:p-16">
					<p className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase mb-5">
						Why Now
					</p>
					<h2 className="font-sans font-black text-4xl md:text-6xl leading-[0.95] tracking-tight mb-14">
						The infrastructure
						<br />
						<span className="text-foreground/30 font-light">is ready.</span>
					</h2>
					<div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-foreground/8">
						{whyNow.map((w, i) => {
							const Icon = w.icon;
							return (
								<div
									key={i}
									className="whynow-card flex-1 py-8 md:py-0 md:px-10 first:pl-0 last:pr-0 flex flex-col gap-5"
								>
									<Icon size={20} className="text-foreground/35" aria-hidden="true" />
									<div>
										<h3 className="font-sans font-bold text-base mb-2 tracking-tight">
											{w.title}
										</h3>
										<p className="text-foreground/40 text-sm leading-relaxed">
											{w.desc}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
