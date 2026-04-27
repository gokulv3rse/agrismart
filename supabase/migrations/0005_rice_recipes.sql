-- ============================================================
-- Spray Recipes for AgriSmart — Rice Classes (agrismart/1)
-- Run AFTER the main 0004_agrismart_recipes.sql
-- ============================================================

INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES

-- ── RICE ──────────────────────────────────────────────────────────────────
(
  'agrismart/1', 'Rice___Bacterial_Blight', true, 0.65, 'pesticide',
  'Copper Oxychloride or Streptomycin Bactericide',
  '3g per litre of water, spray every 7–10 days',
  'Remove and destroy infected leaves. Avoid overhead irrigation. Do not reuse water from infected fields. Practice crop rotation.'
),
(
  'agrismart/1', 'Rice___Blast_Disease', true, 0.65, 'fungicide',
  'Tricyclazole or Isoprothiolane Fungicide',
  '0.6g per litre of water, spray at booting and heading stage',
  'Apply preventively during humid weather. Ensure good field drainage. Avoid excessive nitrogen fertilization which promotes blast.'
),
(
  'agrismart/1', 'Rice___Brown_Spot', true, 0.65, 'fungicide',
  'Mancozeb or Propiconazole Fungicide',
  '2g per litre of water, spray every 10–14 days',
  'Improve soil nutrition, especially potassium and silicon. Drain waterlogged fields. Brown spot is often linked to nutrient deficiency.'
),
(
  'agrismart/1', 'Rice___False_Smut', true, 0.65, 'fungicide',
  'Propiconazole or Hexaconazole Fungicide',
  '1ml per litre of water, spray at panicle initiation',
  'Apply 2 sprays — at panicle initiation and at 50% heading. Infected grain should not be used as seed. Remove smut balls before harvesting.'
),
(
  'agrismart/1', 'Rice___Healthy', false, 0.50, 'none',
  'Healthy',
  '-',
  'Crop appears healthy. Continue regular monitoring, balanced NPK + silicon fertilization, and proper water management.'
),
(
  'agrismart/1', 'Rice___Neck_Blast', true, 0.65, 'fungicide',
  'Tricyclazole (Beam) or Kasugamycin Fungicide',
  '0.6g per litre of water, spray at neck emergence',
  'Neck blast is the most destructive phase. Apply preventively at 5–10% heading. Avoid excessive nitrogen. Ensure balanced potassium fertilization.'
);

-- Verify all 13 classes are now configured
SELECT model_id, class_label, action_type, enabled
FROM public.spray_recipes
WHERE model_id = 'agrismart/1'
ORDER BY class_label;
