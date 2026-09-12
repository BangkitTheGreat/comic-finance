import { connection } from "next/server";
import { Sidebar } from "@/components/navigation/Sidebar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { processDueRecurring } from "@/lib/recurring/store";
import { getCurrencyCode } from "@/lib/currency/store";
import { getProfile } from "@/lib/profile/store";
import { getSettings } from "@/lib/settings/store";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const workspaceId = await getWorkspaceId();
  processDueRecurring(workspaceId);
  const currency = getCurrencyCode(workspaceId);
  const settings = getSettings(workspaceId);
  const profile = getProfile(workspaceId);
  return (
    <div className={`flex min-h-screen ${settings.reduceMotion ? "reduce-motion" : ""}`}>
      <Sidebar profile={profile} currency={currency} reduceMotion={settings.reduceMotion} />
      <MobileNav profile={profile} />
      <main className="flex-1 w-full pt-20 md:pt-8 md:ml-[280px] pb-24 md:pb-12 px-margin-mobile md:px-margin-desktop flex flex-col gap-8 max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
