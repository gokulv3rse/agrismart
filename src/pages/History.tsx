import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { Diagnosis } from '@/lib/types'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

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
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium">History</div>
          <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Your recent diagnoses (latest 50).</div>
        </div>
        <div className="relative w-full max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600 dark:text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search label or model…"
            className="h-10 w-full rounded-xl border border-black/5 bg-white/70 pl-10 pr-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
          />
        </div>
      </div>

      <div className="mt-5">
        <GlassCard className="overflow-hidden">
          <div className="grid grid-cols-12 gap-0 border-b border-black/5 bg-white/40 px-4 py-3 text-xs font-medium text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-400">
            <div className="col-span-5">Label</div>
            <div className="col-span-3">Model</div>
            <div className="col-span-2">Decision</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {busy && (
            <div className="px-4 py-8 text-sm text-ink-600 dark:text-ink-400">Loading…</div>
          )}

          {error && (
            <div className="px-4 py-4 text-sm text-semantic-danger dark:text-semantic-dangerDark">{error}</div>
          )}

          {!busy && !error && filtered.length === 0 && (
            <div className="px-4 py-8 text-sm text-ink-600 dark:text-ink-400">
              No results yet. Go to <Link className="underline" to="/">Dashboard</Link> to run your first prediction.
            </div>
          )}

          {!busy && !error && filtered.length > 0 && (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {filtered.map((r) => (
                <Link
                  to={`/results/${r.id}`}
                  key={r.id}
                  className="grid grid-cols-12 items-center gap-0 px-4 py-3 text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <div className="col-span-5">
                    <div className="font-medium">{r.decision?.label ?? '—'}</div>
                    <div className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{Math.round((r.decision?.confidence ?? 0) * 100)}% confidence</div>
                  </div>
                  <div className="col-span-3 text-xs text-ink-600 dark:text-ink-400">{r.model_id}</div>
                  <div className="col-span-2">
                    {r.decision?.spray ? (
                      <span className="rounded-lg bg-semantic-success/15 px-2 py-1 text-xs font-medium text-semantic-success dark:bg-white/10">Spray</span>
                    ) : (
                      <span className="rounded-lg bg-black/5 px-2 py-1 text-xs font-medium text-ink-600 dark:bg-white/10 dark:text-ink-400">No</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right text-xs text-ink-600 dark:text-ink-400">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}

