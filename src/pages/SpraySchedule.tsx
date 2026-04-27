import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { apiFetch } from '@/lib/apiFetch'
import type { SpraySchedule } from '@/lib/types'
import { CalendarDays, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'

export default function SpraySchedulePage() {
  const [schedules, setSchedules] = useState<SpraySchedule[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const fetchSchedules = async () => {
    setBusy(true)
    try {
      const res = await apiFetch('/api/schedules')
      const data = await res.json()
      if (data.success) setSchedules(data.schedules ?? [])
      else setError(data.error)
    } catch {
      setError('Failed to load schedules')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { fetchSchedules() }, [])

  const handleComplete = async (id: string) => {
    setCompletingId(id)
    try {
      const res = await apiFetch(`/api/schedules/${id}/complete`, { method: 'PATCH' })
      const data = await res.json()
      if (data.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...data.schedule } : s))
        )
      }
    } catch {
      // Silently fail
    } finally {
      setCompletingId(null)
    }
  }

  const active = schedules.filter((s) => s.status === 'active')
  const completed = schedules.filter((s) => s.status === 'completed')

  const isOverdue = (nextDate: string) => {
    return new Date(nextDate) < new Date()
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Spray Schedules</h1>
        <p className="mt-1 text-ink-600 dark:text-ink-400">Track your spray applications and upcoming tasks.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {busy ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <span className="text-sm font-medium text-ink-600">Loading schedules...</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 px-6 py-16 text-center dark:border-ink-600/50 dark:bg-ink-900/30">
          <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-500/10">
             <CalendarDays className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
             <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">No spray schedules yet</h3>
             <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Schedules are automatically created after a diagnosis recommends spraying.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Active schedules */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Active Schedules ({active.length})
            </h2>
            
            {active.length === 0 ? (
               <div className="rounded-xl border border-neutral-300 bg-white/50 p-6 text-center text-sm font-medium text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50 dark:text-ink-400">
                  You have no active tasks.
               </div>
            ) : (
               <div className="grid gap-4">
                 {active.map((s) => {
                   const overdue = isOverdue(s.next_spray_date)
                   return (
                     <GlassCard key={s.id} className={`p-6 transition-colors ${overdue ? 'border-semantic-danger/40 bg-semantic-danger/5 dark:border-semantic-dangerDark/40' : ''}`}>
                       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{s.product_name}</h3>
                             {overdue && (
                               <span className="flex items-center gap-1 rounded-md bg-semantic-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-semantic-danger">
                                 <AlertTriangle className="h-3 w-3" /> Overdue
                               </span>
                             )}
                           </div>
                           <div className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                             {s.dosage} • Every <span className="font-semibold">{s.interval_days}</span> days
                           </div>
                           {s.plants && (
                             <div className="mt-2 inline-flex items-center rounded-md bg-neutral-200/60 px-2.5 py-1 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                               Plant: {s.plants.name} ({s.plants.crop_type})
                             </div>
                           )}
                         </div>
                         <button
                           type="button"
                           onClick={() => handleComplete(s.id)}
                           disabled={completingId === s.id}
                           className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-50 lg:w-auto w-full px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                         >
                           {completingId === s.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <CheckCircle className="h-4 w-4" />
                           )}
                           Mark as Done
                         </button>
                       </div>
 
                       <div className="mt-6">
                         <div className="flex items-center justify-between text-xs font-semibold text-ink-600 dark:text-ink-400 mb-2">
                           <span>{s.completed_applications} of {s.total_applications} passes completed</span>
                           <span>Next Date: {new Date(s.next_spray_date).toLocaleDateString()}</span>
                         </div>
                         <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-ink-600/50">
                           <div
                             className={`h-full rounded-full transition-all duration-1000 ease-out ${overdue ? 'bg-semantic-danger' : 'bg-brand-500'}`}
                             style={{ width: `${Math.max(3, Math.round((s.completed_applications / s.total_applications) * 100))}%` }}
                           />
                         </div>
                       </div>
                     </GlassCard>
                   )
                 })}
               </div>
            )}
          </div>

          {/* Completed schedules */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              <CheckCircle className="h-5 w-5 text-semantic-success" />
              Completed ({completed.length})
            </h2>
            
            {completed.length === 0 ? (
               <div className="rounded-xl border border-neutral-300 bg-white/50 p-6 text-center text-sm font-medium text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50 dark:text-ink-400">
                  No completed schedules yet.
               </div>
            ) : (
               <div className="grid gap-3">
                 {completed.map((s) => (
                   <div key={s.id} className="rounded-xl border border-neutral-200 bg-neutral-100/50 p-4 opacity-80 dark:border-ink-600/30 dark:bg-ink-900/40">
                     <div className="flex items-center justify-between gap-3">
                       <div className="flex-1">
                         <div className="text-sm font-semibold text-ink-900 dark:text-ink-100 line-clamp-1">{s.product_name}</div>
                         <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                           {s.total_applications} passes • Completed
                           {s.plants && ` • ${s.plants.name}`}
                         </div>
                       </div>
                       <CheckCircle className="h-5 w-5 text-semantic-success flex-shrink-0" />
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
