"use client";

import { create } from "zustand";
import type { Entry, EntryKind } from "@/lib/db/types";

export type SheetState =
  | { type: "entry"; kind: EntryKind; editing?: Entry; /** default timestamp for new entries */ at?: number }
  | { type: "day"; date: string }
  | null;

export interface Toast {
  id: number;
  message: string;
  tone: "stamp" | "info" | "error";
  action?: { label: string; run: () => void };
}

interface UiState {
  sheet: SheetState;
  /** The most recently opened sheet; kept while the sheet animates out. */
  lastSheet: Exclude<SheetState, null> | null;
  /** Increments per opening, used as a React key so each sheet starts fresh. */
  sheetNonce: number;
  openEntry: (kind: EntryKind, opts?: { editing?: Entry; at?: number }) => void;
  openDay: (date: string) => void;
  closeSheet: () => void;
  toast: Toast | null;
  showToast: (t: Omit<Toast, "id">) => void;
  dismissToast: () => void;
  /** Id of the entry saved last, so it can "plop" into lists. */
  lastSavedId: string | null;
  setLastSaved: (id: string | null) => void;
  /**
   * Set the moment onboarding finishes. The settings live query can lag a moment behind the write;
   * without this flag the app shell could briefly see "not onboarded" and bounce back to /welkom.
   */
  onboardedThisSession: boolean;
  setOnboarded: (v: boolean) => void;
}

let toastId = 0;

export const useUi = create<UiState>((set) => ({
  sheet: null,
  lastSheet: null,
  sheetNonce: 0,
  openEntry: (kind, opts) =>
    set((s) => {
      const sheet = { type: "entry" as const, kind, ...opts };
      return { sheet, lastSheet: sheet, sheetNonce: s.sheetNonce + 1 };
    }),
  openDay: (date) =>
    set((s) => {
      const sheet = { type: "day" as const, date };
      return { sheet, lastSheet: sheet, sheetNonce: s.sheetNonce + 1 };
    }),
  closeSheet: () => set({ sheet: null }),
  toast: null,
  showToast: (t) => set({ toast: { ...t, id: ++toastId } }),
  dismissToast: () => set({ toast: null }),
  lastSavedId: null,
  setLastSaved: (id) => set({ lastSavedId: id }),
  onboardedThisSession: false,
  setOnboarded: (v) => set({ onboardedThisSession: v }),
}));
