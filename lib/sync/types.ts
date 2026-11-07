/**
 * Contract for a future, optional end-to-end encrypted sync. NOT implemented yet.
 *
 * How the current data model prepares for it:
 * - every record has a stable `id` (or `date` for day logs), `updatedAt` and a `deletedAt` tombstone;
 * - merging is "newer updatedAt wins" — the same rule `applyImport` already uses;
 * - the export format is versioned and migratable.
 *
 * A sync adapter would encrypt a change set on the device (e.g. with a key derived from a
 * passphrase via WebCrypto) and only ever send ciphertext to a server.
 */
import type { ExportFile } from "@/lib/export/format";

export interface ChangeSet {
  /** Records changed since `since` (including tombstones). */
  data: ExportFile["data"];
  since: number;
  until: number;
}

export interface SyncAdapter {
  /** Encrypts and uploads local changes. */
  push(changes: ChangeSet): Promise<void>;
  /** Downloads and decrypts remote changes since a moment. */
  pull(since: number): Promise<ChangeSet>;
}
