# AgriSmart — MS Planner Sprint Reference
> Copy-paste ready content for all 3 sprints.
> Plan name: **Automatic Fertilizer & Pesticide Sprinkling System**

---

## 🗂️ Bucket Setup

| Bucket Name | Purpose |
|---|---|
| Product Backlog | All uncommitted stories |
| Sprint 1 — In Progress | Active Sprint 1 tasks |
| Sprint 2 — In Progress | Active Sprint 2 tasks |
| Sprint 3 — In Progress | Active Sprint 3 tasks |
| Awaiting Review | Tasks pending demo/review |
| Completed Items | Done and accepted tasks |

---

## 📦 Sprint 1 — Foundation & Core AI
**Duration:** Week 1–2
**Bucket:** `Sprint 1 — In Progress`
**Labels on every card:** `Functional Requirement` · `must have` · `User Stories` · `Epic 1` · `Sprint 1`
**Velocity:** Committed: 4 | Completed: 4 | 100% completion rate

---

### #US01 — Image Upload & AI Prediction
**Title:**
> As a farmer, I want to upload a plant image through the web app so that I can check if my crop is healthy or diseased.

**Checklist (4 items):**
- [ ] Upload button visible on Home page
- [ ] Image preview displayed after selection
- [ ] File size validation (<5MB enforced)
- [ ] Image stored in Supabase Storage bucket

---

### #US02 — Spray Recommendation Display
**Title:**
> As a farmer, I want to see the spray recommendation clearly on my screen so that I know exactly what fertilizer or pesticide to apply.

**Checklist (4 items):**
- [ ] Chemical product name displayed
- [ ] Dosage (ml/g per litre) displayed
- [ ] Treatment type shown (pesticide / fungicide)
- [ ] Special notes section visible

---

### #US03 — Low Confidence Warning
**Title:**
> As a farmer, I want a warning message when the AI is not confident so that I know when to retake the photo.

**Checklist (4 items):**
- [ ] Warning shown when confidence < 60%
- [ ] Message reads "Retake a clearer image or try different lighting"
- [ ] "Review" amber badge shown instead of "Healthy" or "Action Required"
- [ ] Low-confidence result NOT saved as a firm diagnosis

---

### #US04 — Mobile Responsiveness
**Title:**
> As a farmer, I want the app to work on my mobile phone so that I can use it directly in the field without needing a computer.

**Checklist (4 items):**
- [ ] App is fully usable on 375px screen width
- [ ] Image upload works on mobile browser
- [ ] Result text is readable without zooming
- [ ] Buttons are large enough to tap with a finger

---

## 📦 Sprint 2 — Platform & IoT Integration
**Duration:** Week 3–4
**Bucket:** `Sprint 2 — In Progress`
**Labels on every card:** `Functional Requirement` · `should have` · `User Stories` · `Epic 2` · `Sprint 2`
**Velocity:** Committed: 6 | Completed: 6 | 100% completion rate

---

### #US05 — Spray History Tracking
**Title:**
> As a farmer, I want to see my past spray history so that I can track which fields I have treated and when.

**Checklist (4 items):**
- [ ] History page lists past diagnoses in reverse-chronological order
- [ ] Each entry shows crop, disease, date, and recommendation
- [ ] Entries are linked to correct plant if assigned
- [ ] Data is user-scoped (RLS enforced)

---

### #US06 — Farm Manager Dashboard
**Title:**
> As a farm manager, I want to view all farmers' spray records so that I can oversee which fields have been treated across the farm.

**Checklist (4 items):**
- [ ] Farm manager login gives access to all users' records
- [ ] Records filterable by farmer name or field zone
- [ ] Total spray events shown as summary count
- [ ] CSV export available for reporting

---

### #US07 — Invalid File Error Handling
**Title:**
> As a farmer, I want to receive an error message when I upload an invalid file so that I know to try again with the correct image.

**Checklist (3 items):**
- [ ] Wrong file format (PDF, HEIC) shows error toast
- [ ] File >5MB shows "File too large" message
- [ ] Error message explains the problem clearly

---

### #US08 — Re-upload / Retake Image
**Title:**
> As a farmer, I want to retake or reupload the image if I am not satisfied with the result so that I can get a more accurate recommendation.

