"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { inputClass } from "@/components/ui/controls";
import { PlusIcon } from "@/components/ui/icons";

/** Collapsed until needed — most entries don't need a note. */
export function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(Boolean(value));
  const id = useId();
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        <PlusIcon size={17} /> {t("addNote")}
      </button>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-[1.05rem] font-bold">
        {t("note")} <span className="font-sans text-xs font-normal text-ink-soft">({t("optional")})</span>
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={2000}
        autoFocus={!value}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("notePlaceholder")}
        className={inputClass + " resize-none"}
      />
    </div>
  );
}
