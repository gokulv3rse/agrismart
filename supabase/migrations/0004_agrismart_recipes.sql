-- ============================================================
-- Spray Recipes for AgriSmart Local Model (agrismart/1)
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- Optional: clear old agrismart/1 entries first
DELETE FROM public.spray_recipes WHERE model_id = 'agrismart/1';

INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES

-- ── POTATO ──────────────────────────────────────────────────────────────
(
  'agrismart/1', 'Potato___Early_blight', true, 0.65, 'fungicide',
  'Chlorothalonil or Mancozeb Fungicide',
  '2g per litre of water, spray every 7–10 days',
  'Remove and destroy infected leaves. Avoid overhead irrigation. Apply fungicide in the early morning.'
),
(
  'agrismart/1', 'Potato___Late_blight', true, 0.65, 'fungicide',
  'Metalaxyl-M + Mancozeb (Ridomil Gold)',
  '2.5g per litre of water, spray every 5–7 days',
  'Highly contagious disease. Destroy affected foliage. Apply preventive sprays during wet weather. Do not compost infected debris.'
),
(
  'agrismart/1', 'Potato___Healthy', false, 0.50, 'none',
  'Healthy',
  '-',
  'Crop appears healthy. Continue regular monitoring and balanced fertilization.'
),

-- ── TOMATO ──────────────────────────────────────────────────────────────
(
  'agrismart/1', 'Tomato___Bacterial_spot', true, 0.65, 'pesticide',
  'Copper-based Bactericide (Copper Oxychloride)',
  '3g per litre of water, spray every 7 days',
  'Avoid working with plants when wet. Remove infected fruit and leaves. Rotate crops next season.'
),
(
  'agrismart/1', 'Tomato___Early_blight', true, 0.65, 'fungicide',
  'Azoxystrobin or Chlorothalonil Fungicide',
  '2g per litre of water, spray every 7–10 days',
  'Remove lower infected leaves. Mulch around plants to prevent soil splash. Ensure good air circulation.'
),
(
  'agrismart/1', 'Tomato___Late_blight', true, 0.65, 'fungicide',
  'Cymoxanil + Mancozeb (Curzate)',
  '2.5g per litre of water, spray every 5–7 days',
  'Destroy all infected plant material. Avoid overhead watering. Apply at first sign of infection. Do not store infected tubers.'
),
(
  'agrismart/1', 'Tomato___Healthy', false, 0.50, 'none',
  'Healthy',
  '-',
  'Crop appears healthy. Continue regular monitoring, balanced NPK fertilization, and adequate irrigation.'
);

-- Verify insertion
SELECT model_id, class_label, action_type, recommendation
FROM public.spray_recipes
WHERE model_id = 'agrismart/1'
ORDER BY class_label;
