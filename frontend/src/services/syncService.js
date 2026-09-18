import { storageService } from './storageService';

const API_BASE = '/api';

class SyncService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Check if backend synchronization server is reachable
   */
  async checkServerHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s quick probe

      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { isOnline: true, serverData: data };
      }
      return { isOnline: false, error: 'Server returned non-200' };
    } catch (err) {
      return { isOnline: false, error: err.message || 'Server unreachable' };
    }
  }

  /**
   * Sync all pending local records to the backend
   */
  async syncPendingRecords() {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;

    try {
      // 1. Fetch pending records from IndexedDB
      const allVisits = await storageService.getAllVisits();
      const pending = allVisits.filter(
        (v) => v.syncStatus === 'Pending Sync' || v.syncStatus === 'Draft' || !v.syncStatus
      );

      if (pending.length === 0) {
        this.isSyncing = false;
        return {
          success: true,
          syncedCount: 0,
          message: 'All records are already synchronized.'
        };
      }

      // 2. Transmit batch to backend
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visits: pending })
      });

      if (!res.ok) {
        throw new Error(`Sync server responded with code ${res.status}`);
      }

      const result = await res.json();
      const syncTime = result.timestamp || new Date().toISOString();

      // 3. Mark synchronized records in IndexedDB
      for (const visit of pending) {
        await storageService.saveVisit({
          ...visit,
          syncStatus: 'Synced',
          syncedAt: syncTime
        });
      }

      this.isSyncing = false;
      return {
        success: true,
        syncedCount: pending.length,
        serverResult: result,
        message: `Successfully synchronized ${pending.length} record(s) with cloud registry.`
      };
    } catch (err) {
      this.isSyncing = false;
      console.warn('Optional sync skipped or failed (safe for offline operation):', err.message);
      return {
        success: false,
        error: err.message,
        message: 'Could not reach sync server. Records remain safe in offline local storage.'
      };
    }
  }

  /**
   * Sync a single specific visit
   */
  async syncSingleRecord(visit) {
    try {
      const res = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visit)
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const updated = {
        ...visit,
        syncStatus: 'Synced',
        syncedAt: new Date().toISOString()
      };
      await storageService.saveVisit(updated);

      return { success: true, visit: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const syncService = new SyncService();
