import { ConditionalShell } from "@/components/layout/ConditionalShell";
import { PwaRegister } from "@/components/app/PwaRegister";
import "@/styels.css";
import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";

const outfit = Outfit({
	variable: "--font-outfit",
	weight: "variable",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ShiftShield",
	description: "Parametric micro-insurance for delivery riders",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "ShiftShield",
	},
	icons: {
		apple: "/icons/icon-180.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${outfit.variable} ${geistMono.variable} font-sans h-full antialiased text-foreground bg-background`}>
			<body className="overflow-x-hidden">
				<a href="#main-content" className="skip-link">Skip to main content</a>
				<ConditionalShell>{children}</ConditionalShell>
				<PwaRegister />
			</body>
		</html>
	);
}
