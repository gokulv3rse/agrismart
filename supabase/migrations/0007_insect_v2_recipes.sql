-- ============================================================
-- Spray Recipes — New EfficientNet Insect Model
-- Model: SanchaiKB-Insect-Classification-Model.hf.space
-- Classes (5): Rice stem borer, green leafhopper, planthopper,
--              rice bug, rice leaf roller
--
-- Run in Supabase SQL Editor → New Query → Run
-- ============================================================

-- Remove old insect recipes (from previous model)
DELETE FROM public.spray_recipes WHERE model_id = 'hf-insect/1';

-- Insert new recipes matching exact class labels from EfficientNet model
INSERT INTO public.spray_recipes
  (model_id, class_label, enabled, min_confidence, action_type, recommendation, dosage, notes)
VALUES

(
  'hf-insect/1', 'Rice stem borer', true, 0.60, 'pesticide',
  'Chlorpyrifos or Carbofuran Granules',
  '1.5ml Chlorpyrifos per litre of water; or 3kg Carbofuran granules per hectare',
  'Apply at tillering stage when dead hearts appear. Drain fields before application. Use pheromone traps for monitoring adult moths. Destroy stubble after harvest to reduce overwintering larvae.'
),
(
  'hf-insect/1', 'green leafhopper', true, 0.60, 'pesticide',
  'Imidacloprid or Thiamethoxam Systemic Insecticide',
  '0.5ml Imidacloprid per litre of water, spray on leaf surfaces',
  'Green leafhoppers are vectors of Rice Tungro Virus — treat promptly. Apply in the early morning. Avoid broad-spectrum sprays that kill beneficial insects. Use light traps for mass trapping at night.'
),
(
  'hf-insect/1', 'planthopper', true, 0.60, 'pesticide',
  'Buprofezin (Applaud) or Pymetrozine (Chess)',
  '1ml per litre of water; apply at the base of plants',
  'Drain fields and spray at the base of tillers where planthoppers cluster. Avoid excessive nitrogen fertilization. Alternate insecticide classes to prevent resistance. Introduce natural enemies (spiders, mirid bugs).'
),
(
  'hf-insect/1', 'rice bug', true, 0.60, 'pesticide',
  'Malathion or Lambda-cyhalothrin Insecticide',
  '2ml Malathion per litre of water; spray during early morning or evening',
  'Rice bugs damage grain at milky stage — act immediately. Drain field edges and spray in early morning when bugs are less active. Remove weedy borders which serve as alternative hosts. Use nets for field protection at heading stage.'
),
(
  'hf-insect/1', 'rice leaf roller', true, 0.60, 'pesticide',
  'Cartap Hydrochloride or Chlorantraniliprole Insecticide',
  '1g Cartap per litre of water; spray when leaf rolling appears',
  'Cut and destroy rolled leaves before spraying. Apply 2 sprays — at tillering and at panicle initiation. Balanced potassium fertilization strengthens leaf tissue against leaf roller damage.'
);

-- Verify
SELECT model_id, class_label, action_type, recommendation
FROM public.spray_recipes
WHERE model_id = 'hf-insect/1'
ORDER BY class_label;
