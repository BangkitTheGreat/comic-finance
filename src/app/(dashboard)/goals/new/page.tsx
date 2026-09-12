import { ComicCard } from "@/components/ui/ComicCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { getActiveCurrency } from "@/lib/currency/store";
import { getWorkspaceId } from "@/lib/workspace/context";
import Link from "next/link";

export default async function NewGoalPage() {
  const workspaceId = await getWorkspaceId();
  const currency = getActiveCurrency(workspaceId);
  return (
    <>
      <div className="mb-4">
        <Link href="/goals" className="flex items-center gap-1 font-label-md text-primary hover:underline">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to goals
        </Link>
      </div>
      <h2 className="mb-6 font-headline-lg font-bold text-ink">Create new goal</h2>

      <ComicCard className="max-w-2xl">
        <GoalForm currency={currency} />
      </ComicCard>
    </>
  );
}
