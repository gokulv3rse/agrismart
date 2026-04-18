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

export type Diagnosis = {
  id: string
  user_id: string
  model_id: string
  image_bucket: string
  image_path: string
  raw_inference: unknown
  decision: Decision
  created_at: string
}

export type InferResponse = {
  success: boolean
  raw?: unknown
  error?: string
  details?: string
}
