import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { User, MapPin, Sun, Moon, Bell, Sprout, CheckCircle } from 'lucide-react'

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const { isDark, toggleTheme } = useTheme()

  // Location settings for weather
  const [lat, setLat] = useState(() => localStorage.getItem('weather_lat') || '28.6139')
  const [lon, setLon] = useState(() => localStorage.getItem('weather_lon') || '77.2090')
  const [defaultCrop, setDefaultCrop] = useState(() => localStorage.getItem('default_crop') || 'rice')
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false')
  const [saved, setSaved] = useState(false)

  const handleSaveLocation = () => {
    localStorage.setItem('weather_lat', lat)
    localStorage.setItem('weather_lon', lon)
    localStorage.setItem('default_crop', defaultCrop)
    localStorage.setItem('notifications', String(notifications))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDetectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude.toFixed(4)))
        setLon(String(pos.coords.longitude.toFixed(4)))
      },
      () => {
        // Use defaults
      },
      { timeout: 5000 }
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-ink-600 dark:text-ink-400">Manage your account preferences and app configuration.</p>
        </div>

        <div className="grid gap-6">
          {/* Profile */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Profile Information
            </h2>
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-100 px-5 py-4 dark:border-ink-600/30 dark:bg-ink-900/50">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Signed in as</span>
              <span className="mt-1 block font-medium text-ink-900 dark:text-ink-100">{user?.email ?? '—'}</span>
            </div>
          </GlassCard>

          {/* Theme */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              {isDark ? <Moon className="h-5 w-5 text-brand-600 dark:text-brand-400" /> : <Sun className="h-5 w-5 text-brand-600 dark:text-brand-400" />}
              Appearance
            </h2>
            <div className="mt-6">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-300 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-ink-600/50 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                <div className="text-left">
                  <div className="font-semibold text-ink-900 dark:text-ink-100">{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                  <div className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                    Click to switch to {isDark ? 'light' : 'dark'} mode
                  </div>
                </div>
                <div className="flex h-8 w-14 flex-shrink-0 items-center rounded-full bg-neutral-200 p-1 dark:bg-ink-800">
                  <div className={`h-6 w-6 rounded-full bg-brand-500 shadow-sm transition-transform duration-300 ease-in-out ${isDark ? 'translate-x-6 bg-brand-400' : ''}`} />
                </div>
              </button>
            </div>
          </GlassCard>

          {/* Location for weather */}
          <GlassCard className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
                <MapPin className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Location (Weather API)
              </h2>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Auto-detect location
              </button>
            </div>
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Latitude</label>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  type="number"
                  step="0.0001"
                  className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Longitude</label>
                <input
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  type="number"
                  step="0.0001"
                  className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
                />
              </div>
            </div>
          </GlassCard>

          {/* Default crop */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              <Sprout className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Default Crop Type
            </h2>
            <div className="mt-6">
              <select
                value={defaultCrop}
                onChange={(e) => setDefaultCrop(e.target.value)}
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
          </GlassCard>

          {/* Notifications */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
              <Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Notifications
            </h2>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-300 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-ink-600/50 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                <div className="text-left">
                  <div className="font-semibold text-ink-900 dark:text-ink-100">Spray schedule reminders</div>
                  <div className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                    Get notified when a spray application is due
                  </div>
                </div>
                <div className={`flex h-8 w-14 flex-shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-brand-500 border border-brand-600' : 'bg-neutral-200 border border-neutral-300 dark:bg-ink-800 dark:border-ink-700'}`}>
                  <div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${notifications ? 'translate-x-6' : ''}`} />
                </div>
              </button>
            </div>
          </GlassCard>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSaveLocation}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 font-semibold text-white transition-all shadow-sm hover:bg-brand-600 hover:shadow"
            >
              {saved && <CheckCircle className="h-5 w-5" />}
              {saved ? 'Saved Successfully' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
