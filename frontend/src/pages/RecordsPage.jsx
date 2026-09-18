import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle,
  X,
  Database,
  Printer
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';

export default function RecordsPage({ 
  visits, 
  onRefreshVisits, 
  isOnline, 
  isSimulatedOffline, 
  onTriggerSync, 
  isSyncing 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [singleSyncingId, setSingleSyncingId] = useState(null);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Filtered visits
  const filteredVisits = visits.filter((v) => {
    const matchesSearch = 
      (v.id && v.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.beneficiary && v.beneficiary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.location && v.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.worker && v.worker.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Completed') return matchesSearch && v.status === 'Completed';
    if (statusFilter === 'Draft') return matchesSearch && v.status === 'Draft';
    if (statusFilter === 'Pending Sync') return matchesSearch && (v.syncStatus === 'Pending Sync' || !v.syncStatus);
    if (statusFilter === 'Synced') return matchesSearch && v.syncStatus === 'Synced';

    return matchesSearch;
  });

  // Handler: Delete Visit
  const handleDeleteVisit = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete visit record ${id}?`)) {
      await storageService.deleteVisit(id);
      if (selectedVisit && selectedVisit.id === id) {
        setSelectedVisit(null);
      }
      onRefreshVisits();
    }
  };

  // Handler: Single Record Sync
  const handleSingleSync = async (visit, e) => {
    if (e) e.stopPropagation();
    if (!effectiveOnline) {
      alert('Cannot sync: Device is currently in Offline Mode.');
      return;
    }

    setSingleSyncingId(visit.id);
    const res = await syncService.syncSingleRecord(visit);
    setSingleSyncingId(null);

    if (res.success) {
      onRefreshVisits();
      if (selectedVisit && selectedVisit.id === visit.id) {
        setSelectedVisit(res.visit);
      }
    } else {
      alert('Sync failed: ' + res.error);
    }
  };

  // Handler: Export as JSON
  const handleExportJSON = (visit) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(visit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${visit.id}_field_record.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem' }}>Field Visit Records</h1>
          <p style={{ fontSize: '0.85rem' }}>
            Browse and manage all on-device records stored in IndexedDB.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {effectiveOnline && (
            <button 
              className="btn btn-primary" 
              onClick={onTriggerSync}
              disabled={isSyncing}
              style={{ fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={isSyncing ? 'status-dot pulse' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Pending Records'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by Beneficiary, Visit ID, or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['All', 'Completed', 'Draft', 'Pending Sync', 'Synced'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Table / Grid */}
      <div className="card">
        {filteredVisits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Database size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>No records found</div>
            <p style={{ fontSize: '0.825rem' }}>Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Visit ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Beneficiary</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Sync Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => (
                  <tr 
                    key={visit.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => setSelectedVisit(visit)}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-light)' }}>
                      {visit.id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {visit.beneficiary || visit.structuredData?.name || 'Unnamed'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {visit.visitType}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {visit.location}
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
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedVisit(visit); }}
                          title="Inspect record"
                        >
                          <Eye size={13} />
                        </button>

                        {effectiveOnline && visit.syncStatus !== 'Synced' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={(e) => handleSingleSync(visit, e)}
                            disabled={singleSyncingId === visit.id}
                            title="Sync record with cloud"
                          >
                            <RefreshCw size={13} className={singleSyncingId === visit.id ? 'status-dot pulse' : ''} />
                          </button>
                        )}

                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={(e) => handleDeleteVisit(visit.id, e)}
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Inspection Modal */}
      {selectedVisit && (
        <div className="modal-backdrop" onClick={() => setSelectedVisit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-draft" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {selectedVisit.id}
                </span>
                <h2 style={{ fontSize: '1.3rem', marginTop: '0.25rem' }}>
                  {selectedVisit.beneficiary || selectedVisit.structuredData?.name}
                </h2>
              </div>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setSelectedVisit(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              {/* Context */}
              <div className="grid-2">
                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Visit Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedVisit.visitType}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Location</div>
                  <div style={{ fontWeight: 500 }}>{selectedVisit.location}</div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Field Worker</div>
                  <div style={{ fontWeight: 600 }}>{selectedVisit.worker} ({selectedVisit.workerId})</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Created At</div>
                  <div style={{ fontWeight: 500 }}>{new Date(selectedVisit.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Spoken Observation */}
              <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Spoken Observation Transcript
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  "{selectedVisit.transcript || 'No voice transcript recorded'}"
                </p>
              </div>

              {/* Structured JSON */}
              <div>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Quantized LLM Structured Output
                </div>
                <div className="code-block">
                  {JSON.stringify(selectedVisit.structuredData || {}, null, 2)}
                </div>
              </div>

              {/* Document OCR Info */}
              {selectedVisit.ocrResults && (
                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Document OCR Recognition
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    Type: <strong>{selectedVisit.ocrResults.docType}</strong> • ID: <strong>{selectedVisit.ocrResults.idNumber}</strong>
                  </div>
                  {selectedVisit.ocrResults.extractedText && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                      {selectedVisit.ocrResults.extractedText}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem' }}
                onClick={() => handleExportJSON(selectedVisit)}
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print Record</span>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setSelectedVisit(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
