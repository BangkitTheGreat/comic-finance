"use client";

import { useId } from "react";
import { SETTING_GROUPS, type Settings } from "@/lib/settings/types";
import { toggleSetting } from "@/lib/settings/actions";
import { useMutationAction } from "@/components/profile/useMutationAction";
import styles from "@/components/profile/profile.module.css";

type Item = (typeof SETTING_GROUPS)[number]["items"][number];
function SettingRow({ item, on }: { item: Item; on: boolean }) {
  const id = useId();
  const { submit, pending, errors, saved } = useMutationAction(toggleSetting);
  return <div className={styles.settingRow}>
    <span aria-hidden="true" className={`material-symbols-outlined ${styles.settingIcon} ${item.color}`}>{item.icon}</span>
    <div className="min-w-0 flex-1">
      <h3 id={`${id}-label`} className="text-base font-semibold text-ink">{item.label}</h3>
      <p id={`${id}-help`} className="mt-1 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>
      {Object.values(errors).map(message => <p key={message} role="alert" className={styles.error}>{message}</p>)}
      <p role="status" className="sr-only">{pending ? `Saving ${item.label}.` : saved ? `${item.label} ${on ? "on" : "off"}.` : ""}</p>
    </div>
    <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} aria-busy={pending} disabled={pending}
      className={styles.switchButton} onClick={() => {
        const form = new FormData(); form.set("key", item.key); form.set("value", String(!on)); submit(form);
      }}>
      <span className={styles.switchTrack} data-on={on}><span className={styles.switchThumb} /></span>
      <span className="text-xs font-semibold text-on-surface-variant">{pending ? "Saving…" : on ? "On" : "Off"}</span>
    </button>
  </div>;
}
export function SettingsPanel({ settings }: { settings: Settings }) {
  return <>{SETTING_GROUPS.map(group => <section key={group.group} className={styles.settingsSection}>
    <h2 className={styles.sectionTitle}>{group.group}</h2>
    <p className="mt-1 text-sm text-on-surface-variant">{group.description}</p>
    <div className="mt-4">{group.items.map(item => <SettingRow key={item.key} item={item} on={settings[item.key]} />)}</div>
  </section>)}</>;
}
