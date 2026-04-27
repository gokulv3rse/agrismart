import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { Diagnosis } from '@/lib/types'
import { Link } from 'react-router-dom'
import { Search, History as HistoryIcon, Loader2 } from 'lucide-react'

export default function History() {
  const [rows, setRows] = useState<Diagnosis[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const run = async () => {
      setBusy(true)
      setError(null)
      const res = await supabase
        .from('diagnoses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (res.error) {
        setError(res.error.message)
        setRows([])
      } else {
        setRows((res.data ?? []) as unknown as Diagnosis[])
      }
      setBusy(false)
    }

    void run()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const label = (r.decision?.label ?? '').toLowerCase()
      const model = (r.model_id ?? '').toLowerCase()
      return label.includes(q) || model.includes(q)
    })
  }, [rows, query])

  return (
    <AppShell>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="mt-1 text-ink-600 dark:text-ink-400">View latest 50 diagnoses and past predictions.</p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by label or model..."
            className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm font-medium outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
          />
        </div>
      </div>

      <GlassCard className="overflow-hidden border-t-0 sm:border-t flex flex-col shadow-sm">
        <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-neutral-200/60 bg-neutral-100/50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50">
          <div className="col-span-5">Diagnosis Label</div>
          <div className="col-span-3">Model Engine</div>
          <div className="col-span-2">Decision</div>
          <div className="col-span-2 text-right">Date</div>
        </div>

        {busy && (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
             <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
             <span className="text-sm font-medium text-ink-600">Loading history...</span>
          </div>
        )}

        {error && (
          <div className="px-6 py-8 text-center text-sm font-medium text-semantic-danger dark:text-semantic-dangerDark">
            {error}
          </div>
        )}

        {!busy && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
             <div className="rounded-full bg-neutral-100 p-4 dark:bg-white/5">
                <HistoryIcon className="h-10 w-10 text-ink-300 dark:text-ink-600" />
             </div>
             <div>
                <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">No history found</h3>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Go to the <Link className="text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400" to="/">Dashboard</Link> to run a prediction.</p>
             </div>
          </div>
        )}

        {!busy && !error && filtered.length > 0 && (
          <div className="divide-y divide-neutral-200/60 dark:divide-ink-600/30">
            {filtered.map((r) => (
              <Link
                to={`/results/${r.id}`}
                key={r.id}
                className="group grid grid-cols-1 sm:grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-ink-600/10"
              >
                {/* Mobile view primarily stacks them, sm view grids them */}
                <div className="sm:col-span-5">
                  <div className="font-semibold text-ink-900 group-hover:text-brand-600 transition-colors dark:text-ink-50 dark:group-hover:text-brand-400 capitalize">
                    {r.decision?.label.replace(/_/g, ' ') ?? 'Unknown'}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-ink-500">
                    {Math.round((r.decision?.confidence ?? 0) * 100)}% Confidence
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <span className="inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                     {r.model_id.split('/')[0]}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  {r.decision?.spray ? (
                    <span className="inline-flex items-center rounded-md bg-semantic-danger/10 px-2.5 py-1 text-xs font-semibold text-semantic-danger">
                       Action Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-semantic-success/10 px-2.5 py-1 text-xs font-medium text-semantic-success">
                       Healthy
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2 sm:text-right text-xs font-medium text-ink-500">
                  {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </AppShell>
  )
}
