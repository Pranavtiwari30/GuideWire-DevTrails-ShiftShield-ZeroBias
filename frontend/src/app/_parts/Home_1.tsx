"use client";
import { useGSAP } from "@gsap/react";
import {
	IconArrowRight,
	IconChevronRight,
	IconCloudRain,
	IconShieldCheck,
	IconWallet,
} from "@tabler/icons-react";
import ScrollLink from "@/components/ScrollLink";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(SplitText);

const DISRUPTIONS = ["rain", "flooding", "bandh", "curfew", "strikes"];

export default function Home_1() {
	const containerRef = useRef<HTMLDivElement>(null);
	const wordRef = useRef<HTMLSpanElement>(null);
	const stopsRef = useRef<HTMLSpanElement>(null);

	useGSAP(
		() => {
			const prefersReduced = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReduced) {
				gsap.set(
					[
						".hero-eyebrow",
						".hero-line",
						".hero-sub",
						".hero-cta",
						".float-card-1",
						".float-card-2",
						".float-card-3",
					],
					{ opacity: 1, y: 0, rotation: 0, clipPath: "none" },
				);
			} else {
				// ── Initial states ─────────────────────────────────────
				gsap.set(".hero-eyebrow", { opacity: 0, y: 14 });
				gsap.set(".hero-line", { clipPath: "inset(0 100% 0 0 round 4px)" });
				gsap.set(".hero-sub", { opacity: 0, y: 14 });
				gsap.set(".hero-cta", { opacity: 0, y: 14 });
				gsap.set(".float-card-1", { opacity: 0, y: 40, rotation: -6 });
				gsap.set(".float-card-2", {
					opacity: 0,
					y: 60,
					rotation: 0,
					scale: 0.95,
				});
				gsap.set(".float-card-3", { opacity: 0, y: 40, rotation: 5 });

				const tl = gsap.timeline();

				// Left side
				tl.to(
					".hero-eyebrow",
					{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
					0.1,
				)
					.to(
						".hero-line",
						{
							clipPath: "inset(0 0% 0 0 round 4px)",
							duration: 0.75,
							stagger: 0.18,
							ease: "power3.inOut",
						},
						0.4,
					)
					.to(
						".hero-sub",
						{ opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
						1.55,
					)
					.to(
						".hero-cta",
						{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
						1.85,
					);

				// Cards enter staggered
				tl.to(
					".float-card-1",
					{
						opacity: 1,
						y: 0,
						rotation: -5,
						duration: 0.8,
						ease: "back.out(1.4)",
					},
					0.5,
				)
					.to(
						".float-card-2",
						{
							opacity: 1,
							y: 0,
							rotation: 0,
							scale: 1,
							duration: 0.8,
							ease: "back.out(1.4)",
						},
						0.72,
					)
					.to(
						".float-card-3",
						{
							opacity: 1,
							y: 0,
							rotation: 4,
							duration: 0.8,
							ease: "back.out(1.4)",
						},
						0.94,
					);

				// ── Idle float loops (staggered phase, different durations) ──
				// Card 1 — slowest, tilts left
				gsap.to(".float-card-1", {
					y: -14,
					rotation: -3,
					duration: 3.8,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
					delay: 1.8,
				});
				// Card 2 — medium, stays upright
				gsap.to(".float-card-2", {
					y: -20,
					duration: 3.1,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
					delay: 2.3,
				});
				// Card 3 — fastest, tilts right
				gsap.to(".float-card-3", {
					y: -12,
					rotation: 6,
					duration: 2.6,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
					delay: 1.4,
				});

				// ── Word cycling ──────────────────────────────────────
				const span = wordRef.current!;
				span.style.display = "inline-block";
				span.textContent = DISRUPTIONS[0];

				let idx = 0;
				const cycleWord = () => {
					idx = (idx + 1) % DISRUPTIONS.length;
					const newWord = DISRUPTIONS[idx];
					const prevWidth = span.getBoundingClientRect().width;

					const splitOut = new SplitText(span, { type: "chars" });
					gsap.to([...splitOut.chars].reverse(), {
						opacity: 0,
						y: -7,
						stagger: 0.028,
						duration: 0.13,
						ease: "power2.in",
						onComplete: () => {
							splitOut.revert();
							span.textContent = newWord;
							const newWidth = span.getBoundingClientRect().width;
							const delta = newWidth - prevWidth;

							gsap.set(stopsRef.current, { x: -delta });
							gsap.to(stopsRef.current, {
								x: 0,
								duration: 0.42,
								ease: "power2.inOut",
							});

							const splitIn = new SplitText(span, { type: "chars" });
							gsap.from(splitIn.chars, {
								opacity: 0,
								y: 9,
								stagger: 0.045,
								duration: 0.22,
								ease: "back.out(1.7)",
								delay: 0.05,
								onComplete: () => splitIn.revert(),
							});
						},
					});
					gsap.delayedCall(2.8, cycleWord);
				};
				gsap.delayedCall(2.8, cycleWord);
			}
		},
		{ scope: containerRef },
	);

	return (
		<section
			ref={containerRef}
			aria-label="Hero"
			className="min-h-screen flex items-center px-4 md:px-10 pt-28 pb-16 overflow-hidden">
			<div className="container mx-auto max-w-6xl">
				<div className="flex items-center gap-8 justify-between">
					{/* Left */}
					<div className="flex-1 flex flex-col gap-10">
						<span className="hero-eyebrow inline-flex items-center gap-2 w-fit font-mono text-[10px] tracking-widest uppercase border border-foreground/20 rounded-full px-4 py-1.5 text-foreground/50">
							<span
								className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
								aria-hidden="true"
							/>
							Predictive Parametric Micro-Insurance
						</span>

						<h1 className="flex flex-col gap-1">
							<span className="hero-line font-sans text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.92] tracking-tight">
								1 tap.
							</span>
							<span className="hero-line font-sans text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.92] tracking-tight">
								0 claims.
							</span>
							<span className="hero-line font-sans text-[clamp(2rem,4.5vw,4rem)] font-light leading-[1.1] tracking-tight text-foreground/45">
								money before{" "}
								<span className="whitespace-nowrap">
									the{" "}
									<span
										ref={wordRef}
										className="inline-block whitespace-nowrap text-foreground font-normal">
										{DISRUPTIONS[0]}
									</span>{" "}
									<span
										ref={stopsRef}
										className="inline-block">
										stops.
									</span>
								</span>
							</span>
						</h1>

						<p className="hero-sub text-base text-foreground/55 max-w-[420px] leading-relaxed">
							ShiftShield covers delivery partners{" "}
							<strong className="text-foreground font-semibold">before</strong>{" "}
							disruption hits — not after. Pincode-level precision. One tap.
							Money arrives before the rain stops.
						</p>

						<div className="hero-cta flex items-center gap-5 flex-wrap">
							<ScrollLink
								href="#how"
								className="primary-btn text-sm px-5 py-2 gap-2">
								See How It Works
								<IconChevronRight
									size={15}
									aria-hidden="true"
								/>
							</ScrollLink>
							<ScrollLink
								href="#pillars"
								className="flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
								Our Differentiators
								<IconArrowRight
									size={14}
									aria-hidden="true"
								/>
							</ScrollLink>
						</div>
					</div>

					{/* Right visual — three floating cards */}
					<div
						className="flex-1 hidden md:flex items-center justify-center"
						aria-hidden="true">
						<div className="relative w-[480px] h-[420px] select-none">
							{/* Card 1 — Rain Alert (back-left) */}
							<div className="float-card-1 absolute left-0 top-10 w-52 bg-foreground text-background rounded-2xl p-5 shadow-xl">
								<div className="flex items-center gap-2 mb-4">
									<IconCloudRain
										size={16}
										className="text-accent"
										aria-hidden="true"
									/>
									<span className="font-mono text-[9px] tracking-widest uppercase text-background/40">
										Alert
									</span>
								</div>
								<p className="font-sans font-bold text-sm leading-snug mb-1">
									Rain detected
								</p>
								<p className="font-mono text-[9px] text-background/35 tracking-wide">
									Velachery · 600042
								</p>
								<p className="font-mono text-[9px] text-background/35 tracking-wide">
									8.2 mm/hr · 19:34
								</p>
							</div>

							{/* Card 2 — Coverage Active (front-center) */}
							<div className="float-card-2 absolute left-[110px] top-[150px] w-56 bg-foreground text-background rounded-2xl p-5 shadow-2xl ring-1 ring-accent/30 z-10">
								<div className="flex items-center gap-2 mb-4">
									<IconShieldCheck
										size={16}
										className="text-accent"
										aria-hidden="true"
									/>
									<span className="font-mono text-[9px] tracking-widest uppercase text-background/40">
										Coverage
									</span>
								</div>
								<div className="font-black text-4xl leading-none text-accent mb-2">
									₹5
								</div>
								<p className="font-mono text-[9px] text-background/35 tracking-widest uppercase mb-3">
									Per shift · Active
								</p>
								<div className="w-full h-px bg-background/10 mb-3" />
								<div className="flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
									<span className="font-mono text-[9px] text-background/40 tracking-wide uppercase">
										Protected
									</span>
								</div>
							</div>

							{/* Card 3 — Payout Sent (back-right) */}
							<div className="float-card-3 absolute right-0 top-[30px] w-52 bg-foreground text-background rounded-2xl p-5 shadow-xl">
								<div className="flex items-center gap-2 mb-4">
									<IconWallet
										size={16}
										className="text-emerald-400"
										aria-hidden="true"
									/>
									<span className="font-mono text-[9px] tracking-widest uppercase text-background/40">
										Payout
									</span>
								</div>
								<p className="font-black text-2xl leading-none text-emerald-400 mb-1">
									₹420
								</p>
								<p className="font-mono text-[9px] text-background/35 tracking-wide mb-0.5">
									UPI · 0.8s transfer
								</p>
								<p className="font-mono text-[9px] text-background/25 tracking-wide">
									Before rain stops
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
