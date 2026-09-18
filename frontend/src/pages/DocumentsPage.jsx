import React, { useState } from 'react';
import { 
  FolderArchive, 
  FileCheck2, 
  ShieldCheck, 
  Search, 
  Eye, 
  Lock, 
  Smartphone,
  ExternalLink,
  X
} from 'lucide-react';

export default function DocumentsPage({ visits }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDoc, setActiveDoc] = useState(null);

  // Extract all visits that contain OCR results or document snapshots
  const documentedVisits = visits.filter(
    (v) => (v.ocrResults && v.ocrResults.idNumber) || v.documentSnapshot
  );

  const filteredDocs = documentedVisits.filter((v) => {
    const doc = v.ocrResults || {};
    const text = `${doc.docType || ''} ${doc.idNumber || ''} ${doc.name || ''} ${v.beneficiary || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem' }}>Beneficiary Documents Vault</h1>
          <p style={{ fontSize: '0.85rem' }}>
            On-device localized document records with privacy redaction controls.
          </p>
        </div>

        <div className="status-pill npu" style={{ fontSize: '0.75rem' }}>
          <Lock size={14} />
          <span>Local Storage Only</span>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="alert-box alert-info" style={{ marginBottom: '1.5rem' }}>
        <ShieldCheck size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Strict Privacy Safeguard:</strong> Identity documents (Aadhaar, PAN, Ayushman Cards) captured by field workers are processed exclusively on the user's device memory. Sensitive national identity numbers are partially masked, and high-resolution photographs are not uploaded without explicit cryptographic authorization.
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search documents by Beneficiary Name, Document Type, or ID Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <FileCheck2 size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>No documents in vault yet</div>
          <p style={{ fontSize: '0.825rem' }}>
            Capture an ID or document during a field visit to see OCR records here.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredDocs.map((visit) => {
            const doc = visit.ocrResults || {};
            return (
              <div key={visit.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                    {doc.docType || 'Identity Document'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {visit.id}
                  </span>
                </div>

                {/* Thumbnail Preview */}
                {visit.documentSnapshot ? (
                  <img 
                    src={visit.documentSnapshot} 
                    alt="Document" 
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border-subtle)' }}>
                    <FileCheck2 size={32} />
                  </div>
                )}

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {doc.name || visit.beneficiary}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    ID: {doc.idNumber || 'Not extracted'}
                  </div>
                  {doc.dob && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      DOB: {doc.dob} • Gender: {doc.gender || 'Unknown'}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    {new Date(visit.createdAt).toLocaleDateString()}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveDoc(visit)}
                  >
                    <Eye size={13} />
                    <span>View OCR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Detail Modal */}
      {activeDoc && (
        <div className="modal-backdrop" onClick={() => setActiveDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                  {activeDoc.ocrResults?.docType || 'Document'}
                </span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                  {activeDoc.ocrResults?.name || activeDoc.beneficiary}
                </h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setActiveDoc(null)}>
                <X size={18} />
              </button>
            </div>

            {activeDoc.documentSnapshot && (
              <img 
                src={activeDoc.documentSnapshot} 
                alt="Document Full" 
                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', background: '#000', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} 
              />
            )}

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Parsed ID / Policy Number</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>
                {activeDoc.ocrResults?.idNumber}
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.35rem' }}>
                Raw Extracted OCR Text
              </div>
              <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                {activeDoc.ocrResults?.extractedText || 'No raw text available'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => setActiveDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
