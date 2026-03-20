import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
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
	description: "",
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
				<Navbar />
				<main id="main-content">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
