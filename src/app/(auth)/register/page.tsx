import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline-lg font-black text-ink">Join Comic Finance</h1>
        <p className="font-body-md text-on-surface-variant">Start your financial journey today.</p>
      </div>

      <ComicCard>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block font-label-md mb-2 text-ink">Full Name</label>
            <input type="text" className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all" placeholder="Comic Finance User" />
          </div>
          <div>
            <label className="block font-label-md mb-2 text-ink">Email</label>
            <input type="email" className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all" placeholder="user@comicfinance.example" />
          </div>
          <div>
            <label className="block font-label-md mb-2 text-ink">Password</label>
            <input type="password" className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all" placeholder="••••••••" />
          </div>
          <Link href="/onboarding" className="w-full">
            <ComicButton type="button" className="w-full mt-2" variant="secondary">
              Create Account
            </ComicButton>
          </Link>
        </form>
      </ComicCard>

      <p className="text-center font-body-md text-on-surface-variant">
        Already have an account? <Link href="/login" className="font-label-md text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
