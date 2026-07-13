// Money is always stored as integer halalas — see CLAUDE.md conventions.
// These convert to/from the SAR decimal a human actually types.

export function sarToHalalas(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const sar = Number(value);
  if (!Number.isFinite(sar) || sar <= 0) return null;
  return Math.round(sar * 100);
}

export function halalasToSar(halalas: number): string {
  return (halalas / 100).toFixed(2);
}
