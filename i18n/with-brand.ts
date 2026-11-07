import { BRAND } from "@/lib/brand";

type Messages = { [key: string]: string | Messages };

/** Replaces the literal token "{brand}" in every message, so the product name lives in one place. */
export function withBrand<T extends Messages>(messages: T): T {
  const walk = (node: Messages): Messages =>
    Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, typeof v === "string" ? v.replaceAll("{brand}", BRAND.name) : walk(v)]),
    );
  return walk(messages) as T;
}
