import { RiderProvider } from "@/components/app/RiderProvider";
import { AppSidebar } from "@/components/app/AppSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "ShiftShield",
	description: "Manage your ShiftShield coverage",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RiderProvider>
			<div className="min-h-screen bg-background md:flex">
				<AppSidebar />
				<main className="flex-1 min-h-screen overflow-auto pb-20 md:pb-0">{children}</main>
			</div>
		</RiderProvider>
	);
}
