"use client";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { type ReactNode } from "react";

gsap.registerPlugin(ScrollToPlugin);

// Matches the fixed navbar height + breathing room
const NAV_OFFSET = 88;

interface ScrollLinkProps {
	href: string;
	className?: string;
	children: ReactNode;
	onClick?: () => void;
}

export default function ScrollLink({ href, className, children, onClick }: ScrollLinkProps) {
	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		const isHash = href.startsWith("#");
		if (!isHash) return;
		e.preventDefault();
		const target = document.querySelector(href);
		if (!target) return;
		gsap.to(window, {
			scrollTo: { y: target, offsetY: NAV_OFFSET },
			duration: 0.85,
			ease: "power3.inOut",
		});
		onClick?.();
	};

	return (
		<a href={href} onClick={handleClick} className={className}>
			{children}
		</a>
	);
}
