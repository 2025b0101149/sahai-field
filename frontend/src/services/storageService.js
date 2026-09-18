import { openDB } from 'idb';

const DB_NAME = 'SahAIFieldDB';
const DB_VERSION = 1;

/**
 * Initialize and return the IndexedDB database instance
 */
export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Visits store
      if (!db.objectStoreNames.contains('visits')) {
        const visitStore = db.createObjectStore('visits', { keyPath: 'id' });
        visitStore.createIndex('createdAt', 'createdAt');
        visitStore.createIndex('status', 'status');
        visitStore.createIndex('syncStatus', 'syncStatus');
        visitStore.createIndex('workerId', 'workerId');
      }

      // Processed Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('visitId', 'visitId');
        docStore.createIndex('createdAt', 'createdAt');
      }

      // App Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

/**
 * Storage Service API
 */
export const storageService = {
  // Visits
  async getAllVisits() {
    const db = await getDB();
    const visits = await db.getAllFromIndex('visits', 'createdAt');
    return visits.reverse(); // Newest first
  },

  async getVisitById(id) {
    const db = await getDB();
    return await db.get('visits', id);
  },

  async saveVisit(visit) {
    const db = await getDB();
    const now = new Date().toISOString();
    const record = {
      ...visit,
      updatedAt: now,
      createdAt: visit.createdAt || now,
      syncStatus: visit.syncStatus || 'Pending Sync',
      status: visit.status || 'Completed'
    };
    await db.put('visits', record);
    return record;
  },

  async deleteVisit(id) {
    const db = await getDB();
    await db.delete('visits', id);
    // Also delete any associated documents
    const tx = db.transaction('documents', 'readwrite');
    const index = tx.store.index('visitId');
    let cursor = await index.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  // Documents
  async saveDocument(doc) {
    const db = await getDB();
    const now = new Date().toISOString();
    const documentRecord = {
      ...doc,
      id: doc.id || 'DOC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      createdAt: doc.createdAt || now
    };
    await db.put('documents', documentRecord);
    return documentRecord;
  },

  async getDocumentsForVisit(visitId) {
    const db = await getDB();
    return await db.getAllFromIndex('documents', 'visitId', visitId);
  },

  async getAllDocuments() {
    const db = await getDB();
    return await db.getAll('documents');
  },

  // Dashboard Metrics & Stats
  async getDashboardStats() {
    const db = await getDB();
    const visits = await db.getAll('visits');
    const documents = await db.getAll('documents');

    const total = visits.length;
    const completed = visits.filter(v => v.status === 'Completed').length;
    const pending = visits.filter(v => v.status === 'Draft' || v.syncStatus === 'Pending Sync').length;
    const offlineRecords = visits.filter(v => v.syncStatus === 'Pending Sync' || v.syncStatus === 'Offline Local').length;
    const visitsWithDocs = visits.filter(v => (v.ocrResults && v.ocrResults.idNumber) || v.documentSnapshot || (v.documents && v.documents.length > 0)).length;
    const docsProcessed = Math.max(documents.length, visitsWithDocs);

    return {
      totalVisits: total,
      completedRecords: completed,
      pendingRecords: pending,
      offlineRecords,
      documentsProcessed: docsProcessed
    };
  },

  // Settings
  async getSetting(key, defaultValue = null) {
    const db = await getDB();
    const record = await db.get('settings', key);
    return record ? record.value : defaultValue;
  },

  async setSetting(key, value) {
    const db = await getDB();
    await db.put('settings', { key, value });
  },

  // Database Purge / Reset
  async clearAllData() {
    const db = await getDB();
    await db.clear('visits');
    await db.clear('documents');
  },

  // Sample Seed Data for Hackathon Presentation
  async seedDemoData() {
    const db = await getDB();
    const count = await db.count('visits');
    if (count > 0) return false; // Don't overwrite existing

    const demoVisits = [
      {
        id: 'VF-2026-0811',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        worker: 'Sunita Sharma (ASHA)',
        workerId: 'ASH-UP-042',
        visitType: 'Health Visit',
        location: 'Rampur Village, Ward 4',
        beneficiary: 'Sita Devi',
        status: 'Completed',
        syncStatus: 'Pending Sync',
        transcript: 'Visited Sita Devi at her home. She is 38 years old. She has been experiencing fever, persistent cough, and fatigue for the past 4 days. Blood pressure was measured at 125/82. Prescribed paracetamol and scheduled an appointment at the Community Health Centre on Thursday. Needs urgent follow-up.',
        structuredData: {
          name: 'Sita Devi',
          age: 38,
          gender: 'Female',
          issue: 'Fever, persistent cough, and fatigue for 4 days',
          health_metrics: 'BP 125/82, elevated temp',
          assistance_required: true,
          follow_up_required: true,
          priority: 'High',
          estimated_loss: null
        },
        ocrResults: {
          docType: 'Ayushman Bharat Card',
          idNumber: 'AB-9921-8834-0129',
          name: 'Sita Devi',
          extractedText: 'GOVERNMENT OF INDIA - AYUSHMAN BHARAT\nPM-JAY GOLD CARD\nName: Sita Devi\nID: AB-9921-8834-0129\nDOB: 1988\nGender: Female\nDistrict: Varanasi'
        },
        notes: 'Primary health kit provided. Family informed regarding free CHC transport.'
      },
      {
        id: 'VF-2026-0812',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        worker: 'Rajesh Verma (Surveyor)',
        workerId: 'INS-HR-109',
        visitType: 'Insurance Survey',
        location: 'Khizrabad Sector 2, Farmland #18',
        beneficiary: 'Ramesh Kumar',
        status: 'Completed',
        syncStatus: 'Synced',
        syncedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        transcript: 'Visited Ramesh Kumar today. He is 42 years old. His paddy crop was heavily inundated and damaged after unseasonal heavy rain. Estimated crop loss is around thirty-five thousand rupees. He needs financial assistance under PM Fasal Bima Yojana.',
        structuredData: {
          name: 'Ramesh Kumar',
          age: 42,
          gender: 'Male',
          issue: 'Paddy crop inundated & damaged after heavy unseasonal rain',
          estimated_loss: 35000,
          assistance_required: true,
          follow_up_required: true,
          priority: 'High'
        },
        ocrResults: {
          docType: 'Aadhaar Card',
          idNumber: 'XXXX-XXXX-8921',
          name: 'Ramesh Kumar',
          extractedText: 'GOVERNMENT OF INDIA\nUnique Identification Authority of India\nTo: Ramesh Kumar\nDOB: 14/05/1984\nGender: Male\nAadhaar No: XXXX-XXXX-8921'
        },
        notes: 'GPS field photos attached to land registry certificate.'
      }
    ];

    for (const v of demoVisits) {
      await db.put('visits', v);
    }
    return true;
  }
};
