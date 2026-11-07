"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface Item {
  href: string;
  label: string;
}

/**
 * Mobile navigation (below the md breakpoint): a menu button that opens a panel under the header.
 * Accessible disclosure pattern: aria-expanded/aria-controls, Escape closes and returns focus,
 * choosing a link closes the panel. No animation library — just a short CSS transition.
 */
export function MobileMenu({
  items,
  language,
  labels,
}: {
  items: Item[];
  language: { href: string; locale: "nl" | "en"; label: string };
  labels: { open: string; close: string; title: string };
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-md text-ink hover:bg-paper-deep"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d={open ? "M6 6l12 12" : "M4 7h16"} className="transition-[d] duration-200" />
          <path d="M4 12h16" className={cn("transition-opacity duration-150", open && "opacity-0")} />
          <path d={open ? "M6 18L18 6" : "M4 17h16"} className="transition-[d] duration-200" />
        </svg>
      </button>

      <div
        id={id}
        role="region"
        aria-label={labels.title}
        className={cn(
          "absolute inset-x-0 top-full z-40 origin-top border-b border-line bg-paper shadow-[var(--shadow-md)] transition-[opacity,transform,visibility] duration-200",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
          {items.map((item) => (
            <li key={item.href} className="border-b border-line last:border-b-0">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between rounded-md px-2 text-[1.0625rem] font-semibold hover:bg-paper-deep"
              >
                {item.label}
                <span aria-hidden className="text-ink-faint">
                  ›
                </span>
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link
              href={language.href}
              locale={language.locale}
              hrefLang={language.locale}
              lang={language.locale}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-2 rounded-md px-2 font-semibold text-ink-soft hover:bg-paper-deep"
            >
              <span className="rounded border border-line-strong px-1.5 text-sm font-bold uppercase">{language.locale}</span>
              {language.label}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
