import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Pause, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speechService, PRESET_OBSERVATIONS } from '../services/speechService';
import { localLLM } from '../services/llmService';
import { ocrService, SAMPLE_DOCUMENTS } from '../services/ocrService';
import { storageService } from '../services/storageService';

export default function NewVisitPage({ initialDemoData = null, onVisitSaved, onCancel }) {
  // Stepper Stage (1: Metadata, 2: Voice, 3: LLM Structuring, 4: Document OCR, 5: Review & Save)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Metadata State
  const [visitId, setVisitId] = useState(() => 'VF-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000));
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [workerName, setWorkerName] = useState('Sunita Sharma');
  const [workerId, setWorkerId] = useState('ASH-UP-042');
  const [location, setLocation] = useState('Rampur Village, Ward 4');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [visitType, setVisitType] = useState('Health Visit');

  // Step 2: Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('health_1');
  const [speechTelemetry, setSpeechTelemetry] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const timerRef = useRef(null);

  // Step 3: LLM Extracted Structured State
  const [isExtracting, setIsExtracting] = useState(false);
  const [llmTelemetry, setLlmTelemetry] = useState(null);
  const [structuredData, setStructuredData] = useState({
    name: '',
    age: '',
    gender: 'Unknown',
    issue: '',
    estimated_loss: null,
    assistance_required: true,
    follow_up_required: true,
    priority: 'Medium',
    recommended_action: ''
  });

  // Step 4: Document OCR State
  const [docImage, setDocImage] = useState(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrTelemetry, setOcrTelemetry] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrFields, setOcrFields] = useState({
    docType: 'General Document',
    idNumber: '',
    name: '',
    dob: '',
    gender: ''
  });
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Step 5: Review & Save State
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Completed');
  const [isSaving, setIsSaving] = useState(false);

  // Camera stream cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Seed demo data if requested via prop
  useEffect(() => {
    if (initialDemoData) {
      setBeneficiaryName(initialDemoData.beneficiary || 'Sita Devi');
      setVisitType(initialDemoData.visitType || 'Health Visit');
      setLocation(initialDemoData.location || 'Rampur Village, Ward 4');
      if (initialDemoData.transcript) setTranscript(initialDemoData.transcript);
      if (initialDemoData.structuredData) setStructuredData(initialDemoData.structuredData);
      if (initialDemoData.ocrResults) {
        setOcrFields(initialDemoData.ocrResults);
        setOcrText(initialDemoData.ocrResults.extractedText || '');
      }
    }
  }, [initialDemoData]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Handler: Start Voice Recording
  const handleStartRecording = async () => {
    try {
      setRecordSeconds(0);
      setIsRecording(true);
      setIsPaused(false);

      await speechService.startRecording((liveText) => {
        setTranscript(liveText);
      });
    } catch (err) {
      console.warn('Microphone permission issue, activating Demo Voice mode:', err.message);
      setIsRecording(true);
    }
  };

  // Handler: Pause / Resume Voice Recording
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Handler: Stop Recording & Transcribe
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);
    setIsTranscribing(true);

    try {
      const audioBlob = await speechService.stopRecording();
      const result = await speechService.transcribe(audioBlob, {
        presetId: selectedPresetId,
        fallbackText: transcript || undefined
      });

      setTranscript(result.transcript);
      setSpeechTelemetry(result);
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handler: Load Preset Voice Observation
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTranscript(preset.text);
    if (preset.category) setVisitType(preset.category);

    if (preset.id === 'health_1') {
      setBeneficiaryName('Sita Devi');
      setLocation('Rampur Village, Ward 4');
    } else if (preset.id === 'insurance_1') {
      setBeneficiaryName('Ramesh Kumar');
      setLocation('Khizrabad Sector 2, Farmland #18');
    } else if (preset.id === 'banking_1') {
      setBeneficiaryName('Anita Bai');
      setLocation('Shahpur Basti, Block C');
    } else if (preset.id === 'general_1') {
      setBeneficiaryName('Mohan Lal');
      setLocation('Village Square, Community Centre');
    }

    setSpeechTelemetry({
      engine: 'DEMO PROCESSING (Offline Whisper Mock)',
      modelName: 'Whisper-Tiny.en INT8',
      latencyMs: 340,
      confidence: 0.95,
      isRealNPU: false,
      isDemo: true
    });
  };

  // Handler: Apply OCR Extracted Details to Record
  const handleApplyOcrToRecord = () => {
    if (ocrFields.name && ocrFields.name !== 'Not Found') {
      setBeneficiaryName(ocrFields.name);
      setStructuredData((prev) => {
        let age = prev.age;
        if (ocrFields.dob) {
          const yearMatch = ocrFields.dob.match(/\d{4}/);
          if (yearMatch) {
            age = new Date().getFullYear() - parseInt(yearMatch[0], 10);
          }
        }
        return {
          ...prev,
          name: ocrFields.name,
          gender: (ocrFields.gender && ocrFields.gender !== 'Not Found') ? ocrFields.gender : prev.gender,
          age: age || prev.age
        };
      });
    }
  };

  // Handler: LLM Extract Structured Data
  const handleExtractInformation = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);

    try {
      const result = await localLLM.extractStructuredData(transcript, {
        beneficiary: beneficiaryName,
        visitType
      });

      setStructuredData(result.data);
      setLlmTelemetry(result);

      if (result.data.name) {
        setBeneficiaryName(result.data.name);
      }
    } catch (err) {
      console.error('LLM structuring error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handler: Camera OCR
  const handleStartCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or unavailable. You can upload an image or choose a demo document preset.');
      setCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setDocImage(dataUrl);

    // Stop camera
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  // Handler: Upload Document Image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Load Sample Document Preset
  const handleSelectDocPreset = async (preset) => {
    setIsOcrProcessing(true);
    const result = await ocrService.extractText(null, { presetId: preset.id });
    setOcrText(result.rawText);
    setOcrFields(result.fields);
    setOcrTelemetry(result);
    setIsOcrProcessing(false);

    // Generate placeholder graphic for document preview
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 480, 300);
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 460, 280);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(preset.docType.toUpperCase(), 30, 50);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '16px monospace';
    ctx.fillText(`ID: ${preset.sampleNumber}`, 30, 100);
    ctx.fillText(`NAME: ${preset.name}`, 30, 140);
    ctx.fillText(`DOB: ${preset.dob} | GENDER: ${preset.gender}`, 30, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('SECURE ON-DEVICE OCR VERIFIED', 30, 250);

    setDocImage(canvas.toDataURL('image/png'));
  };

  // Handler: Run OCR on loaded image
  const handleRunOcr = async () => {
    if (!docImage) return;
    setIsOcrProcessing(true);
    try {
      const preprocessed = await ocrService.preprocessImage(docImage);
      const result = await ocrService.extractText(preprocessed, {
        fallbackText: 'GOVERNMENT OF INDIA IDENTITY RECORD\nName: ' + (beneficiaryName || 'Ramesh Kumar') + '\nAadhaar: XXXX-XXXX-8921'
      });

      setOcrText(result.rawText);
      setOcrFields(result.fields);
      setOcrTelemetry(result);
    } catch (err) {
      console.error('OCR Extraction failed:', err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Handler: Final Save to Local IndexedDB Database
  const handleSaveVisit = async () => {
    setIsSaving(true);
    try {
      const fieldRecord = {
        id: visitId,
        createdAt: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
        worker: workerName,
        workerId,
        location,
        beneficiary: beneficiaryName || structuredData.name || 'Unnamed Beneficiary',
        visitType,
        transcript,
        structuredData,
        ocrResults: {
          docType: ocrFields.docType,
          idNumber: ocrFields.idNumber,
          name: ocrFields.name,
          dob: ocrFields.dob,
          gender: ocrFields.gender,
          extractedText: ocrText
        },
        documentSnapshot: docImage,
        notes,
        status,
        syncStatus: 'Pending Sync' // Stored locally, ready for optional sync
      };

      await storageService.saveVisit(fieldRecord);

      // Also persist to documents store if document was scanned/processed
      if (docImage || (ocrFields.idNumber && ocrFields.idNumber !== 'Not Found')) {
        await storageService.saveDocument({
          visitId,
          beneficiary: fieldRecord.beneficiary,
          docType: ocrFields.docType,
          idNumber: ocrFields.idNumber,
          extractedText: ocrText,
          thumbnail: docImage
        });
      }
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setIsSaving(false);
      onVisitSaved(fieldRecord);
    } catch (err) {
      setIsSaving(false);
      alert('Error saving record locally: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top Breadcrumb & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Field Visits</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>/</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>{visitId}</span>
          </div>
          <h1 style={{ fontSize: '1.65rem' }}>New Field Visit</h1>
        </div>

        <button className="btn btn-secondary" onClick={onCancel} style={{ fontSize: '0.85rem' }}>
          Cancel
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="stepper-nav">
        {[
          { num: 1, label: 'Visit Info' },
          { num: 2, label: 'Voice & Whisper' },
          { num: 3, label: 'Structured AI' },
          { num: 4, label: 'Document OCR' },
          { num: 5, label: 'Review & Save' }
        ].map((step) => (
          <div
            key={step.num}
            className={`step-item ${currentStep === step.num ? 'active' : currentStep > step.num ? 'completed' : ''}`}
            onClick={() => setCurrentStep(step.num)}
          >
            <div className="step-number">{currentStep > step.num ? <Check size={12} strokeWidth={3} /> : step.num}</div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {/* ============================================================
          STEP 1: VISIT METADATA
          ============================================================ */}
      {currentStep === 1 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Calendar size={18} style={{ color: 'var(--primary-light)' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Visit Identification & Location</h2>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Visit ID (Auto-Generated)</label>
              <input 
                type="text" 
                className="form-input" 
                value={visitId} 
                onChange={(e) => setVisitId(e.target.value)} 
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={dateTime} 
                onChange={(e) => setDateTime(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Worker Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={workerName} 
                onChange={(e) => setWorkerName(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Worker ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={workerId} 
                onChange={(e) => setWorkerId(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                <span>Location (Village / Ward / Landmark)</span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => setLocation('Rampur Village (Lat: 25.3176, Lon: 82.9739)')}
                >
                  <MapPin size={12} /> Auto-Fill Coordinates
                </button>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Rampur Village, Ward 4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Beneficiary / Customer Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={beneficiaryName} 
                onChange={(e) => setBeneficiaryName(e.target.value)} 
                placeholder="Spoken or ID name (e.g. Sita Devi / Ramesh Kumar)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Visit Type</label>
            <select 
              className="form-select" 
              value={visitType} 
              onChange={(e) => setVisitType(e.target.value)}
            >
              <option value="Health Visit">Health Visit (ASHA / ANM / Medical Survey)</option>
              <option value="Insurance Survey">Insurance Survey (Crop Loss / Property Damage / PMFBY)</option>
              <option value="Banking/KYC">Banking/KYC (Doorstep BC / Microfinance / SHG)</option>
              <option value="General Field Survey">General Field Survey (Govt Scheme / Sanitation)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
              <span>Next: Voice Observation</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 2: VOICE CAPTURE & STT
          ============================================================ */}
      {currentStep === 2 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mic size={18} style={{ color: 'var(--primary-light)' }} />
              <h2 style={{ fontSize: '1.15rem' }}>Voice Capture (On-Device Whisper)</h2>
            </div>

            {speechTelemetry && (
              <div className="badge badge-draft" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {speechTelemetry.engine} • {speechTelemetry.latencyMs}ms
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Speak naturally in rural field conditions. Audio is captured locally and passed to the on-device Whisper model interface.
          </p>

          {/* Microphone Central Controller */}
          <div className="mic-btn-container" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <button 
              className={`mic-circle-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              title={isRecording ? 'Click to Stop Recording' : 'Click to Start Speaking'}
            >
              {isRecording ? <Square size={38} /> : <Mic size={42} />}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatTime(recordSeconds)}
              </div>
              <div style={{ fontSize: '0.85rem', color: isRecording ? '#f87171' : 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                {isRecording ? (isPaused ? 'Recording Paused' : 'Listening & Recording...') : 'Click Microphone to Start Speaking'}
              </div>
            </div>

            {/* Live Audio Waveform visualization */}
            {isRecording && !isPaused && (
              <div className="waveform-bar-container">
                {[4, 8, 14, 28, 42, 30, 18, 38, 22, 12, 34, 20, 8, 16].map((height, i) => (
                  <div 
                    key={i} 
                    className="waveform-bar" 
                    style={{ animationDelay: `${i * 0.08}s`, height: `${height}px` }} 
                  />
                ))}
              </div>
            )}

            {/* Pause & Stop Button Controls */}
            {isRecording && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button className="btn btn-secondary" onClick={handleTogglePause}>
                  {isPaused ? <Play size={15} /> : <Pause size={15} />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button className="btn btn-danger" onClick={handleStopRecording}>
                  <Square size={15} />
                  <span>Finish & Transcribe</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Voice Presets for Hackathon Testing */}
          <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} />
                <span>Demo Observation Audio Presets (1-Click Test)</span>
              </div>
              <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>OFFLINE SAMPLES</span>
            </div>

            <div className="grid-2">
              {PRESET_OBSERVATIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    textAlign: 'left',
                    background: selectedPresetId === preset.id ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-surface-elevated)',
                    border: selectedPresetId === preset.id ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{preset.title}</span>
                    <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>{preset.category}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{preset.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Transcript Result Box */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <div className="form-label">
              <span>Speech Transcript (Editable)</span>
              {isTranscribing && <span style={{ color: 'var(--accent-cyan)' }}>Processing local audio...</span>}
            </div>
            <textarea 
              className="form-textarea" 
              rows={4} 
              value={transcript} 
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Spoken observation will appear here. You can also type or edit directly..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                handleExtractInformation();
                setCurrentStep(3);
              }}
              disabled={!transcript.trim()}
            >
              <span>Next: Extract Structured Data</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 3: LOCAL LLM STRUCTURED EXTRACTION
          ============================================================ */}
      {currentStep === 3 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} style={{ color: 'var(--primary-light)' }} />
              <h2 style={{ fontSize: '1.15rem' }}>Natural Language to Structured Data (Local LLM)</h2>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={handleExtractInformation}
              disabled={isExtracting || !transcript.trim()}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={13} className={isExtracting ? 'status-dot pulse' : ''} />
              <span>{isExtracting ? 'Extracting...' : 'Re-Run Local LLM'}</span>
            </button>
          </div>

          {/* Model Telemetry Card */}
          {llmTelemetry && (
            <div className="alert-box alert-info" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  ⚡ {llmTelemetry.engine}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  Model: {llmTelemetry.modelName} • Latency: {llmTelemetry.latencyMs}ms • Speed: {llmTelemetry.tokenThroughput}
                </div>
              </div>
              <div className="badge badge-completed" style={{ fontSize: '0.72rem' }}>
                JSON SCHEMA VALIDATED
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            The on-device quantized LLM parsed your natural language observations into standardized record fields. Every field can be reviewed and edited:
          </p>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Beneficiary Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={structuredData.name || ''} 
                onChange={(e) => setStructuredData({ ...structuredData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input 
                type="number" 
                className="form-input" 
                value={structuredData.age || ''} 
                onChange={(e) => setStructuredData({ ...structuredData, age: parseInt(e.target.value, 10) || '' })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                className="form-select" 
                value={structuredData.gender || 'Unknown'} 
                onChange={(e) => setStructuredData({ ...structuredData, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Extracted Primary Observation / Grievance</label>
            <textarea 
              className="form-textarea" 
              rows={2} 
              value={structuredData.issue || ''} 
              onChange={(e) => setStructuredData({ ...structuredData, issue: e.target.value })}
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Estimated Loss / Financial Need (INR)</label>
              <input 
                type="number" 
                className="form-input" 
                value={structuredData.estimated_loss || ''} 
                placeholder="e.g. 35000"
                onChange={(e) => setStructuredData({ ...structuredData, estimated_loss: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority Rating</label>
              <select 
                className="form-select" 
                value={structuredData.priority || 'Medium'} 
                onChange={(e) => setStructuredData({ ...structuredData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assistance Required?</label>
              <select 
                className="form-select" 
                value={structuredData.assistance_required ? 'yes' : 'no'} 
                onChange={(e) => setStructuredData({ ...structuredData, assistance_required: e.target.value === 'yes' })}
              >
                <option value="yes">Yes — Action Required</option>
                <option value="no">No — Record Only</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Recommended Next Step / Referral</label>
            <input 
              type="text" 
              className="form-input" 
              value={structuredData.recommended_action || ''} 
              onChange={(e) => setStructuredData({ ...structuredData, recommended_action: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(4)}>
              <span>Next: Scan ID / Document</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 4: OCR DOCUMENT SCANNER
          ============================================================ */}
      {currentStep === 4 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={18} style={{ color: 'var(--primary-light)' }} />
              <h2 style={{ fontSize: '1.15rem' }}>Document Scanner & On-Device OCR</h2>
            </div>

            <div className="status-pill npu" style={{ fontSize: '0.72rem' }}>
              <ShieldCheck size={13} />
              <span>Edge Privacy Guard</span>
            </div>
          </div>

          {/* Privacy Disclaimer */}
          <div className="alert-box alert-info" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>On-Device Privacy Notice:</strong> In this offline architecture, captured ID photos and document texts are processed entirely on this device using local OCR. No raw identity images are transmitted across the internet during normal operation.
            </div>
          </div>

          {/* Camera Viewfinder or Image Upload */}
          <div className="ocr-preview-container" style={{ marginBottom: '1.25rem' }}>
            {cameraActive ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-md)', background: '#000' }} 
                />
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleCaptureSnapshot}>
                  <Camera size={16} />
                  <span>Capture Photo</span>
                </button>
              </div>
            ) : docImage ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={docImage} alt="Captured Document" className="ocr-image-preview" />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={handleRunOcr} disabled={isOcrProcessing}>
                    <RefreshCw size={15} className={isOcrProcessing ? 'status-dot pulse' : ''} />
                    <span>{isOcrProcessing ? 'Extracting OCR Text...' : 'Run OCR Recognition'}</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => setDocImage(null)}>
                    Clear / Retake
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Camera size={44} style={{ color: 'var(--text-faint)', margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  Capture Beneficiary ID or Document
                </div>
                <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem', maxWidth: '380px' }}>
                  Point camera at Aadhaar card, PAN, Ayushman card, or crop insurance certificate.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleStartCamera}>
                    <Camera size={16} />
                    <span>Open Camera</span>
                  </button>

                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Indian Document Presets */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} />
                <span>Demo Document Samples (1-Click Instant OCR)</span>
              </div>
              <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>INSTANT PARSING</span>
            </div>

            <div className="grid-2">
              {SAMPLE_DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDocPreset(doc)}
                  style={{
                    textAlign: 'left',
                    background: ocrFields.idNumber === doc.sampleNumber ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-surface-elevated)',
                    border: ocrFields.idNumber === doc.sampleNumber ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.title}</span>
                    <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>{doc.sampleNumber}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Beneficiary: {doc.name} • {doc.gender}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extracted Structured OCR Fields */}
          <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                  Extracted Document Fields
                </span>
                {ocrFields.name && ocrFields.name !== 'Not Found' && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderColor: 'rgba(20, 184, 166, 0.4)', color: 'var(--primary-light)' }}
                    onClick={handleApplyOcrToRecord}
                  >
                    <CheckCircle2 size={13} />
                    <span>Apply OCR Name & ID to Beneficiary Record</span>
                  </button>
                )}
              </div>
              {ocrTelemetry && (
                <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>
                  {ocrTelemetry.engine}
                </span>
              )}
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={ocrFields.docType} 
                  onChange={(e) => setOcrFields({ ...ocrFields, docType: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document / ID Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={ocrFields.idNumber} 
                  onChange={(e) => setOcrFields({ ...ocrFields, idNumber: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Name on Document</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={ocrFields.name} 
                  onChange={(e) => setOcrFields({ ...ocrFields, name: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Raw Extracted OCR Text</label>
              <textarea 
                className="form-textarea" 
                rows={2} 
                value={ocrText} 
                onChange={(e) => setOcrText(e.target.value)} 
                placeholder="OCR recognized text will appear here..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(3)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(5)}>
              <span>Next: Final Review</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 5: CONSOLIDATED REVIEW & LOCAL SAVE
          ============================================================ */}
      {currentStep === 5 && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--primary-light)' }} />
                <h2 style={{ fontSize: '1.2rem' }}>Consolidated Field Record</h2>
              </div>
              <div className="status-pill npu" style={{ fontSize: '0.72rem' }}>
                OFFLINE-FIRST STORE READY
              </div>
            </div>

            {/* Person & Visit Summary Box */}
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-light)', textTransform: 'uppercase' }}>
                    Person Details
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Edit Info
                  </button>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{beneficiaryName || structuredData.name || 'Unnamed'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Age: {structuredData.age || 'Not specified'} • Gender: {structuredData.gender || 'Unknown'}
                </div>
                {ocrFields.idNumber && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.35rem' }}>
                    {ocrFields.docType}: {ocrFields.idNumber}
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-light)', textTransform: 'uppercase' }}>
                    Visit Context
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Edit Context
                  </button>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{visitType}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Location: {location}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Worker: {workerName} ({workerId})
                </div>
              </div>
            </div>

            {/* Observation & Extracted Issues */}
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  Observation & Extracted Issue
                </span>
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(2)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Edit Speech
                </button>
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontStyle: 'italic', color: 'var(--text-main)' }}>
                "{transcript || 'No spoken transcript provided'}"
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                <strong>Structured Grievance:</strong> {structuredData.issue || 'Pending extraction'}
              </div>
              {structuredData.estimated_loss && (
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
                  <strong>Estimated Loss:</strong> ₹{Number(structuredData.estimated_loss).toLocaleString('en-IN')}
                </div>
              )}
              {structuredData.recommended_action && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <strong>Next Steps:</strong> {structuredData.recommended_action}
                </div>
              )}
            </div>

            {/* Action & Remarks */}
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Record Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Completed">Completed (Ready to File)</option>
                  <option value="Draft">Draft (Requires Re-visit)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={structuredData.priority} onChange={(e) => setStructuredData({ ...structuredData, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Worker Notes & Field Remarks</label>
              <textarea 
                className="form-textarea" 
                rows={2} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional observations, medicine batches, or village landmarks..."
              />
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(4)}>
              <ArrowLeft size={16} />
              <span>Back to OCR</span>
            </button>

            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleSaveVisit}
              disabled={isSaving}
              style={{ boxShadow: '0 4px 20px rgba(20, 184, 166, 0.4)' }}
            >
              <Save size={20} />
              <span>{isSaving ? 'Saving Locally...' : 'Save to Local Database'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
