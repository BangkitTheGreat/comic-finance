export interface Settings {
  notifyBills: boolean;
  notifyBudget: boolean;
  notifyGoals: boolean;
  reduceMotion: boolean;
}

export type SettingKey = keyof Settings;

export const SETTING_GROUPS: {
  group: string;
  items: { key: SettingKey; label: string; description: string; icon: string; color: string }[];
}[] = [
  {
    group: "Notifications",
    items: [
      { key: "notifyBills", label: "Bill Reminders", description: "Show upcoming and overdue bill alerts", icon: "notifications", color: "bg-pop-blue" },
      { key: "notifyBudget", label: "Budget Warnings", description: "Warn when a category nears its limit", icon: "warning", color: "bg-warning" },
      { key: "notifyGoals", label: "Goal Nudges", description: "Celebrate progress toward savings goals", icon: "celebration", color: "bg-pop-pink" },
    ],
  },
  {
    group: "Appearance",
    items: [
      { key: "reduceMotion", label: "Reduce Motion", description: "Disable animations and morphing text", icon: "animation", color: "bg-pop-purple" },
    ],
  },
];

export const DEFAULT_SETTINGS: Settings = {
  notifyBills: true,
  notifyBudget: true,
  notifyGoals: true,
  reduceMotion: false,
};
