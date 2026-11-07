import { getDb } from "@/lib/db/database";
import { ensureBuiltinTags } from "@/lib/db/repo";
import { generateSeed } from "./generate";

/** Development only: replaces entries with 3 weeks of fictional data. */
export async function loadSeedIntoDb(): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_SEED !== "1") {
    throw new Error("Seed data is only available in development.");
  }
  const seed = generateSeed();
  const db = getDb();
  await db.transaction("rw", [db.meals, db.symptoms, db.stress, db.days], async () => {
    await Promise.all([db.meals.clear(), db.symptoms.clear(), db.stress.clear(), db.days.clear()]);
    await db.meals.bulkPut(seed.meals);
    await db.symptoms.bulkPut(seed.symptoms);
    await db.stress.bulkPut(seed.stress);
    await db.days.bulkPut(seed.days);
  });
  await ensureBuiltinTags();
}
