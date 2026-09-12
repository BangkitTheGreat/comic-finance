import { getProfile } from "@/lib/profile/store";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ResetDemoPanel } from "@/components/profile/ResetDemoPanel";
import { getCurrencyCode } from "@/lib/currency/store";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { getSettings } from "@/lib/settings/store";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import styles from "@/components/profile/profile.module.css";

export default function ProfilePage() {
  const profile = getProfile();
  const currency = getCurrencyCode();
  const settings = getSettings();
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
          <div className="min-w-0"><h2 id="demo-heading" className="text-base font-bold text-ink">Demo workspace</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">Explore with sample data. This demo is shared, and changes may reset when the app restarts. Use sample details rather than personal information.</p>
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
      <div className="lg:col-span-2"><ResetDemoPanel /></div>
    </div>
  </div>;
}
