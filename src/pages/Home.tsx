import { useEffect, useMemo, useState } from 'react'
import { UploadCloud, Loader2, Sparkles, ExternalLink, Activity, Thermometer, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { WeatherWidget } from '@/components/WeatherWidget'
import { IoTStatus } from '@/components/IoTStatus'
import { supabase } from '@/lib/supabaseClient'
import { apiFetch } from '@/lib/apiFetch'
import { useAuthStore } from '@/stores/authStore'
import type { Decision, Diagnosis, InferResponse, Plant } from '@/lib/types'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type ModelId = 'agrismart/1' | 'hf-rice/1' | 'hf-insect/1'

type ModelOption = {
  id: ModelId
  name: string
  emoji: string
  helper: string
}

const MODELS: ModelOption[] = [
  { id: 'agrismart/1',  emoji: '🍅', name: 'Tomato & Potato', helper: 'Detects Tomato and Potato diseases using local MobileNetV2 (94% accuracy).' },
  { id: 'hf-rice/1',   emoji: '🌾', name: 'Rice Diseases',   helper: 'Detects 6 Rice diseases via HuggingFace model (Blast, Brown Spot, Blight, Smut, NeckBlast).' },
  { id: 'hf-insect/1', emoji: '🦗', name: 'Pest Detection',  helper: 'Identifies crop insects and pests via HuggingFace classifier.' },
]

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const [modelId, setModelId] = useState<ModelId>('agrismart/1')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latest, setLatest] = useState<Diagnosis | null>(null)

  // Plant selector
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<string>('')

  const model = useMemo(() => MODELS.find((m) => m.id === modelId)!, [modelId])

  // Fetch user's plants
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await apiFetch('/api/plants')
        const data = await res.json()
        if (data.success) setPlants(data.plants ?? [])
      } catch {
        // Silently fail
      }
    }
    fetchPlants()
  }, [])

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

      // Call the API with auth — server now returns decision
      const inferRes = await apiFetch('/api/roboflow/infer', {
        method: 'POST',
        body: JSON.stringify({
          modelId,
          imageUrl: signed.data.signedUrl,
          plantId: selectedPlantId || null,
        }),
      })

      const inferJson = (await inferRes.json()) as InferResponse
      if (!inferJson.success || !inferJson.raw) throw new Error(inferJson.error || 'Inference failed')

      // Use the server-side decision
      const decision: Decision = inferJson.decision ?? {
        spray: false,
        actionType: 'none',
        label: 'unknown',
        confidence: 0,
        recommendation: 'Decision engine unavailable',
        dosage: '-',
        notes: '',
        reason: 'Server did not return a decision',
        ruleVersion: 'fallback',
      }

      const insert = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          model_id: modelId,
          image_bucket: 'diagnosis-images',
          image_path: path,
          raw_inference: inferJson.raw,
          decision,
          plant_id: selectedPlantId || null,
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-ink-600 dark:text-ink-400">Welcome back! Analyze your crops and monitor IoT devices.</p>
      </div>

      {/* Top row: Weather + IoT widgets */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <WeatherWidget />
        <IoTStatus />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard className="p-6 md:p-8 flex flex-col h-full">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">New Diagnosis</h2>
              <p className="text-sm text-ink-600 dark:text-ink-400">Select a model and upload a plant leaf image.</p>
            </div>
            
            {/* Model Selector — 3 options */}
            <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-200/50 p-1 dark:border-ink-600/50 dark:bg-ink-900/50">
              {MODELS.map((m) => {
                const active = m.id === modelId
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={m.helper}
                    onClick={() => setModelId(m.id)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-all shadow-sm flex items-center gap-1.5',
                      active
                        ? 'bg-white text-brand-700 dark:bg-ink-600 dark:text-brand-400'
                        : 'text-ink-600 hover:text-ink-900 shadow-none dark:text-ink-400 dark:hover:text-ink-100'
                    )}
                  >
                    <span>{m.emoji}</span>
                    <span className="hidden sm:inline">{m.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {/* Massive Dropzone */}
            <label className="group flex-1 flex flex-col items-center justify-center min-h-[300px] cursor-pointer rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 hover:bg-neutral-200/50 transition-colors p-8 text-center overflow-hidden relative dark:border-ink-600/50 dark:bg-ink-900/30 dark:hover:bg-ink-900/60">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="absolute inset-0 bg-black/5 dark:bg-black/40 p-2 flex items-center justify-center">
                   <img src={previewUrl} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="rounded-full bg-brand-100 p-4 text-brand-600 group-hover:scale-110 group-hover:bg-brand-200 transition-all dark:bg-brand-500/20 dark:text-brand-400">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-ink-900 dark:text-ink-100">Click to upload or drag & drop</h3>
                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">PNG, JPG up to 20MB</p>
                  </div>
                </div>
              )}
            </label>

            {/* Plant selector & Actions Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {plants.length > 0 ? (
                <div className="flex-1">
                  <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                  >
                    <option value="">Link to a Plant (Optional)</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.crop_type})</option>
                    ))}
                  </select>
                </div>
              ) : <div className="flex-1" />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-12 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 font-semibold text-ink-900 transition-colors hover:bg-neutral-200 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-600/30"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={!file || busy}
                  onClick={() => void run()}
                  className={cn(
                    "inline-flex h-12 flex-shrink-0 items-center gap-2 rounded-xl px-8 font-semibold text-white transition-all shadow-sm",
                    !file || busy
                      ? "bg-brand-500/50 cursor-not-allowed"
                      : "bg-brand-500 hover:bg-brand-600 hover:shadow"
                  )}
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  Analyze Image
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
                {error}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Results Panel */}
        <GlassCard className="p-6 md:p-8 flex flex-col bg-neutral-100/50 dark:bg-ink-900/50">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Analysis Report</h2>
            <Activity className="h-5 w-5 text-ink-400" />
          </div>

          {!latest && !busy && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="rounded-full bg-neutral-200/50 p-4 dark:bg-white/5">
                <Cpu className="h-8 w-8 text-ink-400" />
              </div>
              <div>
                <p className="font-medium text-ink-900 dark:text-ink-100">No analysis yet</p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Upload a leaf image to generate a diagnostic report.</p>
              </div>
            </div>
          )}

          {busy && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12 animate-pulse">
              <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
              <p className="font-medium text-brand-600 dark:text-brand-400">AI is analyzing your crop...</p>
            </div>
          )}

          {latest && (
            <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Primary Label */}
              <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm dark:border-ink-600/50 dark:bg-ink-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-ink-600 dark:text-ink-400">Detected Condition</h3>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white capitalize">
                      {latest.decision.label.includes('___')
                        ? latest.decision.label.split('___').map(s => s.replace(/_/g, ' ')).join(' — ')
                        : latest.decision.label.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {/* Badge — 3 states: spray needed / healthy / no recipe configured */}
                  {latest.decision.spray ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-semantic-danger/10 px-3 py-1 font-medium text-semantic-danger">
                      <ShieldAlert className="h-4 w-4" />
                      Action Required
                    </div>
                  ) : latest.decision.recommendation === 'Healthy' ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-semantic-success/10 px-3 py-1 font-medium text-semantic-success">
                      <ShieldCheck className="h-4 w-4" />
                      Healthy
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="h-4 w-4" />
                      Review
                    </div>
                  )}
                </div>
                
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-ink-600 dark:text-ink-400">Confidence Score</span>
                    <span className="text-brand-600 dark:text-brand-400">{Math.round(latest.decision.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-ink-600/50">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.max(2, Math.min(100, Math.round(latest.decision.confidence * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
                <h3 className="text-sm font-medium text-brand-800 dark:text-brand-300 mb-3">AI Recommendation</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="font-semibold text-brand-900 dark:text-brand-100 block">{latest.decision.recommendation}</span>
                  </div>
                  
                  {latest.decision.actionType !== 'none' && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-200/50 dark:border-brand-500/10">
                      <div>
                        <span className="block text-xs font-medium text-brand-700/70 dark:text-brand-300/70">Dosage</span>
                        <span className="mt-0.5 block font-medium text-brand-900 dark:text-brand-100">{latest.decision.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-brand-700/70 dark:text-brand-300/70">Treatment Type</span>
                        <span className="mt-0.5 block font-medium capitalize text-brand-900 dark:text-brand-100">{latest.decision.actionType}</span>
                      </div>
                    </div>
                  )}
                  
                  {latest.decision.notes && (
                    <div className="pt-3 border-t border-brand-200/50 dark:border-brand-500/10">
                      <span className="block text-xs font-medium text-brand-700/70 dark:text-brand-300/70">Special Notes</span>
                      <p className="mt-1 text-brand-900 dark:text-brand-100">{latest.decision.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Links */}
              <div className="mt-auto pt-4 flex flex-col gap-3">
                {/* Create Schedule — only when spray is needed */}
                {latest.decision.spray && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { supabase } = await import('@/lib/supabaseClient')
                        const { data: { session } } = await supabase.auth.getSession()
                        if (!session) return
                        const res = await fetch('/api/schedules', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                          body: JSON.stringify({
                            diagnosisId: latest.id,
                            plantId: latest.plantId ?? null,
                            productName: latest.decision.recommendation,
                            dosage: latest.decision.dosage,
                            intervalDays: 10,
                            totalApplications: 3,
                          }),
                        })
                        if (res.ok) {
                          alert('✅ Spray schedule created! View it in the Schedules page.')
                        } else {
                          alert('Failed to create schedule. Try again.')
                        }
                      } catch {
                        alert('Error creating schedule.')
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                    Create Spray Schedule
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <Link
                    to="/history"
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 border border-neutral-300 shadow-sm transition-colors hover:bg-neutral-50 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-600/30"
                  >
                    View History
                  </Link>
                  <Link
                    to={`/results/${latest.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-950 dark:bg-brand-500 dark:hover:bg-brand-600"
                  >
                    Full Report
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}
