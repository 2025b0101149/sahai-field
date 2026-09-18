# SahAI Field — Offline-First AI for Rural Fieldwork

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Express-0d9488.svg)](#technology-stack)
[![Offline](https://img.shields.io/badge/Offline-IndexedDB%20Local-10b981.svg)](#offline-architecture)
[![Target](https://img.shields.io/badge/Target-Qualcomm%20Snapdragon%20NPU-6366f1.svg)](#qualcomm-snapdragon-npu-integration)

> **SahAI Field** is a full-stack, Edge AI-powered mobile application designed for rural health workers (ASHA/ANM), crop insurance surveyors, and banking correspondents (Bank Mitras). It converts spoken field observations and identity documents into structured digital records **completely on-device without internet connectivity**.

---

## 1. The Core Problem

Field workers in rural villages face severe operational bottlenecks:
* **Connectivity Deadzones:** Villages, agricultural fields, and mountainous areas often have zero cellular coverage.
* **Tedious Manual Paperwork:** Documenting patient symptoms, flood crop damage, or micro-loan KYC by hand takes hours, leading to high error rates and lost claim forms.
* **Cloud AI Fragility:** Cloud-based voice assistants (like Siri, Google Assistant, or OpenAI Whisper API) fail instantly without reliable high-speed internet.

---

## 2. The SahAI Field Solution

SahAI Field operates as a **true offline-first system**:
1. **Spoken Observation:** The worker presses the microphone and speaks naturally in the field.
2. **On-Device Whisper STT:** Speech is transcribed locally.
3. **Quantized Local LLM:** A 4-bit quantized model structures freeform speech into a validated JSON schema (identifying symptoms, crop loss amounts, priority, and follow-ups).
4. **On-Device Document OCR:** Identity cards (Aadhaar, PAN, Ayushman Bharat, Kisan Credit) are photographed and parsed locally.
5. **Local IndexedDB Database:** The complete field record is stored persistently in the browser/device memory.
6. **Optional Cloud Sync:** When connectivity is restored, records can be synced to a regional registry in one click.

---

## 3. Technology Stack

* **Frontend:** React 18, Vite 5, Custom Design System (Vanilla CSS with dark mode, glassmorphism, and responsive mobile-first controls), Lucide Icons, Canvas Confetti.
* **Local Offline Storage:** IndexedDB managed via the `idb` library for ACID transactions, indexing, and persistent offline storage.
* **On-Device Vision / OCR:** WebAssembly `Tesseract.js` engine + HTML5 Canvas image preprocessing (grayscale & contrast normalization).
* **AI Service Abstraction Layer:** Modular adapters (`speechService`, `llmService`, `ocrService`, `storageService`, `syncService`).
* **Backend (Optional Sync Server):** Node.js, Express, CORS, resilient file-backed JSON database with optional MongoDB support.
* **Target Hardware:** Qualcomm Snapdragon NPU (Hexagon NPU via Qualcomm AI Hub / QNN SDK).

---

## 4. Quick Start: Running Locally

### Prerequisites
* **Node.js**: v18 or higher (v24 tested)
* **npm**: v9 or higher

### Option A: Run Both Frontend & Backend Concurrently (Recommended)

From the project root:

```bash
# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Start both the backend sync server and frontend dev server
npm run dev
```

* **Frontend Application:** [http://localhost:5173](http://localhost:5173)
* **Backend Sync Server:** [http://localhost:5000](http://localhost:5000)
* **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option B: Run Services Individually

#### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```
The server will start on port `5000`.

#### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on port `5173`.

---

## 5. End-to-End Hackathon Demonstration Flow

You can demonstrate the complete offline Edge AI pipeline in under 2 minutes:

### Step 1: Open Dashboard
1. Visit [http://localhost:5173](http://localhost:5173).
2. Note the **5 KPI Metrics**: Total Visits, Completed, Pending Sync, Offline Records, and Documents Processed.
3. Observe the live connectivity pill: `🟢 Online — Sync Ready`.

### Step 2: Test Offline Simulation Mode
1. Click the status pill or navigate to **NPU / Config** and click **"Simulate Offline Mode"**.
2. Notice the badge changes to `🔴 Offline — Working Locally` and an offline security banner appears.
3. Every feature continues working flawlessly with **zero server calls**!

### Step 3: Create a Field Visit
1. Click **"+ New Field Visit"**.
2. **Step 1 (Visit Info):** Review or edit auto-generated Visit ID, Date/Time, Worker ID, Location (use "Auto-Fill Coordinates" for GPS simulation), and Beneficiary Name.
3. **Step 2 (Voice & Whisper):**
   - Click the large microphone to record live audio via your mic, **OR**
   - Click one of the **1-Click Demo Observation Presets** (e.g. *Maternal & Child Health Checkup* or *Crop Flood Damage Assessment*).
   - Observe the speech transcript appear along with inference latency and model details.
4. **Step 3 (Natural Language to Structured Data):**
   - Click **"Next: Extract Structured Data"**.
   - The on-device quantized LLM parses the natural speech into structured fields: Age, Gender, Primary Grievance, Estimated Loss in INR, and Priority.
   - All fields are editable. Notice the **JSON Schema Validated** indicator!
5. **Step 4 (Document Scanner & OCR):**
   - Open camera, upload a photo, **OR** click one of the **Demo Document Samples** (Aadhaar Card, Ayushman Bharat Card, PAN, or Kisan Credit Card).
   - Click **"Run OCR Recognition"** to extract the document type, ID number, and raw OCR text.
   - Read the on-device privacy guarantee.
6. **Step 5 (Consolidated Review & Local Save):**
   - Review the complete consolidated record.
   - Click **"Save to Local Database"**.
   - Watch the celebratory completion animation! The record is saved directly to IndexedDB.

### Step 4: Inspect Records & Test Cloud Sync
1. Navigate to **Records** to view the newly saved visit.
2. Click **Inspect** to see the full record details modal and structured JSON block.
3. Click **"Export JSON"** to download the record file.
4. Toggle connectivity back to online, and click **"Sync Pending Records"** to sync with the Express backend!

---

## 6. Qualcomm Snapdragon NPU Integration

### Target Architecture
```
AUDIO INPUT ──> ON-DEVICE WHISPER (INT8) ──> LOCAL TRANSCRIPT
                                                    │
                                                    ▼
                                           QUANTIZED LOCAL LLM (INT4)
                                                    │
                                                    ▼
CAMERA INPUT ──> LOCAL OCR (VISION NPU) ──> STRUCTURED RECORD
                                                    │
                                                    ▼
                                            LOCAL INDEXEDDB
```

### Engineering Transparency
Web browsers do not currently have direct kernel access to the Snapdragon Hexagon NPU. Rather than fabricating fake NPU execution, SahAI Field establishes a clean, decoupled service abstraction:

```
frontend/src/services/
├── speechService.js   # Whisper STT interface + WebSpeech fallback + QNN adapter hook
├── llmService.js      # Quantized LLM extractor + JSON schema validator
├── ocrService.js      # In-browser WASM Tesseract + NPU Vision adapter hook
├── storageService.js  # IndexedDB local storage engine
└── syncService.js     # Asynchronous optional cloud synchronizer
```

### Snapdragon Deployment Path
When compiling SahAI Field into a native Android APK or Windows on Snapdragon application:
1. Export model weights via **Qualcomm AI Hub** (`Llama-3.2-1B-Instruct` INT4 and `Whisper-Base` INT8).
2. Load compiled `.dlc` / QNN execution provider graphs using ONNX Runtime Mobile.
3. Bind native C++/Java JNI calls to `speechService.transcribe()` and `llmService.extractStructuredData()`.

Detailed specifications are available in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 7. Backend API Reference (Optional Sync Server)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, uptime, and storage mode |
| `GET` | `/api/stats` | Aggregate count of visits by category |
| `GET` | `/api/visits` | Retrieve all synced visits stored on server |
| `POST` | `/api/visits` | Save or update a single field record |
| `POST` | `/api/sync` | Idempotent batch sync for multiple offline visits |

---

## 8. Privacy & Data Sovereignty Guarantees

* **Local-First Processing:** Sensitive beneficiary health symptoms, financial hardship notes, and identity documents are processed inside device memory.
* **No Secret Cloud Calls:** When offline, zero network packets leave the device.
* **Masked ID Storage:** Identity cards display masked numbers (e.g. `XXXX-XXXX-8921`) to prevent unauthorized disclosure.
* **User-Controlled Data:** Field workers have full authority to review, correct, export, or purge records from their device at any time.

---

## 9. Project Structure

```
sahai-field/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx           # Nav, status badges, sync button
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Metrics, recent visits, quick start
│   │   │   ├── NewVisitPage.jsx     # 5-step interactive wizard (Voice + LLM + OCR)
│   │   │   ├── RecordsPage.jsx      # Filterable local datastore & inspector
│   │   │   ├── DocumentsPage.jsx    # Identity document vault
│   │   │   └── SettingsPage.jsx     # NPU config, data controls, privacy
│   │   ├── services/
│   │   │   ├── speechService.js     # Whisper abstraction & audio recorder
│   │   │   ├── llmService.js        # Local quantized LLM schema extractor
│   │   │   ├── ocrService.js        # WebAssembly OCR & document parsing
│   │   │   ├── storageService.js    # IndexedDB persistent engine
│   │   │   └── syncService.js       # Asynchronous synchronization
│   │   ├── App.jsx                  # Main application orchestrator
│   │   ├── main.jsx                 # React root mounting
│   │   └── index.css                # Cohesive design system & styles
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── sw.js                    # Offline caching service worker
│   ├── index.html                   # Mobile viewport & font imports
│   ├── vite.config.js               # Vite config & API reverse proxy
│   └── package.json
│
├── backend/
│   ├── data/
│   │   └── records.json             # File-backed persistence store
│   ├── server.js                    # Express sync server
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md              # Snapdragon NPU pipeline & QNN roadmap
├── .env.example                     # Environment template
├── package.json                     # Root monorepo scripts
└── README.md                        # Complete project documentation
```

---

## 10. Authors & Acknowledgements

Built with ❤️ for rural frontline workers, empowering ASHA health workers, crop insurance surveyors, and banking correspondents with state-of-the-art Edge AI.
