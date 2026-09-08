import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { listGoals } from "@/lib/goals/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency/types";
import Link from "next/link";

export default function GoalsPage() {
  const savingsGoals = listGoals();
  const currency = getActiveCurrency();
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg font-bold text-ink mb-1">Savings Goals</h2>
          <p className="font-body-md text-on-surface-variant">Track your dreams and targets.</p>
        </div>
        <Link href="/goals/new">
          <ComicButton icon="add_circle">Add Goal</ComicButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map(goal => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <ComicCard interactive className="h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full border-2 border-border-heavy flex items-center justify-center ${goal.bgColor} text-white shadow-comic-sm`}>
                  <span className="material-symbols-outlined">{goal.icon}</span>
                </div>
                <span className="bg-surface-container-high px-2 py-1 rounded font-caption font-bold">On Track</span>
              </div>
              <h3 className="font-headline-md text-ink mb-2">{goal.name}</h3>
              <div className="flex justify-between items-end mb-2">
                <p className="font-headline-lg-mobile text-ink">{formatMoney(goal.current, currency)}</p>
                <p className="font-body-md text-on-surface-variant">/ {formatMoney(goal.target, currency)}</p>
              </div>
              <div className="w-full h-3 bg-surface-variant border-2 border-border-heavy rounded-full overflow-hidden mt-4">
                <div className={`h-full ${goal.bgColor} border-r-2 border-border-heavy`} style={{ width: `${(goal.current/goal.target)*100}%`}}></div>
              </div>
            </ComicCard>
          </Link>
        ))}
      </div>
    </>
  );
}
