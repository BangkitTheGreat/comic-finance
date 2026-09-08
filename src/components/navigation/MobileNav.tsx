"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Activity", href: "/transactions", icon: "list_alt" },
    { name: "Budgets", href: "/budget", icon: "account_balance" },
    { name: "More", href: "/accounts", icon: "menu" },
  ];

  return (
    <>
      <header className="md:hidden fixed top-0 w-full z-40 bg-surface border-b-2 border-border-heavy shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] flex justify-between items-center px-margin-mobile h-16">
        <div className="font-headline-md font-bold text-on-background tracking-tight">PennyComic</div>
        <div className="flex gap-4">
          <button className="hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Link href="/login" className="hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all border-2 border-border-heavy rounded-full p-1 bg-pop-pink text-white">
            <span className="material-symbols-outlined icon-fill">person</span>
          </Link>
        </div>
      </header>

      <Link href="/transactions" className="md:hidden fixed bottom-[88px] right-4 w-14 h-14 bg-pop-blue text-border-heavy rounded-full border-2 border-border-heavy shadow-comic flex items-center justify-center z-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-comic-sm transition-all" aria-label="Add transaction">
        <span className="material-symbols-outlined text-[32px]">add</span>
      </Link>

      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface border-t-2 border-border-heavy shadow-[0px_-4px_0px_0px_rgba(17,24,39,0.1)] rounded-t-xl flex justify-around items-center px-margin-mobile py-2 pb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-transform w-16 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container border-2 border-border-heavy shadow-comic-sm -translate-y-1 active:scale-95"
                  : "text-on-surface-variant hover:bg-surface-variant active:scale-95"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""}`}>{item.icon}</span>
              <span className={`font-label-md-mobile text-[10px] mt-1 ${isActive ? "font-bold" : "font-semibold"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
