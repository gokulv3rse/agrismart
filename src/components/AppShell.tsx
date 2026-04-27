import { useState, type ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  History, Leaf, LogOut, Moon, Settings, SlidersHorizontal, Sun,
  Sprout, CalendarDays, BarChart3, Menu, X, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const signOut = useAuthStore((s) => s.signOut)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const nav = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/plants', label: 'My Plants', icon: Sprout },
    { to: '/schedules', label: 'Schedules', icon: CalendarDays },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/history', label: 'History', icon: History },
    { to: '/rules', label: 'Admin Rules', icon: SlidersHorizontal },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  // Bottom tab bar items (mobile — show key items only)
  const bottomNav = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/plants', label: 'Plants', icon: Sprout },
    { to: '/schedules', label: 'Schedules', icon: CalendarDays },
    { to: '/history', label: 'History', icon: History },
  ]

  return (
    <div className="flex min-h-screen bg-neutral-200 dark:bg-[#0b1121] text-ink-900 dark:text-ink-100 font-sans selection:bg-brand-500/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-neutral-300/60 bg-neutral-100 md:flex dark:border-ink-600/30 dark:bg-ink-900">
        <div className="flex h-16 items-center gap-3 border-b border-neutral-300/60 px-6 dark:border-ink-600/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-lg">AgriSmart</span>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="mb-2 px-2 text-xs font-semibold text-ink-400 uppercase tracking-wider dark:text-ink-600">
            Navigation
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.to
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-100/50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-ink-600 hover:bg-neutral-200/60 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-100',
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-brand-600 dark:text-brand-400" : "")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-neutral-300/60 p-4 dark:border-ink-600/30 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-neutral-200/60 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-100"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-semantic-danger/10 hover:text-semantic-danger dark:text-ink-400 dark:hover:bg-semantic-dangerDark/10 dark:hover:text-semantic-dangerDark"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-300/60 bg-neutral-100/95 px-4 backdrop-blur md:hidden dark:border-ink-600/30 dark:bg-ink-900/95">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">AgriSmart</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-ink-600 hover:bg-neutral-200 dark:text-ink-400 dark:hover:bg-white/10">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-ink-600 hover:bg-neutral-200 dark:text-ink-400 dark:hover:bg-white/10">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-14 z-30 border-b border-neutral-300/60 bg-neutral-100 shadow-lg md:hidden dark:border-ink-600/30 dark:bg-ink-900">
            <nav className="flex flex-col p-4 space-y-1">
              {nav.map((item) => {
                const active = pathname === item.to
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-100/50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-ink-600 hover:bg-neutral-200/50 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-100',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="mt-4 pt-4 border-t border-neutral-300/60 dark:border-ink-600/30">
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-600 transition-colors hover:bg-semantic-danger/10 hover:text-semantic-danger dark:text-ink-400 dark:hover:bg-semantic-dangerDark/10 dark:hover:text-semantic-dangerDark"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-neutral-300/60 bg-neutral-100/95 backdrop-blur md:hidden dark:border-ink-600/30 dark:bg-ink-900/95">
        {bottomNav.map((item, i) => {
          const active = pathname === item.to || (pathname !== '/' && item.to !== '/' && pathname.startsWith(item.to))
          const Icon = item.icon
          return (
            <Link
              key={i}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
                active
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-ink-400 hover:text-ink-600 dark:text-ink-600 dark:hover:text-ink-400',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        {/* We place Settings in mobile menu instead, but keeping it in bottom tab is fine too. Used a subset to prevent crowding. */}
      </div>
    </div>
  )
}
