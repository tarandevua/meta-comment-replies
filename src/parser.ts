export function extractSelection(text: string): number | null {
  const match = text.trim().match(/^(?:[^0-9]*)(\d{1,2})(?:[^0-9]*)$/u);
  if (!match?.[1]) return null;
  const n=Number(match[1]); return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}
