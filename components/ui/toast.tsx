"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useUi } from "@/lib/store/ui";
import { cn } from "@/lib/cn";
import { CheckIcon, InfoIcon } from "./icons";

/**
 * Feedback after an action (ISO 9241-110: self-descriptiveness, error tolerance):
 * a short confirmation at the top, readable by screen readers, with "undo" where an action is reversible.
 */
export function ToastHost() {
  const toast = useUi((s) => s.toast);
  const dismiss = useUi((s) => s.dismissToast);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismiss, toast.action ? 6000 : 3000);
    return () => clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[70] flex justify-center px-4">
      <div role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="popLayout">
          {toast ? (
            <motion.div
              key={toast.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto flex min-h-12 items-center gap-3 rounded-lg px-4 py-2 shadow-[var(--shadow-md)]",
                toast.tone === "error" ? "bg-danger text-white" : "bg-ink text-paper",
              )}
            >
              {toast.tone === "error" ? <InfoIcon size={20} /> : <CheckIcon size={20} strokeWidth={2.6} />}
              <span className="font-semibold">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.run();
                    dismiss();
                  }}
                  className="ml-1 min-h-11 rounded-md px-3 font-bold text-accent underline underline-offset-4"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
