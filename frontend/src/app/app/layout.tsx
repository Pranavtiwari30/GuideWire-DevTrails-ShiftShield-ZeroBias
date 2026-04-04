import { RiderProvider } from "@/components/app/RiderProvider";
import { AppNav } from "@/components/app/AppNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShiftShield — Rider App",
  description: "Manage your ShiftShield coverage",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RiderProvider>
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="px-4 md:px-8 pt-20 pb-24 md:pb-8 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
    </RiderProvider>
  );
}
