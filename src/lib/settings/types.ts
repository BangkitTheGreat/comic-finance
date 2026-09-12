export interface Settings {
  notifyBills: boolean;
  notifyBudget: boolean;
  reduceMotion: boolean;
}
export type SettingKey = keyof Settings;
export const SETTING_GROUPS: {
  group: string;
  description: string;
  items: { key: SettingKey; label: string; description: string; icon: string; color: string }[];
}[] = [
  { group: "In-app reminders", description: "Choose what appears while you use PennyComic.", items: [
    { key: "notifyBills", label: "Upcoming bills", description: "Show upcoming bills on your dashboard.", icon: "notifications", color: "bg-pop-blue" },
    { key: "notifyBudget", label: "Budget warnings", description: "Show a warning as spending approaches a category limit.", icon: "warning", color: "bg-warning" },
  ] },
  { group: "Appearance", description: "Make the interface comfortable for you.", items: [
    { key: "reduceMotion", label: "Reduce motion", description: "Minimize animations and stop the moving sidebar text.", icon: "animation", color: "bg-pop-purple" },
  ] },
];
export const DEFAULT_SETTINGS: Settings = { notifyBills: true, notifyBudget: true, reduceMotion: false };
