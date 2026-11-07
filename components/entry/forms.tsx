"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { saveMeal, saveStress, saveSymptom } from "@/lib/db/repo";
import {
  DERIVED_TAGS,
  FOOD_TAG_GROUPS,
  tagGroupOf,
  type FoodTagGroup,
  STRESS_TRIGGERS,
  SYMPTOM_TYPES,
  type Meal,
  type MealSize,
  type StressEvent,
  type StressTrigger,
  type Symptom,
  type SymptomType,
} from "@/lib/db/types";
import { localHour } from "@/lib/analysis/time";
import { useRecentMeals, useTagLabel, useTags } from "@/lib/hooks/data";
import { Chip, FieldLabel, inputClass, ScalePicker, Switch } from "@/components/ui/controls";
import { InfoIcon } from "@/components/ui/icons";
import { NoteField } from "./note-field";
import { TimeField } from "./time-field";

export interface FormProps<T> {
  formId: string;
  editing?: T;
  /** Default timestamp for new entries. */
  at?: number;
  onSaved: (record: T, wasEdit: boolean) => void;
  onError: () => void;
}

function useTimestamp(initial?: number) {
  const [opened] = useState(() => initial ?? Date.now());
  const [ts, setTs] = useState(opened);
  const [touched, setTouched] = useState(false);
  return {
    ts,
    isNow: !touched && initial === undefined,
    set: (v: number) => {
      setTs(v);
      setTouched(true);
    },
    /** For untouched new entries, use the actual save moment. */
    final: () => (touched || initial !== undefined ? ts : Date.now()),
  };
}

const AUTO_TAGS = new Set<string>([DERIVED_TAGS.large, DERIVED_TAGS.late]);

// ── Meal ────────────────────────────────────────────────────────────────

