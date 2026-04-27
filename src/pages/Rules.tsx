import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { SprayRecipe } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Loader2, Settings2, Save } from 'lucide-react'

type ModelId = 'insect-pesticide/1' | 'fertilizer-sprinkling/2'

const MODEL_OPTIONS: { id: ModelId; label: string }[] = [
  { id: 'insect-pesticide/1', label: 'Insect / Pesticide' },
  { id: 'fertilizer-sprinkling/2', label: 'Disease / Treatment' },
]

export default function Rules() {
  const [modelId, setModelId] = useState<ModelId>('insect-pesticide/1')
  const [rows, setRows] = useState<SprayRecipe[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, Partial<SprayRecipe>>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async (mid: ModelId) => {
    setBusy(true)
    setError(null)
    setEditing({})

    const res = await supabase
      .from('spray_recipes')
      .select('*')
      .eq('model_id', mid)
      .order('class_label', { ascending: true })

    if (res.error) {
      setError(res.error.message)
      setRows([])
      setBusy(false)
      return
    }

    setRows((res.data as unknown as SprayRecipe[]) ?? [])
    setBusy(false)
  }

  useEffect(() => {
    void load(modelId)
  }, [modelId])

  const mergedRows = useMemo(() => {
    return rows.map((r) => ({ ...r, ...(editing[r.id] ?? {}) }))
  }, [rows, editing])

  const setField = (id: string, patch: Partial<SprayRecipe>) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...patch },
    }))
  }

  const save = async (id: string) => {
    const base = rows.find((r) => r.id === id)
    if (!base) return

    const patch = editing[id]
    if (!patch) return

    setSavingId(id)
    setError(null)

    const payload = {
      id: base.id,
      model_id: base.model_id,
      class_label: base.class_label,
      enabled: patch.enabled ?? base.enabled,
      min_confidence: patch.min_confidence ?? base.min_confidence,
      action_type: patch.action_type ?? base.action_type,
      recommendation: patch.recommendation ?? base.recommendation,
      dosage: patch.dosage ?? base.dosage,
      notes: patch.notes ?? base.notes,
      updated_at: new Date().toISOString(),
    }

    const res = await supabase.from('spray_recipes').upsert(payload).select('*').single()
    if (res.error) {
      setError(res.error.message)
      setSavingId(null)
      return
    }

    const saved = res.data as unknown as SprayRecipe
    setRows((prev) => prev.map((r) => (r.id === id ? saved : r)))
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSavingId(null)
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Decision Rules <Settings2 className="h-6 w-6 text-brand-500" />
          </h1>
          <p className="mt-1 text-ink-600 dark:text-ink-400">Map model outputs to specific spray recommendations and parameters.</p>
        </div>
        
        <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-200/50 p-1 dark:border-ink-600/50 dark:bg-ink-900/50">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelId(m.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                modelId === m.id
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-600 dark:text-brand-400'
                  : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {busy ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <span className="text-sm font-medium text-ink-600">Loading rules...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {mergedRows.map((r) => {
            const dirty = Boolean(editing[r.id])
            return (
              <GlassCard key={r.id} className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-200 pb-5 mb-5 dark:border-ink-600/50">
                  <div>
                    <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100 capitalize">{r.class_label.replace(/_/g, ' ')}</h3>
                    <div className="mt-1 text-sm font-medium text-ink-500 uppercase tracking-wider dark:text-ink-400">{r.model_id.split('/')[0]}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink-900 cursor-pointer dark:text-ink-100">
                      <input
                        type="checkbox"
                        checked={Boolean(r.enabled)}
                        onChange={(e) => setField(r.id, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600 dark:border-ink-600 dark:bg-ink-900"
                      />
                      Rule Enabled
                    </label>
                    <button
                      type="button"
                      disabled={!dirty || savingId === r.id}
                      onClick={() => void save(r.id)}
                      className={cn(
                        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-all shadow-sm",
                        !dirty || savingId === r.id
                          ? "bg-brand-500/50 cursor-not-allowed"
                          : "bg-brand-500 hover:bg-brand-600 hover:shadow"
                      )}
                    >
                      {savingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Action Type</label>
                    <select
                      value={r.action_type ?? 'none'}
                      onChange={(e) => setField(r.id, { action_type: e.target.value })}
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                    >
                      <option value="none">None</option>
                      <option value="pesticide">Pesticide</option>
                      <option value="fertilizer">Fertilizer</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Minimum Confidence (0-1)</label>
                    <input
                      value={String(r.min_confidence ?? 0.6)}
                      onChange={(e) => setField(r.id, { min_confidence: Number(e.target.value) })}
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Recommendation</label>
                    <input
                      value={r.recommendation ?? ''}
                      onChange={(e) => setField(r.id, { recommendation: e.target.value })}
                      type="text"
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Dosage</label>
                    <input
                      value={r.dosage ?? ''}
                      onChange={(e) => setField(r.id, { dosage: e.target.value })}
                      type="text"
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Special Notes</label>
                    <input
                      value={r.notes ?? ''}
                      onChange={(e) => setField(r.id, { notes: e.target.value })}
                      type="text"
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                    />
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
