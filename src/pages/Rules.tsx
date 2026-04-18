import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { SprayRecipe } from '@/lib/types'

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Rules / Spray Recipes</div>
          <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">
            Map each model class to a spray recommendation, dosage, and minimum confidence.
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white/60 p-1 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelId(m.id)}
              className={
                modelId === m.id
                  ? 'h-9 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white'
                  : 'h-9 rounded-lg px-3 text-sm font-medium text-ink-600 hover:bg-black/5 dark:text-ink-400 dark:hover:bg-white/10'
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl2 border border-semantic-danger/20 bg-white/70 px-6 py-5 text-sm text-semantic-danger shadow-glass backdrop-blur dark:border-semantic-dangerDark/30 dark:bg-white/10 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {busy ? (
        <div className="mt-5 rounded-xl2 border border-black/5 bg-white/70 px-6 py-5 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
          Loading…
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {mergedRows.map((r) => {
            const dirty = Boolean(editing[r.id])
            return (
              <GlassCard key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{r.class_label}</div>
                    <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Model: {r.model_id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-400">
                      <input
                        type="checkbox"
                        checked={Boolean(r.enabled)}
                        onChange={(e) => setField(r.id, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      disabled={!dirty || savingId === r.id}
                      onClick={() => void save(r.id)}
                      className={
                        !dirty || savingId === r.id
                          ? 'inline-flex h-9 items-center justify-center rounded-xl bg-brand-500/40 px-3 text-sm font-medium text-white/70'
                          : 'inline-flex h-9 items-center justify-center rounded-xl bg-brand-500 px-3 text-sm font-medium text-white transition hover:bg-brand-700'
                      }
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-ink-600 dark:text-ink-400">Action type</label>
                    <select
                      value={r.action_type ?? 'none'}
                      onChange={(e) => setField(r.id, { action_type: e.target.value })}
                      className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                    >
                      <option value="none">none</option>
                      <option value="pesticide">pesticide</option>
                      <option value="fertilizer">fertilizer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-600 dark:text-ink-400">Min confidence</label>
                    <input
                      value={String(r.min_confidence ?? 0.6)}
                      onChange={(e) => setField(r.id, { min_confidence: Number(e.target.value) })}
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-600 dark:text-ink-400">Recommendation</label>
                    <input
                      value={r.recommendation ?? ''}
                      onChange={(e) => setField(r.id, { recommendation: e.target.value })}
                      type="text"
                      className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-600 dark:text-ink-400">Dosage</label>
                    <input
                      value={r.dosage ?? ''}
                      onChange={(e) => setField(r.id, { dosage: e.target.value })}
                      type="text"
                      className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-600 dark:text-ink-400">Notes</label>
                    <input
                      value={r.notes ?? ''}
                      onChange={(e) => setField(r.id, { notes: e.target.value })}
                      type="text"
                      className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
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

