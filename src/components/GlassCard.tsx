import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'

export function GlassCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-black/5 bg-white/85 shadow-glass backdrop-blur dark:border-white/10 dark:bg-[rgba(36,41,31,0.85)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

