/**
 * Server-side decision engine v3.0.0
 * Replaces the client-side buildDecision() that was in Home.tsx
 * and the dead-code decide() in the old decision.ts
 */

export type RoboflowPrediction = {
  class?: string
  confidence?: number
  [k: string]: unknown
}

export type RoboflowRawResponse = {
  predictions?: RoboflowPrediction[] | Record<string, { confidence?: number; class_id?: number }>
  [k: string]: unknown
}

export type Decision = {
  spray: boolean
  actionType: 'pesticide' | 'fertilizer' | 'none'
  label: string
  confidence: number
  recommendation: string
  dosage: string
  notes: string
  reason: string
  ruleVersion: string
}

export type NormalizedPred = { label: string; confidence: number }

export type SprayRecipe = {
  id: string
  model_id: string
  class_label: string
  enabled: boolean
  min_confidence: number
  action_type: string
  recommendation: string
  dosage: string
  notes: string
  updated_at: string
  created_at: string
}

const RULE_VERSION = 'v3.0.0'

export function normalizePredictions(raw: RoboflowRawResponse): NormalizedPred[] {
  const p = raw.predictions

  if (Array.isArray(p)) {
    return p
      .map((it) => {
        // Support both Roboflow format ({ class }) and local model format ({ label })
        const label =
          typeof it?.label === 'string' ? it.label
          : typeof it?.class === 'string' ? it.class
          : String((it?.label ?? it?.class) ?? 'unknown')
        const confidence = typeof it?.confidence === 'number' ? it.confidence : Number(it?.confidence ?? 0)
        return { label, confidence }
      })
      .filter((x) => Number.isFinite(x.confidence))
  }

  if (p && typeof p === 'object') {
    return Object.entries(p)
      .map(([label, v]) => ({
        label,
        confidence: typeof v?.confidence === 'number' ? v.confidence : Number(v?.confidence ?? 0),
      }))
      .filter((x) => Number.isFinite(x.confidence))
  }

  return []
}

export function getTopTwo(preds: NormalizedPred[]): { top: NormalizedPred; second: NormalizedPred | null } {
  if (!preds.length) return { top: { label: 'unknown', confidence: 0 }, second: null }
  const sorted = [...preds].sort((a, b) => b.confidence - a.confidence)
  return { top: sorted[0], second: sorted.length > 1 ? sorted[1] : null }
}

export function buildDecision(args: {
  modelId: string
  raw: RoboflowRawResponse
  recipe: SprayRecipe | null
}): Decision {
  const preds = normalizePredictions(args.raw)
  const { top, second } = getTopTwo(preds)
  const margin = second ? top.confidence - second.confidence : 1
  const isUncertain = top.confidence < 0.6 || margin < 0.08

  // Healthy crop — no action needed
  // Handles: 'Healthy', 'Healthy Crop', 'Tomato___Healthy', 'Potato___Healthy', etc.
  const isHealthy =
    top.label.toLowerCase() === 'healthy' ||
    top.label.toLowerCase() === 'healthy crop' ||
    top.label.toLowerCase().endsWith('___healthy') ||
    top.label.toLowerCase().endsWith('_healthy')

  if (isHealthy) {
    return {
      spray: false,
      actionType: 'none',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Healthy',
      dosage: '-',
      notes: 'Crop appears healthy. No treatment required.',
      reason: 'Healthy class detected.',
      ruleVersion: RULE_VERSION,
    }
  }

  // No recipe configured for this class
  if (!args.recipe || !args.recipe.enabled) {
    return {
      spray: false,
      actionType: 'none',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'No product configured',
      dosage: '-',
      notes: 'No recipe configured for this class yet.',
      reason: 'Missing spray recipe mapping.',
      ruleVersion: RULE_VERSION,
    }
  }

  // Low confidence / uncertain prediction
  if (isUncertain || top.confidence < args.recipe.min_confidence) {
    return {
      spray: false,
      actionType: 'none',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Low confidence',
      dosage: '-',
      notes: 'Retake a clearer image or try different lighting.',
      reason: `Low confidence or ambiguous prediction (confidence ${top.confidence.toFixed(2)}).`,
      ruleVersion: RULE_VERSION,
    }
  }

  // Determine action type — fertilizer or pesticide
  const actionType: Decision['actionType'] =
    args.recipe.action_type === 'fertilizer'
      ? 'fertilizer'
      : args.recipe.action_type === 'pesticide'
        ? 'pesticide'
        : 'none'

  // Build fertilizer-specific notes if applicable
  const fertilizerNotes = actionType === 'fertilizer'
    ? `${args.recipe.notes || ''} Apply based on soil test results. Water thoroughly after application.`
    : args.recipe.notes || ''

  return {
    spray: actionType !== 'none',
    actionType,
    label: top.label,
    confidence: top.confidence,
    recommendation: args.recipe.recommendation || 'Recommended product (configure)',
    dosage: args.recipe.dosage || 'Follow label instructions.',
    notes: fertilizerNotes,
    reason: `Matched recipe for ${top.label}.`,
    ruleVersion: RULE_VERSION,
  }
}
