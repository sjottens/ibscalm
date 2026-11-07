"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { setFavoriteTags, updateSettings } from "@/lib/db/repo";
import { FOOD_TAG_GROUPS } from "@/lib/db/types";
import { useTagLabel } from "@/lib/hooks/data";
import { cn } from "@/lib/cn";
import { useUi } from "@/lib/store/ui";
import { Button, Chip } from "@/components/ui/controls";
import { ArrowRightIcon, ChevronLeftIcon, InfoIcon, LockIcon, MealIcon, SymptomIcon } from "@/components/ui/icons";
import { Logo, LogoMark } from "@/components/ui/logo";

const STEPS = 5;
// The choices that matter most at the start: common triggers and drinks. Everything else is one tap away later.
const PICKABLE = [...FOOD_TAG_GROUPS.triggers, ...FOOD_TAG_GROUPS.drinks];

export function Onboarding() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const tagLabel = useTagLabel();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["onion-garlic", "wheat-gluten", "dairy-lactose"]));

  const setOnboarded = useUi((s) => s.setOnboarded);
  const finish = async (save: boolean) => {
    if (save) await setFavoriteTags([...favorites]);
    await updateSettings({ onboardingDone: true });
    setOnboarded(true);
    router.replace("/vandaag");
  };
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const key = `s${step + 1}` as "s1" | "s2" | "s3" | "s4" | "s5";

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
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col"
          aria-labelledby="onb-title"
        >
          <div className="relative my-8 grid flex-1 place-items-center">
            <Art step={step} />
          </div>
          <p className="text-sm font-semibold text-ink-soft">{t(`${key}.kicker`)}</p>
          <h1 id="onb-title" className="mt-2 text-[2rem] font-black leading-tight">
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

/** One calm illustration per step: an icon in a soft tinted circle. */
function Art({ step }: { step: number; bg?: string }) {
  const items = [
    { Icon: null, tone: "bg-paper-deep" },
    { Icon: SymptomIcon, tone: "bg-symptom-wash text-symptom-ink" },
    { Icon: LockIcon, tone: "bg-sleep-wash text-sleep-ink" },
    { Icon: InfoIcon, tone: "bg-stress-wash text-stress-ink" },
    { Icon: MealIcon, tone: "bg-food-wash text-food-ink" },
  ][step];
  return (
    <div className={cn("grid h-44 w-44 place-items-center rounded-full", items.tone)} aria-hidden>
      {items.Icon ? <items.Icon size={72} strokeWidth={1.6} /> : <LogoMark size={128} />}
    </div>
  );
}
