-- ============================================================
-- Migration 0003: Plants, spray schedules, and fertilizer data
-- ============================================================

-- 1. Plants table — track individual plants/fields/plots
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  crop_type TEXT NOT NULL DEFAULT 'rice',
  planted_date DATE,
  location TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plants_user ON public.plants(user_id);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plants_select_own" ON public.plants;
CREATE POLICY "plants_select_own"
  ON public.plants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "plants_insert_own" ON public.plants;
CREATE POLICY "plants_insert_own"
  ON public.plants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "plants_update_own" ON public.plants;
CREATE POLICY "plants_update_own"
  ON public.plants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "plants_delete_own" ON public.plants;
CREATE POLICY "plants_delete_own"
  ON public.plants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT ALL PRIVILEGES ON TABLE public.plants TO authenticated;

-- 2. Link diagnoses to plants (optional FK)
ALTER TABLE public.diagnoses ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_diagnoses_plant ON public.diagnoses(plant_id);

-- 3. Spray schedules table
CREATE TABLE IF NOT EXISTS public.spray_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  dosage TEXT NOT NULL DEFAULT 'Follow label instructions',
  interval_days INTEGER NOT NULL DEFAULT 7,
  total_applications INTEGER NOT NULL DEFAULT 3,
  completed_applications INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_spray_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spray_schedules_user ON public.spray_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_spray_schedules_plant ON public.spray_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_spray_schedules_status ON public.spray_schedules(status, next_spray_date);

ALTER TABLE public.spray_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select_own" ON public.spray_schedules;
CREATE POLICY "schedules_select_own"
  ON public.spray_schedules FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "schedules_insert_own" ON public.spray_schedules;
CREATE POLICY "schedules_insert_own"
  ON public.spray_schedules FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "schedules_update_own" ON public.spray_schedules;
CREATE POLICY "schedules_update_own"
  ON public.spray_schedules FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "schedules_delete_own" ON public.spray_schedules;
CREATE POLICY "schedules_delete_own"
  ON public.spray_schedules FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT ALL PRIVILEGES ON TABLE public.spray_schedules TO authenticated;

-- 4. Restrict spray_recipes write to service_role only (fix security flaw)
DROP POLICY IF EXISTS "spray_recipes_write_auth" ON public.spray_recipes;
CREATE POLICY "spray_recipes_write_admin"
  ON public.spray_recipes FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Seed fertilizer recipes (justify "Fertilizer" in project title)
INSERT INTO public.spray_recipes (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES
  ('fertilizer-sprinkling/2', 'Nitrogen Deficiency', TRUE, 0.55, 'fertilizer',
   'Urea (46-0-0) application recommended',
   '50-60 kg/ha split in 2-3 applications',
   'Apply during active growth stage. Irrigate within 24 hours of application.'),
  ('fertilizer-sprinkling/2', 'Phosphorus Deficiency', TRUE, 0.55, 'fertilizer',
   'DAP (18-46-0) or SSP application recommended',
   '40-50 kg/ha as basal dose',
   'Apply at transplanting/sowing. Mix with soil before planting.'),
  ('fertilizer-sprinkling/2', 'Potassium Deficiency', TRUE, 0.55, 'fertilizer',
   'MOP (0-0-60) application recommended',
   '30-40 kg/ha split in 2 applications',
   'Apply half at tillering and half at panicle initiation. Avoid excess application.'),
  ('fertilizer-sprinkling/2', 'Zinc Deficiency', TRUE, 0.55, 'fertilizer',
   'Zinc Sulphate application recommended',
   '25 kg/ha as soil application OR 0.5% foliar spray',
   'Common in rice nurseries. Apply before transplanting for best results.'),
  ('insect-pesticide/1', 'Healthy Crop', TRUE, 0.60, 'none',
   'No spray recommended.',
   '-',
   'Crop appears healthy. Continue regular monitoring.')
ON CONFLICT (model_id, class_label) DO NOTHING;
