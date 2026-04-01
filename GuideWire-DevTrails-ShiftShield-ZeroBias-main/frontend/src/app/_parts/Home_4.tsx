"use client";
import { useGSAP } from "@gsap/react";
import {
	IconBolt,
	IconDeviceMobile,
	IconRadar2,
	IconWallet,
} from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
	{
		num: "01",
		icon: IconDeviceMobile,
		title: "Activate Coverage",
		desc: "One tap on the app before your shift starts. Select your pincode. Coverage is live instantly — no forms, no waiting.",
	},
	{
		num: "02",
		icon: IconRadar2,
		title: "System Detects Disruption",
		desc: "Real-time weather and platform data is monitored continuously. If rainfall exceeds threshold at your pincode, the trigger fires automatically.",
	},
	{
		num: "03",
		icon: IconBolt,
		title: "Instant Payout",
		desc: "Money is credited to your UPI account before the disruption even ends. No claim. No adjuster. No wait.",
	},
	{
		num: "04",
		icon: IconWallet,
		title: "Back to Work",
		desc: "Zero paperwork. Zero claims. Zero friction. Your income gap is covered and you are back on the road.",
	},
];

export default function Home_4() {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

			gsap.from(".how-header", {
				opacity: 0,
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 78%",
				},
			});

			gsap.set(".step-card", { opacity: 0, y: 40 });

			ScrollTrigger.batch(".step-card", {
				onEnter: (elements) =>
					gsap.to(elements, {
						opacity: 1,
						y: 0,
						stagger: 0.12,
						duration: 0.65,
						ease: "power2.out",
					}),
				start: "top 85%",
			});
		},
		{ scope: containerRef }
	);

	return (
		<section
			id="how"
			ref={containerRef}
			className="scroll-mt-24 px-4 md:px-10 py-4"
		>
			<div className="container mx-auto max-w-6xl">
				<div className="how-header mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
					<div>
						<p className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase mb-5">
							How It Works
						</p>
						<h2 className="font-sans font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
							Four steps.
							<br />
							<span className="text-foreground/30 font-light">Zero friction.</span>
						</h2>
					</div>
					<p className="md:max-w-[220px] text-foreground/40 text-sm leading-relaxed">
						From activation to payout — the entire process takes seconds, not weeks.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/8 rounded-3xl overflow-hidden border border-foreground/8">
					{steps.map((s, i) => {
						const Icon = s.icon;
						return (
							<div
								key={i}
								className="step-card bg-background p-8 flex flex-col justify-between min-h-[280px] hover:bg-foreground/3 transition-colors duration-200"
							>
								<div className="flex items-start justify-between">
									<span className="font-sans font-black text-[5rem] md:text-[6.5rem] leading-none text-foreground/5 -mt-3 -ml-1 select-none" aria-hidden="true">
										{s.num}
									</span>
									<Icon size={18} className="text-foreground/35 mt-2" aria-hidden="true" />
								</div>
								<div>
									<h3 className="font-sans font-bold text-base mb-2 tracking-tight">
										{s.title}
									</h3>
									<p className="text-foreground/40 text-sm leading-relaxed">
										{s.desc}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
