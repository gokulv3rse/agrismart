CREATE TABLE IF NOT EXISTS public.spray_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  class_label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  min_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.60,
  action_type TEXT NOT NULL DEFAULT 'none',
  recommendation TEXT NOT NULL DEFAULT '',
  dosage TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model_id, class_label)
);

ALTER TABLE public.spray_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spray_recipes_select_auth" ON public.spray_recipes;
CREATE POLICY "spray_recipes_select_auth"
  ON public.spray_recipes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "spray_recipes_write_auth" ON public.spray_recipes;
CREATE POLICY "spray_recipes_write_auth"
  ON public.spray_recipes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL PRIVILEGES ON TABLE public.spray_recipes TO authenticated;

INSERT INTO public.spray_recipes (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES
  ('insect-pesticide/1', 'green leafhopper', TRUE, 0.60, 'pesticide', 'Pesticide spray recommended (configure exact product).', 'Follow label instructions.', 'Wear protective gear; avoid spraying in high wind.'),
  ('insect-pesticide/1', 'planthopper', TRUE, 0.60, 'pesticide', 'Pesticide spray recommended (configure exact product).', 'Follow label instructions.', 'Wear protective gear; avoid spraying in high wind.'),
  ('insect-pesticide/1', 'rice bug', TRUE, 0.60, 'pesticide', 'Pesticide spray recommended (configure exact product).', 'Follow label instructions.', 'Wear protective gear; avoid spraying in high wind.'),
  ('insect-pesticide/1', 'rice leaf roller', TRUE, 0.60, 'pesticide', 'Pesticide spray recommended (configure exact product).', 'Follow label instructions.', 'Wear protective gear; avoid spraying in high wind.'),
  ('insect-pesticide/1', 'Rice stem borer', TRUE, 0.60, 'pesticide', 'Pesticide spray recommended (configure exact product).', 'Follow label instructions.', 'Wear protective gear; avoid spraying in high wind.'),

  ('fertilizer-sprinkling/2', 'Bacterial Blight Disease', TRUE, 0.60, 'pesticide', 'Treatment spray recommended (configure exact product).', 'Follow label instructions.', 'Consider local agronomy guidance.'),
  ('fertilizer-sprinkling/2', 'Blast Disease', TRUE, 0.60, 'pesticide', 'Treatment spray recommended (configure exact product).', 'Follow label instructions.', 'Consider local agronomy guidance.'),
  ('fertilizer-sprinkling/2', 'Brown Spot Disease', TRUE, 0.60, 'pesticide', 'Treatment spray recommended (configure exact product).', 'Follow label instructions.', 'Consider local agronomy guidance.'),
  ('fertilizer-sprinkling/2', 'False Smut Disease', TRUE, 0.60, 'pesticide', 'Treatment spray recommended (configure exact product).', 'Follow label instructions.', 'Consider local agronomy guidance.'),
  ('fertilizer-sprinkling/2', 'Healthy Crop', TRUE, 0.60, 'none', 'No spray recommended.', '-', 'Crop appears healthy.'),
  ('fertilizer-sprinkling/2', 'NeckBlast', TRUE, 0.60, 'pesticide', 'Treatment spray recommended (configure exact product).', 'Follow label instructions.', 'Consider local agronomy guidance.'),
  ('fertilizer-sprinkling/2', 'Unlabeled', FALSE, 0.60, 'none', 'No spray recommended.', '-', 'Model returned an unlabeled class. Retake photo or retrain model.')
ON CONFLICT (model_id, class_label) DO NOTHING;
