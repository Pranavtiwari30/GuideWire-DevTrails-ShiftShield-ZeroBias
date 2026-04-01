import ScrollLink from "@/components/ScrollLink";
import { IconShieldDollar } from "@tabler/icons-react";
import Link from "next/link";

const navLinks = [
	{ label: "Problem", href: "#problem" },
	{ label: "How It Works", href: "#how" },
	{ label: "Differentiators", href: "#pillars" },
	{ label: "Market", href: "#market" },
];

export default function Footer() {
	return (
		<footer className="px-4 md:px-10 py-4 pb-10">
			<div className="container mx-auto max-w-6xl">
				<div className="rounded-3xl bg-foreground text-background p-10 md:p-16">
					<div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
						<div className="flex flex-col gap-4 max-w-xs">
							<Link
								href="/"
								className="text-2xl flex items-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
								Shift
								<IconShieldDollar
									color="#00aaff"
									aria-hidden="true"
								/>
								<span className="text-accent">hield</span>
							</Link>
							<p className="text-background/50 text-sm leading-relaxed">
								Predictive parametric micro-insurance for India&apos;s gig
								delivery workforce.
							</p>
							<span className="font-mono text-[9px] text-background/25 tracking-widest uppercase border border-background/10 rounded-full px-3 py-1 w-fit">
								Guidewire DEVTrails 2026
							</span>
						</div>

						<div className="grid grid-cols-2 gap-12">
							<div>
								<p className="font-mono text-[9px] text-background/35 tracking-widest uppercase mb-5">
									Product
								</p>
								<ul className="flex flex-col gap-2.5">
									{navLinks.map(({ label, href }) => (
										<li key={label}>
											<ScrollLink
												href={href}
												className="text-sm text-background/55 hover:text-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
												{label}
											</ScrollLink>
										</li>
									))}
								</ul>
							</div>
							<div>
								<p className="font-mono text-[9px] text-background/35 tracking-widest uppercase mb-5">
									Connect
								</p>
								<ul className="flex flex-col gap-2.5">
									{[
										{
											label: "GitHub",
											href: "https://github.com/Pranavtiwari30/GuideWire-DevTrails-ShiftShield-ZeroBias",
										},
										{ label: "Demo", href: "#" },
									].map(({ label, href }) => (
										<li key={label}>
											<a
												href={href}
												target={href !== "#" ? "_blank" : undefined}
												rel={href !== "#" ? "noopener noreferrer" : undefined}
												className="text-sm text-background/55 hover:text-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
												{label}
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>

					<div className="mt-16 pt-8 border-t border-background/8 flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="font-mono text-[10px] text-background/40 tracking-wider">
							&copy; 2026 ShiftShield. Built for Guidewire DEVTrails.
						</p>
						<p className="font-mono text-[10px] text-background/30 tracking-wider">
							Parametric insurance for the gig economy.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
