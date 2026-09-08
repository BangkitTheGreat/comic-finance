import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { getGoal } from "@/lib/goals/store";
import { contributeGoal, deleteGoal } from "@/lib/goals/actions";
import { getActiveCurrency } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = getGoal(id);
  if (!goal) notFound();

  const currency = getActiveCurrency();
  const percent = Math.min((goal.current / goal.target) * 100, 100);
  const remaining = Math.max(goal.target - goal.current, 0);

  return (
    <>
      <div className="mb-4">
        <Link href="/goals" className="font-label-md text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Goals
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ComicCard className="col-span-1 lg:col-span-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full border-2 border-border-heavy ${goal.bgColor} text-white flex items-center justify-center shadow-comic`}>
              <span className="material-symbols-outlined text-[32px]">{goal.icon}</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-ink">{goal.name}</h2>
              <p className="font-body-md text-on-surface-variant">{percent >= 100 ? "Goal reached! 🎉" : `${Math.round(percent)}% of the way there`}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mb-2">
            <p className="font-display-numeric text-ink">{formatMoney(goal.current, currency)}</p>
            <p className="font-body-md text-on-surface-variant">/ {formatMoney(goal.target, currency)}</p>
          </div>
          <div className="w-full h-5 bg-surface-variant border-2 border-border-heavy rounded-full overflow-hidden">
            <div className={`h-full ${goal.bgColor} border-r-2 border-border-heavy transition-all`} style={{ width: `${percent}%` }}></div>
          </div>
          <p className="font-caption text-on-surface-variant mt-3">
            {remaining > 0 ? `${formatMoney(remaining, currency)} left to reach your target.` : "You've fully funded this goal!"}
          </p>
        </ComicCard>

        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ComicCard>
            <h3 className="font-headline-md mb-4">Add Funds</h3>
            <form action={contributeGoal} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={goal.id} />
              <input name="amount" type="number" step="0.01" required className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:border-primary" placeholder="Amount (use - to withdraw)" />
              <ComicButton type="submit" variant="primary" icon="add" className="w-full">Contribute</ComicButton>
            </form>
          </ComicCard>

          <ComicCard>
            <h3 className="font-headline-md mb-4 text-danger flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Delete Goal
            </h3>
            <p className="font-body-md text-on-surface-variant mb-4">This permanently removes the goal.</p>
            <form action={deleteGoal}>
              <input type="hidden" name="id" value={goal.id} />
              <ComicButton type="submit" variant="danger" icon="delete" className="w-full">Delete Goal</ComicButton>
            </form>
          </ComicCard>
        </div>
      </div>
    </>
  );
}
