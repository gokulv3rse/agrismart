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

type NormalizedPred = { label: string; confidence: number }

function normalizePredictions(raw: RoboflowRawResponse): NormalizedPred[] {
  const p = raw.predictions

  if (Array.isArray(p)) {
    return p
      .map((it) => {
        const label = typeof it?.class === 'string' ? it.class : String(it?.class ?? 'unknown')
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

function getTopPrediction(raw: RoboflowRawResponse): NormalizedPred {
  const preds = normalizePredictions(raw)
  if (!preds.length) return { label: 'unknown', confidence: 0 }
  return preds.sort((a, b) => b.confidence - a.confidence)[0]
}

export function decide(modelId: string, raw: RoboflowRawResponse): Decision {
  const top = getTopPrediction(raw)
  const threshold = 0.6
  const confident = top.confidence >= threshold

  const isPesticideModel = modelId.startsWith('insect-pesticide/')
  const isFertilizerModel = modelId.startsWith('fertilizer-sprinkling/')

  if (!confident) {
    return {
      spray: false,
      actionType: 'none',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'No spray recommended',
      dosage: '-',
      notes: 'Retake a clearer image or try different lighting.',
      reason: `Top prediction confidence below ${threshold}.`,
      ruleVersion: 'v1.0.0',
    }
  }

  if (isPesticideModel) {
    return {
      spray: true,
      actionType: 'pesticide',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Pesticide spray recommended',
      dosage: 'Follow label instructions and local guidance.',
      notes: 'Wear protective gear and avoid spraying in high wind.',
      reason: `Detected ${top.label} with confidence ${top.confidence.toFixed(2)}.`,
      ruleVersion: 'v1.0.0',
    }
  }

  if (isFertilizerModel) {
    return {
      spray: true,
      actionType: 'fertilizer',
      label: top.label,
      confidence: top.confidence,
      recommendation: 'Fertilizer application recommended',
      dosage: 'Follow fertilizer guidelines for your crop and soil.',
      notes: 'Water appropriately after applying fertilizer.',
      reason: `Detected ${top.label} with confidence ${top.confidence.toFixed(2)}.`,
      ruleVersion: 'v1.0.0',
    }
  }

  return {
    spray: false,
    actionType: 'none',
    label: top.label,
    confidence: top.confidence,
    recommendation: 'No spray recommended',
    dosage: '-',
    notes: 'Unsupported model.',
    reason: 'Unsupported model id.',
    ruleVersion: 'v1.0.0',
  }
}
