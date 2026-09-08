import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { GOAL_THEMES } from "@/lib/goals/types";
import { createGoal } from "@/lib/goals/actions";
import Link from "next/link";

export default function NewGoalPage() {
  return (
    <>
      <div className="mb-4">
        <Link href="/goals" className="font-label-md text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Goals
        </Link>
      </div>
      <h2 className="font-headline-lg font-bold text-ink mb-6">Create New Goal</h2>

      <ComicCard className="max-w-2xl">
        <form action={createGoal} className="flex flex-col gap-6">
          <div>
            <label className="block font-label-md mb-2 text-ink">Goal Name</label>
            <input name="name" type="text" required className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:border-primary" placeholder="e.g. Dream House" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md mb-2 text-ink">Target Amount</label>
              <input name="target" type="number" step="0.01" min="1" required className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:border-primary" placeholder="50000" />
            </div>
            <div>
              <label className="block font-label-md mb-2 text-ink">Starting Amount</label>
              <input name="current" type="number" step="0.01" min="0" defaultValue={0} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:border-primary" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block font-label-md mb-3 text-ink">Pick an Icon</label>
            <div className="flex flex-wrap gap-3">
              {GOAL_THEMES.map((theme, i) => (
                <label key={theme.icon} className="cursor-pointer">
                  <input type="radio" name="icon" value={theme.icon} defaultChecked={i === 0} className="peer sr-only" />
                  <span className={`w-12 h-12 rounded-full border-2 border-border-heavy ${theme.bgColor} flex items-center justify-center text-white shadow-comic-sm peer-checked:ring-4 peer-checked:ring-border-heavy peer-checked:-translate-y-1 transition-all`}>
                    <span className="material-symbols-outlined">{theme.icon}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <ComicButton type="submit" variant="primary" icon="add_circle" className="w-full sm:w-auto self-end mt-4">Create Goal</ComicButton>
        </form>
      </ComicCard>
    </>
  );
}
