-- ============================================================
-- AgriSmart — MASTER Spray Recipes (All 3 Models)
-- One file to run them all. Clears old data and inserts fresh.
--
-- Models covered:
--   agrismart/1  → Local MobileNetV2 (Tomato + Potato, 7 classes)
--   hf-rice/1    → HuggingFace Rice model (6 classes)
--   hf-insect/1  → HuggingFace EfficientNet-B0 (5 pest classes)
--
-- HOW TO USE:
--   Supabase Dashboard → SQL Editor → New Query → paste → Run ▶
-- ============================================================

-- Wipe ALL existing recipes for all 3 models cleanly
DELETE FROM public.spray_recipes
WHERE model_id IN ('agrismart/1', 'hf-rice/1', 'hf-insect/1');

-- ============================================================
-- MODEL 1: agrismart/1 — Local MobileNetV2 (Tomato + Potato)
-- ============================================================
INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES

-- POTATO
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

-- TOMATO
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
  'Destroy all infected plant material. Avoid overhead watering. Apply at first sign of infection.'
),
(
  'agrismart/1', 'Tomato___Healthy', false, 0.50, 'none',
  'Healthy',
  '-',
  'Crop appears healthy. Continue regular monitoring, balanced NPK fertilization, and adequate irrigation.'
),

-- ============================================================
-- MODEL 2: hf-rice/1 — HuggingFace Rice Disease Model
-- Labels exactly as returned by sanchaikb-fertilizer-model.hf.space
-- ============================================================

(
  'hf-rice/1', 'Bacterial Blight Disease', true, 0.60, 'pesticide',
  'Copper Oxychloride or Streptomycin Bactericide',
  '3g per litre of water, spray every 7–10 days',
  'Remove and destroy infected leaves. Avoid overhead irrigation. Do not reuse water from infected fields. Practice crop rotation.'
),
(
  'hf-rice/1', 'Blast Disease', true, 0.60, 'fungicide',
  'Tricyclazole (Beam) or Isoprothiolane Fungicide',
  '0.6g per litre of water, spray at booting and heading stage',
  'Apply preventively during humid weather. Ensure good field drainage. Avoid excessive nitrogen fertilization which promotes blast.'
),
(
  'hf-rice/1', 'Brown Spot Disease', true, 0.60, 'fungicide',
  'Mancozeb or Propiconazole Fungicide',
  '2g per litre of water, spray every 10–14 days',
  'Improve soil nutrition (potassium + silicon). Drain waterlogged fields. Brown spot is often linked to nutrient deficiency.'
),
(
  'hf-rice/1', 'False Smut Disease', true, 0.60, 'fungicide',
  'Propiconazole or Hexaconazole Fungicide',
  '1ml per litre of water, spray at panicle initiation',
  'Apply 2 sprays — at panicle initiation and at 50% heading. Infected grain should not be used as seed.'
),
(
  'hf-rice/1', 'Healthy Crop', false, 0.50, 'none',
  'Healthy',
  '-',
  'Rice crop appears healthy. Continue regular monitoring, balanced NPK + silicon fertilization, and proper water management.'
),
(
  'hf-rice/1', 'NeckBlast', true, 0.60, 'fungicide',
  'Tricyclazole (Beam) or Kasugamycin Fungicide',
  '0.6g per litre of water, spray at neck emergence',
  'Neck blast is the most destructive phase. Apply preventively at 5–10% heading. Avoid excessive nitrogen. Ensure balanced potassium.'
),

-- ============================================================
-- MODEL 3: hf-insect/1 — EfficientNet-B0 Insect Classifier
-- Labels exactly as returned by SanchaiKB-Insect-Classification-Model.hf.space
-- ============================================================

(
  'hf-insect/1', 'Rice stem borer', true, 0.60, 'pesticide',
  'Chlorpyrifos or Carbofuran Granules',
  '1.5ml Chlorpyrifos per litre of water; or 3kg Carbofuran granules per hectare',
  'Apply at tillering stage when dead hearts appear. Drain fields before application. Use pheromone traps for monitoring adult moths. Destroy stubble after harvest.'
),
(
  'hf-insect/1', 'green leafhopper', true, 0.60, 'pesticide',
  'Imidacloprid or Thiamethoxam Systemic Insecticide',
  '0.5ml Imidacloprid per litre of water, spray on leaf surfaces',
  'Green leafhoppers are vectors of Rice Tungro Virus — treat promptly. Apply in the early morning. Use light traps for mass trapping at night.'
),
(
  'hf-insect/1', 'planthopper', true, 0.60, 'pesticide',
  'Buprofezin (Applaud) or Pymetrozine (Chess)',
  '1ml per litre of water; apply at the base of plants',
  'Drain fields and spray at the base of tillers where planthoppers cluster. Avoid excessive nitrogen. Alternate insecticide classes to prevent resistance.'
),
(
  'hf-insect/1', 'rice bug', true, 0.60, 'pesticide',
  'Malathion or Lambda-cyhalothrin Insecticide',
  '2ml Malathion per litre of water; spray during early morning or evening',
  'Rice bugs damage grain at milky stage — act immediately. Spray in early morning when bugs are less active. Remove weedy borders.'
),
(
  'hf-insect/1', 'rice leaf roller', true, 0.60, 'pesticide',
  'Cartap Hydrochloride or Chlorantraniliprole Insecticide',
  '1g Cartap per litre of water; spray when leaf rolling appears',
  'Cut and destroy rolled leaves before spraying. Apply 2 sprays — at tillering and at panicle initiation.'
);

-- ================================================================
-- VERIFY: Should show exactly 18 rows across 3 models
-- ================================================================
SELECT
  model_id,
  COUNT(*) AS class_count,
  STRING_AGG(class_label, ', ' ORDER BY class_label) AS classes
FROM public.spray_recipes
WHERE model_id IN ('agrismart/1', 'hf-rice/1', 'hf-insect/1')
GROUP BY model_id
ORDER BY model_id;
