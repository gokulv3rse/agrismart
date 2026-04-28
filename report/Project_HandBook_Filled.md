# PROJECT HAND BOOK — FILLED CONTENT
## AgriSmart: Intelligent Fertilizer and Pesticide Sprinkling System
### 21CSP302L — Minor Project | SRM IST Kattankulathur | 2025–2026 (Even) | Semester 6

---

## Title of the Project:
**Intelligent Fertilizer and Pesticide Sprinkling System (AgriSmart)**

---

## Project Site / Location:
**Name and Address of the Company / Organisation:**
SRM Institute of Science and Technology,
Kattankulathur, Chengalpattu District – 603 203,
Tamil Nadu, India.

---

## Supervision Team

### Supervisor:
| Field | Details |
|---|---|
| **Name** | Dr. K. Suresh |
| **Designation** | Assistant Professor |
| **Department** | Computational Intelligence |
| **Campus** | Kattankulathur |
| **Telephone** | (to be filled by student) |
| **E-mail** | (to be filled by student) |

### Co-Supervisor:
| Field | Details |
|---|---|
| **Name** | — (Not Applicable) |
| **Designation** | — |
| **Department** | — |
| **Campus** | — |
| **Telephone** | — |
| **E-mail** | — |

### External Supervisor (if applicable):
Not Applicable.

---

## Student Details

### Student 1:
| Field | Details |
|---|---|
| **Name of Student** | Sanchai K B |
| **Register Number** | RA2311026010342 |
| **Department** | Computational Intelligence (CINTEL) |
| **Mobile Number** | (to be filled by student) |
| **Email ID** | (to be filled by student) |

### Student 2:
| Field | Details |
|---|---|
| **Name of Student** | Gokul Uday |
| **Register Number** | RA2311026010402 |
| **Department** | Computational Intelligence (CINTEL) |
| **Mobile Number** | (to be filled by student) |
| **Email ID** | gu1982@srmist.edu.in |

---

## Programme Information

| Field | Details |
|---|---|
| **Degree / Program** | B.Tech |
| **Specialisation** | Computer Science & Engineering (AI & ML) |
| **Project Batch ID** | (to be filled by student — from SRM portal) |
| **Academic Year** | 2025–2026 (Even) |
| **Semester** | 6 |
| **Course Code** | 21CSP302L |
| **Course Title** | Minor Project |

---

## Mission Statement

AgriSmart is designed with a clear mission: **to democratize precision agriculture for smallholder farmers in developing economies by turning a smartphone camera into an expert agronomist.**

The system's mission is to:
1. Eliminate the dependence on subjective visual inspection for crop disease and pest identification.
2. Provide instant, AI-driven, chemical-specific spray recommendations accessible on any mobile device.
3. Reduce unnecessary pesticide and fertilizer over-application through confident, threshold-based recommendations.
4. Track crop health over time through an integrated diagnosis history and spray scheduling platform.
5. Empower farm managers with analytics dashboards to monitor field-level treatment patterns across their operations.

The platform aims to reduce annual crop losses — currently 20–30% globally due to unchecked disease and pest infestations — by bringing deep learning-based diagnostics directly to field-level decision making.

---

## Problem (or) Product Description

### Problem Statement:
Agriculture is the backbone of food security in developing nations, yet farmers routinely suffer 20–30% annual crop losses due to plant disease and pest infestations. In India, where rice cultivation dominates rural livelihoods, the consequences of misidentified or untreated disease are economically and socially severe.

Current approaches rely on:
- **Manual visual inspection** — subjective, slow, and requiring domain expertise that smallholder farmers lack.
- **Prophylactic spraying** — farmers apply pesticides indiscriminately, causing chemical runoff, soil degradation, and financial waste.
- **No digital tracking** — there is no mechanism to record past treatments, monitor crop health trends, or schedule future applications.

### Product Description:
**AgriSmart** is a full-stack web application that integrates three AI models to automate crop disease and pest identification, and convert diagnoses into precise chemical treatment recommendations.

