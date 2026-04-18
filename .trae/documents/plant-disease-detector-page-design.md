# Page Design Specification (Desktop-first)

## Global Styles
- Layout system: CSS Grid for page scaffolding + Flexbox for component alignment.
- Max width: 1120–1200px content container; centered with 24px side padding.
- Typography: base 16px; scale: 14/16/20/24/32; headings semibold.
- Colors (tokens):
  - Light background gradient: #f8faf6 → #f0f4e8 → #e8f2dc.
  - Light surface/card (glass): rgba(255, 255, 255, 0.85).
  - Light text: #2d3319; muted: #6b7160.
  - Light primary: #4a7c59; primary hover: #3f6a4c; accent: #d4e4d9.
  - Dark background gradient: #1a1f16 → #1e2318 → #22281c.
  - Dark surface/card (glass): rgba(36, 41, 31, 0.85).
  - Dark text: #e8ebe5; muted: #9ca398.
  - Dark primary: #7ba662; accent: #3d4735.
  - Semantic: danger #c44536 (dark: #d45949), warning #c9a959, info #5a8aa5, success #7ba662.
  - Neutral: #f4f1e8, #e8e6dd, #cbced4.
- Buttons: 40px height, 8px radius; primary/secondary/ghost variants; loading state with spinner.
- Inputs: 40px height; clear error text beneath; focus ring in primary color.
- Responsive behavior: desktop-first; collapse multi-column sections into single column at <= 768px.

---

## Page: Auth (/auth)
### Meta Information
- Title: Plant Disease Detector — Sign in
- Description: Sign in to upload plant photos and track diagnosis history.
- Open Graph: title + description + generic app image.

### Page Structure
- Centered authentication card on a minimal background.

### Sections & Components
1. Top brand header
   - App name + short tagline.
2. Auth card (max 420px)
   - Tabs or segmented control: “Sign in” / “Sign up”.
   - Email input, password input.
   - Primary submit button.
   - Inline error region (auth errors, validation).
3. Secondary links
   - “Sign out” (only when already authenticated) or redirect to Home.

Interaction states
- Disable submit until valid.
- Show loading state during auth.

---

## Page: Upload & Detect (Home) (/)
### Meta Information
- Title: Plant Disease Detector — Upload
- Description: Upload a plant photo, run detection, and save results.
- Open Graph: title + description.

### Page Structure
- Two-column layout on desktop:
  - Left: upload + actions
  - Right: live result preview panel

### Sections & Components
1. Top navigation bar
   - Left: logo/app name.
   - Right: links: History, Sign out.
2. Upload panel (left column)
   - Drag-and-drop zone + “Choose file” button.
   - File constraints hint (e.g., JPG/PNG).
   - Image preview thumbnail once selected.
   - Actions row:
     - Primary: “Run detection”.
     - Secondary: “Reset”.
3. Result panel (right column)
   - State: empty (instructions), loading, success, error.
   - Success content:
     - Final diagnosis label (large).
     - Confidence (progress bar or percentage).
     - Key predictions list (top N classes + confidence).
     - “View result details” link.
4. Save feedback
   - Toast/banner after saving: success with link to Result Detail.

---

## Page: History (/history)
### Meta Information
- Title: Plant Disease Detector — History
- Description: Browse your past plant diagnosis results.

### Page Structure
- Single-column page with toolbar + grid/list.

### Sections & Components
1. Page header
   - Title “History” + short helper text.
2. Toolbar
   - Sort dropdown (default “Newest”).
3. Result list
   - Desktop: card grid (3 columns) or table-like list.
   - Each item:
     - Image thumbnail
     - Final label
     - Date/time
     - “Open” action (click card)
4. Empty state
   - Illustration + CTA button: “Run your first detection”.

---

## Page: Result Detail (/results/:id)
### Meta Information
- Title: Plant Disease Detector — Result
- Description: View diagnosis details and model output.

### Page Structure
- Header + two-column detail layout.

### Sections & Components
1. Breadcrumb/header
   - Back link to History.
   - Title: “Diagnosis result”.
2. Left column: image and final decision
   - Large image preview.
   - Final label, confidence, timestamp.
   - Rule version (small text) for reproducibility.
3. Right column: model output
   - Card: “Top predictions” list with confidence bars.
   - Card: “Raw response” collapsed JSON viewer (read-only).

Interaction states
- Loading skeleton while fetching record.
- If record not found/unauthorized: show error with link back to History.
