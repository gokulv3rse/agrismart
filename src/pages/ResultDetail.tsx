import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { Diagnosis } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function ResultDetail() {
  const { id } = useParams<{ id: string }>()
  const [row, setRow] = useState<Diagnosis | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setBusy(true)
      setError(null)
      setRow(null)
      setImageUrl(null)

      const res = await supabase.from('diagnoses').select('*').eq('id', id).single()
      if (res.error) {
        setError(res.error.message)
        setBusy(false)
        return
      }

      const data = res.data as unknown as Diagnosis
      setRow(data)

      const signed = await supabase.storage
        .from(data.image_bucket)
        .createSignedUrl(data.image_path, 60 * 10)
      if (!signed.error && signed.data?.signedUrl) setImageUrl(signed.data.signedUrl)
      setBusy(false)
    }

    void run()
  }, [id])

  const topPreds = useMemo(() => {
    const raw = row?.raw_inference
    if (!raw || typeof raw !== 'object') return []

    const predictions = (raw as { predictions?: unknown }).predictions

    if (Array.isArray(predictions)) {
      return predictions
        .map((p) => {
          if (!p || typeof p !== 'object') return { label: 'unknown', confidence: 0 }
          const po = p as { class?: unknown; confidence?: unknown }
          return {
            label: typeof po.class === 'string' ? po.class : String(po.class ?? 'unknown'),
            confidence: typeof po.confidence === 'number' ? po.confidence : Number(po.confidence ?? 0),
          }
        })
        .filter((x) => Number.isFinite(x.confidence))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8)
    }

    if (predictions && typeof predictions === 'object') {
      return Object.entries(predictions as Record<string, unknown>)
        .map(([label, v]) => {
          const vo = v as { confidence?: unknown }
          return {
            label,
            confidence: typeof vo?.confidence === 'number' ? vo.confidence : Number(vo?.confidence ?? 0),
          }
        })
        .filter((x) => Number.isFinite(x.confidence))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8)
    }

    return []
  }, [row])

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-sm font-medium text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <div className="text-sm font-medium">Diagnosis Result</div>
          <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">{id}</div>
        </div>
      </div>

      {busy && (
        <div className="mt-6 rounded-xl2 border border-black/5 bg-white/70 px-6 py-5 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
          Loading…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl2 border border-semantic-danger/20 bg-white/70 px-6 py-5 text-sm text-semantic-danger shadow-glass backdrop-blur dark:border-semantic-dangerDark/30 dark:bg-white/10 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {row && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <GlassCard className="overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Uploaded" className="h-[360px] w-full object-cover" />
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-ink-600 dark:text-ink-400">Image unavailable</div>
            )}
            <div className="p-5">
              <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Final decision</div>
              <div className="mt-1 flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-medium">{row.decision.label}</div>
                  <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Model: {row.model_id}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Confidence</div>
                  <div className="mt-1 text-lg font-medium">{Math.round(row.decision.confidence * 100)}%</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(2, Math.min(100, Math.round(row.decision.confidence * 100)))}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-black/5 bg-white/55 p-4 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Spray Decision</div>
                <div className="mt-1 text-sm font-medium">{row.decision.recommendation}</div>
                <div className="mt-2 text-xs text-ink-600 dark:text-ink-400">Dosage: {row.decision.dosage}</div>
                <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Notes: {row.decision.notes}</div>
                <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Reason: {row.decision.reason}</div>
              </div>
              <div className="mt-4 text-xs text-ink-600 dark:text-ink-400">
                Created: {new Date(row.created_at).toLocaleString()} • Rule: {row.decision.ruleVersion}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-sm font-medium">Model Output</div>
            <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Top predictions (stored raw output).</div>

            <div className="mt-4 grid gap-2">
              {topPreds.length === 0 && (
                <div className="rounded-xl border border-black/5 bg-white/55 p-4 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
                  No predictions found.
                </div>
              )}

              {topPreds.map((p) => (
                <div
                  key={`${p.label}-${p.confidence}`}
                  className="rounded-xl border border-black/5 bg-white/55 p-3 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-ink-600 dark:text-ink-400">{Math.round(p.confidence * 100)}%</div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, Math.min(100, Math.round(p.confidence * 100)))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </AppShell>
  )
}
