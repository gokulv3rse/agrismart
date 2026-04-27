import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import type { Diagnosis } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, Loader2 } from 'lucide-react'

// Updated to new brand and semantic colors
const COLORS = ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#ef4444', '#94a3b8', '#475569', '#f87171']

export default function Analytics() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setBusy(true)
      const { data } = await supabase
        .from('diagnoses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setDiagnoses((data ?? []) as unknown as Diagnosis[])
      setBusy(false)
    }
    fetch()
  }, [])

  // Disease frequency
  const diseaseFrequency = useMemo(() => {
    const counts: Record<string, number> = {}
    diagnoses.forEach((d) => {
      const label = d.decision?.label.replace(/_/g, ' ') ?? 'Unknown'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [diagnoses])

  // Action type distribution
  const actionDistribution = useMemo(() => {
    const counts: Record<string, number> = { pesticide: 0, fertilizer: 0, none: 0 }
    diagnoses.forEach((d) => {
      const action = d.decision?.actionType ?? 'none'
      counts[action] = (counts[action] || 0) + 1
    })
    return [
      { name: 'Pesticide', value: counts.pesticide, color: '#ef4444' }, // semantic-danger
      { name: 'Fertilizer', value: counts.fertilizer, color: '#10b981' }, // brand-500
      { name: 'No Action', value: counts.none, color: '#94a3b8' }, // slate-400
    ].filter(d => d.value > 0)
  }, [diagnoses])

  // Confidence distribution
  const confidenceDistribution = useMemo(() => {
    const buckets = [
      { range: '0-20%', min: 0, max: 0.2, count: 0 },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
      { range: '80-100%', min: 0.8, max: 1.01, count: 0 },
    ]
    diagnoses.forEach((d) => {
      const conf = d.decision?.confidence ?? 0
      const bucket = buckets.find((b) => conf >= b.min && conf < b.max)
      if (bucket) bucket.count++
    })
    return buckets.map(({ range, count }) => ({ range, count }))
  }, [diagnoses])

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { month: string; total: number; spray: number; noSpray: number }> = {}
    diagnoses.forEach((d) => {
      const date = new Date(d.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { month: label, total: 0, spray: 0, noSpray: 0 }
      months[key].total++
      if (d.decision?.spray) months[key].spray++
      else months[key].noSpray++
    })
    return Object.values(months).slice(-12)
  }, [diagnoses])

  // Stats summary
  const stats = useMemo(() => {
    const total = diagnoses.length
    const sprayCount = diagnoses.filter(d => d.decision?.spray).length
    const avgConfidence = total > 0
      ? diagnoses.reduce((sum, d) => sum + (d.decision?.confidence ?? 0), 0) / total
      : 0
    const uniqueLabels = new Set(diagnoses.map(d => d.decision?.label)).size
    return { total, sprayCount, avgConfidence, uniqueLabels }
  }, [diagnoses])

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="mt-1 text-ink-600 dark:text-ink-400">Insights from your diagnosis and crop history.</p>
      </div>

      {busy ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <span className="text-sm font-medium text-ink-600">Loading analytics...</span>
        </div>
      ) : diagnoses.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 px-6 py-12 text-center dark:border-ink-600/50 dark:bg-ink-900/30">
          <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-500/10">
            <BarChart3 className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">No diagnosis data yet</h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Run some predictions to see analytics automatically generate here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-500/10">
                  <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Total Diagnoses</span>
              </div>
              <div className="text-3xl font-bold text-ink-900 dark:text-ink-50">{stats.total}</div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-semantic-danger/10 p-2 dark:bg-semantic-danger/20">
                  <span className="text-semantic-danger dark:text-semantic-dangerDark">🧪</span>
                </div>
                <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Spray Actions</span>
              </div>
              <div className="text-3xl font-bold text-ink-900 dark:text-ink-50">{stats.sprayCount}</div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-semantic-info/10 p-2 dark:bg-semantic-info/20">
                  <TrendingUp className="h-5 w-5 text-semantic-info" />
                </div>
                <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Avg Confidence</span>
              </div>
              <div className="text-3xl font-bold text-ink-900 dark:text-ink-50">{Math.round(stats.avgConfidence * 100)}%</div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-semantic-warning/10 p-2 dark:bg-semantic-warning/20">
                  <PieChartIcon className="h-5 w-5 text-semantic-warning" />
                </div>
                <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Unique Classes</span>
              </div>
              <div className="text-3xl font-bold text-ink-900 dark:text-ink-50">{stats.uniqueLabels}</div>
            </GlassCard>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Disease frequency */}
            <GlassCard className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">Condition Frequency</h2>
              <p className="mt-1 text-xs text-ink-500 mb-6 font-medium uppercase tracking-wider">Most Commonly Detected</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseFrequency} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 500 }}
                      cursor={{fill: 'rgba(150,150,150,0.05)'}}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Action type pie */}
            <GlassCard className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">Action Distribution</h2>
              <p className="mt-1 text-xs text-ink-500 mb-6 font-medium uppercase tracking-wider">Recommended Treatments</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={65}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      stroke="none"
                    >
                      {actionDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Confidence histogram */}
            <GlassCard className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">Confidence Distribution</h2>
              <p className="mt-1 text-xs text-ink-500 mb-6 font-medium uppercase tracking-wider">Model Accuracy Trend</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceDistribution} margin={{ left: -20, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 500 }}
                      cursor={{fill: 'rgba(150,150,150,0.05)'}}  
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                      {confidenceDistribution.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Monthly trends */}
            <GlassCard className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">Monthly Trends</h2>
              <p className="mt-1 text-xs text-ink-500 mb-6 font-medium uppercase tracking-wider">Diagnoses Over Time</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ left: -20, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 500 }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} name="Total" />
                    <Line type="monotone" dataKey="spray" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} name="Spray Action" />
                    <Line type="monotone" dataKey="noSpray" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} name="Healthy / No Spray" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </AppShell>
  )
}
