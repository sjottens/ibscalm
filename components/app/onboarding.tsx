"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { setFavoriteTags, updateSettings } from "@/lib/db/repo";
import { BUILTIN_FOOD_TAGS, DERIVED_TAGS } from "@/lib/db/types";
import { useTagLabel } from "@/lib/hooks/data";
import { cn } from "@/lib/cn";
import { Button, Chip } from "@/components/ui/controls";
import { ArrowRightIcon, ChevronLeftIcon, InfoIcon, LockIcon, MealIcon, StressIcon, SymptomIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const STEPS = 5;
const PICKABLE = BUILTIN_FOOD_TAGS.filter((t) => t !== DERIVED_TAGS.large && t !== DERIVED_TAGS.late);

export function Onboarding() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const tagLabel = useTagLabel();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["onion-garlic", "wheat-gluten", "dairy-lactose"]));

  const finish = async (save: boolean) => {
    if (save) await setFavoriteTags([...favorites]);
    await updateSettings({ onboardingDone: true });
    router.replace("/vandaag");
  };
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const key = `s${step + 1}` as "s1" | "s2" | "s3" | "s4" | "s5";
  const bg = ["bg-food", "bg-stress", "bg-sleep", "bg-symptom", "bg-food"][step];

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => go(step - 1)} className="grid h-12 w-12 place-items-center rounded-full hover:bg-paper-deep" aria-label={tc("back")}>
            <ChevronLeftIcon />
          </button>
        ) : (
          <Logo size="sm" />
        )}
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={t("step", { current: step + 1, total: STEPS })}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={cn("h-2 rounded-full transition-all duration-300", i === step ? "w-6 bg-ink" : i < step ? "w-2 bg-ink" : "w-2 bg-line-strong")} />
          ))}
        </div>
        <button type="button" onClick={() => void finish(false)} className="min-h-12 rounded-xl px-3 font-semibold text-ink-soft hover:text-ink">
          {tc("skip")}
        </button>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.section
          key={step}
          custom={dir}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="flex flex-1 flex-col"
          aria-labelledby="onb-title"
        >
          <div className="relative my-8 grid flex-1 place-items-center">
            <Art step={step} bg={bg} />
          </div>
          <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-soft">{t(`${key}.kicker`)}</p>
          <h1 id="onb-title" className="mt-2 font-display text-[2.3rem] font-extrabold leading-[1.02]">
            {t(`${key}.title`)}
          </h1>
          <p className="mt-3 text-[1.05rem] text-ink-soft">{t(`${key}.body`)}</p>

          {step === 4 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {PICKABLE.map((id) => (
                <Chip
                  key={id}
                  selected={favorites.has(id)}
                  onToggle={() =>
                    setFavorites((f) => {
                      const n = new Set(f);
                      if (n.has(id)) n.delete(id);
                      else n.add(id);
                      return n;
                    })
                  }
                >
                  {tagLabel(id)}
                </Chip>
              ))}
            </div>
          ) : null}
        </motion.section>
      </AnimatePresence>

      <div className="mt-8">
        {step < STEPS - 1 ? (
          <Button size="lg" className="w-full" onClick={() => go(step + 1)} icon={step === 3 ? <InfoIcon size={20} /> : null}>
            {step === 3 ? t("s4.agree") : tc("next")} {step !== 3 ? <ArrowRightIcon size={20} /> : null}
          </Button>
        ) : (
          <Button size="lg" variant="spot" spot="food" className="w-full" onClick={() => void finish(true)}>
            {t("s5.start")} <ArrowRightIcon size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}

/** One riso composition per step; shapes stamp in with a little stagger. */
function Art({ step, bg }: { step: number; bg: string }) {
  const icons = [MealIcon, SymptomIcon, StressIcon];
  return (
    <div className="relative h-56 w-56" aria-hidden>
      <motion.div
        initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: -4, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className={cn("absolute inset-4 rounded-[2.5rem] border-[2px] border-ink", bg)}
      />
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 300, damping: 16 }}
        className="halftone absolute -right-2 -top-2 h-24 w-24 rounded-full [--dot:var(--ink)]"
      />
      <div className="absolute inset-0 grid place-items-center">
        {step === 0 ? <Logo size="lg" /> : null}
        {step === 1 ? (
          <div className="flex gap-2">
            {icons.map((Icon, i) => (
              <motion.span
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="grid h-14 w-14 place-items-center rounded-2xl border-[2px] border-ink bg-card"
              >
                <Icon size={28} />
              </motion.span>
            ))}
          </div>
        ) : null}
        {step === 2 ? (
          <span className="grid h-24 w-24 place-items-center rounded-full border-[2px] border-ink bg-card">
            <LockIcon size={44} />
          </span>
        ) : null}
        {step === 3 ? <span className="font-display text-[5.5rem] font-extrabold leading-none text-ink">!</span> : null}
        {step === 4 ? (
          <span className="grid h-24 w-24 place-items-center rounded-full border-[2px] border-ink bg-card">
            <MealIcon size={44} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
