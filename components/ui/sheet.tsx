"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";
import type { Spot } from "./controls";

const bandColor: Record<Spot | "ink", string> = {
  food: "bg-food",
  symptom: "bg-symptom",
  stress: "bg-stress",
  sleep: "bg-sleep",
  ink: "bg-ink",
};

/**
 * Bottom sheet built on Radix Dialog (focus trap, Escape, aria) with a spring entrance.
 * Drag the handle down to dismiss. The footer stays pinned above the keyboard/home bar.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  spot = "ink",
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  spot?: Spot | "ink";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslations("common");
  const controls = useDragControls();
  const reduce = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-[rgb(18_20_42/0.42)] backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-xl flex-col rounded-t-[var(--radius-sheet)] border-[1.5px] border-b-0 border-ink bg-paper shadow-[0_-12px_40px_rgb(18_20_42/0.18)] outline-none"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }}
                drag={reduce ? false : "y"}
                dragControls={controls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 600) onOpenChange(false);
                }}
              >
                {/* Colour band + drag handle */}
                <div
                  className="relative shrink-0 cursor-grab touch-none pb-1 pt-2.5 active:cursor-grabbing"
                  onPointerDown={(e) => controls.start(e)}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-1.5 rounded-t-[var(--radius-sheet)]", bandColor[spot])} />
                  <div className="mx-auto mt-1.5 h-1.5 w-11 rounded-full bg-line-strong" />
                </div>
                <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-2">
                  <div>
                    <Dialog.Title className="font-display text-[1.6rem] font-extrabold leading-tight">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description>
                    ) : null}
                  </div>
                  <Dialog.Close
                    className="-mr-1 grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-paper-deep hover:text-ink"
                    aria-label={t("close")}
                  >
                    <CloseIcon />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
                {footer ? <div className="pb-safe shrink-0 border-t-[1.5px] border-line bg-paper px-5 pt-3">{footer}</div> : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Small confirmation dialog (centered). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(18_20_42/0.5)]" />
        <Dialog.Content className="paper-card riso-shadow fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6 [--riso:var(--danger)]">
          <Dialog.Title className="font-display text-2xl font-extrabold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-ink-soft">{description}</Dialog.Description>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
