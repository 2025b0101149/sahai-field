import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Data persistence file path
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure records file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Helpers for reading and writing records
const readRecords = () => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading records file:', err);
    return [];
  }
};

const writeRecords = (records) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing records file:', err);
    return false;
  }
};

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Generous payload limit to handle captured ID photos/thumbnails
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'SahAI Field Sync Server',
    storageMode: 'Local JSON Vault (Zero-Config)'
  });
});

// Stats Endpoint
app.get('/api/stats', (req, res) => {
  const records = readRecords();
  const total = records.length;
  const completed = records.filter(r => r.status === 'Completed').length;
  const healthVisits = records.filter(r => r.visitType === 'Health Visit').length;
  const insuranceSurveys = records.filter(r => r.visitType === 'Insurance Survey').length;
  const bankingKyc = records.filter(r => r.visitType === 'Banking/KYC').length;

  res.json({
    totalVisits: total,
    completedRecords: completed,
    healthVisits,
    insuranceSurveys,
    bankingKyc,
    serverTime: new Date().toISOString()
  });
});

// GET all visits
app.get('/api/visits', (req, res) => {
  const records = readRecords();
  res.json({
    count: records.length,
    visits: records
  });
});

// POST single visit
app.post('/api/visits', (req, res) => {
  const visit = req.body;
  if (!visit || !visit.id) {
    return res.status(400).json({ error: 'Invalid visit data: id is required' });
  }

  const records = readRecords();
  const existingIndex = records.findIndex(r => r.id === visit.id);

  const enrichedVisit = {
    ...visit,
    syncedAt: new Date().toISOString(),
    syncStatus: 'Synced'
  };

  if (existingIndex >= 0) {
    records[existingIndex] = enrichedVisit;
  } else {
    records.unshift(enrichedVisit);
  }

  writeRecords(records);

  res.status(201).json({
    message: 'Visit saved successfully',
    visit: enrichedVisit
  });
});

// POST batch sync (idempotent upsert)
app.post('/api/sync', (req, res) => {
  const { visits = [] } = req.body;

  if (!Array.isArray(visits)) {
    return res.status(400).json({ error: 'Expected visits array' });
  }

  const records = readRecords();
  let createdCount = 0;
  let updatedCount = 0;
  const now = new Date().toISOString();

  const syncedVisits = visits.map(visit => {
    const existingIndex = records.findIndex(r => r.id === visit.id);
    const enriched = {
      ...visit,
      syncedAt: now,
      syncStatus: 'Synced'
    };

    if (existingIndex >= 0) {
      records[existingIndex] = enriched;
      updatedCount++;
    } else {
      records.unshift(enriched);
      createdCount++;
    }

    return enriched;
  });

  writeRecords(records);

  res.json({
    status: 'success',
    timestamp: now,
    syncedCount: visits.length,
    createdCount,
    updatedCount,
    totalRecordsOnServer: records.length,
    message: `Synchronized ${visits.length} field records successfully`
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` SahAI Field Sync Server running on port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` Sync:   http://localhost:${PORT}/api/sync`);
  console.log(` Mode:   Offline-Resilient Local JSON Storage`);
  console.log(`=============================================`);
});