**Core Platform Components:**
- **New Diagnosis Interface:** Farmers select a crop model (Rice Diseases or Pest Detection), upload a leaf/plant image, and receive an instant AI prediction with disease name, confidence score, and a complete actionable spray recommendation.
- **AI Model Layer:** Three independent deep learning models — a locally hosted MobileNetV2 Flask inference server and two HuggingFace-hosted EfficientNet-B0 models — cover Rice diseases (6 classes), crop pests (5 classes), and Tomato/Potato diseases.
- **Decision Engine:** A server-side rule engine maps AI predictions to spray recipes in the database, implementing 4-state decisions: Healthy (no action), Action Required (full spray recommendation), Review (low confidence), and No Recipe (class not yet configured).
- **Spray Schedule Manager:** After diagnosis, farmers create multi-application spray schedules that track products, dosages, interval days, and completion status.
- **Analytics Dashboard:** Visualises disease frequency, monthly trends, and action distribution across all diagnoses.
- **IoT Sprinkler Simulation:** Simulates sprinkler activation on detection, with capacity for future MQTT/Raspberry Pi integration.
- **Admin Decision Rules Panel:** Administrators can update chemical recommendations, dosages, and confidence thresholds per disease class without database access.

**Technology Stack:**
- Frontend: React 18 + TypeScript + Vite
- API: Node.js 20 + Express + JWT authentication
- ML: PyTorch MobileNetV2 (local) + HuggingFace EfficientNet-B0 (cloud)
- Database: Supabase (PostgreSQL + Auth + Storage + RLS)
- Weather: OpenWeatherMap API

---

## Assumptions and Constraints

### Assumptions:
1. Farmers have access to a smartphone or tablet with a camera and internet connectivity.
2. Uploaded images are of sufficient resolution (minimum 480×480 pixels) for meaningful classification.
3. The local Flask inference server (`ml/serve.py`) is running on the deployment host when the MobileNetV2 model is used.
4. HuggingFace Spaces hosting the Rice Disease and Insect models are accessible — potential 30–60 second cold starts on the free tier are expected.
5. Supabase provides high-availability PostgreSQL and Storage without on-premises database management.
6. Farmers use the system primarily during daylight hours when clear field images can be captured.
7. The spray recipe database is maintained by an administrator with agronomy domain knowledge.

### Constraints:
1. **Dataset limitation:** The MobileNetV2 model is trained on the PlantVillage dataset, which contains controlled lab-condition images. Real-world field images with complex backgrounds may reduce accuracy.
2. **HuggingFace cold starts:** Free-tier Spaces may timeout on the first request after an idle period; a paid tier or keep-alive mechanism is required for production deployment.
3. **Local server dependency:** The MobileNetV2 model requires the Flask server to be running locally; this introduces a single point of failure not present in the cloud-hosted models.
4. **Confidence threshold:** The system will not issue a spray recommendation if the model confidence falls below the configured minimum threshold (default: 60%), returning a "Review" status instead.
5. **IoT hardware:** Physical sprinkler integration with MQTT and Raspberry Pi hardware has not been implemented; the IoT module is currently simulation-only.
6. **Language:** The platform is currently English-only; multi-language support (Tamil, Hindi) is identified as future work.
7. **Internet connectivity:** The platform requires an active internet connection; offline mode is not currently supported.

### Stakeholders:
| Stakeholder | Role | Interest |
|---|---|---|
| **Smallholder Farmers** | Primary end-users | Receive AI-driven spray recommendations to protect crop yield |
| **Farm Managers** | Secondary end-users | Monitor all farmers' treatment records and analytics across the farm |
| **Agronomists / Extension Officers** | Domain experts | Review diagnosis reports; validate spray recipe accuracy |
| **System Administrator** | Technical operator | Maintain spray recipe database; update AI model configurations |
| **University Supervisors (Dr. K. Suresh)** | Academic overseers | Evaluate technical quality and academic rigor of the platform |
| **SRM IST Department** | Institutional stakeholder | Ensure project meets 21CSP302L course requirements |

---

