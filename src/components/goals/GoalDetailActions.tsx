"use client";

import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicCard } from "@/components/ui/ComicCard";
import { contributeGoal, deleteGoal } from "@/lib/goals/actions";
import type { Currency } from "@/lib/currency/types";

const inputClass = "w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary";

export function GoalDetailActions({ goalId, goalName, currency }: { goalId: string; goalName: string; currency: Currency }) {
  const router = useRouter();
  const step = currency.fractionDigits === 0 ? "1" : "0.01";

  return (
    <>
      <ComicCard>
        <h3 className="mb-4 font-headline-md">Add or withdraw funds</h3>
        {/* Direction is an explicit choice rather than a minus sign typed into
            the amount, so the same positive-amount validation as every other
            money field applies. */}
        <ActionForm action={contributeGoal} labels={{ direction: "Direction" }} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={goalId} />
          <input type="hidden" name="currencyCode" value={currency.code} />
          <div>
            <label htmlFor="goal-amount" className="mb-2 block font-label-md text-ink">Amount ({currency.code})</label>
            <input id="goal-amount" name="amount" type="number" inputMode="decimal" step={step} min={step} max="1000000000000" required placeholder={currency.fractionDigits === 0 ? "500000" : "500.00"} className={inputClass} />
          </div>
          <div>
            <label htmlFor="goal-direction" className="mb-2 block font-label-md text-ink">Direction</label>
            <select id="goal-direction" name="direction" defaultValue="add" className={`${inputClass} cursor-pointer`}>
              <option value="add">Add to goal</option>
              <option value="withdraw">Withdraw from goal</option>
            </select>
          </div>
          <ComicButton type="submit" variant="primary" icon="savings" className="w-full">Save</ComicButton>
        </ActionForm>
      </ComicCard>

      <ComicCard>
        <h3 className="mb-4 flex items-center gap-2 font-headline-md text-danger">
          <span aria-hidden="true" className="material-symbols-outlined">warning</span>
          Delete goal
        </h3>
        <p className="mb-4 font-body-md text-on-surface-variant">This permanently removes the goal. Your accounts and transactions are not affected.</p>
        <ActionForm
          action={deleteGoal}
          confirmation={`Delete "${goalName}"? This cannot be undone.`}
          onSuccess={() => router.push("/goals")}
        >
          <input type="hidden" name="id" value={goalId} />
          <ComicButton type="submit" variant="danger" icon="delete" className="w-full">Delete goal</ComicButton>
        </ActionForm>
      </ComicCard>
    </>
  );
}
