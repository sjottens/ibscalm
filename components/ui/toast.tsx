"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useUi } from "@/lib/store/ui";
import { cn } from "@/lib/cn";
import { CheckIcon } from "./icons";

/**
 * The "stamp": after saving, a rubber-stamp mark thumps onto the page at a slight angle.
 * Error and info toasts use the same position without the stamp motion.
 */
export function ToastHost() {
  const toast = useUi((s) => s.toast);
  const dismiss = useUi((s) => s.dismissToast);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismiss, toast.action ? 5000 : 2400);
    return () => clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[70] flex justify-center px-4">
      <div role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="popLayout">
          {toast ? (
            <motion.div
              key={toast.id}
              initial={reduce ? { opacity: 0 } : toast.tone === "stamp" ? { opacity: 0, scale: 1.7, rotate: -9 } : { opacity: 0, y: -16 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: toast.tone === "stamp" ? -3.5 : 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 700, damping: 22, mass: 0.7 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-2xl border-[2.5px] bg-card px-4 py-2.5 shadow-[0_10px_30px_rgb(18_20_42/0.18)]",
                toast.tone === "stamp" && "border-symptom text-symptom-ink",
                toast.tone === "info" && "border-ink text-ink",
                toast.tone === "error" && "border-danger text-danger",
              )}
            >
              {toast.tone === "stamp" ? (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-symptom text-on-spot">
                  <CheckIcon size={16} strokeWidth={3} />
                </span>
              ) : null}
              <span
                className={cn(
                  "font-display font-extrabold",
                  toast.tone === "stamp" ? "text-lg uppercase tracking-[0.08em]" : "text-base",
                )}
              >
                {toast.message}
              </span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.run();
                    dismiss();
                  }}
                  className="ml-1 min-h-11 rounded-xl px-3 font-semibold text-ink underline decoration-2 underline-offset-4"
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
