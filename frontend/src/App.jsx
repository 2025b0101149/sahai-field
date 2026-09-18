import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import NewVisitPage from './pages/NewVisitPage';
import RecordsPage from './pages/RecordsPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import { storageService } from './services/storageService';
import { syncService } from './services/syncService';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  FolderArchive, 
  Settings, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedRecords: 0,
    pendingRecords: 0,
    offlineRecords: 0,
    documentsProcessed: 0
  });

  // Connectivity
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Pre-seed demo payload for "Demo Mode" quick launch
  const [demoPayload, setDemoPayload] = useState(null);

  // Show Toast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load visits and stats from IndexedDB
  const refreshData = async () => {
    try {
      // Auto seed sample data on first run if database is fresh
      await storageService.seedDemoData();
      const loadedVisits = await storageService.getAllVisits();
      const loadedStats = await storageService.getDashboardStats();
      setVisits(loadedVisits);
      setStats(loadedStats);
    } catch (err) {
      console.error('Failed to load local storage data:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // Listen to browser network changes
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Cloud sync is available.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network disconnected. Operating 100% locally.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Trigger
  const handleTriggerSync = async () => {
    if (!isOnline || isSimulatedOffline) {
      showToast('Cannot sync while in Offline Mode.', 'warning');
      return;
    }

    setIsSyncing(true);
    const result = await syncService.syncPendingRecords();
    setIsSyncing(false);

    if (result.success) {
      showToast(result.message, 'success');
      refreshData();
    } else {
      showToast(result.message, 'warning');
    }
  };

  // Quick Demo Mode Visit Launcher
  const handleStartDemoVisit = () => {
    setDemoPayload({
      beneficiary: 'Sita Devi',
      visitType: 'Health Visit',
      location: 'Rampur Village, Ward 4',
      transcript: 'Visited Sita Devi at her home. She is 38 years old. She reported high fever and continuous cough for 4 days. Blood pressure recorded at 125 over 82. Prescribed paracetamol and scheduled an appointment at Primary Health Centre on Thursday. Needs urgent follow-up.',
      structuredData: {
        name: 'Sita Devi',
        age: 38,
        gender: 'Female',
        issue: 'High fever, continuous cough for 4 days',
        estimated_loss: null,
        assistance_required: true,
        follow_up_required: true,
        priority: 'High',
        recommended_action: 'Primary Health Centre consultation & 48-hour follow-up.'
      },
      ocrResults: {
        docType: 'Ayushman Bharat Card',
        idNumber: 'AB-9921-8834-0129',
        name: 'Sita Devi',
        dob: '1988',
        gender: 'Female',
        extractedText: 'PM-JAY GOLD CARD\nName: Sita Devi\nID: AB-9921-8834-0129\nGender: Female\nDOB: 1988'
      }
    });
    setCurrentPage('new-visit');
  };

  const handleStartCleanVisit = () => {
    setDemoPayload(null);
    setCurrentPage('new-visit');
  };

  const handleVisitSaved = () => {
    refreshData();
    setCurrentPage('records');
    showToast('Field record saved to local IndexedDB successfully!', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        toggleOfflineSimulation={() => {
          const next = !isSimulatedOffline;
          setIsSimulatedOffline(next);
          showToast(next ? 'Simulated Offline Mode enabled' : 'Simulated Offline Mode disabled', 'info');
        }}
        pendingSyncCount={stats.pendingRecords}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
      />

      {/* Main Content Area */}
      <main className="app-container" style={{ flex: 1 }}>
        {currentPage === 'dashboard' && (
          <DashboardPage 
            stats={stats}
            visits={visits}
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onStartNewVisit={handleStartCleanVisit}
            onStartDemoVisit={handleStartDemoVisit}
            onViewVisitDetails={(visit, target = 'records') => {
              setCurrentPage('records');
            }}
            onTriggerSync={handleTriggerSync}
            isSyncing={isSyncing}
          />
        )}

        {currentPage === 'new-visit' && (
          <NewVisitPage 
            initialDemoData={demoPayload}
            onVisitSaved={handleVisitSaved}
            onCancel={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'records' && (
          <RecordsPage 
            visits={visits}
            onRefreshVisits={refreshData}
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onTriggerSync={handleTriggerSync}
            isSyncing={isSyncing}
          />
        )}

        {currentPage === 'documents' && (
          <DocumentsPage visits={visits} />
        )}

        {currentPage === 'settings' && (
          <SettingsPage 
            onDataModified={refreshData}
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            toggleOfflineSimulation={() => setIsSimulatedOffline(!isSimulatedOffline)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav">
        <div 
          className={`mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        <div 
          className={`mobile-nav-item ${currentPage === 'new-visit' ? 'active' : ''}`}
          onClick={handleStartCleanVisit}
        >
          <PlusCircle size={20} />
          <span>New Visit</span>
        </div>
        <div 
          className={`mobile-nav-item ${currentPage === 'records' ? 'active' : ''}`}
          onClick={() => setCurrentPage('records')}
        >
          <FileText size={20} />
          <span>Records</span>
        </div>
        <div 
          className={`mobile-nav-item ${currentPage === 'documents' ? 'active' : ''}`}
          onClick={() => setCurrentPage('documents')}
        >
          <FolderArchive size={20} />
          <span>Docs</span>
        </div>
        <div 
          className={`mobile-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
        >
          <Settings size={20} />
          <span>NPU</span>
        </div>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--accent-cyan)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
