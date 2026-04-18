CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_id TEXT NOT NULL,
  image_bucket TEXT NOT NULL DEFAULT 'diagnosis-images',
  image_path TEXT NOT NULL,
  raw_inference JSONB NOT NULL,
  decision JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_created_at ON public.diagnoses(user_id, created_at DESC);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diagnoses_select_own" ON public.diagnoses;
CREATE POLICY "diagnoses_select_own"
  ON public.diagnoses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "diagnoses_insert_own" ON public.diagnoses;
CREATE POLICY "diagnoses_insert_own"
  ON public.diagnoses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "diagnoses_update_own" ON public.diagnoses;
CREATE POLICY "diagnoses_update_own"
  ON public.diagnoses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "diagnoses_delete_own" ON public.diagnoses;
CREATE POLICY "diagnoses_delete_own"
  ON public.diagnoses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT ALL PRIVILEGES ON TABLE public.diagnoses TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnosis-images', 'diagnosis-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "diagnosis_images_select_own" ON storage.objects;
CREATE POLICY "diagnosis_images_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'diagnosis-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "diagnosis_images_insert_own" ON storage.objects;
CREATE POLICY "diagnosis_images_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'diagnosis-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "diagnosis_images_update_own" ON storage.objects;
CREATE POLICY "diagnosis_images_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'diagnosis-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'diagnosis-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "diagnosis_images_delete_own" ON storage.objects;
CREATE POLICY "diagnosis_images_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'diagnosis-images' AND owner = auth.uid());
