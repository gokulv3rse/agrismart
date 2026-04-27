-- ============================================================
-- Spray Recipes for HuggingFace Models
-- hf-rice/1   → sanchaikb-fertilizer-model.hf.space
-- hf-insect/1 → sanchaikb-crop-insect-classifier.hf.space
-- 
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- ── RICE DISEASE MODEL (hf-rice/1) ──────────────────────────────────────────
-- Class labels exactly as returned by the HF model
DELETE FROM public.spray_recipes WHERE model_id = 'hf-rice/1';

INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES
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
  'Apply 2 sprays — at panicle initiation and at 50% heading. Infected grain should not be used as seed. Remove smut balls before harvest.'
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
);

-- ── INSECT/PEST MODEL (hf-insect/1) ─────────────────────────────────────────
-- The insect model returns a single prediction label (pest name)
-- Labels are dynamic (e.g. "planthopper", "grasshopper") — we add common ones
DELETE FROM public.spray_recipes WHERE model_id = 'hf-insect/1';

INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES
(
  'hf-insect/1', 'planthopper', true, 0.60, 'pesticide',
  'Imidacloprid or Buprofezin Insecticide',
  '1ml per litre of water, apply at base of plant',
  'Drain fields for 3–5 days to disrupt nymph cycle. Avoid excessive nitrogen. Use light traps. Remove alternate host weeds.'
),
(
  'hf-insect/1', 'grasshopper', true, 0.60, 'pesticide',
  'Chlorpyrifos or Malathion Insecticide',
  '2ml per litre of water, spray in early morning',
  'Apply when nymphs are small and before adult stage. Avoid spraying near flowering. Use biological control (Nosema) where possible.'
),
(
  'hf-insect/1', 'aphid', true, 0.60, 'pesticide',
  'Dimethoate or Thiamethoxam Insecticide',
  '1.5ml per litre of water, spray on underside of leaves',
  'Inspect undersides of leaves. Introduce natural predators (ladybirds). Avoid excessive nitrogen which promotes aphid populations.'
),
(
  'hf-insect/1', 'whitefly', true, 0.60, 'pesticide',
  'Spiromesifen or Neem Oil Spray',
  '3ml neem oil per litre of water, spray every 7 days',
  'Use yellow sticky traps for monitoring. Spray on leaf undersides. Remove heavily infested leaves. Avoid planting near tomatoes in summer.'
),
(
  'hf-insect/1', 'caterpillar', true, 0.60, 'pesticide',
  'Bt (Bacillus thuringiensis) or Spinosad Biopesticide',
  '1g Bt per litre of water, spray at first sign of infestation',
  'Apply in the evening when caterpillars feed. Safe for beneficial insects. Check for egg masses and hand-pick if accessible.'
),
(
  'hf-insect/1', 'leaf miner', true, 0.60, 'pesticide',
  'Abamectin or Cyromazine Insecticide',
  '0.5ml per litre of water, spray when tunnels first appear',
  'Remove and destroy heavily mined leaves. Use blue/yellow sticky traps. Avoid broad-spectrum insecticides that kill natural parasitoids.'
);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT model_id, class_label, action_type, recommendation
FROM public.spray_recipes
WHERE model_id IN ('hf-rice/1', 'hf-insect/1')
ORDER BY model_id, class_label;
