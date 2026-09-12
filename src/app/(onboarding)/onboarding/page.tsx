"use client";

import { useState } from "react";
import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push("/");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Progress Bar */}
      <div className="w-full h-4 bg-surface-variant border-2 border-border-heavy rounded-full overflow-hidden">
        <div className="h-full bg-primary border-r-2 border-border-heavy transition-all duration-300" style={{ width: `${(step / 3) * 100}%`}}></div>
      </div>

      <ComicCard>
        {step === 1 && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-24 h-24 rounded-full border-2 border-border-heavy bg-pop-blue flex items-center justify-center shadow-comic-sm">
              <span className="material-symbols-outlined text-[48px] text-ink">savings</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-ink">Set Your Base Currency</h2>
              <p className="font-body-md text-on-surface-variant mt-2">What currency do you want to track your pennies in?</p>
            </div>
            <select className="w-full max-w-xs bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all cursor-pointer text-ink">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="IDR">IDR (Rp)</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-24 h-24 rounded-full border-2 border-border-heavy bg-pop-purple flex items-center justify-center shadow-comic-sm">
              <span className="material-symbols-outlined text-[48px] text-ink">account_balance_wallet</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-ink">Add Your First Account</h2>
              <p className="font-body-md text-on-surface-variant mt-2">Where do you keep your money?</p>
            </div>
            <div className="w-full flex flex-col gap-4 text-left">
              <div>
                <label className="block font-label-md mb-2 text-ink">Account Name</label>
                <input type="text" className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" placeholder="e.g. Main Checking" />
              </div>
              <div>
                <label className="block font-label-md mb-2 text-ink">Initial Balance</label>
                <input type="number" className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" placeholder="0.00" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-24 h-24 rounded-full border-2 border-border-heavy bg-secondary flex items-center justify-center shadow-comic-sm">
              <span className="material-symbols-outlined text-[48px] text-white">celebration</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-ink">You&apos;re All Set!</h2>
              <p className="font-body-md text-on-surface-variant mt-2">Ready to take control of your personal finances?</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between w-full">
          {step > 1 ? (
            <ComicButton type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </ComicButton>
          ) : <div></div>}
          
          <ComicButton type="button" variant="primary" onClick={handleNext}>
            {step === 3 ? "Go to Dashboard" : "Next Step"}
          </ComicButton>
        </div>
      </ComicCard>
    </div>
  );
}
