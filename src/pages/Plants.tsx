import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { apiFetch } from '@/lib/apiFetch'
import type { Plant } from '@/lib/types'
import { Link } from 'react-router-dom'
import { Plus, Sprout, MapPin, Calendar, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Plants() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [cropType, setCropType] = useState('rice')
  const [plantedDate, setPlantedDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const fetchPlants = async () => {
    setBusy(true)
    try {
      const res = await apiFetch('/api/plants')
      const data = await res.json()
      if (data.success) setPlants(data.plants ?? [])
      else setError(data.error)
    } catch {
      setError('Failed to load plants')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { fetchPlants() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch('/api/plants', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          cropType,
          plantedDate: plantedDate || null,
          location: location.trim() || null,
          notes: notes.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPlants((prev) => [data.plant, ...prev])
        setName('')
        setCropType('rice')
        setPlantedDate('')
        setLocation('')
        setNotes('')
        setShowForm(false)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create plant')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/plants/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) setPlants((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // Silently fail
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Plants</h1>
          <p className="mt-1 text-ink-600 dark:text-ink-400">Track your plants, fields, and crop plots.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-10 w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 font-semibold text-white transition-all shadow-sm hover:bg-brand-600 hover:shadow"
        >
          <Plus className="h-4 w-4" />
          Add Plant
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <GlassCard className="mb-8 p-6 md:p-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold tracking-tight">New Plant / Field</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-1.5 block">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Field A - Plot 3"
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-1.5 block">Crop Type</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              >
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="maize">Maize</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="cotton">Cotton</option>
                <option value="potato">Potato</option>
                <option value="tomato">Tomato</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-1.5 block">Planted Date</label>
              <input
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-1.5 block">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="GPS coordinates or description"
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-1.5 block">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this plant/field"
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
            />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white transition-all shadow-sm",
                saving || !name.trim()
                  ? "bg-brand-500/50 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600 hover:shadow"
              )}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plant
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 font-semibold text-ink-900 transition-colors hover:bg-neutral-200 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-600/30"
            >
              Cancel
            </button>
          </div>
        </GlassCard>
      )}

      {/* Plants list */}
      <div>
        {busy && (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
            <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
            <span className="text-sm font-medium text-ink-600">Loading plants...</span>
          </div>
        )}

        {!busy && plants.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 px-6 py-12 text-center dark:border-ink-600/50 dark:bg-ink-900/30">
            <div className="rounded-full bg-brand-100 p-4 dark:bg-white/5">
              <Sprout className="h-10 w-10 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">No plants added yet</h3>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Click "Add Plant" to start tracking your crop conditions.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
            >
               <Plus className="h-4 w-4" /> Add Plant
            </button>
          </div>
        )}

        {!busy && plants.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant) => (
              <Link key={plant.id} to={`/plants/${plant.id}`} className="group block focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 rounded-xl">
                <GlassCard className="p-6 transition-all group-hover:shadow-md group-hover:border-neutral-400 dark:group-hover:border-ink-500 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/10 dark:text-brand-400">
                        <Sprout className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-ink-900 dark:text-ink-50 line-clamp-1">{plant.name}</div>
                        <div className="mt-0.5 text-xs font-medium text-ink-500 uppercase tracking-wider dark:text-ink-400">{plant.crop_type}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(plant.id) }}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-semantic-danger/10 hover:text-semantic-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-neutral-200/60 dark:border-ink-600/30 flex flex-col gap-2">
                     <div className="flex gap-4 text-xs font-medium text-ink-600 dark:text-ink-400">
                      {plant.planted_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-ink-400" />
                          {new Date(plant.planted_date).toLocaleDateString()}
                        </span>
                      )}
                      {plant.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ink-400" />
                          {plant.location.slice(0, 15)}{plant.location.length > 15 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
