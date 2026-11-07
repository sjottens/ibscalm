"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { deleteEntry, restoreEntry } from "@/lib/db/repo";
import type { Entry, EntryKind } from "@/lib/db/types";
import { useDayLog } from "@/lib/hooks/data";
import { useUi } from "@/lib/store/ui";
import { haptic } from "@/lib/theme";
import { formatDayLong } from "@/lib/format";
import { Button, kindSpot } from "@/components/ui/controls";
import { CheckIcon, TrashIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { DayForm } from "./day-form";
import { MealForm, StressForm, SymptomForm } from "./forms";

/** Renders whichever entry sheet is open in the UI store. Mounted once in the app shell. */
export function SheetHost() {
  const open = useUi((s) => s.sheet);
  // While closing, keep rendering the last sheet so it can animate out.
  const sheet = useUi((s) => s.lastSheet);
  const nonce = useUi((s) => s.sheetNonce);
  const close = useUi((s) => s.closeSheet);
  const showToast = useUi((s) => s.showToast);
  const setLastSaved = useUi((s) => s.setLastSaved);
  const t = useTranslations();
  const key = String(nonce);

  const onSaved = (id: string, wasEdit: boolean) => {
    haptic(wasEdit ? 8 : [10, 40, 14]);
    setLastSaved(id);
    close();
    showToast({ message: wasEdit ? t("entry.updated") : t("entry.saved"), tone: "stamp" });
  };
  const onError = () => showToast({ message: t("errors.storage"), tone: "error" });

  return (
    <>
      <EntrySheet
        key={key}
        open={open?.type === "entry"}
        kind={sheet?.type === "entry" ? sheet.kind : "meal"}
        editing={sheet?.type === "entry" ? sheet.editing : undefined}
        at={sheet?.type === "entry" ? sheet.at : undefined}
        onClose={close}
        onSaved={onSaved}
        onError={onError}
      />
      <DaySheet
        key={`d-${key}`}
        open={open?.type === "day"}
        date={sheet?.type === "day" ? sheet.date : null}
        onClose={close}
        onSaved={() => onSaved("", true)}
        onError={onError}
      />
    </>
  );
}

function EntrySheet({
  open,
  kind,
  editing,
  at,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  kind: EntryKind;
  editing?: Entry;
  at?: number;
  onClose: () => void;
  onSaved: (id: string, wasEdit: boolean) => void;
  onError: () => void;
}) {
  const t = useTranslations();
  const showToast = useUi((s) => s.showToast);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formId = `form-${kind}`;
  const titles = {
    meal: editing ? t("entry.meal.editTitle") : t("entry.meal.title"),
    symptom: editing ? t("entry.symptom.editTitle") : t("entry.symptom.title"),
    stress: editing ? t("entry.stress.editTitle") : t("entry.stress.title"),
  };
  const spot = kindSpot[kind];
  const saved = (r: { id: string }, wasEdit: boolean) => onSaved(r.id, wasEdit);

  const remove = async () => {
    if (!editing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteEntry(kind, editing.id);
    onClose();
    haptic(20);
    showToast({
      message: t("entry.deleted"),
      tone: "info",
      action: { label: t("common.undo"), run: () => void restoreEntry(kind, editing.id) },
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={titles[kind]}
      spot={spot}
      footer={
        <div className="flex gap-3">
          {editing ? (
            <Button
              variant={confirmDelete ? "danger" : "outline"}
              size="lg"
              onClick={remove}
              aria-label={confirmDelete ? t("entry.deleteConfirm") : t("common.delete")}
              icon={<TrashIcon size={20} />}
              className={confirmDelete ? "" : "w-14 px-0"}
            >
              {confirmDelete ? t("entry.deleteConfirm") : null}
            </Button>
          ) : null}
          <Button type="submit" form={formId} variant="spot" spot={spot} size="lg" className="flex-1" icon={<CheckIcon size={20} strokeWidth={2.6} />}>
            {editing ? t("common.saveChanges") : t("common.save")}
          </Button>
        </div>
      }
    >
      {kind === "meal" ? (
        <MealForm formId={formId} editing={editing?.kind === "meal" ? editing : undefined} at={at} onSaved={saved} onError={onError} />
      ) : kind === "symptom" ? (
        <SymptomForm formId={formId} editing={editing?.kind === "symptom" ? editing : undefined} at={at} onSaved={saved} onError={onError} />
      ) : (
        <StressForm formId={formId} editing={editing?.kind === "stress" ? editing : undefined} at={at} onSaved={saved} onError={onError} />
      )}
    </Sheet>
  );
}

function DaySheet({
  open,
  date,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  date: string | null;
  onClose: () => void;
  onSaved: () => void;
  onError: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const existing = useDayLog(date ?? "");
  const formId = "form-day";
  const ready = date !== null && existing !== undefined;
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t("day.title")}
      description={date ? formatDayLong(date, locale) : undefined}
      spot="sleep"
      footer={
        <Button type="submit" form={formId} variant="spot" spot="sleep" size="lg" className="w-full" icon={<CheckIcon size={20} strokeWidth={2.6} />} disabled={!ready}>
          {t("common.save")}
        </Button>
      }
    >
      {ready ? <DayForm formId={formId} date={date} existing={existing} onSaved={onSaved} onError={onError} /> : <div className="h-64" />}
    </Sheet>
  );
}
