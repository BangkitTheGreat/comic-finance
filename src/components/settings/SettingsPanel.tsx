"use client";

import { SETTING_GROUPS, type Settings } from "@/lib/settings/types";
import { toggleSetting } from "@/lib/settings/actions";

export function SettingsPanel({ settings }: { settings: Settings }) {
  return (
    <div className="flex flex-col gap-6">
      {SETTING_GROUPS.map((group) => (
        <div key={group.group}>
          <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-3">{group.group}</h4>
          <div className="space-y-3">
            {group.items.map((item) => {
              const on = settings[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between p-4 border-2 border-border-heavy rounded-lg gap-4 bg-surface">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${item.color} rounded-full border-2 border-border-heavy flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-ink">{item.icon}</span>
                    </div>
                    <div>
                      <h5 className="font-label-md text-on-surface">{item.label}</h5>
                      <p className="font-caption text-on-surface-variant">{item.description}</p>
                    </div>
                  </div>
                  <form action={toggleSetting} className="flex-shrink-0">
                    <input type="hidden" name="key" value={item.key} />
                    <input type="hidden" name="value" value={(!on).toString()} />
                    <button
                      type="submit"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${on ? "Disable" : "Enable"} ${item.label}`}
                      className={`relative w-14 h-8 rounded-full border-2 border-border-heavy transition-colors shadow-comic-sm comic-interactive ${on ? "bg-secondary" : "bg-surface-container-high"}`}
                    >
                      <span className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-border-heavy bg-white transition-all ${on ? "left-[26px]" : "left-1"}`}></span>
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
