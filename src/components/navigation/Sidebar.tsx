"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/lib/profile/store";
import { Avatar } from "@/components/profile/Avatar";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import type { CurrencyCode } from "@/lib/currency/types";

export function Sidebar({ profile, currency, reduceMotion = false }: { profile: UserProfile; currency: CurrencyCode; reduceMotion?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Transactions", href: "/transactions", icon: "receipt_long" },
    { name: "Accounts", href: "/accounts", icon: "account_balance_wallet" },
    { name: "Budget", href: "/budget", icon: "pie_chart" },
    { name: "Goals", href: "/goals", icon: "track_changes" },
    { name: "Bills", href: "/bills", icon: "payments" },
    { name: "Recurring", href: "/recurring", icon: "update" },
    { name: "Statistics", href: "/statistics", icon: "insights" },
  ];

  return (
    <nav className="hidden md:flex flex-col p-panel-padding gap-unit fixed left-0 top-0 h-full w-[280px] z-50 border-r-2 border-border-heavy shadow-[4px_0px_0px_0px_rgba(17,24,39,0.1)] bg-surface">
      <div className="mb-8 mt-2 px-2">
        <h1 className="font-headline-lg font-black text-on-surface tracking-tighter leading-none">PennyComic</h1>
        {reduceMotion ? (
          <p className="h-4 w-full mt-1 font-caption text-on-surface-variant font-semibold uppercase tracking-widest">Personal Finance</p>
        ) : (
          <GooeyText
            texts={["Personal Finance", "Expense Tracker", "Budget Planner", "Money Manager"]}
            morphTime={1}
            cooldownTime={4}
            className="h-4 w-full mt-1"
            textClassName="font-caption text-on-surface-variant font-semibold uppercase tracking-widest"
          />
        )}
      </div>

      <Link href="/transactions" className="w-full mb-6 bg-primary text-on-primary font-label-md px-4 py-3 rounded-lg border-2 border-border-heavy shadow-comic hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-comic-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2">
        <span className="material-symbols-outlined">add</span>
        <span>Add Transaction</span>
      </Link>

      <div className="flex flex-col gap-2 overflow-y-auto px-2 py-2 -mx-2 -my-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-md transition-all duration-100 ${
                isActive
                  ? "bg-primary-container text-on-primary-container border-2 border-border-heavy shadow-comic -translate-x-[2px] -translate-y-[2px] z-10"
                  : "text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high hover:border-border-heavy hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-comic"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""}`}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto border-t-2 border-border-heavy pt-2 flex flex-col">
        <div className="mb-2">
          <CurrencySwitcher current={currency} variant="sidebar" />
        </div>
        <Link href="/profile" className="flex items-center gap-3 px-2 py-1.5 rounded-lg border-2 border-transparent hover:bg-surface-container-high hover:border-border-heavy hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] hover:shadow-comic-sm transition-all duration-100 group">
          <Avatar name={profile.name} />
          <div className="flex min-w-0 flex-col">
            <span className="font-label-md truncate text-on-surface group-hover:text-primary transition-colors leading-tight" title={profile.name}>{profile.name}</span>
            <span className="font-caption text-on-surface-variant leading-tight">View Profile</span>
          </div>
        </Link>
        <Link href="/login" className="flex items-center gap-3 px-2 py-1.5 mt-1 rounded-lg border-2 border-transparent hover:bg-error-container hover:border-border-heavy hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] hover:shadow-comic-sm transition-all duration-100 group text-danger">
          <div className="w-9 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] group-hover:text-on-error-container">logout</span>
          </div>
          <span className="font-label-md group-hover:text-on-error-container transition-colors">Leave demo</span>
        </Link>
      </div>
    </nav>
  );
}
