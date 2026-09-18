import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Lock
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { speechService, SPEECH_ENGINES } from '../services/speechService';
import { localLLM, LLM_ENGINES } from '../services/llmService';
import { ocrService, OCR_ENGINES } from '../services/ocrService';

export default function SettingsPage({ onDataModified, isOnline, isSimulatedOffline, toggleOfflineSimulation }) {
  const [speechEngine, setSpeechEngine] = useState(speechService.getEngine());
  const [llmEngine, setLlmEngine] = useState(localLLM.getEngine());
  const [ocrEngine, setOcrEngine] = useState(ocrService.getEngine());
  const [statusMessage, setStatusMessage] = useState('');

  // Engine change handlers
  const handleSpeechEngineChange = (engine) => {
    speechService.setEngine(engine);
    setSpeechEngine(engine);
    showNotice(`Speech engine switched to: ${engine}`);
  };

  const handleLlmEngineChange = (engine) => {
    localLLM.setEngine(engine);
    setLlmEngine(engine);
    showNotice(`Local LLM engine switched to: ${engine}`);
  };

  const handleOcrEngineChange = (engine) => {
    ocrService.setEngine(engine);
    setOcrEngine(engine);
    showNotice(`OCR engine switched to: ${engine}`);
  };

  const showNotice = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Seed Data
  const handleSeedData = async () => {
    await storageService.seedDemoData();
    onDataModified();
    showNotice('Sample rural field visits seeded successfully!');
  };

  // Purge Data
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to delete ALL local visits and documents from IndexedDB?')) {
      await storageService.clearAllData();
      onDataModified();
      showNotice('All local records purged.');
    }
  };

  // Export All
  const handleExportAll = async () => {
    const visits = await storageService.getAllVisits();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(visits, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SahAI_Field_Complete_Export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice('Export downloaded successfully.');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem' }}>Edge AI & Hardware Settings</h1>
          <p style={{ fontSize: '0.85rem' }}>
            Configure on-device AI runtimes, Qualcomm Snapdragon NPU pipeline, and local storage.
          </p>
        </div>

        {statusMessage && (
          <div className="badge badge-completed" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Network Simulation Controller */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Network Environment Simulator</span>
            </div>
            <p style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
              Simulate total disconnection from the internet to test and demo genuine offline behavior without turning off your computer's Wi-Fi.
            </p>
          </div>

          <button 
            className={`btn ${isSimulatedOffline ? 'btn-danger' : 'btn-secondary'}`}
            onClick={toggleOfflineSimulation}
          >
            {isSimulatedOffline ? '🔴 End Offline Simulation' : '🔴 Simulate Offline Mode'}
          </button>
        </div>
      </div>

      {/* Section 1: Qualcomm Snapdragon NPU Architecture */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(99, 102, 241, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Snapdragon NPU Integration Pipeline</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: Qualcomm Snapdragon 8 Gen / Snapdragon X Elite Hexagon NPU</div>
            </div>
          </div>

          <div className="status-pill npu">
            <Sparkles size={13} />
            <span>NPU Integration Ready</span>
          </div>
        </div>

        {/* Conceptual Pipeline Visualization */}
        <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            On-Device Execution Graph
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#5eead4', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
              USER SPEECH
            </div>
            <span style={{ color: 'var(--text-faint)' }}>➔</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              WHISPER (INT8)
            </div>
            <span style={{ color: 'var(--text-faint)' }}>➔</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              TRANSCRIPT
            </div>
            <span style={{ color: 'var(--text-faint)' }}>➔</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              QUANTIZED LLM (INT4)
            </div>
            <span style={{ color: 'var(--text-faint)' }}>➔</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              JSON SCHEMA
            </div>
            <span style={{ color: 'var(--text-faint)' }}>➔</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              INDEXEDDB
            </div>
          </div>
        </div>

        {/* Engine Abstraction Selectors */}
        <div className="grid-3">
          {/* Speech Engine */}
          <div className="form-group">
            <label className="form-label">Speech-To-Text Engine</label>
            <select 
              className="form-select" 
              value={speechEngine} 
              onChange={(e) => handleSpeechEngineChange(e.target.value)}
            >
              <option value={SPEECH_ENGINES.DEMO_WHISPER}>Demo Mode (Whisper Preset/Audio Mock)</option>
              <option value={SPEECH_ENGINES.BROWSER_WEBSPEECH}>Browser Web Speech API (Local Mic)</option>
              <option value={SPEECH_ENGINES.NPU_WHISPER}>Snapdragon NPU Whisper (Simulated QNN)</option>
            </select>
          </div>

          {/* LLM Engine */}
          <div className="form-group">
            <label className="form-label">Structured LLM Engine</label>
            <select 
              className="form-select" 
              value={llmEngine} 
              onChange={(e) => handleLlmEngineChange(e.target.value)}
            >
              <option value={LLM_ENGINES.DEMO_LLM}>Demo Local LLM (Rule + Mock)</option>
              <option value={LLM_ENGINES.SNAPDRAGON_NPU}>Snapdragon NPU QNN (Llama 3.2 INT4)</option>
            </select>
          </div>

          {/* OCR Engine */}
          <div className="form-group">
            <label className="form-label">OCR Document Engine</label>
            <select 
              className="form-select" 
              value={ocrEngine} 
              onChange={(e) => handleOcrEngineChange(e.target.value)}
            >
              <option value={OCR_ENGINES.DEMO_PRESET}>Demo Mode (Indian Document Presets)</option>
              <option value={OCR_ENGINES.BROWSER_WASM_TESSERACT}>Browser Tesseract WebAssembly</option>
              <option value={OCR_ENGINES.SNAPDRAGON_NPU_VISION}>Snapdragon NPU Mobile Vision</option>
            </select>
          </div>
        </div>

        {/* Engineering Integrity Notice */}
        <div className="alert-box alert-warning" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Engineering Transparency:</strong> Browsers do not possess native direct kernel drivers for Snapdragon Hexagon NPU. Rather than faking real execution, SahAI Field establishes a standardized service abstraction layer (<code>/services/speechService</code>, <code>/services/llmService</code>, <code>/services/ocrService</code>) ready to link directly to native Qualcomm AI Hub ONNX / QNN C++ libraries when compiled as an Android or Windows on Snapdragon native application.
          </div>
        </div>
      </div>

      {/* Section 2: Privacy & Security Guarantees */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(16, 185, 129, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Privacy & Data Sovereignty</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Local-first security model for rural beneficiaries</div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-light)', marginBottom: '0.35rem' }}>
              Zero Mandatory Cloud Transmission
            </div>
            <p style={{ fontSize: '0.8rem' }}>
              Observations and documents remain in browser IndexedDB storage until explicitly uploaded by the authenticated field worker.
            </p>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              User-Controlled Lifecycle
            </div>
            <p style={{ fontSize: '0.8rem' }}>
              Records can be inspected, corrected, exported, or deleted on-device at any moment without server permission.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Data Management & Storage Operations */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(6, 182, 212, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Database size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>IndexedDB Storage Controls</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Backup, restore, and seed demo records</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleSeedData}>
            <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>Seed Sample Field Visits</span>
          </button>

          <button className="btn btn-secondary" onClick={handleExportAll}>
            <Download size={16} />
            <span>Export Database (JSON)</span>
          </button>

          <button className="btn btn-danger" onClick={handleClearData}>
            <Trash2 size={16} />
            <span>Purge Local Database</span>
          </button>
        </div>
      </div>
    </div>
  );
}
