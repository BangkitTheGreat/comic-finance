"use client";

import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { createGoal } from "@/lib/goals/actions";
import { GOAL_THEMES } from "@/lib/goals/types";
import type { Currency } from "@/lib/currency/types";

const inputClass = "w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary";

/**
 * Client form so a failed save reports inline instead of throwing a server
 * error page, and so the redirect happens only after the goal actually
 * exists. ActionForm supplies the pending state and double-submit lock.
 */
export function GoalForm({ currency }: { currency: Currency }) {
  const router = useRouter();
  const step = currency.fractionDigits === 0 ? "1" : "0.01";

  return (
    <ActionForm
      action={createGoal}
      onSuccess={() => router.push("/goals")}
      labels={{ target: "Target amount", current: "Starting amount" }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="currencyCode" value={currency.code} />

      <div>
        <label htmlFor="goal-name" className="mb-2 block font-label-md text-ink">Goal name</label>
        <input id="goal-name" name="name" type="text" required maxLength={100} placeholder="e.g. Dream House" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="goal-target" className="mb-2 block font-label-md text-ink">Target amount ({currency.code})</label>
          <input id="goal-target" name="target" type="number" inputMode="decimal" step={step} min={step} max="1000000000000" required placeholder={currency.fractionDigits === 0 ? "50000000" : "50000"} className={inputClass} />
        </div>
        <div>
          <label htmlFor="goal-current" className="mb-2 block font-label-md text-ink">Starting amount ({currency.code})</label>
          <input id="goal-current" name="current" type="number" inputMode="decimal" step={step} min="0" max="1000000000000" defaultValue="0" className={inputClass} />
          <p className="mt-1 font-caption text-on-surface-variant">Leave at zero if you are starting from scratch.</p>
        </div>
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-3 block font-label-md text-ink">Pick an icon</legend>
        <div className="flex flex-wrap gap-3">
          {GOAL_THEMES.map((theme, i) => (
            <label key={theme.icon} className="cursor-pointer">
              <input type="radio" name="icon" value={theme.icon} defaultChecked={i === 0} className="peer sr-only" />
              <span className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-border-heavy ${theme.bgColor} text-white shadow-comic-sm transition-all peer-checked:-translate-y-1 peer-checked:ring-4 peer-checked:ring-border-heavy peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40`}>
                <span className="material-symbols-outlined">{theme.icon}</span>
              </span>
              <span className="sr-only">{theme.icon}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ComicButton type="submit" variant="primary" icon="add_circle" className="mt-2 w-full self-end sm:w-auto">Create goal</ComicButton>
    </ActionForm>
  );
}
