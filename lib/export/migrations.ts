/**
 * Upgrades older export files step by step to the current EXPORT_FORMAT.
 * Add a step for every format bump: `steps[n]` turns format n into n + 1.
 */
type Raw = Record<string, unknown>;

const steps: Record<number, (file: Raw) => Raw> = {
  // 1: (file) => ({ ...file, format: 2, data: { ... } }),
};

export function migrateExport(file: Raw): Raw {
  let current = file;
  let format = typeof current.format === "number" ? current.format : 1;
  while (steps[format]) {
    current = steps[format](current);
    format++;
  }
  return current;
}
