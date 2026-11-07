/**
 * Prints what the insights page would conclude from the seed data.
 * Usage: npm run seed:report [-- <seed> <days>]
 */
import { runAnalysis } from "../lib/analysis";
import { generateSeed } from "../lib/seed/generate";

const seed = Number(process.argv[2] ?? 42);
const days = Number(process.argv[3] ?? 21);
const data = generateSeed({ seed, days });
const r = runAnalysis(data);
const pct = (x: number | null) => (x === null ? "  –  " : `${Math.round(x * 100)}%`.padStart(5));

console.log(`\nSeed ${seed} · ${days} days · meals ${data.meals.length} · symptoms ${data.symptoms.length} · stress ${data.stress.length}\n`);
console.log("SUMMARY", JSON.stringify({ ...r.summary, counts: undefined }, null, 1));
console.log("\nFOOD (with vs without, n)");
for (const t of r.food.tags)
  console.log(`  ${t.tag.padEnd(16)} ${pct(t.exposed.rate)} vs ${pct(t.reference.rate)}  n=${t.exposed.n}  Δ=${pct(t.difference)}  ${t.confidence}`);
console.log(`  baseline ${pct(r.food.baseline.rate)}`);
const s = r.stress;
console.log("\nSTRESS moments: all", pct(s.all.exposed.rate), "n", s.all.exposed.n, "| anticipatory", pct(s.anticipatory.exposed.rate), "n", s.anticipatory.exposed.n, "| reference", pct(s.all.reference.rate), "n", s.referenceMoments);
console.log("STRESS days: high", r.stressDays.exposed.mean?.toFixed(1), "n", r.stressDays.exposed.n, "| low", r.stressDays.reference.mean?.toFixed(1), "n", r.stressDays.reference.n);
console.log("SLEEP days: poor", r.sleepDays.exposed.mean?.toFixed(1), "n", r.sleepDays.exposed.n, "| good", r.sleepDays.reference.mean?.toFixed(1), "n", r.sleepDays.reference.n);
console.log("LATE eating: late", pct(r.lateEating.exposed.rate), "n", r.lateEating.exposed.n, "| other", pct(r.lateEating.reference.rate), "n", r.lateEating.reference.n);
