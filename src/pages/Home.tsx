import { useMemo, useState } from 'react'
import { UploadCloud, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import type { Decision, Diagnosis, InferResponse, SprayRecipe } from '@/lib/types'
import { getTopTwo, normalizeRoboflowPredictions } from '@/lib/roboflow'
import { Link } from 'react-router-dom'

type ModelId = 'insect-pesticide/1' | 'fertilizer-sprinkling/2'

type ModelOption = {
  id: ModelId
  name: string
  helper: string
}

const MODELS: ModelOption[] = [
  { id: 'insect-pesticide/1', name: 'Pest Model', helper: 'Detect insect pests and show pesticide guidance.' },
  { id: 'fertilizer-sprinkling/2', name: 'Disease Model', helper: 'Detect plant diseases and show treatment guidance.' },
]

const RULE_VERSION = 'v2.1.0'

function buildDecision(args: { modelId: ModelId; raw: unknown; recipe: SprayRecipe | null }): Decision {
  const preds = normalizeRoboflowPredictions(args.raw)
  const { top, second } = getTopTwo(preds)
  const margin = second ? top.confidence - second.confidence : 1
  const isUncertain = top.confidence < 0.6 || margin < 0.08

  if (top.label.toLowerCase() === 'healthy crop' || top.label.toLowerCase() === 'healthy') {
    return {
      spray: false,
      actionType: 'none' as const,
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Healthy',
      dosage: '-',
      notes: 'Crop appears healthy.',
      reason: 'Healthy class detected.',
      ruleVersion: RULE_VERSION,
    }
  }

  if (!args.recipe || !args.recipe.enabled) {
    return {
      spray: false,
      actionType: 'none' as const,
      label: top.label,
      confidence: top.confidence,
      recommendation: 'No product configured',
      dosage: '-',
      notes: 'No recipe configured for this class yet.',
      reason: 'Missing spray recipe mapping.',
      ruleVersion: RULE_VERSION,
    }
  }

  if (isUncertain || top.confidence < args.recipe.min_confidence) {
    return {
      spray: false,
      actionType: 'none' as const,
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Low confidence',
      dosage: '-',
      notes: 'Retake a clearer image or try different lighting.',
      reason: `Low confidence or ambiguous prediction (confidence ${top.confidence.toFixed(2)}).`,
      ruleVersion: RULE_VERSION,
    }
  }

  const actionType =
    args.recipe.action_type === 'fertilizer'
      ? ('fertilizer' as const)
      : args.recipe.action_type === 'pesticide'
        ? ('pesticide' as const)
        : ('none' as const)

  return {
    spray: actionType !== 'none',
    actionType,
    label: top.label,
    confidence: top.confidence,
    recommendation: args.recipe.recommendation || 'Recommended product (configure)',
    dosage: args.recipe.dosage || 'Follow label instructions.',
    notes: args.recipe.notes || '',
    reason: `Matched recipe for ${top.label}.`,
    ruleVersion: RULE_VERSION,
  }
}

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const [modelId, setModelId] = useState<ModelId>('insect-pesticide/1')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latest, setLatest] = useState<Diagnosis | null>(null)

  const model = useMemo(() => MODELS.find((m) => m.id === modelId)!, [modelId])

  const onPickFile = (f: File | null) => {
    setError(null)
    setLatest(null)
    setFile(f)
    if (!f) {
      setPreviewUrl(null)
      return
    }
    setPreviewUrl(URL.createObjectURL(f))
  }

  const reset = () => {
    setError(null)
    setLatest(null)
    setFile(null)
    setPreviewUrl(null)
  }

  const run = async () => {
    if (!user || !file) return
    setBusy(true)
    setError(null)
    setLatest(null)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const upload = await supabase.storage
        .from('diagnosis-images')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (upload.error) throw new Error(upload.error.message)

      const signed = await supabase.storage
        .from('diagnosis-images')
        .createSignedUrl(path, 60 * 5)
      if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || 'Failed to create signed URL')

      const inferRes = await fetch('/api/roboflow/infer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modelId, imageUrl: signed.data.signedUrl }),
      })

      const inferJson = (await inferRes.json()) as InferResponse
      if (!inferJson.success || !inferJson.raw) throw new Error(inferJson.error || 'Inference failed')

      const p = normalizeRoboflowPredictions(inferJson.raw)
      const { top: t } = getTopTwo(p)

      const recipeRes = await supabase
        .from('spray_recipes')
        .select('*')
        .eq('model_id', modelId)
        .eq('class_label', t.label)
        .limit(1)
        .maybeSingle()
      if (recipeRes.error) throw new Error(recipeRes.error.message)

      const decision = buildDecision({ modelId, raw: inferJson.raw, recipe: (recipeRes.data as unknown as SprayRecipe) ?? null })

      const insert = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          model_id: modelId,
          image_bucket: 'diagnosis-images',
          image_path: path,
          raw_inference: inferJson.raw,
          decision,
        })
        .select('*')
        .single()

      if (insert.error) throw new Error(insert.error.message)
      setLatest(insert.data as unknown as Diagnosis)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Upload Plant Image</div>
              <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">JPG/PNG recommended. Keep the leaf area centered.</div>
            </div>
            <div className="rounded-xl bg-brand-100 p-2 text-brand-500 dark:bg-white/10 dark:text-brand-400">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Model</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelId(m.id)}
                    className={
                      m.id === modelId
                        ? 'rounded-xl border border-brand-100 bg-brand-100 px-3 py-2 text-left text-sm font-medium text-brand-700 dark:border-white/10 dark:bg-white/10 dark:text-brand-400'
                        : 'rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-left text-sm font-medium text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15'
                    }
                  >
                    <div className="text-sm">{m.name}</div>
                    <div className="mt-1 text-xs font-normal text-ink-600/80 dark:text-ink-400/80">{m.helper}</div>
                  </button>
                ))}
              </div>
            </div>

            <label className="group relative block cursor-pointer rounded-xl border border-dashed border-black/10 bg-white/50 px-4 py-5 text-sm text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/70 dark:border-white/15 dark:bg-white/5 dark:text-ink-400 dark:hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100">Drag & drop or choose file</div>
                  <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Max 20MB recommended.</div>
                </div>
                <div className="rounded-xl bg-brand-100 px-3 py-2 text-xs font-medium text-brand-700 dark:bg-white/10 dark:text-brand-400">
                  Browse
                </div>
              </div>
            </label>

            {previewUrl && (
              <div className="overflow-hidden rounded-xl border border-black/5 bg-white/60 shadow-glass dark:border-white/10 dark:bg-white/10">
                <img src={previewUrl} alt="Preview" className="max-h-[260px] w-full object-cover" />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-semantic-danger/20 bg-white/70 px-3 py-2 text-sm text-semantic-danger shadow-glass backdrop-blur dark:border-semantic-dangerDark/30 dark:bg-white/10 dark:text-semantic-dangerDark">
                {error}
              </div>
            )}

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                disabled={!file || busy}
                onClick={() => void run()}
                className={
                  !file || busy
                    ? 'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500/40 px-4 text-sm font-medium text-white/70'
                    : 'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-700'
                }
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Get Prediction
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-black/5 bg-white/60 px-4 text-sm font-medium text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15"
              >
                Reset
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Prediction Result</div>
              <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Model: {model.name}</div>
            </div>
            {latest?.decision?.spray ? (
              <div className="rounded-xl bg-semantic-success/15 px-3 py-1 text-xs font-medium text-semantic-success dark:bg-white/10">Spray</div>
            ) : (
              <div className="rounded-xl bg-black/5 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-white/10 dark:text-ink-400">No spray</div>
            )}
          </div>

          {!latest && !busy && (
            <div className="mt-6 rounded-xl border border-black/5 bg-white/55 p-4 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
              Upload an image and click “Get Prediction” to see results.
            </div>
          )}

          {busy && (
            <div className="mt-6 rounded-xl border border-black/5 bg-white/55 p-4 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
              Running inference…
            </div>
          )}

          {latest && (
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-black/5 bg-white/55 p-4 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Final Label</div>
                    <div className="mt-1 text-lg font-medium">{latest.decision.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Confidence</div>
                    <div className="mt-1 text-lg font-medium">{Math.round(latest.decision.confidence * 100)}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(2, Math.min(100, Math.round(latest.decision.confidence * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-black/5 bg-white/55 p-4 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Spray Decision</div>
                <div className="mt-1 text-sm font-medium">{latest.decision.recommendation}</div>
                <div className="mt-2 text-xs text-ink-600 dark:text-ink-400">Dosage: {latest.decision.dosage}</div>
                <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Notes: {latest.decision.notes}</div>
                <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Reason: {latest.decision.reason}</div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/history"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white/60 px-4 py-2 text-sm font-medium text-ink-600 shadow-glass backdrop-blur transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-ink-400 dark:hover:bg-white/15"
                >
                  View History
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  to={`/results/${latest.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Open Result
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
