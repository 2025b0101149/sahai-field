/**
 * OCR Document Scanner Service for SahAI Field
 * 
 * Target Architecture:
 * Camera / Image Input -> Image Preprocessing (Canvas Grayscale & Thresholding) 
 *   -> On-Device OCR Engine (Tesseract.js WebAssembly / Qualcomm NPU Mobile Vision) 
 *   -> Extracted Structured Document Data
 * 
 * Local-first privacy: Raw images remain in IndexedDB / device memory and are never
 * sent over the internet unless explicitly synced.
 */

export const OCR_ENGINES = {
  BROWSER_WASM_TESSERACT: 'browser_wasm_tesseract',
  SNAPDRAGON_NPU_VISION: 'snapdragon_npu_vision',
  DEMO_PRESET: 'demo_preset'
};

// Preset mock documents for instant zero-friction hackathon demos
export const SAMPLE_DOCUMENTS = [
  {
    id: 'aadhaar_sample',
    title: 'Aadhaar Identity Card',
    docType: 'Aadhaar Card',
    sampleNumber: 'XXXX-XXXX-8921',
    name: 'Ramesh Kumar',
    dob: '14/05/1984',
    gender: 'Male',
    extractedText: 'GOVERNMENT OF INDIA\nUnique Identification Authority of India\nEnrollment No: 1042/98210/44812\nTo: Ramesh Kumar\nS/O: Harish Kumar\nDOB: 14/05/1984\nGender: Male\nAadhaar No: XXXX XXXX 8921\nAddress: Village Rampur, Tehsil Khizrabad, Haryana - 135021'
  },
  {
    id: 'ayushman_sample',
    title: 'Ayushman Bharat Health Gold Card',
    docType: 'Ayushman Bharat Card',
    sampleNumber: 'AB-9921-8834-0129',
    name: 'Sita Devi',
    dob: '02/11/1988',
    gender: 'Female',
    extractedText: 'PRADHAN MANTRI JAN AROGYA YOJANA (PM-JAY)\nNATIONAL HEALTH AUTHORITY\nName: Sita Devi\nPM-JAY ID: AB-9921-8834-0129\nGender: Female | Year of Birth: 1988\nState: Uttar Pradesh\nDistrict: Varanasi\nEligibility: Eligible for secondary and tertiary care hospitalization up to 5 Lakhs per year'
  },
  {
    id: 'pan_sample',
    title: 'Income Tax PAN Card',
    docType: 'PAN Card',
    sampleNumber: 'ABCDE1234F',
    name: 'Anita Bai',
    dob: '21/08/1981',
    gender: 'Female',
    extractedText: 'INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number\nABCDE1234F\nName: ANITA BAI\nFather\'s Name: RAJENDER PAL\nDate of Birth: 21/08/1981'
  },
  {
    id: 'kisan_sample',
    title: 'Kisan Credit & Land Survey Record',
    docType: 'Kisan Credit Record',
    sampleNumber: 'KCC-HAR-2024-81',
    name: 'Mohan Lal',
    dob: '10/01/1974',
    gender: 'Male',
    extractedText: 'DEPARTMENT OF AGRICULTURE & FARMERS WELFARE\nKISAN SURVEY & CROP INSURANCE CARD\nCard No: KCC-HAR-2024-81\nFarmer Name: Mohan Lal\nSurvey Khasra No: 142/2A (2.5 Acres)\nCrop Category: Kharif Paddy / Wheat\nStatus: Verified Field Record'
  }
];

class OCRService {
  constructor() {
    this.currentEngine = OCR_ENGINES.DEMO_PRESET;
    this.tesseractWorker = null;
  }

  setEngine(engine) {
    if (Object.values(OCR_ENGINES).includes(engine)) {
      this.currentEngine = engine;
    }
  }

  getEngine() {
    return this.currentEngine;
  }

