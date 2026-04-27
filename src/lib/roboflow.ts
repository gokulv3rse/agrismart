export type NormalizedPrediction = { label: string; confidence: number }

export function normalizeRoboflowPredictions(raw: unknown): NormalizedPrediction[] {
  if (!raw || typeof raw !== 'object') return []
  const predictions = (raw as { predictions?: unknown }).predictions

  if (Array.isArray(predictions)) {
    return predictions
      .map((p) => {
        if (!p || typeof p !== 'object') return { label: 'unknown', confidence: 0 }
        const po = p as { class?: unknown; label?: unknown; confidence?: unknown }
        return {
          // Local model returns { label }, Roboflow returns { class } — support both
          label:
            typeof po.label === 'string' ? po.label
            : typeof po.class === 'string' ? po.class
            : String((po.label ?? po.class) ?? 'unknown'),
          confidence: typeof po.confidence === 'number' ? po.confidence : Number(po.confidence ?? 0),
        }
      })
      .filter((x) => Number.isFinite(x.confidence))
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
  }

  return []
}

export function getTopTwo(preds: NormalizedPrediction[]): { top: NormalizedPrediction; second: NormalizedPrediction | null } {
  if (!preds.length) return { top: { label: 'unknown', confidence: 0 }, second: null }
  const sorted = [...preds].sort((a, b) => b.confidence - a.confidence)
  return { top: sorted[0], second: sorted.length > 1 ? sorted[1] : null }
}