export function MealForm({ formId, editing, at, onSaved, onError }: FormProps<Meal>) {
  const t = useTranslations();
  const tagLabel = useTagLabel();
  const allTags = useTags();
  const recent = useRecentMeals();
  const time = useTimestamp(editing?.timestamp ?? at);
  const [description, setDescription] = useState(editing?.description ?? "");
  const [tags, setTags] = useState<Set<string>>(new Set(editing?.tags ?? []));
  const [size, setSize] = useState<MealSize>(editing?.size ?? "normal");
  const [note, setNote] = useState(editing?.note ?? "");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(false);
  const descId = useId();

  const pickable = useMemo(
    () => (allTags ?? []).filter((tag) => !tag.archived && !AUTO_TAGS.has(tag.id)),
    [allTags],
  );
  // Quick view: favourites, the common triggers and whatever is already selected.
  const quick = pickable.filter(
    (tag) => tag.favorite || tags.has(tag.id) || tagGroupOf(tag.id) === "triggers",
  );
  // Full view: every tag, grouped the way people think about food.
  const groups = useMemo(() => {
    const out: { key: string; tags: typeof pickable }[] = (Object.keys(FOOD_TAG_GROUPS) as FoodTagGroup[]).map((key) => ({
      key,
      tags: pickable.filter((tag) => tagGroupOf(tag.id) === key),
    }));
    out.push({ key: "own", tags: pickable.filter((tag) => !tag.builtin) });
    return out.filter((g) => g.tags.length > 0);
  }, [pickable]);
  const chip = (tag: (typeof pickable)[number]) => (
    <Chip key={tag.id} selected={tags.has(tag.id)} onToggle={() => toggle(tag.id)} spot="food">
      {tagLabel(tag.id)}
    </Chip>
  );

  const toggle = (id: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() && tags.size === 0) {
      setError(true);
      return;
    }
    try {
      const saved = await saveMeal({
        id: editing?.id,
        timestamp: time.final(),
        description: description.trim(),
        tags: [...tags],
        size,
        note: note.trim() || undefined,
      });
      onSaved(saved, Boolean(editing));
    } catch {
      onError();
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-6" noValidate>
      <TimeField value={time.ts} onChange={time.set} isNow={time.isNow} />

      <div>
        <label htmlFor={descId} className="sr-only">
          {t("entry.meal.descriptionLabel")}
        </label>
        <input
          id={descId}
          className={inputClass + " text-lg"}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(false);
          }}
          placeholder={t("entry.meal.placeholder")}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={200}
          aria-invalid={error || undefined}
          aria-describedby={error ? `${descId}-err` : undefined}
        />
        {error ? (
          <p id={`${descId}-err`} className="mt-2 text-sm font-medium text-danger">
            {t("entry.needsDescription")}
          </p>
        ) : null}
        {!editing && recent && recent.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-sm font-semibold text-ink-soft">{t("entry.meal.recent")}</p>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {recent.map((r) => (
                <button
                  key={r.description}
                  type="button"
                  onClick={() => {
                    setDescription(r.description);
                    setTags(new Set(r.tags));
                    setSize(r.size);
                    setError(false);
                  }}
                  className="min-h-11 shrink-0 rounded-lg border border-line-strong bg-paper-deep px-3.5 text-sm font-medium text-ink hover:border-ink"
                >
                  {r.description}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2.5 font-display text-[1.05rem] font-bold">{t("entry.meal.tagsLabel")}</legend>
        {showAll ? (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.key} role="group" aria-labelledby={`tg-${g.key}`}>
                <p id={`tg-${g.key}`} className="mb-2 text-sm font-semibold text-ink-soft">
                  {t(`tagGroups.${g.key}` as never)}
                </p>
                <div className="flex flex-wrap gap-2">{g.tags.map(chip)}</div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div layout className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {quick.map((tag) => (
                <motion.div key={tag.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  {chip(tag)}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {pickable.length > quick.length ? (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mt-2 min-h-11 text-sm font-semibold text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
          >
            {showAll ? t("entry.meal.fewerTags") : t("entry.meal.moreTags")}
          </button>
        ) : null}
      </fieldset>

      <div>
        <FieldLabel as="h3">{t("entry.meal.sizeLabel")}</FieldLabel>
        <ScalePicker
          label={t("entry.meal.sizeLabel")}
          options={["small", "normal", "large"] as const}
          value={size}
          onChange={(v) => v && setSize(v)}
          spot="food"
          renderOption={(v) => <span className="font-sans">{t(`sizes.${v}`)}</span>}
          describe={(v) => t(`sizes.${v}`)}
        />
      </div>

      {localHour(time.ts) >= 21 ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <InfoIcon size={18} /> {t("entry.meal.lateHint")}
        </p>
      ) : null}

      <NoteField value={note} onChange={setNote} />
    </form>
  );
}

// ── Symptom ─────────────────────────────────────────────────────────────

const SEVERITIES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const BRISTOL = [1, 2, 3, 4, 5, 6, 7] as const;

export function SymptomForm({ formId, editing, at, onSaved, onError }: FormProps<Symptom>) {
  const t = useTranslations();
  const time = useTimestamp(editing?.timestamp ?? at);
  const [types, setTypes] = useState<Set<SymptomType>>(new Set(editing?.types ?? []));
  const [severity, setSeverity] = useState<number>(editing?.severity ?? 5);
  const [bristol, setBristol] = useState<number | null>(editing?.bristol ?? null);
  const [note, setNote] = useState(editing?.note ?? "");
  const [error, setError] = useState(false);

  const toggle = (type: SymptomType) => {
    setError(false);
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (types.size === 0) {
      setError(true);
      return;
    }
    try {
      const saved = await saveSymptom({
        id: editing?.id,
        timestamp: time.final(),
        types: SYMPTOM_TYPES.filter((x) => types.has(x)),
        severity,
        bristol,
        note: note.trim() || undefined,
      });
      onSaved(saved, Boolean(editing));
    } catch {
      onError();
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-6" noValidate>
      <TimeField value={time.ts} onChange={time.set} isNow={time.isNow} />

      <fieldset aria-describedby={error ? "symptom-types-err" : undefined}>
        <legend className="mb-2.5 flex w-full items-baseline justify-between font-display text-[1.05rem] font-bold">
          {t("entry.symptom.typesLabel")}
          <span className="font-sans text-xs font-normal text-ink-soft">{t("entry.symptom.typesHint")}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_TYPES.map((type) => (
            <Chip key={type} selected={types.has(type)} onToggle={() => toggle(type)} spot="symptom">
              {t(`symptomTypes.${type}`)}
            </Chip>
          ))}
        </div>
        {error ? (
          <p id="symptom-types-err" className="mt-2 text-sm font-medium text-danger">
            {t("entry.needsTypes")}
          </p>
        ) : null}
      </fieldset>

      <div>
        <div className="mb-2.5 flex items-end justify-between">
          <h3 className="font-display text-[1.05rem] font-bold">{t("severity.label")}</h3>
          <p className="text-right" aria-hidden>
            <span className="tabular font-display text-4xl font-extrabold leading-none text-symptom-ink">{severity}</span>
            <span className="ml-2 text-sm font-semibold text-ink-soft">{t("severity.word", { value: String(severity) })}</span>
          </p>
        </div>
        <ScalePicker
          label={t("severity.label")}
          options={SEVERITIES}
          value={severity}
          onChange={(v) => v !== null && setSeverity(v)}
          spot="symptom"
          columns={6}
          describe={(v) => `${v} — ${t("severity.word", { value: String(v) })}`}
        />
        <p className="mt-2 text-xs text-ink-soft">{t("severity.scale")}</p>
      </div>

      <div>
        <FieldLabel as="h3" hint={t("common.optional")}>
          {t("bristol.label")}
        </FieldLabel>
        <ScalePicker
          label={t("bristol.label")}
          options={BRISTOL}
          value={bristol}
          onChange={setBristol}
          allowClear
          spot="sleep"
          describe={(v) => `${v} — ${t(`bristol.${v}` as never)}`}
        />
        <p className="mt-2 text-xs text-ink-soft">
          {bristol ? `${bristol}: ${t(`bristol.${bristol}` as never)}` : t("bristol.hint")}
        </p>
      </div>

      <NoteField value={note} onChange={setNote} />
    </form>
  );
}

// ── Stress ──────────────────────────────────────────────────────────────

const LEVELS = [1, 2, 3, 4, 5] as const;

export function StressForm({ formId, editing, at, onSaved, onError }: FormProps<StressEvent>) {
  const t = useTranslations();
  const time = useTimestamp(editing?.timestamp ?? at);
  const [level, setLevel] = useState<number>(editing?.level ?? 3);
  const [trigger, setTrigger] = useState<StressTrigger>(editing?.trigger ?? "other");
  const [anticipatory, setAnticipatory] = useState(editing?.anticipatory ?? false);
  const [note, setNote] = useState(editing?.note ?? "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const saved = await saveStress({
        id: editing?.id,
        timestamp: time.final(),
        level,
        trigger,
        anticipatory,
        note: note.trim() || undefined,
      });
      onSaved(saved, Boolean(editing));
    } catch {
      onError();
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-6" noValidate>
      <TimeField value={time.ts} onChange={time.set} isNow={time.isNow} />

      <div>
        <div className="mb-2.5 flex items-end justify-between">
          <h3 className="font-display text-[1.05rem] font-bold">{t("stressLevel.label")}</h3>
          <p aria-hidden>
            <span className="tabular font-display text-4xl font-extrabold leading-none text-stress-ink">{level}</span>
            <span className="ml-2 text-sm font-semibold text-ink-soft">{t("stressLevel.word", { value: String(level) })}</span>
          </p>
        </div>
        <ScalePicker
          label={t("stressLevel.label")}
          options={LEVELS}
          value={level}
          onChange={(v) => v !== null && setLevel(v)}
          spot="stress"
          describe={(v) => `${v} — ${t("stressLevel.word", { value: String(v) })}`}
        />
      </div>

      <fieldset>
        <legend className="mb-2.5 font-display text-[1.05rem] font-bold">{t("entry.stress.triggerLabel")}</legend>
        <div role="radiogroup" aria-label={t("entry.stress.triggerLabel")} className="flex flex-wrap gap-2">
          {STRESS_TRIGGERS.map((tr) => (
            <Chip key={tr} selected={trigger === tr} onToggle={() => setTrigger(tr)} spot="stress" role="radio" aria-checked={trigger === tr} aria-pressed={undefined}>
              {t(`stressTriggers.${tr}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="paper-card p-4">
        <Switch
          checked={anticipatory}
          onCheckedChange={setAnticipatory}
          label={t("entry.stress.anticipatory")}
          description={t("entry.stress.anticipatoryHint")}
          spot="stress"
        />
      </div>

      <NoteField value={note} onChange={setNote} />
    </form>
  );
}
