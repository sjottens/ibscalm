"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { DEFAULT_ANALYSIS_CONFIG, resolveConfig } from "@/lib/analysis";
import { addTag, deleteTag, updateSettings, updateTag, wipeAll, type ThemePreference } from "@/lib/db/repo";
import { applyImport, ImportError, parseExport } from "@/lib/export";
import { useSettings, useTagLabel, useTags } from "@/lib/hooks/data";
import { useUi } from "@/lib/store/ui";
import { formatDateNumeric } from "@/lib/format";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { loadSeedIntoDb } from "@/lib/seed/load";
import { Button, inputClass, Stepper } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/sheet";
import {
  ArrowRightIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  ShieldIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { exportBackup, exportCsv } from "./export-actions";
import { Skeleton } from "./states";

const VERSION = "1.0.0";

export function SettingsView() {
  const t = useTranslations("settings");
  const settings = useSettings();

  return (
    <div className="space-y-5 px-4 pb-10 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="font-display text-[2.2rem] font-extrabold leading-none">{t("title")}</h1>
      <TagsSection />
      <AppearanceSection theme={settings?.theme ?? "system"} />
      {settings ? <AnalysisSection overrides={settings.analysis} /> : <Skeleton className="h-40" />}
      <DataSection lastBackupAt={settings?.lastBackupAt ?? null} />
      <AboutSection />
      {process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_SEED === "1" ? <DevSection /> : null}
    </div>
  );
}

function Section({ id, title, body, children }: { id: string; title: string; body?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="paper-card scroll-mt-6 p-5">
      <h2 id={`${id}-t`} className="font-display text-[1.3rem] font-extrabold">
        {title}
      </h2>
      {body ? <p className="mt-1 text-sm text-ink-soft">{body}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ── Tags ────────────────────────────────────────────────────────────────

function TagsSection() {
  const t = useTranslations("settings.tags");
  const tags = useTags();
  const tagLabel = useTagLabel();
  const [label, setLabel] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await addTag(label);
    setLabel("");
  };

  return (
    <Section id="tags" title={t("title")} body={t("body")}>
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <label htmlFor="new-tag" className="sr-only">
          {t("add")}
        </label>
        <input id="new-tag" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("addPlaceholder")} maxLength={40} className={inputClass} />
        <Button type="submit" variant="spot" spot="food" icon={<PlusIcon size={18} />} aria-label={t("add")} className="shrink-0">
          <span className="hidden sm:inline">{t("add")}</span>
        </Button>
      </form>
      {!tags ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="divide-y divide-line">
          {tags.map((tag) => (
            <li key={tag.id} className={cn("flex items-center gap-1 py-1.5", tag.archived && "opacity-55")}>
              <span className="min-w-0 flex-1 truncate font-medium">
                {tagLabel(tag.id)}
                {!tag.builtin ? <span className="ml-2 text-xs text-ink-soft">({t("own")})</span> : null}
                {tag.archived ? <span className="ml-2 text-xs text-ink-soft">({t("hidden")})</span> : null}
              </span>
              <IconToggle
                label={`${t("favorite")}: ${tagLabel(tag.id)}`}
                pressed={tag.favorite}
                onClick={() => void updateTag(tag.id, { favorite: !tag.favorite })}
              >
                <StarIcon filled={tag.favorite} size={20} className={tag.favorite ? "text-stress-ink" : undefined} />
              </IconToggle>
              <IconToggle
                label={`${tag.archived ? t("show") : t("hide")}: ${tagLabel(tag.id)}`}
                pressed={tag.archived}
                onClick={() => void updateTag(tag.id, { archived: !tag.archived })}
              >
                {tag.archived ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </IconToggle>
              {!tag.builtin ? (
                <button
                  type="button"
                  onClick={() => void deleteTag(tag.id)}
                  aria-label={`${t("remove")}: ${tag.label}`}
                  className="grid h-12 w-12 place-items-center rounded-full text-ink-soft hover:bg-danger-wash hover:text-danger"
                >
                  <TrashIcon size={19} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function IconToggle({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-full text-ink-soft transition hover:bg-paper-deep hover:text-ink active:scale-90"
    >
      {children}
    </button>
  );
}

// ── Language & theme ────────────────────────────────────────────────────

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid rounded-2xl border border-line-strong p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("min-h-11 rounded-xl text-sm font-semibold transition", value === o.value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AppearanceSection({ theme }: { theme: ThemePreference }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <section className="paper-card space-y-5 p-5" aria-label={`${t("language.title")} · ${t("theme.title")}`}>
      <div>
        <h2 className="mb-2 font-display text-[1.3rem] font-extrabold">{t("language.title")}</h2>
        <Segmented
          label={t("language.title")}
          value={locale as "nl" | "en"}
          options={[
            { value: "nl", label: t("language.nl") },
            { value: "en", label: t("language.en") },
          ]}
          onChange={(l) => router.replace(pathname, { locale: l })}
        />
      </div>
      <div>
        <h2 className="mb-2 font-display text-[1.3rem] font-extrabold">{t("theme.title")}</h2>
        <Segmented
          label={t("theme.title")}
          value={theme}
          options={[
            { value: "system", label: t("theme.system") },
            { value: "light", label: t("theme.light") },
            { value: "dark", label: t("theme.dark") },
          ]}
          onChange={(v) => {
            applyTheme(v);
            void updateSettings({ theme: v });
          }}
        />
      </div>
    </section>
  );
}

// ── Analysis ────────────────────────────────────────────────────────────

function AnalysisSection({ overrides }: { overrides: Parameters<typeof resolveConfig>[0] }) {
  const t = useTranslations("settings.analysis");
  const tc = useTranslations("common");
  const cfg = resolveConfig(overrides);
  const save = (patch: NonNullable<Parameters<typeof resolveConfig>[0]>) =>
    void updateSettings({
      analysis: {
        ...overrides,
        ...patch,
        food: { ...overrides?.food, ...patch.food },
        stress: { ...overrides?.stress, ...patch.stress },
        lateEating: { ...overrides?.lateEating, ...patch.lateEating },
      },
    });
  const isDefault = JSON.stringify(cfg) === JSON.stringify(DEFAULT_ANALYSIS_CONFIG);

  const row = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, unit = "") => (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-sm font-semibold">{label}</span>
      <Stepper label={label} value={value} onChange={onChange} min={min} max={max} unit={unit} decreaseLabel={`− ${label}`} increaseLabel={`+ ${label}`} />
    </div>
  );

  return (
    <Section id="analyse" title={t("title")} body={t("body")}>
      <div className="divide-y divide-line">
        {row(t("threshold"), cfg.severityThreshold, (v) => save({ severityThreshold: v }), 1, 9)}
        {row(t("foodMin"), cfg.food.minHours, (v) => save({ food: { minHours: Math.min(v, cfg.food.maxHours - 1) } }), 0, 12, "u")}
        {row(t("foodMax"), cfg.food.maxHours, (v) => save({ food: { maxHours: Math.max(v, cfg.food.minHours + 1) } }), 2, 24, "u")}
        {row(t("stressWindow"), cfg.stress.afterHours, (v) => save({ stress: { afterHours: v } }), 1, 12, "u")}
        {row(t("lateHour"), cfg.lateEating.hour, (v) => save({ lateEating: { hour: v } }), 18, 23, ":00")}
      </div>
      {!isDefault ? (
        <Button variant="outline" className="mt-3" onClick={() => void updateSettings({ analysis: null })}>
          {t("reset")}
        </Button>
      ) : null}
      <span className="sr-only">{tc("optional")}</span>
    </Section>
  );
}

// ── Data ────────────────────────────────────────────────────────────────

function DataSection({ lastBackupAt }: { lastBackupAt: number | null }) {
  const t = useTranslations("settings.data");
  const tc = useTranslations("common");
  const locale = useLocale();
  const tagLabel = useTagLabel();
  const showToast = useUi((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseExport(await file.text());
      const res = await applyImport(parsed);
      showToast({ message: t("importDone", { added: res.added, updated: res.updated }), tone: "stamp" });
    } catch (e) {
      const code = e instanceof ImportError ? e.code : "invalid-data";
      showToast({ message: t(`importError.${code}`), tone: "error" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Section id="data" title={t("title")} body={t("body")}>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1.5 text-sm">
        <ShieldIcon size={17} />
        {lastBackupAt ? t("lastBackup", { date: formatDateNumeric(lastBackupAt, locale) }) : t("neverBackup")}
      </p>
      <div className="grid gap-2.5">
        <Button variant="spot" spot="sleep" size="lg" icon={<DownloadIcon size={20} />} onClick={() => void exportBackup()} className="justify-start">
          {t("exportJson")}
        </Button>
        <Link href="/rapport" className="inline-flex min-h-14 items-center gap-2 rounded-lg border border-line-strong bg-card px-6 text-[1.0625rem] font-semibold hover:bg-paper-deep">
          <DownloadIcon size={20} /> {t("report")}
        </Link>
        <Button variant="outline" size="lg" icon={<DownloadIcon size={20} />} onClick={() => void exportCsv(tagLabel)} className="justify-start">
          {t("exportCsv")}
        </Button>
        <Button variant="outline" size="lg" icon={<UploadIcon size={20} />} onClick={() => fileRef.current?.click()} className="justify-start">
          {t("import")}
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onImport(e.target.files?.[0])} data-testid="import-input" />
        <Button variant="ghost" size="lg" icon={<TrashIcon size={20} />} onClick={() => setWipeOpen(true)} className="justify-start text-danger hover:bg-danger-wash">
          {t("wipe")}
        </Button>
      </div>
      <ConfirmDialog open={wipeOpen} onOpenChange={setWipeOpen} title={t("wipeTitle")} description={t("wipeBody")}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (confirm.trim().toUpperCase() !== t("wipeConfirmWord")) return;
            await wipeAll();
            useUi.getState().setOnboarded(false);
            try {
              localStorage.clear();
            } catch {
              // ignore
            }
            setWipeOpen(false);
            showToast({ message: t("wiped"), tone: "info" });
            router.replace("/welkom");
          }}
        >
          <label htmlFor="wipe-confirm" className="mb-1.5 block text-sm font-semibold">
            {t("wipeConfirmLabel")}
          </label>
          <input id="wipe-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="off" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWipeOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={confirm.trim().toUpperCase() !== t("wipeConfirmWord")}>
              {t("wipeAction")}
            </Button>
          </div>
        </form>
      </ConfirmDialog>
    </Section>
  );
}

// ── About ───────────────────────────────────────────────────────────────

function AboutSection() {
  const t = useTranslations("settings.about");
  const router = useRouter();
  return (
    <Section id="about" title={t("title")}>
      <h3 className="font-display text-lg font-bold">{t("disclaimer")}</h3>
      <p className="mt-1 text-sm text-ink-soft">{t("disclaimerBody")}</p>
      <div className="mt-4 grid gap-1">
        <Link href="/privacy" className="flex min-h-12 items-center justify-between rounded-xl px-1 font-semibold hover:bg-paper-deep">
          {t("privacy")} <ArrowRightIcon size={18} />
        </Link>
        <button
          type="button"
          onClick={async () => {
            await updateSettings({ onboardingDone: false });
            useUi.getState().setOnboarded(false);
            router.push("/welkom");
          }}
          className="flex min-h-12 items-center justify-between rounded-xl px-1 text-left font-semibold hover:bg-paper-deep"
        >
          {t("onboarding")} <ArrowRightIcon size={18} />
        </button>
      </div>
      <p className="mt-3 font-mono text-xs text-ink-soft">{t("version", { version: VERSION })}</p>
    </Section>
  );
}

function DevSection() {
  const t = useTranslations("settings.dev");
  const showToast = useUi((s) => s.showToast);
  return (
    <section className="rounded-[var(--radius-card)] border border-dashed border-stress-ink p-5">
      <h2 className="text-sm font-semibold text-stress-ink">{t("title")}</h2>
      <Button
        variant="outline"
        className="mt-3"
        onClick={async () => {
          await loadSeedIntoDb();
          await updateSettings({ onboardingDone: true });
          showToast({ message: t("seeded"), tone: "stamp" });
        }}
      >
        {t("seed")}
      </Button>
    </section>
  );
}
