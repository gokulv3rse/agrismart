/**
 * Spray schedule management routes.
 * Manages spray schedules created from diagnoses.
 */
import { Router, type Response } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { createSupabaseClient } from '../lib/supabaseAdmin.js'

const router = Router()

// Create a new spray schedule from a diagnosis
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { diagnosisId, plantId, productName, dosage, intervalDays, totalApplications } = req.body ?? {}

  if (!diagnosisId || !productName) {
    res.status(400).json({ success: false, error: 'diagnosisId and productName are required' })
    return
  }

  const supabase = createSupabaseClient(req.accessToken)

  const today = new Date().toISOString().split('T')[0]
  const nextSpray = new Date()
  nextSpray.setDate(nextSpray.getDate() + (intervalDays || 7))

  const { data, error } = await supabase
    .from('spray_schedules')
    .insert({
      diagnosis_id: diagnosisId,
      plant_id: plantId || null,
      user_id: req.userId,
      product_name: productName,
      dosage: dosage || 'Follow label instructions',
      interval_days: intervalDays || 7,
      total_applications: totalApplications || 3,
      completed_applications: 0,
      start_date: today,
      next_spray_date: today,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(201).json({ success: true, schedule: data })
})

// Get upcoming schedules for the authenticated user
router.get('/upcoming', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)

  const { data, error } = await supabase
    .from('spray_schedules')
    .select('*, plants(name, crop_type)')
    .eq('user_id', req.userId!)
    .eq('status', 'active')
    .order('next_spray_date', { ascending: true })
    .limit(20)

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, schedules: data })
})

// Get all schedules for the authenticated user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)

  const { data, error } = await supabase
    .from('spray_schedules')
    .select('*, plants(name, crop_type)')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, schedules: data })
})

// Mark a spray application as complete
router.patch('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)
  const { id } = req.params

  // Get current schedule
  const { data: schedule, error: fetchErr } = await supabase
    .from('spray_schedules')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.userId!)
    .single()

  if (fetchErr || !schedule) {
    res.status(404).json({ success: false, error: 'Schedule not found' })
    return
  }

  const completedApps = (schedule.completed_applications || 0) + 1
  const isComplete = completedApps >= (schedule.total_applications || 3)

  // Calculate next spray date
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + (schedule.interval_days || 7))

  const { data, error } = await supabase
    .from('spray_schedules')
    .update({
      completed_applications: completedApps,
      next_spray_date: isComplete ? schedule.next_spray_date : nextDate.toISOString().split('T')[0],
      status: isComplete ? 'completed' : 'active',
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, schedule: data })
})

export default router
