"use client";
import { useGSAP } from "@gsap/react";
import {
	IconCoin,
	IconMapPin,
	IconReportMoney,
	IconBolt,
} from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
	{
		icon: IconReportMoney,
		title: "Parametric Payouts",
		desc: "Payouts trigger on objective data — rainfall at your pincode. No claims process. No adjuster. The system pays when conditions are met.",
		tag: "Zero claims",
	},
	{
		icon: IconMapPin,
		title: "Pincode-Level Precision",
		desc: "Hyper-local weather data means your coverage reflects actual conditions where you ride, not city-wide averages that miss your street.",
		tag: "Hyperlocal",
	},
	{
		icon: IconCoin,
		title: "Sub-₹10 Premiums",
		desc: "At ₹5 per shift, ShiftShield is the first insurance product accessible at gig-economy scale — no yearly commitment required.",
		tag: "Accessible",
	},
	{
		icon: IconBolt,
		title: "Instant UPI Settlement",
		desc: "Payouts hit your UPI account in seconds, not weeks. Money arrives before the rain stops — not after your bonus is already docked.",
		tag: "Real-time",
	},
];

export default function Home_5() {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

			gsap.from(".pillars-header", {
				opacity: 0,
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 78%",
				},
			});
			gsap.from(".pillar-card", {
				opacity: 0,
				y: 45,
				stagger: 0.12,
				duration: 0.65,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".pillar-card",
					start: "top 85%",
				},
			});
		},
		{ scope: containerRef },
	);

	return (
		<section
			id="pillars"
			ref={containerRef}
			className="scroll-mt-24 px-4 md:px-10 py-4">
			<div className="container mx-auto max-w-6xl">
				<div className="rounded-3xl bg-foreground text-background p-10 md:p-16">
					<div className="pillars-header mb-14">
						<p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mb-5">
							Our Differentiators
						</p>
						<h2 className="font-sans font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
							Built different.
							<br />
							<span className="text-background/30 font-light">On purpose.</span>
						</h2>
					</div>

					<div className="flex flex-col gap-3">
						{/* Featured first pillar — full width, horizontal */}
						{(() => {
							const p = pillars[0];
							const Icon = p.icon;
							return (
								<div className="pillar-card border border-background/8 rounded-2xl p-10 md:p-12 flex flex-col md:flex-row gap-10 md:items-center justify-between hover:border-accent/20 transition-colors duration-300">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-6">
											<Icon size={22} className="text-accent" aria-hidden="true" />
											<span className="font-mono text-[9px] text-background/30 border border-background/10 rounded-full px-3 py-0.5 tracking-widest uppercase">
												{p.tag}
											</span>
										</div>
										<h3 className="font-sans font-black text-3xl md:text-4xl mb-4 tracking-tight leading-tight">
											{p.title}
										</h3>
										<p className="text-background/45 text-sm leading-relaxed max-w-lg">
											{p.desc}
										</p>
									</div>
									<div className="font-sans font-black text-[7rem] md:text-[9rem] leading-none text-background/4 select-none shrink-0" aria-hidden="true">
										01
									</div>
								</div>
							);
						})()}

						{/* Remaining 3 in a row */}
						<div className="grid md:grid-cols-3 gap-3">
							{pillars.slice(1).map((p, i) => {
								const Icon = p.icon;
								return (
									<div
										key={i}
										className="pillar-card border border-background/8 rounded-2xl p-8 flex flex-col gap-6 hover:border-accent/20 transition-colors duration-300"
									>
										<div className="flex items-start justify-between">
											<Icon size={20} className="text-accent" aria-hidden="true" />
											<span className="font-mono text-[9px] text-background/25 border border-background/10 rounded-full px-3 py-0.5 tracking-widest uppercase">
												{p.tag}
											</span>
										</div>
										<div>
											<h3 className="font-sans font-bold text-lg mb-3 tracking-tight leading-tight">
												{p.title}
											</h3>
											<p className="text-background/45 text-sm leading-relaxed">
												{p.desc}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
