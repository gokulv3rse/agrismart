# Automatic Pesticide and Fertilizer Sprinkling System (Web)

Full-stack demo app:
- React UI with Supabase Auth
- Image upload to Supabase Storage
- Roboflow inference via backend proxy (keeps Roboflow API key server-side)
- Stores diagnosis records in Supabase Postgres
- History + result detail views

## 1) Supabase setup

### 1.1 Create schema + policies
In your Supabase project:
- Go to SQL Editor
- Run the SQL in `supabase/migrations/0001_init.sql`

This creates:
- Table `public.diagnoses` with RLS (users can only read/write their own rows)
- Storage bucket `diagnosis-images` (private)
- Storage RLS policies (users can only access their own uploaded files)

It also creates:
- Table `public.spray_recipes` (editable mapping from model class → recommendation)

### 1.2 Auth
Enable Email Auth (default).

Email confirmation ON (recommended):
- Supabase → Authentication → Providers → Email → keep confirmations enabled
- Configure SMTP to avoid the default email provider throttling:
  - Supabase → Authentication → Settings → SMTP

If you see "email rate limit exceeded" during testing:
- Wait a bit and try again, or configure SMTP immediately.
- You can also confirm a test user manually:
  - Supabase → Authentication → Users → select user → confirm

The app includes a "Resend confirmation email" button on the sign-in page.

## 2) Environment variables

Copy `.env.example` to `.env` and fill values:
```bash
cp .env.example .env
```

Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ROBOFLOW_API_KEY`

Security note: do not commit `.env`. If your Roboflow key was ever shared publicly, rotate it.

## 3) Run locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:3001`

## 4) App flow
1. Sign in / sign up
2. Upload plant image
3. App uploads to Supabase Storage
4. App creates a signed URL and sends it to backend `/api/roboflow/infer`
5. Backend calls Roboflow for `insect-pesticide/1` or `fertilizer-sprinkling/2`
6. Frontend maps the top class to a spray recipe in `spray_recipes` and builds the decision
7. Frontend stores record in `diagnoses` and shows result + history
