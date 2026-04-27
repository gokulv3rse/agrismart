/**
 * Plant management routes.
 * CRUD operations for tracking plants/fields/plots.
 */
import { Router, type Response } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { createSupabaseClient } from '../lib/supabaseAdmin.js'

const router = Router()

// List all plants for the user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)

  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, plants: data })
})

// Get a single plant with its diagnoses
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)

  const { data: plant, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single()

  if (error || !plant) {
    res.status(404).json({ success: false, error: 'Plant not found' })
    return
  }

  // Get diagnoses for this plant
  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('plant_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get spray schedules for this plant
  const { data: schedules } = await supabase
    .from('spray_schedules')
    .select('*')
    .eq('plant_id', req.params.id)
    .order('created_at', { ascending: false })

  res.status(200).json({ success: true, plant, diagnoses: diagnoses ?? [], schedules: schedules ?? [] })
})

// Create a new plant
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, cropType, plantedDate, location, notes } = req.body ?? {}

  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' })
    return
  }

  const supabase = createSupabaseClient(req.accessToken)

  const { data, error } = await supabase
    .from('plants')
    .insert({
      user_id: req.userId,
      name,
      crop_type: cropType || 'rice',
      planted_date: plantedDate || null,
      location: location || null,
      notes: notes || '',
    })
    .select('*')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(201).json({ success: true, plant: data })
})

// Update a plant
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)
  const { name, cropType, plantedDate, location, notes } = req.body ?? {}

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (cropType !== undefined) updates.crop_type = cropType
  if (plantedDate !== undefined) updates.planted_date = plantedDate
  if (location !== undefined) updates.location = location
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('plants')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select('*')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, plant: data })
})

// Delete a plant
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const supabase = createSupabaseClient(req.accessToken)

  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true })
})

export default router
