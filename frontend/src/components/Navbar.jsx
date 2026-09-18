import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  PlusCircle, 
  LayoutDashboard, 
  FileText, 
  FolderArchive, 
  Settings, 
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  setCurrentPage, 
  isOnline, 
  isSimulatedOffline, 
  toggleOfflineSimulation, 
  pendingSyncCount, 
  isSyncing, 
  onTriggerSync 
}) {
  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="brand" onClick={() => setCurrentPage('dashboard')}>
          <div className="brand-icon">
            <Radio size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>SahAI</span>
              <span className="brand-text-accent">Field</span>
              <span className="badge badge-draft" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>EDGE AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 500 }}>
              Offline-First AI for Rural Fieldwork
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links" style={{ display: 'none' }} id="desktop-nav">
          <button 
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-link ${currentPage === 'new-visit' ? 'active' : ''}`}
            onClick={() => setCurrentPage('new-visit')}
          >
            <PlusCircle size={16} />
            <span>New Visit</span>
          </button>
          <button 
            className={`nav-link ${currentPage === 'records' ? 'active' : ''}`}
            onClick={() => setCurrentPage('records')}
          >
            <FileText size={16} />
            <span>Records</span>
            {pendingSyncCount > 0 && (
              <span className="badge badge-pending" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>
                {pendingSyncCount}
              </span>
            )}
          </button>
          <button 
            className={`nav-link ${currentPage === 'documents' ? 'active' : ''}`}
            onClick={() => setCurrentPage('documents')}
          >
            <FolderArchive size={16} />
            <span>Documents</span>
          </button>
          <button 
            className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <Settings size={16} />
            <span>Platform Studio</span>
          </button>
        </nav>

        {/* Status Badges and Sync Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* NPU Ready Chip */}
          <div 
            className="status-pill npu" 
            style={{ cursor: 'pointer', display: 'none' }} 
            id="npu-indicator"
            onClick={() => setCurrentPage('settings')}
            title="Snapdragon NPU Architecture Ready"
          >
            <Cpu size={14} />
            <span style={{ fontSize: '0.7rem' }}>NPU Ready</span>
          </div>

          {/* Connectivity Status Badge with Quick Toggle */}
          <button
            onClick={toggleOfflineSimulation}
            className={`status-pill ${effectiveOnline ? 'online' : 'offline'}`}
            title={`Click to simulate ${effectiveOnline ? 'Offline' : 'Online'} mode for testing`}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            <span className={`status-dot ${effectiveOnline ? 'online' : 'offline pulse'}`} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {effectiveOnline ? (
                <>
                  <Wifi size={13} />
                  <span>Online — Sync Ready</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  <span>Offline — Working Locally</span>
                </>
              )}
            </span>
          </button>

          {/* Sync Trigger Button */}
          {effectiveOnline && (
            <button 
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              onClick={onTriggerSync}
              disabled={isSyncing}
              title="Sync pending offline records with cloud backend"
            >
              <RefreshCw size={14} className={isSyncing ? 'status-dot pulse' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              {pendingSyncCount > 0 && (
                <span style={{ 
                  background: 'white', 
                  color: 'var(--primary)', 
                  borderRadius: '50%', 
                  width: '16px', 
                  height: '16px', 
                  fontSize: '0.7rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 800 
                }}>
                  {pendingSyncCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 820px) {
          #desktop-nav { display: flex !important; }
          #npu-indicator { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
