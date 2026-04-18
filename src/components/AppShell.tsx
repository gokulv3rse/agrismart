import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { History, Leaf, LogOut, Moon, Settings, SlidersHorizontal, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const signOut = useAuthStore((s) => s.signOut)

  const nav = [
    { to: '/', label: 'Dashboard', icon: Leaf },
    { to: '/history', label: 'History', icon: History },
    { to: '/rules', label: 'Rules / Admin', icon: SlidersHorizontal },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-full bg-[#eef3e8] text-[#1d2a1f] dark:bg-app-dark dark:text-ink-100">
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] gap-6 px-6 py-8">
        <aside className="hidden w-[240px] flex-shrink-0 md:block">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-white/10 dark:text-brand-400">
                <Leaf className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">AgriSmart</div>
                <div className="text-xs text-ink-600 dark:text-ink-400">Pest & Fertilizer System</div>
              </div>
            </div>

            <nav className="mt-4 space-y-1">
              {nav.map((item) => {
                const active = pathname === item.to
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                      active
                        ? 'bg-black/5 text-brand-700 dark:bg-white/10 dark:text-brand-400'
                        : 'text-ink-600 hover:bg-black/5 dark:text-ink-400 dark:hover:bg-white/10',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15"
              >
                <span className="font-medium">Theme</span>
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15"
              >
                <span className="font-medium">Sign out</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 text-xs text-ink-600/70 dark:text-ink-400">© 2026 AgriSmart System</div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

