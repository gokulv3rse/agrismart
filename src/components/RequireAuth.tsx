import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized)
  const user = useAuthStore((s) => s.user)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    if (!initialized) void init()
  }, [initialized, init])

  if (!initialized) {
    return (
      <div className="min-h-full bg-app-light dark:bg-app-dark">
        <div className="mx-auto flex min-h-full max-w-[1200px] items-center justify-center px-6 py-10">
          <div className="rounded-xl2 bg-white/70 px-6 py-5 text-sm text-ink-600 shadow-glass backdrop-blur dark:bg-white/10 dark:text-ink-400">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}
