import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'

export function GlassCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-300/50 bg-neutral-100 shadow-sm dark:border-ink-600/30 dark:bg-ink-900',
        className,
      )}
    >
      {children}
    </div>
  )
}

