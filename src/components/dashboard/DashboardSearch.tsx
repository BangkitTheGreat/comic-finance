"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { buildSearchTransactionUrl, MAX_SEARCH_LENGTH } from "@/lib/search/url";

export function DashboardSearch() {
  const router = useRouter();

  // Prefetch transactions route for instant navigation
  useEffect(() => {
    router.prefetch("/transactions");
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawQuery = formData.get("q");
    const targetUrl = buildSearchTransactionUrl(typeof rawQuery === "string" ? rawQuery : "");
    router.push(targetUrl);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="relative w-full max-w-md"
    >
      <label htmlFor="dashboard-search-input" className="sr-only">
        Search transactions
      </label>
      <span
        aria-hidden="true"
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none"
      >
        search
      </span>
      <input
        id="dashboard-search-input"
        name="q"
        type="search"
        autoComplete="off"
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Search..."
        onFocus={() => router.prefetch("/transactions")}
        className="w-full bg-surface-container-low border-2 border-border-heavy rounded-full py-2 pl-10 pr-4 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all"
      />
    </form>
  );
}
