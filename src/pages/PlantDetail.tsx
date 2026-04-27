import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { apiFetch } from '@/lib/apiFetch'
import type { Plant, Diagnosis, SpraySchedule } from '@/lib/types'
import { ArrowLeft, Sprout, Calendar, MapPin, Activity, CalendarDays, Loader2 } from 'lucide-react'

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [schedules, setSchedules] = useState<SpraySchedule[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      if (!id) return
      setBusy(true)
      try {
        const res = await apiFetch(`/api/plants/${id}`)
        const data = await res.json()
        if (data.success) {
          setPlant(data.plant)
          setDiagnoses(data.diagnoses ?? [])
          setSchedules(data.schedules ?? [])
        } else {
          setError(data.error)
        }
      } catch {
        setError('Failed to load plant details')
      } finally {
        setBusy(false)
      }
    }
    fetch()
  }, [id])

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/plants"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-white text-ink-600 transition-colors hover:bg-neutral-100 hover:text-ink-900 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{plant?.name ?? 'Plant Detail'}</h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-500 font-medium uppercase tracking-wider dark:text-ink-400">{plant?.crop_type ?? 'Loading'}</p>
          </div>
        </div>
      </div>

      {busy && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <span className="text-sm font-medium text-ink-600">Loading plant data...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {plant && !busy && (
        <div className="grid gap-6">
          {/* Plant info card */}
          <GlassCard className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/10 dark:text-brand-400">
                <Sprout className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">{plant.name}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-ink-600 dark:text-ink-400">
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 uppercase tracking-wider text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                    {plant.crop_type}
                  </span>
                  {plant.planted_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-ink-400" />
                      Planted: {new Date(plant.planted_date).toLocaleDateString()}
                    </span>
                  )}
                  {plant.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-ink-400" />
                      {plant.location}
                    </span>
                  )}
                </div>
                {plant.notes && (
                  <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-ink-700 dark:bg-ink-900/50 dark:text-ink-300 border border-neutral-200 dark:border-ink-700">
                    {plant.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-ink-700 dark:bg-ink-900/50">
                <div className="text-2xl font-bold text-ink-900 dark:text-ink-50">{diagnoses.length}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Diagnoses</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-ink-700 dark:bg-ink-900/50">
                <div className="text-2xl font-bold text-semantic-success dark:text-semantic-success">{schedules.filter(s => s.status === 'active').length}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Active Schedules</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-ink-700 dark:bg-ink-900/50">
                <div className="text-2xl font-bold text-semantic-warning">{diagnoses.filter(d => d.decision?.spray).length}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Spray Actions</div>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Diagnosis history */}
            <GlassCard className="p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100 mb-6">
                <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Diagnosis History
              </h3>

              {diagnoses.length === 0 ? (
                <div className="rounded-xl border border-neutral-300 bg-white/50 p-6 text-center text-sm font-medium text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50 dark:text-ink-400">
                  No diagnoses linked to this plant yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-ink-700">
                  {diagnoses.map((d) => (
                    <Link
                      key={d.id}
                      to={`/results/${d.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-ink-800/30 -mx-4 px-4 rounded-xl"
                    >
                      <div>
                        <div className="text-sm font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400 capitalize">
                          {d.decision?.label.replace(/_/g, ' ') ?? 'Unknown'}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-ink-500">
                          <span>{Math.round((d.decision?.confidence ?? 0) * 100)}% Confidence</span>
                          <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-ink-600" />
                          <span className="uppercase">{d.model_id.split('/')[0]}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {d.decision?.spray ? (
                          <span className="inline-flex rounded-md bg-semantic-danger/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-semantic-danger">Action</span>
                        ) : (
                          <span className="inline-flex rounded-md bg-semantic-success/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-semantic-success">Healthy</span>
                        )}
                        <span className="text-xs font-medium text-ink-500">{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Spray schedules */}
            <GlassCard className="p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100 mb-6">
                 <CalendarDays className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                 Spray Schedules
              </h3>
              
              {schedules.length === 0 ? (
                <div className="rounded-xl border border-neutral-300 bg-white/50 p-6 text-center text-sm font-medium text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50 dark:text-ink-400">
                  No active or completed schedules.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-ink-700">
                  {schedules.map((s) => (
                    <div key={s.id} className="py-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-sm font-semibold text-ink-900 dark:text-ink-100">{s.product_name}</div>
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          s.status === 'active'
                            ? 'bg-semantic-success/10 text-semantic-success'
                            : 'bg-neutral-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-ink-500 mb-2">
                        <span>{s.completed_applications} of {s.total_applications} Passes</span>
                        <span>{s.status === 'active' ? `Next: ${new Date(s.next_spray_date).toLocaleDateString()}` : 'Finished'}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-ink-800">
                        <div
                          className={`h-full rounded-full ${s.status === 'active' ? 'bg-brand-500' : 'bg-neutral-400 dark:bg-ink-500'}`}
                          style={{ width: `${Math.max(3, Math.round((s.completed_applications / s.total_applications) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </AppShell>
  )
}
