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
  plant_id?: string | null
  created_at: string
}

export type InferResponse = {
  success: boolean
  raw?: unknown
  decision?: Decision | null
  plantId?: string | null
  error?: string
  details?: string
}

export type Plant = {
  id: string
  user_id: string
  name: string
  crop_type: string
  planted_date: string | null
  location: string | null
  notes: string
  created_at: string
}

export type SpraySchedule = {
  id: string
  diagnosis_id: string
  plant_id: string | null
  user_id: string
  product_name: string
  dosage: string
  interval_days: number
  total_applications: number
  completed_applications: number
  start_date: string
  next_spray_date: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  plants?: { name: string; crop_type: string } | null
}

export type WeatherData = {
  current: {
    temp: number
    feelsLike: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    main: string
  }
  sprayAdvisory: {
    advisable: boolean
    reasons: string[]
    rainInForecast: boolean
  }
  forecast: Array<{
    time: string
    temp: number
    humidity: number
    weather: string
    description: string
    icon: string
    windSpeed: number
  }>
}

export type SprinklerStatus = {
  isOn: boolean
  zone: string
  flowRate: number
  startedAt: string | null
  tankLevelPesticide: number
  tankLevelFertilizer: number
  lastUpdated: string
}