## Division of Work and Contributors — SPRINT 1
### (Foundation & Core AI Pipeline | Duration: 2 Weeks)

### Sprint Goal:
Establish the project's technical foundation and deliver a functional end-to-end AI inference pipeline — a farmer can upload a crop image and receive a disease classification with an actionable spray recommendation.

### Division of Work:

| Task | Contributor | Description |
|---|---|---|
| Dataset preparation and folder structuring | Sanchai K B | Organised PlantVillage dataset into training/validation splits across 7 classes |
| ResNet18 insect model architecture & training | Sanchai K B | Implemented frozen backbone + custom head; 30-epoch training achieving 87.24% val accuracy |
| EfficientNet-B0 rice disease model training | Gokul Uday | Full fine-tuning on 6 rice disease classes; 86.06% best validation accuracy |
| Flask inference server implementation | Gokul Uday | Built `serve.py` with temperature scaling (T=1.8), `/predict` and `/predict-upload` endpoints |
| React frontend scaffold | Gokul Uday | Vite + React 18 + TypeScript project setup; routing, AppShell, sidebar navigation |
| Home.tsx diagnosis panel | Sanchai K B | Model selector toggle, drag-and-drop upload zone, Analysis Report panel |
| Supabase project setup | Gokul Uday | PostgreSQL schema (diagnoses table), Auth, Storage bucket, RLS policies |
| Integration testing | Both | E2E test: image upload → Flask prediction → Supabase save → React display |

### Daily Scrum Log — Sprint 1:

| Day / Week | Daily Scrum Notes |
|---|---|
| Week 1, Day 1 | **Plan:** Set up React + Flask project skeletons. **Done:** Vite scaffold created; Flask app with health endpoint running. **Blockers:** None. |
| Week 1, Day 2 | **Plan:** Configure Supabase project and auth. **Done:** Supabase project created; `diagnoses` table schema defined; RLS enabled. **Blockers:** None. |
| Week 1, Day 3 | **Plan:** Begin ResNet18 training. **Done:** Dataset loaded; ImageNet weights applied; custom head (Dropout + Linear) implemented; Phase 1 training started. **Blockers:** Dataset class imbalance — resolved with WeightedRandomSampler. |
| Week 1, Day 4 | **Plan:** Begin EfficientNet-B0 training. **Done:** Full fine-tuning configured; training loop running on 6 rice disease classes. **Blockers:** Validation accuracy stagnant at epoch 5 — resolved by unfreezing all layers. |
| Week 1, Day 5 | **Plan:** Review mid-training metrics. **Done:** ResNet18 at 72% val acc by epoch 10; EfficientNet at 68%. Both training logs saved to CSV. **Blockers:** None. |
| Week 2, Day 1 | **Plan:** Implement Flask `/predict` endpoint. **Done:** Image URL download → preprocess → forward pass → softmax → JSON response working. **Blockers:** CORS errors from React — resolved with `flask_cors`. |
| Week 2, Day 2 | **Plan:** Add `/predict-upload` multipart endpoint. **Done:** Endpoint accepts file from FormData; returns ranked predictions. **Blockers:** None. |
| Week 2, Day 3 | **Plan:** Connect React frontend to Flask. **Done:** Home.tsx dispatches POST to `/predict-upload`; response populates Analysis Report panel. **Blockers:** None. |
| Week 2, Day 4 | **Plan:** Supabase Storage integration. **Done:** Uploaded images stored in `diagnosis-images` bucket (signed URLs); diagnosis record saved to PostgreSQL. **Blockers:** None. |
| Week 2, Day 5 | **Plan:** Sprint 1 review and test all 4 user stories. **Done:** TC01–TC05 all PASS. Sprint retrospective held. All 4 user stories #US01–#US04 completed. **Blockers:** None. |

