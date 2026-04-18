export function percent(n: number) {
  return Math.round(n * 1000) / 10
}

export function splitSafetyNotes(text: string): string[] {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s*\u2022\s*/g, ' • ')
    .trim()
  const parts = cleaned
    .split(/(?:\s*•\s*|\s*;\s*|\s*\.\s+)/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.slice(0, 6)
}

