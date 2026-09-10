"use client";

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currency/types";
import { changeCurrency } from "@/lib/currency/actions";

interface Props {
  current: CurrencyCode;
  variant?: "sidebar" | "settings";
}

const currencyNames: Record<CurrencyCode, string> = {
  USD: "US Dollar", IDR: "Indonesian Rupiah", EUR: "Euro",
};

const currencyColors: Record<CurrencyCode, string> = {
  USD: "bg-pop-blue", IDR: "bg-secondary-container", EUR: "bg-pop-purple",
};

export function CurrencySwitcher({ current, variant = "sidebar" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(variant === "sidebar");
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const locked = useRef(false);
  const id = useId();
  const selected = CURRENCY_LIST.find(c => c.code === current) ?? CURRENCY_LIST[0];

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (open) options.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function close() { setOpen(false); trigger.current?.focus(); }
  function show(last = false) {
    if (pending || locked.current) return;
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) setAbove(rect.top > 260 && (variant === "sidebar" || window.innerHeight - rect.bottom < 260));
    setActiveIndex(last ? CURRENCY_LIST.length - 1 : Math.max(0, CURRENCY_LIST.findIndex(c => c.code === current)));
    setOpen(true);
  }
  function navigate(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    else if (event.key === "Tab") close();
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setActiveIndex(index => event.key === "Home" ? 0 : event.key === "End" ? CURRENCY_LIST.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : -1) + CURRENCY_LIST.length) % CURRENCY_LIST.length);
    } else if (/^[a-z]$/i.test(event.key)) {
      const index = CURRENCY_LIST.findIndex(c => c.code.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index >= 0) { event.preventDefault(); setActiveIndex(index); }
    }
  }
  function choose(code: CurrencyCode) {
    if (locked.current) return;
    close();
    if (code === current) return;
    const form = new FormData(); form.set("code", code);
    locked.current = true; setError("");
    startTransition(async () => {
      try {
        const result = await changeCurrency(form);
        if (!result.ok) setError(Object.values(result.errors).join(" "));
      } catch { setError("Unable to change currency. Please try again."); }
      finally { locked.current = false; }
    });
  }

  return (
    <div className={variant === "sidebar" ? "px-2 min-w-0" : "min-w-0"}>
      <div ref={root} className="relative" aria-busy={pending}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <button ref={trigger} type="button" aria-label={`Display currency: ${selected.code}`}
          aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
          aria-disabled={pending} aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => open ? close() : show()}
          onKeyDown={event => {
            if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show(event.key === "ArrowUp"); }
          }}
          className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${open ? "border-border-heavy bg-primary-fixed shadow-comic" : "border-border-heavy bg-surface shadow-comic-sm hover:bg-primary-fixed hover:shadow-comic"} ${pending ? "cursor-wait" : "cursor-pointer"}`}>
          <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border-heavy text-sm font-black text-ink shadow-comic-sm ${currencyColors[selected.code]}`}>{selected.symbol}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Currency</span>
            <span className="mt-0.5 block truncate text-sm font-bold text-ink">{selected.code} <span className="font-normal text-on-surface-variant">· {selected.code === "IDR" ? "Rupiah" : currencyNames[selected.code]}</span></span>
          </span>
          {pending ? <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none" /> :
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-on-surface-variant"><path d={open ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        {open && <div className={`absolute inset-x-0 z-[80] overflow-hidden rounded-xl border-2 border-border-heavy bg-surface p-1.5 shadow-comic animate-in fade-in duration-150 motion-reduce:animate-none ${above ? "bottom-full mb-2" : "top-full mt-2"}`}>
          <p id={`${id}-title`} className="-mx-1.5 -mt-1.5 mb-1.5 border-b-2 border-border-heavy bg-warning px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink">Choose currency</p>
          <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-title`} onKeyDown={navigate}>
            {CURRENCY_LIST.map((currency, index) => {
              const checked = currency.code === current;
              return <button key={currency.code} ref={node => { options.current[index] = node; }}
                type="button" role="option" aria-selected={checked} tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)} onClick={() => choose(currency.code)}
                className={`my-0.5 flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${checked ? "border-border-heavy bg-primary-fixed text-primary shadow-comic-sm" : "border-transparent text-ink hover:border-border-heavy hover:bg-surface-container-high focus:border-border-heavy focus:bg-surface-container-high"}`}>
                <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border-heavy text-sm font-black text-ink shadow-comic-sm ${currencyColors[currency.code]}`}>{currency.symbol}</span>
                <span className="flex-1"><span className="block text-sm font-bold">{currency.code}</span><span className="block text-xs text-on-surface-variant">{currencyNames[currency.code]}</span></span>
                {checked && <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>;
            })}
          </div>
        </div>}
        <span role="status" className="sr-only">{pending ? "Updating currency…" : `Display currency: ${selected.code}`}</span>
        {error && <p id={`${id}-error`} role="alert" className="font-caption text-danger mt-1">{error}</p>}
      </div>
    </div>
  );
}
