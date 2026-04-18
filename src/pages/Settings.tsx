import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { useAuthStore } from '@/stores/authStore'

export default function Settings() {
  const user = useAuthStore((s) => s.user)

  return (
    <AppShell>
      <div className="grid gap-6">
        <GlassCard className="p-5">
          <div className="text-sm font-medium">Settings</div>
          <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Profile and app preferences.</div>

          <div className="mt-4 rounded-xl border border-black/5 bg-white/55 p-4 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
            <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Signed in as</div>
            <div className="mt-1 text-sm font-medium">{user?.email ?? '—'}</div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}

