import { Router, type Response } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { buildDecision } from '../lib/decisionEngine.js'
import { createSupabaseClient } from '../lib/supabaseAdmin.js'

const router = Router()

// ── Model registry ─────────────────────────────────────────────────────────────
const LOCAL_INFER_URL  = process.env.LOCAL_INFER_URL  ?? 'http://localhost:5001/predict-upload'
const HF_INSECT_URL    = 'https://SanchaiKB-Insect-Classification-Model.hf.space/predict'
const HF_RICE_URL      = 'https://sanchaikb-fertilizer-model.hf.space/predict'

const ALLOWED_MODELS = new Set([
  'agrismart/1',   // local MobileNetV2 — Tomato + Potato
  'hf-insect/1',   // HuggingFace insect/pest classifier
  'hf-rice/1',     // HuggingFace rice disease model
])

type LocalPred   = { label: string; confidence: number }
type NormalizedRaw = { predictions: LocalPred[]; top_label?: string; top_confidence?: number; [k: string]: unknown }

type InferBody = {
  modelId?:    string
  imageUrl?:   string
  confidence?: number
  plantId?:    string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Download an image from a URL and return it as a Blob + filename. */
async function fetchImageAsBlob(url: string): Promise<{ blob: Blob; filename: string }> {
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!r.ok) throw new Error(`Failed to fetch image: ${r.status}`)
  const buffer      = await r.arrayBuffer()
  const contentType = r.headers.get('content-type') ?? 'image/jpeg'
  const ext         = contentType.includes('png') ? 'png' : 'jpg'
  return { blob: new Blob([buffer], { type: contentType }), filename: `image.${ext}` }
}

/** Call a HuggingFace Space predict endpoint with a multipart file upload. */
async function callHFEndpoint(hfUrl: string, imageUrl: string): Promise<NormalizedRaw> {
  const { blob, filename } = await fetchImageAsBlob(imageUrl)

  const form = new FormData()
  form.append('file', blob, filename)

  const r = await fetch(hfUrl, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(45_000),   // HF free tier may need to wake up
  })
  if (!r.ok) {
    const txt = await r.text()
    throw new Error(`HF endpoint error ${r.status}: ${txt}`)
  }

  const data = await r.json() as Record<string, unknown>

  // ── Normalise HF response → internal { predictions: [{label, confidence}] }
  // Fertilizer/Rice model returns { prediction, confidence, scores: [{label, confidence}] }
  if (Array.isArray(data.scores)) {
    const scores = data.scores as Array<{ label: string; confidence: number }>
    const preds  = scores.map((s) => ({ label: s.label, confidence: s.confidence }))
    preds.sort((a, b) => b.confidence - a.confidence)
    return { predictions: preds, top_label: preds[0]?.label, top_confidence: preds[0]?.confidence, ...data }
  }

  // New EfficientNet insect model returns { prediction, confidence, all_scores: {label: confidence} }
  if (data.all_scores && typeof data.all_scores === 'object' && !Array.isArray(data.all_scores)) {
    const allScores = data.all_scores as Record<string, number>
    const preds = Object.entries(allScores)
      .map(([label, confidence]) => ({ label, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
    return { predictions: preds, top_label: preds[0]?.label, top_confidence: preds[0]?.confidence, ...data }
  }

  // Legacy insect model returns only top-1 { prediction, confidence }
  const label      = String(data.prediction ?? 'unknown')
  const confidence = Number(data.confidence ?? 0)
  return {
    predictions:    [{ label, confidence }],
    top_label:      label,
    top_confidence: confidence,
    ...data,
  }
}

// ── Infer route ───────────────────────────────────────────────────────────────
router.post('/infer', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const body     = (req.body ?? {}) as InferBody
  const modelId  = String(body.modelId ?? '')
  const imageUrl = String(body.imageUrl ?? '')
  const plantId  = body.plantId || null

  if (!ALLOWED_MODELS.has(modelId)) {
    res.status(400).json({ success: false, error: `Unsupported modelId: ${modelId}` })
    return
  }

  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
    res.status(400).json({ success: false, error: 'Invalid imageUrl' })
    return
  }

  let raw: NormalizedRaw

  try {
    if (modelId === 'agrismart/1') {
      // ── Local PyTorch inference server ─────────────────────────────────────
      const { blob, filename } = await fetchImageAsBlob(imageUrl)
      const form = new FormData()
      form.append('file', blob, filename)

      const r = await fetch(LOCAL_INFER_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(20_000) })
      if (!r.ok) {
        if (r.status === 0 || !r.ok) {
          res.status(503).json({ success: false, error: 'Local inference server not running. Start: cd ml && python serve.py' })
          return
        }
      }
      const data = await r.json() as { success?: boolean; predictions?: LocalPred[]; top_label?: string; top_confidence?: number; error?: string }
      if (!data.success || !data.predictions?.length) {
        res.status(502).json({ success: false, error: data.error ?? 'Empty response from local server' })
        return
      }
      raw = { predictions: data.predictions, top_label: data.top_label, top_confidence: data.top_confidence }

    } else if (modelId === 'hf-insect/1') {
      // ── HuggingFace Insect Classifier ──────────────────────────────────────
      raw = await callHFEndpoint(HF_INSECT_URL, imageUrl)

    } else {
      // ── HuggingFace Rice / Fertilizer Model ────────────────────────────────
      raw = await callHFEndpoint(HF_RICE_URL, imageUrl)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ success: false, error: msg })
    return
  }

  // ── Decision engine + recipe lookup ────────────────────────────────────────
  try {
    const sorted   = [...raw.predictions].sort((a, b) => b.confidence - a.confidence)
    const top      = sorted[0] ?? { label: 'unknown', confidence: 0 }
    const supabase = createSupabaseClient(req.accessToken)

    const recipeRes = await supabase
      .from('spray_recipes')
      .select('*')
      .eq('model_id', modelId)
      .eq('class_label', top.label)
      .limit(1)
      .maybeSingle()

    const recipe   = recipeRes.data ?? null
    const decision = buildDecision({ modelId, raw: { predictions: raw.predictions }, recipe })

    res.status(200).json({ success: true, raw, decision, plantId })
  } catch {
    res.status(200).json({ success: true, raw, decision: null, error: 'Decision engine failed' })
  }
})

export default router