**Checklist (4 items):**
- [ ] "Clear" button resets image and result panel
- [ ] Re-upload triggers a fresh analysis
- [ ] Previous result is cleared from view
- [ ] New diagnosis is saved as a separate record

---

### #US09 — Weather-Based Spray Advisory
**Title:**
> As a farmer, I want to see real-time weather conditions before spraying so that I avoid spraying during rain or wind.

**Checklist (4 items):**
- [ ] Weather widget shows current temperature and humidity
- [ ] "Not ideal for spraying" advisory shown when rain probability >40%
- [ ] Wind speed displayed
- [ ] Data sourced from OpenWeatherMap API

---

### #US10 — Spray Schedule Creation
**Title:**
> As a farmer, I want to schedule a spray task after my diagnosis so that I don't forget to treat my crop on time.

**Checklist (4 items):**
- [ ] "Create Spray Schedule" button visible after Action Required diagnosis
- [ ] Schedule stores product name, dosage, interval_days, total_applications
- [ ] User can mark each application as Done
- [ ] Status changes to "Completed" after all applications finished

---

## 📦 Sprint 3 — Multi-Model & Finalization
**Duration:** Week 5–6
**Bucket:** `Sprint 3 — In Progress`
**Labels on every card:** `Functional Requirement` · `must have` · `User Stories` · `Epic 3` · `Sprint 3`
**Velocity:** Committed: 4 | Completed: 4 | 100% completion rate

---

### #US11 — Multi-Model Selector (Tomato / Rice / Pest)
**Title:**
> As a farmer, I want to select between Tomato/Potato, Rice Disease, or Pest Detection so that I get the right AI diagnosis for my specific crop type.

**Checklist (4 items):**
- [ ] 3 model tabs visible on Home page (🍅 Tomato & Potato, 🌾 Rice Diseases, 🦗 Pest Detection)
- [ ] Correct model endpoint called based on selection
- [ ] Helper text below each tab explains what it detects
- [ ] Selected model saved in diagnosis record

---

### #US12 — Rice Disease Classification (HuggingFace)
**Title:**
> As a farmer, I want the app to identify if my plant has Blast Disease, Brown Spot, NeckBlast, or other rice diseases so that I get the right chemical recommendation for that specific disease.

**Checklist (4 items):**
- [ ] All 6 rice classes return correct spray recipe
- [ ] HuggingFace Space endpoint connected and healthy
- [ ] NeckBlast shows "Action Required" with Tricyclazole recommendation
- [ ] All 6 labels mapped in spray_recipes table

---

### #US13 — Pest / Insect Classification (EfficientNet-B0)
**Title:**
> As a farmer, I want to identify crop pests such as Rice Stem Borer, Leafhopper, and Planthopper so that I can apply the correct insecticide at the right time.

**Checklist (4 items):**
- [ ] All 5 pest classes return correct spray recipe
- [ ] EfficientNet-B0 HuggingFace Space connected and healthy
- [ ] all_scores dictionary parsed correctly from API response
- [ ] Confidence bar shows per-class scores

---

### #US14 — PDF Diagnosis Report Download
**Title:**
> As a farmer, I want to download a PDF report of my diagnosis so that I can print it and share it with my agronomist or extension officer.

**Checklist (4 items):**
- [ ] "Download PDF" button visible on Full Report page
- [ ] PDF includes crop image, disease name, confidence score
- [ ] PDF includes chemical name, dosage, and special notes
- [ ] Filename includes date (e.g., agrismart_report_2026-04-27.pdf)

---

## 📊 Velocity Summary

| Sprint | Theme | Committed | Completed | Rate |
|---|---|---|---|---|
| Sprint 1 | Foundation & Core AI | 4 | 4 | 100% |
| Sprint 2 | Platform & IoT Integration | 6 | 6 | 100% |
| Sprint 3 | Multi-Model & Finalization | 4 | 4 | 100% |
| **Total** | | **14** | **14** | **100%** |

---

## 🏷️ Label Colour Reference (for MS Planner)

| Label | Colour |
|---|---|
| Functional Requirement | Pink |
| must have | Dark Pink / Red |
| should have | Gray |
| could have | Orange |
| User Stories | Teal / Cyan |
| Epic 1 | Light Blue |
| Epic 2 | Light Blue |
| Epic 3 | Light Blue |
| Sprint 1 | Dark (Black) |
| Sprint 2 | Teal |
| Sprint 3 | Purple |
