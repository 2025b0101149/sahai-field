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
  Lock,
  Activity,
  Zap,
  FileSpreadsheet,
  FileCode2,
  Sliders,
  Play
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { speechService, SPEECH_ENGINES } from '../services/speechService';
import { localLLM, LLM_ENGINES } from '../services/llmService';
import { ocrService, OCR_ENGINES } from '../services/ocrService';
import { benchmarkService } from '../services/benchmarkService';
import { exportService } from '../services/exportService';
import { BUILTIN_TEMPLATES } from '../services/templateService';

export default function SettingsPage({ onDataModified, isOnline, isSimulatedOffline, toggleOfflineSimulation }) {
  const [speechEngine, setSpeechEngine] = useState(speechService.getEngine());
  const [llmEngine, setLlmEngine] = useState(localLLM.getEngine());
  const [ocrEngine, setOcrEngine] = useState(ocrService.getEngine());
  const [statusMessage, setStatusMessage] = useState('');

  // Benchmark suite state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

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
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Run On-Device Benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkProgress({ step: 0, name: 'Initializing Edge AI Hardware Benchmark...' });
    try {
      const result = await benchmarkService.runFullBenchmark((prog) => {
        setBenchmarkProgress(prog);
      });
      setBenchmarkResult(result);
      showNotice(`Benchmark finished: Score ${result.overallScore}/100 (${result.tier})`);
    } catch (err) {
      console.error('Benchmark failed:', err);
      showNotice('Benchmark encountered an error: ' + err.message);
    } finally {
      setIsBenchmarking(false);
    }
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

  // Multi-Format Exports
  const handleExportJSON = async () => {
    const visits = await storageService.getAllVisits();
    exportService.downloadJSON(visits, `SahAI_Field_Complete_Export_${new Date().toISOString().slice(0, 10)}.json`);
    showNotice('Complete JSON records exported.');
  };

  const handleExportCSV = async () => {
    const visits = await storageService.getAllVisits();
    exportService.exportAsCSV(visits);
    showNotice('CSV spreadsheet exported.');
  };

  const handleExportFHIR = async () => {
    const visits = await storageService.getAllVisits();
    exportService.exportAsFHIRBundle(visits);
    showNotice('ABDM / FHIR R4 Bundle exported.');
  };

  const handleExportPMFBY = async () => {
    const visits = await storageService.getAllVisits();
    exportService.exportAsPMFBYClaims(visits);
    showNotice('PMFBY Crop Claims package exported.');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem' }}>Edge AI Platform & Hardware Studio</h1>
          <p style={{ fontSize: '0.85rem' }}>
            Modular domain schemas, Qualcomm Snapdragon NPU pipeline, and on-device hardware diagnostics.
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

      {/* Section 1: Edge AI Hardware Diagnostic & Benchmark Suite */}
      <div className="card card-glow" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(20, 184, 166, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary-light)'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>On-Device AI Hardware Diagnostics</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Measure real-time STT latency, LLM tok/sec, and NPU compute readiness</div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleRunBenchmark} 
            disabled={isBenchmarking}
            style={{ fontSize: '0.85rem' }}
          >
            <Play size={14} className={isBenchmarking ? 'status-dot pulse' : ''} />
            <span>{isBenchmarking ? 'Benchmarking...' : 'Run Diagnostics'}</span>
          </button>
        </div>

        {/* Diagnostic Progress / Results */}
        {isBenchmarking && benchmarkProgress && (
          <div className="alert-box alert-info" style={{ marginBottom: '1rem' }}>
            <RefreshCw size={18} className="status-dot pulse" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Stage {benchmarkProgress.step}/4: {benchmarkProgress.name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Evaluating on-device compute tensors and memory bandwidth...</div>
            </div>
          </div>
        )}

        {benchmarkResult ? (
          <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Overall Edge AI Capability Score</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.overallScore} / 100
                </div>
              </div>
              <div className="status-pill npu" style={{ fontSize: '0.78rem' }}>
                <Zap size={14} />
                <span>{benchmarkResult.tier}</span>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Whisper STT Latency</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.sttLatencyMs} ms
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local LLM Throughput</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.llmTokensPerSec} tokens / sec
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vision OCR Speed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.ocrLatencyMs} ms / document
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IndexedDB Transaction Speed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.storageIops} IOPS
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Target Verification: <strong>{benchmarkResult.npuReadiness}</strong>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Run the diagnostic suite to benchmark this device's on-device Whisper STT speed, quantized LLM inference token rate, and storage transaction IOPS.
          </p>
        )}
      </div>

      {/* Section 2: Reusable Domain Templates */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(6, 182, 212, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Sliders size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Pluggable Domain Schemas</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reusable workflows configured for healthcare, agriculture, and banking</div>
          </div>
        </div>

        <div className="grid-2">
          {BUILTIN_TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{tmpl.name}</span>
                <span className="badge badge-draft" style={{ fontSize: '0.68rem' }}>{tmpl.category}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tmpl.description}</p>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: 'auto', paddingTop: '0.5rem' }}>
                Standards: {tmpl.standardsCompliance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Qualcomm Snapdragon NPU Architecture */}
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

        {/* Engine Abstraction Selectors */}
        <div className="grid-3">
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
      </div>

      {/* Section 4: Multi-Standard Interoperability & Storage */}
      <div className="card">
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
            <Database size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Data Interoperability & Local Storage</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Export records to national registry formats (FHIR / ABDM, PMFBY, CSV, JSON)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileSpreadsheet size={15} style={{ color: 'var(--accent-emerald)' }} />
            <span>Export CSV Spreadsheet</span>
          </button>

          <button className="btn btn-secondary" onClick={handleExportFHIR}>
            <FileCode2 size={15} style={{ color: 'var(--accent-cyan)' }} />
            <span>Export ABDM / FHIR Bundle</span>
          </button>

          <button className="btn btn-secondary" onClick={handleExportPMFBY}>
            <Download size={15} style={{ color: 'var(--accent-amber)' }} />
            <span>Export PMFBY Crop Claims</span>
          </button>

          <button className="btn btn-secondary" onClick={handleExportJSON}>
            <Download size={15} />
            <span>Export Full JSON</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-secondary" onClick={handleSeedData}>
            <Sparkles size={15} style={{ color: 'var(--primary-light)' }} />
            <span>Seed Sample Field Records</span>
          </button>

          <button className="btn btn-danger" onClick={handleClearData}>
            <Trash2 size={15} />
            <span>Purge Local IndexedDB Database</span>
          </button>
        </div>
      </div>
    </div>
  );
}
