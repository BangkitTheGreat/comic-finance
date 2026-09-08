export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  icon: string;
  color: string;
  bgColor: string;
}

export interface GoalTheme {
  icon: string;
  color: string;
  bgColor: string;
}

export const GOAL_THEMES: GoalTheme[] = [
  { icon: "flight_takeoff", color: "text-primary", bgColor: "bg-primary" },
  { icon: "directions_car", color: "text-pop-purple", bgColor: "bg-pop-purple" },
  { icon: "home", color: "text-secondary", bgColor: "bg-secondary" },
  { icon: "savings", color: "text-warning", bgColor: "bg-warning" },
  { icon: "school", color: "text-pop-blue", bgColor: "bg-pop-blue" },
  { icon: "favorite", color: "text-pop-pink", bgColor: "bg-pop-pink" },
];

export function getGoalTheme(icon: string): GoalTheme {
  return GOAL_THEMES.find((t) => t.icon === icon) ?? GOAL_THEMES[0];
}
