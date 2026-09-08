import { Sidebar } from "@/components/navigation/Sidebar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { processDueRecurring } from "@/lib/recurring/store";
import { getCurrencyCode } from "@/lib/currency/store";
import { getSettings } from "@/lib/settings/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  processDueRecurring();
  const currency = getCurrencyCode();
  const settings = getSettings();
  return (
    <div className={`flex min-h-screen ${settings.reduceMotion ? "reduce-motion" : ""}`}>
      <Sidebar currency={currency} reduceMotion={settings.reduceMotion} />
      <MobileNav />
      <main className="flex-1 w-full pt-20 md:pt-8 md:ml-[280px] pb-24 md:pb-12 px-margin-mobile md:px-margin-desktop flex flex-col gap-8 max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