### Sprint 1 Velocity:
- **Committed:** 4 User Stories (#US01 – #US04)
- **Completed:** 4 User Stories
- **Completion Rate:** 100%

_____________________
**Signature of the Supervisor:** Dr. K. Suresh

---

## Division of Work and Contributors — SPRINT 2
### (Platform Features & Analytics | Duration: 2 Weeks)

### Sprint Goal:
Extend the platform with diagnosis history, analytics charts, spray scheduling, weather-based advisability, and a JWT-protected Express API server.

### Division of Work:

| Task | Contributor | Description |
|---|---|---|
| Express API server scaffold | Gokul Uday | Node.js 20 + TypeScript server; Vite proxy configuration for `/api/*` routes |
| JWT authentication middleware | Gokul Uday | `requireAuth()` middleware — validates Supabase Bearer tokens on all routes |
| `/api/plants` CRUD routes | Sanchai K B | Create, list, update, delete plant records linked to diagnoses |
| `/api/schedules` routes | Sanchai K B | Schedule creation, listing, mark-complete with next-date recalculation |
| `/api/weather` proxy route | Gokul Uday | OpenWeatherMap proxy with spray advisability logic (rain >40%, wind >15km/h) |
| History page (History.tsx) | Sanchai K B | Diagnosis timeline with real-time search filtering and chronological ordering |
| Analytics Dashboard (Analytics.tsx) | Gokul Uday | Recharts bar/line/donut charts from live Supabase aggregation queries |
| Spray Schedule page (SpraySchedule.tsx) | Sanchai K B | Kanban-style grid with Mark Done button, next spray date tracking |
| Settings page (Settings.tsx) | Gokul Uday | Profile, appearance, location, default crop, notifications (persisted via Supabase) |
| Error handling + image retry | Both | Invalid file toast error; Clear button resets image + result panel |

### Daily Scrum Log — Sprint 2:

| Day / Week | Daily Scrum Notes |
|---|---|
| Week 3, Day 1 | **Plan:** Scaffold Express server. **Done:** TypeScript Express app running on port 3000; Vite proxy routing `/api/*` correctly. **Blockers:** None. |
| Week 3, Day 2 | **Plan:** Implement `requireAuth` JWT middleware. **Done:** Token extracted from Authorization header; validated via `supabase.auth.getUser()`; userId attached to request. **Blockers:** None. |
| Week 3, Day 3 | **Plan:** `/api/plants` and `/api/schedules` routes. **Done:** All CRUD operations implemented and tested via Postman. RLS confirmed working. **Blockers:** None. |
| Week 3, Day 4 | **Plan:** `/api/weather` OpenWeatherMap proxy. **Done:** Route fetches current weather by city; spray advisability logic implemented (Not Ideal text shown with rain/wind). **Blockers:** Rate limit issue (429) during load testing — noted for future caching fix. |
| Week 3, Day 5 | **Plan:** History.tsx page. **Done:** Diagnosis timeline renders correctly; real-time search filter implemented. **Blockers:** None. |
| Week 4, Day 1 | **Plan:** Analytics Dashboard. **Done:** Disease frequency bar chart and monthly trend line chart rendering from Supabase data. Summary stat cards (total, action required, healthy). **Blockers:** None. |
| Week 4, Day 2 | **Plan:** Spray Schedule page. **Done:** Schedule cards display product, dosage, next date, status. Mark Done button calls PATCH route. **Blockers:** None. |
| Week 4, Day 3 | **Plan:** Auto-schedule from diagnosis. **Done:** "Create Spray Schedule" button wired to `/api/schedules POST` from Home.tsx result panel. **Blockers:** None. |
| Week 4, Day 4 | **Plan:** Settings page. **Done:** Profile and location settings saved to Supabase user profile. Appearance toggle working. **Blockers:** None. |
| Week 4, Day 5 | **Plan:** Sprint 2 review. **Done:** TC06–TC12 all PASS. All 6 user stories #US05–#US10 completed. Sprint retrospective held. **Blockers:** None. |

### Sprint 2 Velocity:
- **Committed:** 6 User Stories (#US05 – #US10)
- **Completed:** 6 User Stories
- **Completion Rate:** 100%

_____________________
**Signature of the Supervisor:** Dr. K. Suresh

---

## Division of Work and Contributors — SPRINT 3
### (Multi-Model Integration & Finalization | Duration: 2 Weeks)

### Sprint Goal:
Complete the multi-model inference system integrating three AI models, implement the Admin Decision Rules panel, populate all 18 spray recipes, and deliver the system in its final presentation-ready state with PDF report generation.

### Division of Work:

| Task | Contributor | Description |
|---|---|---|
| Multi-model router (roboflow.ts) | Gokul Uday | Unified `POST /api/roboflow/infer` routing to 3 model endpoints by `modelId` |
| HuggingFace Rice model integration | Sanchai K B | `hf-rice/1` endpoint; `scores[]` response format normalisation |
| HuggingFace EfficientNet Insect model | Gokul Uday | `hf-insect/1` endpoint; `all_scores{}` dict format parsing |
| 3-tab model selector frontend | Sanchai K B | Home.tsx updated with Rice Diseases and Pest Detection tabs |
| Decision Engine v3 (decisionEngine.ts) | Gokul Uday | `buildDecision()` — 4-state logic: Healthy / Action Required / Review / No Recipe |
| Master spray recipes SQL migration | Sanchai K B | `0008_master_recipes.sql` — 18 recipes across all 3 models |
| Admin Decision Rules Panel (Rules.tsx) | Gokul Uday | CRUD interface for per-class spray recipe editing without DB access |
| PDF Report Generator (reportGenerator.ts) | Sanchai K B | jsPDF + AutoTable — downloadable PDF with image, disease, dosage, notes |
| Temperature Scaling implementation | Gokul Uday | T=1.8 applied to Flask logits; confidence range improved to 75–95% |
| GitHub push + README + LaTeX report | Both | Final documentation, architecture diagrams, sprint chapter, and code appendix |

### Daily Scrum Log — Sprint 3:

| Day / Week | Daily Scrum Notes |
|---|---|
| Week 5, Day 1 | **Plan:** Multi-model router scaffold. **Done:** `ALLOWED_MODELS` set defined; routing by modelId implemented in `roboflow.ts`. **Blockers:** None. |
| Week 5, Day 2 | **Plan:** HuggingFace Rice model integration. **Done:** `callHFEndpoint()` for Rice model; `scores[]` response parsed and sorted. **Blockers:** HF cold start caused 503 on first test — resolved by using `AbortSignal.timeout(45_000)`. |
| Week 5, Day 3 | **Plan:** HuggingFace EfficientNet insect model. **Done:** `all_scores{}` dict format detected and normalised; insect predictions returning correctly. **Blockers:** None. |
| Week 5, Day 4 | **Plan:** Temperature Scaling in Flask. **Done:** `logits / 1.8` before softmax; 100% confidence artifacts eliminated; realistic 75–95% range confirmed on 10 test images. **Blockers:** None. |
| Week 5, Day 5 | **Plan:** 18 spray recipes insert migration. **Done:** `0008_master_recipes.sql` run in Supabase; all 18 recipes visible in spray_recipes table. **Blockers:** None. |
| Week 6, Day 1 | **Plan:** Decision Engine v3 — 4-state logic. **Done:** Healthy / Missing Recipe / Low Confidence / Action Required states all working correctly in integration test. **Blockers:** None. |
| Week 6, Day 2 | **Plan:** "Create Spray Schedule" button in 3-state badge. **Done:** Button visible only on "Action Required" state; creates schedule from recipe dosage and interval. **Blockers:** None. |
| Week 6, Day 3 | **Plan:** Admin Rules Panel. **Done:** Rules.tsx renders per-class recipe cards; CRUD operations update `spray_recipes` table. **Blockers:** None. |
| Week 6, Day 4 | **Plan:** PDF report generator. **Done:** `reportGenerator.ts` downloads PDF with crop image thumbnail, disease name, confidence, dosage, and notes. **Blockers:** Image thumbnail positioning required 3 iterations. |
| Week 6, Day 5 | **Plan:** Final E2E test + GitHub push. **Done:** TC13–TC19 all PASS. GitHub repository pushed with README, architecture diagrams, LaTeX report, SQL migrations. Sprint retrospective held. **Blockers:** None. |

### Sprint 3 Velocity:
- **Committed:** 4 User Stories (#US11 – #US14)
- **Completed:** 4 User Stories
- **Completion Rate:** 100%

_____________________
**Signature of the Supervisor:** Dr. K. Suresh

---

## Worksheet / Data Collection / Observations

### Model Training Results:

| Model | Architecture | Dataset | Classes | Best Val Accuracy | Epochs |
|---|---|---|---|---|---|
| Insect / Pest Classifier | ResNet18 (IMAGENET1K_V1) | Custom field dataset | 5 pest classes | **87.24%** | 30 |
| Rice Disease / Fertilizer | EfficientNet-B0 (IMAGENET1K_V1) | Rice disease dataset | 6 disease classes | **86.06%** | 30 |
| Tomato / Potato (local) | MobileNetV2 (IMAGENET1K_V1) | PlantVillage subset | 7 classes | ~83% | 30 |

### Spray Recipe Coverage:

| Model ID | Classes Covered | Recipes Inserted |
|---|---|---|
| `hf-rice/1` | Blast Disease, Brown Spot, Bacterial Blight, False Smut, NeckBlast, Healthy | 6 |
| `hf-insect/1` | Rice Stem Borer, Green Leafhopper, Planthopper, Rice Bug, Rice Leaf Roller | 5 |
| `agrismart/1` | Tomato Early Blight, Late Blight, Leaf Mold, Septoria, Spider Mites, Mosaic Virus, Healthy | 7 |
| **Total** | | **18** |

### Functional Test Results:

| Sprint | Test Cases Run | Pass | Fail | Pass Rate |
|---|---|---|---|---|
| Sprint 1 | TC01–TC05 (5 cases) | 5 | 0 | 100% |
| Sprint 2 | TC06–TC12 (7 cases) | 7 | 0 | 100% |
| Sprint 3 | TC13–TC19 (7 cases) | 7 | 0 | 100% |
| **Total** | **19 cases** | **19** | **0** | **100%** |

### Key Technical Observations:
1. **Temperature Scaling** at T=1.8 reduced overconfident 99–100% predictions to a realistic 75–95% range, significantly improving recommendation trustworthiness.
2. **Weighted Random Sampling** effectively addressed class imbalance in the training dataset — minority classes (e.g., False Smut) achieved per-class F1 scores above 0.78.
3. **HuggingFace cold starts** averaged 35–45 seconds on the free tier after 15 minutes of inactivity. A production deployment would require paid tier or a keep-alive scheduler.
4. **JWT middleware** enforced authentication on 100% of API routes — all unauthorized requests correctly returned 401 Unauthorized.
5. **Spray Schedule completion workflow** correctly calculated next spray dates across multi-application cycles in all tested scenarios.

---

## Research Article / Journal Publication Details

### Publication Status: **Not yet submitted** (target: IEEE Access or Springer — Precision Agriculture)

**Planned Title:** "AgriSmart: A Multi-Model Deep Learning Platform for Real-Time Rice Disease and Pest Diagnosis with Integrated Treatment Recommendation"

**Planned Authors:** Sanchai K B, Gokul Uday, Dr. K. Suresh

**Target Venue:** IEEE Access / Computers and Electronics in Agriculture (Elsevier)

**Planned Abstract Summary:**
The paper will present AgriSmart's hybrid 3-model inference architecture (local MobileNetV2 + 2 HuggingFace EfficientNet-B0 models), the temperature-scaled confidence calibration approach, the database-driven decision engine, and comparative classification results against single-model baselines. The practical deployment challenges, cold-start latency mitigation strategies, and real-world generalization issues will also be addressed.

---

*This handbook was prepared for 21CSP302L — Minor Project, Department of Computational Intelligence,*
*SRM Institute of Science and Technology, Kattankulathur, Academic Year 2025–2026 (Even Semester 6).*
