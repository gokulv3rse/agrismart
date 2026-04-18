export function ProgressBar({ value }: { value: number }) {
  const w = Math.max(2, Math.min(100, Math.round(value * 100)))
  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div className="h-full rounded-full bg-brand-700" style={{ width: `${w}%` }} />
    </div>
  )
}

