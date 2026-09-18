/**
 * Multi-Standard Interoperability & Export Service for SahAI Field
 * 
 * Supports exporting offline records in:
 * 1. Standard JSON
 * 2. ABDM / FHIR R4 Bundle format (National Digital Health Mission)
 * 3. PMFBY Agronomy Claim format (Crop Insurance)
 * 4. CSV (Tabular data for Excel / Google Sheets)
 */

export const exportService = {
  /**
   * Export as standard JSON
   */
  downloadJSON(data, filename = 'sahai_field_records.json') {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    this._triggerDownload(jsonStr, filename);
  },

  /**
   * Export Health visits as an ABDM / FHIR R4 Compliant Bundle
   */
  exportAsFHIRBundle(visits) {
    const healthVisits = visits.filter(v => v.visitType === 'Health Visit');
    const fhirBundle = {
      resourceType: 'Bundle',
      id: 'sahai-field-abdm-' + Date.now(),
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: healthVisits.map(visit => ({
        resource: {
          resourceType: 'Encounter',
          id: visit.id,
          status: visit.status === 'Completed' ? 'finished' : 'planned',
          subject: {
            display: visit.beneficiary || visit.structuredData?.name,
            identifier: {
              system: 'https://healthid.abdm.gov.in',
              value: visit.ocrResults?.idNumber || 'UNLINKED'
            }
          },
          participant: [
            {
              individual: {
                display: visit.worker,
                identifier: { value: visit.workerId }
              }
            }
          ],
          period: { start: visit.createdAt },
          reasonCode: [
            {
              text: visit.structuredData?.issue || visit.transcript
            }
          ],
          location: [
            {
              location: { display: visit.location }
            }
          ]
        }
      }))
    };

    this.downloadJSON(fhirBundle, `ABDM_FHIR_Bundle_${new Date().toISOString().slice(0, 10)}.json`);
  },

  /**
   * Export Insurance surveys as PMFBY Claim Schema
   */
  exportAsPMFBYClaims(visits) {
    const insuranceVisits = visits.filter(v => v.visitType === 'Insurance Survey');
    const pmfbyClaims = {
      schemaVersion: 'PMFBY-FIELD-V2.1',
      generatedAt: new Date().toISOString(),
      totalClaims: insuranceVisits.length,
      records: insuranceVisits.map(v => ({
        claimId: v.id,
        farmerName: v.beneficiary || v.structuredData?.name,
        aadhaarMasked: v.ocrResults?.idNumber,
        surveyLocation: v.location,
        cropLossReported: v.structuredData?.issue,
        estimatedLossInr: v.structuredData?.estimated_loss,
        inspectionOfficer: v.worker,
        inspectionDate: v.createdAt,
        fastTrackRecommended: v.structuredData?.assistance_required,
        priority: v.structuredData?.priority
      }))
    };

    this.downloadJSON(pmfbyClaims, `PMFBY_Crop_Claims_${new Date().toISOString().slice(0, 10)}.json`);
  },

  /**
   * Export visits as a CSV spreadsheet
   */
  exportAsCSV(visits) {
    if (!visits || visits.length === 0) return;

    const headers = [
      'Visit ID',
      'Date',
      'Worker Name',
      'Worker ID',
      'Beneficiary',
      'Visit Type',
      'Location',
      'Observation / Issue',
      'Estimated Loss (INR)',
      'Document Type',
      'ID Number',
      'Priority',
      'Status',
      'Sync Status'
    ];

    const rows = visits.map(v => [
      v.id,
      v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '',
      `"${(v.worker || '').replace(/"/g, '""')}"`,
      v.workerId || '',
      `"${(v.beneficiary || v.structuredData?.name || '').replace(/"/g, '""')}"`,
      v.visitType || '',
      `"${(v.location || '').replace(/"/g, '""')}"`,
      `"${(v.structuredData?.issue || v.transcript || '').replace(/"/g, '""')}"`,
      v.structuredData?.estimated_loss || '',
      v.ocrResults?.docType || '',
      v.ocrResults?.idNumber || '',
      v.structuredData?.priority || 'Medium',
      v.status || 'Completed',
      v.syncStatus || 'Pending Sync'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    this._triggerDownload(url, `SahAI_Field_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  _triggerDownload(urlOrData, filename) {
    const link = document.createElement('a');
    link.setAttribute('href', urlOrData);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