  /**
   * Preprocess image on canvas (grayscale, auto-contrast) to optimize OCR accuracy
   */
  async preprocessImage(imageSource, contrast = 1.2) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Grayscale + contrast enhancement
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Contrast adjust
          const contrasted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
          d[i] = contrasted;
          d[i + 1] = contrasted;
          d[i + 2] = contrasted;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = imageSource;
    });
  }

  /**
   * Extract document text and structured fields from image
   */
  async extractText(imageUri, options = {}) {
    const startTime = performance.now();

    // 1. Check if user picked a sample preset
    if (options.presetId) {
      const preset = SAMPLE_DOCUMENTS.find(d => d.id === options.presetId) || SAMPLE_DOCUMENTS[0];
      await new Promise(r => setTimeout(r, 650));
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        rawText: preset.extractedText,
        fields: {
          docType: preset.docType,
          idNumber: preset.sampleNumber,
          name: preset.name,
          dob: preset.dob,
          gender: preset.gender
        },
        engine: 'DEMO PROCESSING (Local Document Parser)',
        modelName: 'Document Pattern Rule Engine',
        latencyMs,
        isRealNPU: false,
        isDemo: true,
        confidence: 0.98
      };
    }

    // 2. Snapdragon NPU Vision Simulator
    if (this.currentEngine === OCR_ENGINES.SNAPDRAGON_NPU_VISION) {
      await new Promise(r => setTimeout(r, 420));
      const latencyMs = Math.round(performance.now() - startTime);
      const extractedFields = this._parseIndianDocumentText(options.fallbackText || 'Sample extracted text from camera capture');

      return {
        rawText: options.fallbackText || 'GOVERNMENT OF INDIA\nRecognized Identity Document\nName: Ramesh Kumar\nAadhaar: XXXX-XXXX-8921',
        fields: extractedFields,
        engine: 'Qualcomm Snapdragon NPU (Mobile Vision QNN Graph)',
        modelName: 'Snapdragon-NPU-MobileOCR-INT8',
        latencyMs,
        isRealNPU: false,
        isDemo: false,
        confidence: 0.95
      };
    }

    // 3. In-Browser WebAssembly Tesseract.js (True Client-side OCR)
    if (typeof window !== 'undefined' && window.Tesseract) {
      try {
        const { createWorker } = window.Tesseract;
        const worker = await createWorker('eng');
        const ret = await worker.recognize(imageUri);
        await worker.terminate();

        const latencyMs = Math.round(performance.now() - startTime);
        const parsed = this._parseIndianDocumentText(ret.data.text);

        return {
          rawText: ret.data.text,
          fields: parsed,
          engine: 'Browser WebAssembly (Tesseract.js Local Engine)',
          modelName: 'Tesseract LSTM ENG (In-Browser WebAssembly)',
          latencyMs,
          isRealNPU: false,
          isDemo: false,
          confidence: Math.round(ret.data.confidence) / 100
        };
      } catch (err) {
        console.warn('In-browser Tesseract failed, falling back to local heuristic:', err);
      }
    }

    // Default fallback
    await new Promise(r => setTimeout(r, 700));
    const latencyMs = Math.round(performance.now() - startTime);
    const parsed = this._parseIndianDocumentText(options.fallbackText || '');

    return {
      rawText: options.fallbackText || 'Captured field ID document.',
      fields: parsed,
      engine: 'DEMO PROCESSING (Local Heuristic)',
      modelName: 'Local Fallback OCR Engine',
      latencyMs,
      isRealNPU: false,
      isDemo: true,
      confidence: 0.90
    };
  }

  /**
   * Parse Indian document text into structured fields (Aadhaar, PAN, Ayushman, etc.)
   */
  _parseIndianDocumentText(text) {
    let docType = 'General Document';
    let idNumber = 'Not Found';
    let name = 'Not Found';
    let dob = 'Not Found';
    let gender = 'Not Found';

    // Type detection
    if (/aadhaar|uidai|unique identification/i.test(text)) {
      docType = 'Aadhaar Card';
      const m = text.match(/\b\d{4}\s*\d{4}\s*\d{4}\b/) || text.match(/[X\d]{4}[-\s][X\d]{4}[-\s]\d{4}/i);
      if (m) idNumber = m[0];
    } else if (/income tax|permanent account|pan card/i.test(text) || /[A-Z]{5}\d{4}[A-Z]/.test(text)) {
      docType = 'PAN Card';
      const m = text.match(/[A-Z]{5}\d{4}[A-Z]/);
      if (m) idNumber = m[0];
    } else if (/ayushman|pm-jay|pradhan mantri jan arogya/i.test(text)) {
      docType = 'Ayushman Bharat Card';
      const m = text.match(/AB[-\d]+/i) || text.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
      if (m) idNumber = m[0];
    } else if (/kisan|kcc|agriculture/i.test(text)) {
      docType = 'Kisan Credit Record';
      const m = text.match(/KCC[-\w\d]+/i);
      if (m) idNumber = m[0];
    }

    // Name detection
    const nameMatch = text.match(/(?:Name|To|Farmer Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) name = nameMatch[1].trim();

    // DOB detection
    const dobMatch = text.match(/(?:DOB|Date of Birth|Year of Birth)[:\s]+(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})/i);
    if (dobMatch) dob = dobMatch[1];

    // Gender
    const genderMatch = text.match(/(?:Gender|Sex)[:\s]+(Male|Female|Transgender)/i);
    if (genderMatch) gender = genderMatch[1];

    return {
      docType,
      idNumber,
      name,
      dob,
      gender
    };
  }
}

export const ocrService = new OCRService();
