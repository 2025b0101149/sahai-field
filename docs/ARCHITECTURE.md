# SahAI Field — Technical Architecture

### Offline-First Edge AI for Rural Fieldwork

SahAI Field is engineered as a **resilient, local-first computing system** designed for rural field workers operating in environments with intermittent, low-bandwidth, or zero internet connectivity.

---

## 1. System Philosophy: Zero Cloud Dependency

Traditional mobile and field applications rely on synchronous cloud roundtrips for Natural Language Processing (Speech-to-Text and LLM extraction) and Document Computer Vision (OCR). In rural regions, this causes latency spikes, connection timeouts, and workflow abandonment.

**SahAI Field breaks this dependency:**
1. Spoken audio is digitized and transcribed **on-device**.
2. Unstructured speech transcripts are converted to validated JSON schemas **on-device**.
3. Captured identity documents and certificates are processed **on-device**.
4. All records are persisted to **local IndexedDB storage** immediately.
5. Cloud synchronization is strictly **optional, asynchronous, and user-controlled**.

---

## 2. Core On-Device Data Pipeline

```
┌────────────────────────────────────────────────────────┐
│                   FIELD OBSERVATION                    │
│           (Worker Speech & Document Capture)           │
└───────────────────────────┬────────────────────────────┘
                            │
              Audio Stream  │  Document Photograph
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  ON-DEVICE STT    │       │   ON-DEVICE OCR   │
    │  (Whisper INT8)   │       │ (Tesseract / NPU) │
    └─────────┬─────────┘       └─────────┬─────────┘
              │                           │
       Raw Transcript              Parsed ID Text
              ▼                           │
    ┌───────────────────┐                 │
    │ QUANTIZED LOCAL   │                 │
    │   LLM (INT4)      │                 │
    └─────────┬─────────┘                 │
              │                           │
       Structured JSON                    │
              └─────────────┬─────────────┘
                            ▼
               ┌────────────────────────┐
               │    LOCAL DATABASE      │
               │ (IndexedDB / SQLite)   │
               └────────────┬───────────┘
                            │
               Optional (When Online)
                            ▼
               ┌────────────────────────┐
               │     OPTIONAL SYNC      │
               │ (Express / Regional)   │
               └────────────────────────┘
```

---

## 3. Hardware Acceleration: Qualcomm Snapdragon NPU Target

### Target Silicon
* **Qualcomm Snapdragon 8 Gen 3 / Gen 4** (Mobile Form Factor)
* **Qualcomm Snapdragon X Elite / X Plus** (Laptop / Tablet Form Factor)
* **Dedicated Qualcomm Hexagon NPU** delivering up to 45 TOPS of INT4/INT8 compute.

### Why Snapdragon NPU for Rural Fieldwork?
* **Energy Efficiency:** Generating tokens on CPU/GPU drains mobile batteries within 2 hours of field visits. The Hexagon NPU executes INT4 quantized tensors at a fraction of the thermal and battery envelope (~3-5W).
* **Deterministic Low Latency:** On-device STT and schema structuring complete in <600ms, enabling real-time feedback while standing in a farmer's field or home.
* **Complete Privacy:** Identity documents, medical symptoms, and financial hardship notes never leave device memory without explicit permission.

### Native Execution Roadmap (Qualcomm AI Hub Integration)

```
[PyTorch / HuggingFace Model]
       │
       ▼ (Qualcomm AI Hub Optimization)
[Quantized QNN Graph (.dlc / ONNX INT4)]
       │
       ▼ (Compiled for Hexagon V73/V75 NPU)
[Qualcomm Neural Processing Engine (QNPE / QNN SDK)]
       │
       ▼
[SahAI Field Native Android / Capacitor / Electron Bridge]
       │
       ▼
[speechService / llmService / ocrService Abstraction Layer]
```

#### 1. Speech-To-Text (Whisper)
* **Target Model:** OpenAI Whisper Base / Tiny (English + Hindi/Regional Indic dialects).
* **Quantization:** INT8 dynamic weights + FP16 activations.
* **Runtime:** Qualcomm QNN Execution Provider via ONNX Runtime Mobile or `whisper.cpp` with Hexagon HTX acceleration.

