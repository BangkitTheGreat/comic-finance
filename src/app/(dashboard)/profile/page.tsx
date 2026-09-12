import { getProfile } from "@/lib/profile/store";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { DataWorkspacePanel } from "@/components/profile/DataWorkspacePanel";
import { getCurrencyCode } from "@/lib/currency/store";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { getSettings } from "@/lib/settings/store";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getWorkspaceId } from "@/lib/workspace/context";
import { getWorkspaceStatus, getWorkspaceCounts } from "@/lib/workspace/store";
import styles from "@/components/profile/profile.module.css";

export default async function ProfilePage() {
  const workspaceId = await getWorkspaceId();
  const profile = getProfile(workspaceId);
  const currency = getCurrencyCode(workspaceId);
  const settings = getSettings(workspaceId);
  const status = getWorkspaceStatus(workspaceId);
  const counts = getWorkspaceCounts(workspaceId);
  return <div className={styles.page}>
    <header className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Profile & settings</h1>
      <p className="mt-3 max-w-prose text-base leading-relaxed text-on-surface-variant">Your identity, your preferences, your way to track money.</p>
    </header>
    <div className={styles.layout}>
      <div className="min-w-0 space-y-6">
        <ProfileCard profile={profile} />
        <aside className={styles.demoNote} aria-labelledby="demo-heading">
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">info</span>
          <div className="min-w-0"><h2 id="demo-heading" className="text-base font-bold text-ink">Private to this browser</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">Your data is saved on this server and tied to this browser, not to a verified account. It survives reloads and restarts, but a cleared browser cookie or a different device starts a new, empty workspace.</p>
          </div>
        </aside>
      </div>
      <div className={`${styles.panel} min-w-0`}>
        <section className={styles.settingsSection} aria-labelledby="preferences-heading">
          <h2 id="preferences-heading" className={styles.sectionTitle}>Preferences</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Choose how your money is displayed.</p>
          <div className={styles.currencyRow}>
            <div className="min-w-0"><h3 className="text-base font-semibold text-ink">Display currency</h3><p className="mt-1 max-w-sm text-sm leading-relaxed text-on-surface-variant">Change the view without changing your balances.</p></div>
            <div className={styles.currencyControl}><CurrencySwitcher current={currency} variant="settings" /></div>
          </div>
        </section>
        <SettingsPanel settings={settings} />
      </div>
      <div className="lg:col-span-2"><DataWorkspacePanel status={status} counts={counts} /></div>
    </div>
  </div>;
}
