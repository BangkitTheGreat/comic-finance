import { ComicCard } from "@/components/ui/ComicCard";
import { getProfile } from "@/lib/profile/store";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { deleteAccountData } from "@/lib/profile/actions";
import { getCurrencyCode } from "@/lib/currency/store";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { getSettings } from "@/lib/settings/store";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export default function ProfilePage() {
  const userProfile = getProfile();
  const currency = getCurrencyCode();
  const settings = getSettings();
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline-lg text-on-surface">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Info */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ProfileCard profile={userProfile} />

          <ComicCard>
            <h3 className="font-headline-md mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">verified_user</span>
              Account Status
            </h3>
            <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-border-heavy rounded-lg">
              <div>
                <p className="font-label-md">Pro Member</p>
                <p className="font-caption text-on-surface-variant">Active until Dec 2026</p>
              </div>
              <span className="material-symbols-outlined text-secondary text-3xl">workspace_premium</span>
            </div>
          </ComicCard>
        </div>

        {/* Settings & Details */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <ComicCard>
            <h3 className="font-headline-md mb-6">General Settings</h3>
            
            <div className="space-y-4">
              <SettingsPanel settings={settings} />

              <div className="flex items-center justify-between p-4 border-2 border-border-heavy rounded-lg gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-container rounded-full border-2 border-border-heavy flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">paid</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-on-surface">Currency</h4>
                    <p className="font-caption text-on-surface-variant">Display all amounts in this currency</p>
                  </div>
                </div>
                <div className="w-40">
                  <CurrencySwitcher current={currency} variant="settings" />
                </div>
              </div>
            </div>
          </ComicCard>

          <ComicCard>
            <h3 className="font-headline-md mb-4 text-danger flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Danger Zone
            </h3>
            <p className="font-body-md text-on-surface-variant mb-4">
              Permanently delete your account and all of your content.
            </p>
            <form action={deleteAccountData}>
              <button type="submit" className="py-2 px-4 bg-error-container text-on-error-container font-label-md rounded-lg border-2 border-danger shadow-[2px_2px_0px_0px_#EB5757] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#EB5757] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                Delete Account
              </button>
            </form>
          </ComicCard>
        </div>
      </div>
    </>
  );
}
