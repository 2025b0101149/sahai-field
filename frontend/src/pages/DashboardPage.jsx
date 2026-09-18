import React from 'react';
import { 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  FileCheck2, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  MapPin, 
  User, 
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export default function DashboardPage({ 
  stats, 
  visits, 
  isOnline, 
  isSimulatedOffline, 
  onStartNewVisit, 
  onStartDemoVisit, 
  onViewVisitDetails, 
  onTriggerSync,
  isSyncing 
}) {
  const effectiveOnline = isOnline && !isSimulatedOffline;
  const recentVisits = visits.slice(0, 5);

  return (
    <div>
      {/* Top Connectivity & Offline Banner */}
      {!effectiveOnline ? (
        <div className="alert-box alert-offline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <WifiOff size={22} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔴 Offline Mode Active</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                Zero internet connection detected. <strong>Your data, voice transcripts, and documents are being processed and stored 100% locally</strong> on this device.
              </div>
            </div>
          </div>
          <div className="badge badge-draft" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            LOCAL-FIRST GUARANTEE
          </div>
        </div>
      ) : (
        <div className="alert-box alert-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wifi size={20} style={{ color: 'var(--online-color)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>🟢 Online — Cloud Sync Available</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Field records are stored in local IndexedDB and can be synced with regional registry at your discretion.
              </div>
            </div>
          </div>
          {stats.pendingRecords > 0 && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={onTriggerSync}
              disabled={isSyncing}
            >
              <RefreshCw size={14} className={isSyncing ? 'status-dot pulse' : ''} />
              <span>{isSyncing ? 'Syncing...' : `Sync ${stats.pendingRecords} Records`}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Hero Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
            SahAI Field Dashboard
          </h1>
          <p style={{ fontSize: '0.925rem' }}>
            On-device intelligent edge assistant for health workers, insurance surveyors, and banking correspondents.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onStartDemoVisit}
            title="Pre-populate with sample field observation for instant demo"
            style={{ border: '1px solid rgba(20, 184, 166, 0.3)' }}
          >
            <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>Demo Mode</span>
          </button>

          <button 
            className="btn btn-primary btn-lg" 
            onClick={onStartNewVisit}
          >
            <PlusCircle size={20} />
            <span>+ New Field Visit</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent-gradient': 'linear-gradient(to right, #0d9488, #14b8a6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Total Visits</span>
            <Database size={16} style={{ color: 'var(--primary-light)' }} />
          </div>
          <div className="stat-value">{stats.totalVisits}</div>
        </div>

        <div className="stat-card" style={{ '--accent-gradient': 'linear-gradient(to right, #10b981, #34d399)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Completed</span>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="stat-value">{stats.completedRecords}</div>
        </div>

        <div className="stat-card" style={{ '--accent-gradient': 'linear-gradient(to right, #f59e0b, #fbbf24)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Pending Sync</span>
            <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="stat-value">{stats.pendingRecords}</div>
        </div>

        <div className="stat-card" style={{ '--accent-gradient': 'linear-gradient(to right, #6366f1, #818cf8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Offline Records</span>
            <Smartphone size={16} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="stat-value">{stats.offlineRecords}</div>
        </div>

        <div className="stat-card" style={{ '--accent-gradient': 'linear-gradient(to right, #06b6d4, #38bdf8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Docs Processed</span>
            <FileCheck2 size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="stat-value">{stats.documentsProcessed}</div>
        </div>
      </div>

      {/* Field Worker Context & NPU Banner Card */}
      <div className="card card-glow" style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              background: 'rgba(20, 184, 166, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary-light)'
            }}>
              <User size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.975rem' }}>Active Field Worker: Sunita Sharma</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>ID: ASH-UP-042 (Health Worker)</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={12} /> Varanasi District, Sector 4
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="status-pill npu" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={14} />
              <span>Zero Cloud Dependency Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Field Visits Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Recent Field Visits</h2>
            <p style={{ fontSize: '0.825rem' }}>Saved locally in browser IndexedDB vault</p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => onViewVisitDetails(null, 'all')}
          >
            <span>View All Records</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentVisits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Database size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>No field visits recorded yet</div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Start your first offline visit using natural voice notes and document OCR.
            </p>
            <button className="btn btn-primary" onClick={onStartNewVisit}>
              <PlusCircle size={16} />
              <span>Start First Visit</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.775rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Visit ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Beneficiary</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Visit Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Sync</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit) => (
                  <tr 
                    key={visit.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-light)' }}>
                      {visit.id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {visit.beneficiary || visit.structuredData?.name || 'Unnamed'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {visit.visitType}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {visit.location || 'Not Specified'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${visit.status === 'Completed' ? 'badge-completed' : 'badge-draft'}`}>
                        {visit.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${visit.syncStatus === 'Synced' ? 'badge-synced' : 'badge-pending'}`}>
                        {visit.syncStatus || 'Pending Sync'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                        onClick={() => onViewVisitDetails(visit)}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
