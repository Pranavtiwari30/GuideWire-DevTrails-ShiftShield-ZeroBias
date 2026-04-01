"use client";
import { useGSAP } from "@gsap/react";
import {
	IconAlertTriangle,
	IconClock,
	IconFileOff,
} from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const problems = [
	{
		icon: IconClock,
		title: "Claims take weeks",
		desc: "Traditional claims require adjusters, paperwork, and weeks of processing — completely unworkable for a ₹5 daily premium.",
	},
	{
		icon: IconFileOff,
		title: "Claim friction kills adoption",
		desc: "Filing a claim costs more in time than the payout is worth. Riders simply absorb the loss and move on.",
	},
	{
		icon: IconAlertTriangle,
		title: "No micro-coverage exists",
		desc: "Insurance products are designed for months or years. No one covers a single shift — until now.",
	},
];

export default function Home_3() {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

			gsap.from(".problem-header", {
				opacity: 0,
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 78%",
				},
			});
			gsap.from(".problem-card", {
				opacity: 0,
				y: 40,
				stagger: 0.13,
				duration: 0.6,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".problem-card",
					start: "top 85%",
				},
			});
			gsap.from(".problem-quote", {
				opacity: 0,
				x: -20,
				duration: 0.7,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".problem-quote",
					start: "top 88%",
				},
			});
		},
		{ scope: containerRef }
	);

	return (
		<section
			id="problem"
			ref={containerRef}
			className="scroll-mt-24 px-4 md:px-10 py-4"
		>
			<div className="container mx-auto max-w-6xl">
				<div className="rounded-3xl bg-foreground text-background p-10 md:p-16 flex flex-col gap-16">
					<div className="problem-header flex flex-col md:flex-row md:items-end gap-8 justify-between">
						<div>
							<p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mb-5">
								The Problem
							</p>
							<h2 className="font-sans font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
								Millions lose income
								<br />
								<span className="text-background/35 font-light">every time it rains.</span>
							</h2>
						</div>
						<p className="md:max-w-[260px] text-background/45 leading-relaxed text-sm">
							India has 15M+ gig delivery riders with zero income protection
							against weather disruptions. Traditional insurance doesn&apos;t
							fit their reality.
						</p>
					</div>

					<div className="flex flex-col">
						{problems.map((p, i) => {
							const Icon = p.icon;
							return (
								<div
									key={i}
									className="problem-card flex items-start gap-10 py-8 border-t border-background/8"
								>
									<span className="font-mono text-[9px] text-background/20 tracking-widest pt-1.5 w-6 shrink-0">
										{String(i + 1).padStart(2, "0")}
									</span>
									<Icon size={18} className="text-background/30 shrink-0 mt-1" aria-hidden="true" />
									<div className="flex-1">
										<h3 className="font-sans font-bold text-xl md:text-2xl mb-3 tracking-tight">
											{p.title}
										</h3>
										<p className="text-background/45 text-sm leading-relaxed max-w-lg">
											{p.desc}
										</p>
									</div>
								</div>
							);
						})}
					</div>

					<blockquote className="problem-quote pt-8 border-t border-background/8">
						<p className="font-sans font-black text-3xl md:text-5xl leading-tight tracking-tight text-background/75">
							&ldquo;Claim forms. Adjusters.
							<br />
							Weeks of waiting.&rdquo;
						</p>
						<p className="font-mono text-[9px] text-background/25 tracking-widest uppercase mt-6">
							— The current reality for 15M+ delivery riders
						</p>
					</blockquote>
				</div>
			</div>
		</section>
	);
}