#### 2. Local Language Model (Structured JSON Extraction)
* **Target Model:** `Llama-3.2-1B-Instruct` or `Phi-3.5-mini-instruct` (3.8B).
* **Quantization:** AWQ / GPTQ 4-bit (`INT4`) compiled through Qualcomm AI Hub.
* **Context Budget:** 2,048 tokens (sufficient for typical 2-minute field observations + JSON schema prompts).
* **Inference Speed on Hexagon NPU:** ~28–45 tokens/second.

#### 3. Optical Character Recognition (Document Scanner)
* **Target Pipeline:** MobileNetV4 / DBNet text detector + CRNN text recognizer compiled via QNN.
* **Preprocessing:** Canvas Grayscale, Auto-contrast stretch, and morphological thresholding.
* **Parser:** Rule-assisted Indian document heuristics (UIDAI Aadhaar checksum, PAN alphanumeric regex, Ayushman PM-JAY Gold ID, Kisan KCC format).

---

## 4. Software Abstraction Layer

To ensure the web prototype is instantly demonstrable on standard laptops while maintaining engineering integrity, SahAI Field uses decoupled, pluggable service modules:

| Module | Interface Method | Current Prototype Adapter | Native Snapdragon Target Adapter |
|---|---|---|---|
| `speechService` | `.transcribe(audioBlob, opts)` | Web Speech API + High-fidelity Whisper mock | QNN ONNX Runtime Whisper Bridge |
| `llmService` | `.extractStructuredData(text)` | Deterministic rule extractor + JSON schema validator | Qualcomm AI Hub Llama 3.2 1B INT4 |
| `ocrService` | `.extractText(imageUri, opts)` | Tesseract.js WebAssembly + Canvas preprocessor | Snapdragon NPU Mobile Vision QNN |
| `storageService` | `.saveVisit()`, `.getAllVisits()` | Browser IndexedDB (`idb`) | SQLite with SQLCipher encryption |
| `syncService` | `.syncPendingRecords()` | Asynchronous fetch to `/api/sync` | Background Sync Worker with retry backoff |

> **Engineering Guarantee:** The application explicitly labels whether output was generated via Browser Web APIs, Demo Local Mock, or Simulated NPU. It never fabricates real NPU execution when running in standard browser contexts.

---

## 5. Local Storage Schema (IndexedDB)

The primary offline datastore is named `SahAIFieldDB` and consists of three object stores:

### 1. Store: `visits` (Key: `id`)
```typescript
interface FieldVisit {
  id: string;                      // e.g. "VF-20260919-4812"
  createdAt: string;               // ISO 8601 Timestamp
  updatedAt: string;               // ISO 8601 Timestamp
  worker: string;                  // Field worker full name
  workerId: string;                // Field worker badge ID
  location: string;                // Village / coordinates / ward
  beneficiary: string;             // Client name
  visitType: 'Health Visit' | 'Insurance Survey' | 'Banking/KYC' | 'General Field Survey';
  transcript: string;              // Spoken observation text
  structuredData: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other' | 'Unknown';
    issue: string;
    estimated_loss: number | null;
    assistance_required: boolean;
    follow_up_required: boolean;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    recommended_action: string;
  };
  ocrResults: {
    docType: string;
    idNumber: string;
    name: string;
    dob?: string;
    gender?: string;
    extractedText: string;
  };
  documentSnapshot?: string;       // Base64 thumbnail (kept local)
  notes?: string;
  status: 'Draft' | 'Completed';
  syncStatus: 'Pending Sync' | 'Synced' | 'Offline Local';
  syncedAt?: string;
}
```

### 2. Store: `documents` (Key: `id`)
Stores individual cropped identity records and raw OCR telemetry.

### 3. Store: `settings` (Key: `key`)
Stores active hardware engine choices (`speechEngine`, `llmEngine`, `ocrEngine`), worker identity, and demo flags.

---

## 6. Asynchronous Synchronization Mechanism

When network connectivity is detected (or simulated by the user), synchronization proceeds through idempotent batching:

1. `syncService` queries IndexedDB for records where `syncStatus !== 'Synced'`.
2. A single payload containing the pending records is posted to `POST /api/sync`.
3. The Express backend performs an upsert:
   - Matches records by `id`.
   - If existing, updates fields and sets `syncedAt`.
   - If new, adds record to the server database.
4. Upon receiving `status: 'success'` and the batch response, `syncService` atomically updates the local records in IndexedDB to `syncStatus: 'Synced'`.
5. **Resilience Guarantee:** If the network drops halfway or the backend is offline, local records remain in `Pending Sync`. No data is ever lost or corrupted.
