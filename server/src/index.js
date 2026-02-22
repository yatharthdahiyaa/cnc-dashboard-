// server/src/index.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import https from 'https';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import googleSheetService from './services/GoogleSheetService.js';
import authMiddleware from './middleware/authMiddleware.js';
import { validateBulkPush, validateSinglePush } from './middleware/validatePayload.js';
import { requireSupervisor } from './middleware/roleMiddleware.js';
import { initDb, saveReading, getHistory } from './services/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── TLS Certificate ──────────────────────────────────────────────────────────
const certPath = join(__dirname, '..', 'certs', 'cert.pem');
const keyPath = join(__dirname, '..', 'certs', 'key.pem');
const hasCerts = existsSync(certPath) && existsSync(keyPath);

if (!hasCerts) {
  console.warn('⚠️  TLS certs not found in server/certs/ — running HTTP only.');
  console.warn('   Run: node scripts/generate-cert.mjs  to generate a dev cert.');
}

const app = express();

// Create HTTPS or HTTP server depending on cert availability
const server = hasCerts
  ? https.createServer({ key: readFileSync(keyPath), cert: readFileSync(certPath) }, app)
  : http.createServer(app);

// ─── Security Headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled so the SPA can load without CSP issues in dev
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS — only allow the dashboard client ───────────────────────────────────
// Support multiple allowed origins (comma-separated in CLIENT_ORIGIN env var)
// Falls back to allowing localhost + any LAN IP (192.168.x.x) in dev
const ALLOWED_ORIGINS = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, ''))
  : null;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalizedOrigin = origin.trim().replace(/\/$/, '');

  if (ALLOWED_ORIGINS && ALLOWED_ORIGINS.includes(normalizedOrigin)) return true;

  // Dev & Cloud fallback: allow localhost, any LAN IP, and common deployment domains
  const isAllowed = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(normalizedOrigin) ||
    normalizedOrigin.endsWith('.vercel.app') ||
    normalizedOrigin.endsWith('.railway.app');

  if (!isAllowed) {
    console.warn(`🚫 CORS Rejected: ${origin}`);
  }
  return isAllowed;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // Reject silently or handle via error
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

// ─── Cookie parser (needed for CSRF) ─────────────────────────────────────────
app.use(cookieParser());

// ─── Body parsing with size limit (prevent payload flooding) ─────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General read limiter
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// Strict write limiter
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Rate limit exceeded. Max 60 write requests/min.' },
});

app.use(readLimiter);

// ─── WebSocket ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── Structured Audit Logger ──────────────────────────────────────────────────
function auditLog(action, req, extra = {}) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    ip: req.ip,
    role: req.userRole || req.headers['x-user-role'] || 'system',
    ua: req.headers['user-agent']?.slice(0, 80) || 'unknown',
    ...extra,
  };
  console.log(`📋 AUDIT | ${entry.ts} | ${action} | ip=${entry.ip} | role=${entry.role} |`, JSON.stringify(extra));
}

// ─── In-memory state ─────────────────────────────────────────────────────────
let machinesState = { machine1: null };
let hasLiveData = false;

let cnnPredictions = {
  anomalyScore: 0,
  toolLifeRemaining: 100,
  qualityClass: 'Good',
  confidence: 0.95,
  predictedDefectType: null,
  uncertainty: 0.02,
  lastUpdate: null,
  modelAvailable: false,
};

const connectedClients = new Set();

// ─── Helper: build full machine object ───────────────────────────────────────
function buildMachineObject(machineId, machineName, rawData) {
  return {
    id: machineId,
    name: machineName,
    raw: {
      ...rawData,
      status: rawData.status.toUpperCase(),
      timestamp: rawData.timestamp || new Date().toISOString(),
      alarms: rawData.alarms || [],
    },
    derived: googleSheetService.computeDerivedMetrics(machineId, rawData),
  };
}

// ─── WebSocket connections ────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  connectedClients.add(socket.id);

  if (machinesState.machine1 || machinesState.machine2) {
    socket.emit('machines-data', machinesState);
  }
  if (cnnPredictions.lastUpdate) {
    socket.emit('cnn-predictions', cnnPredictions);
  }

  socket.on('cnc-data-received', () => {
    console.log(`📥 Client ${socket.id} acknowledged data`);
  });

  const intervalId = setInterval(async () => {
    if (hasLiveData) return;
    try {
      const allMachines = await googleSheetService.fetchAllMachines();
      machinesState = allMachines;
      socket.emit('machines-data', machinesState);
    } catch (err) {
      console.error('Error in interval:', err.message);
    }
  }, 2000);

  socket.on('request-data', () => {
    socket.emit('machines-data', machinesState);
  });

  socket.on('request-machine', (machineId) => {
    const machine = machinesState[machineId];
    if (machine) socket.emit('machine-data', { machineId, ...machine });
  });

  socket.on('control-command', (command) => {
    console.log(`🎮 Command from ${socket.id}:`, command);
    const { machineId, type, value } = command;
    const machine = machinesState[machineId];
    if (machine) {
      switch (type) {
        case 'START': machine.raw.status = 'RUNNING'; break;
        case 'STOP': machine.raw.status = 'IDLE'; break;
        case 'RESET_PART_COUNT': machine.raw.production.partsCompleted = 0; break;
        case 'SET_SPINDLE_SPEED': machine.raw.spindle.speed = value; break;
      }
      socket.emit('machines-data', machinesState);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
    connectedClients.delete(socket.id);
    clearInterval(intervalId);
  });

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error from ${socket.id}:`, error);
  });
});

// ─── Public routes ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'CNC Dashboard Server',
    status: 'running',
    uptime: Math.floor(process.uptime()),
    clients: connectedClients.size,
    hasLiveData,
  });
});

// Health check — used by Railway (railway.toml) to confirm the server is ready
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    clients: connectedClients.size,
    hasLiveData,
  });
});

app.get('/api/machines', async (req, res) => {
  try {
    if (!hasLiveData && !machinesState.machine1) {
      machinesState = await googleSheetService.fetchAllMachines();
    }
    res.json(machinesState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/machines/:id', (req, res) => {
  const machine = machinesState[req.params.id];
  if (machine) res.json(machine);
  else res.status(404).json({ error: 'Machine not found' });
});

app.get('/api/cnn/predictions', (req, res) => res.json(cnnPredictions));

/**
 * GET /api/history?machine=machine1&limit=200
 * Returns last N readings from Postgres for a given machine (oldest → newest).
 */
app.get('/api/history', readLimiter, async (req, res) => {
  const machineId = req.query.machine || 'machine1';
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  if (!['machine1', 'machine2'].includes(machineId)) {
    return res.status(400).json({ error: 'Invalid machine. Use machine1 or machine2.' });
  }
  const rows = await getHistory(machineId, limit);
  res.json({ machineId, count: rows.length, rows });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    machines: Object.keys(machinesState).length,
    clients: connectedClients.size,
    hasLiveData,
    cnnModelAvailable: cnnPredictions.modelAvailable,
    timestamp: new Date().toISOString(),
  });
});

// ─── Protected write routes ───────────────────────────────────────────────────

/**
 * POST /api/data/push
 * Push data for one or both machines.
 * Requires: Bearer token + Supervisor or higher role
 */
app.post('/api/data/push', writeLimiter, authMiddleware, requireSupervisor, validateBulkPush, (req, res) => {
  try {
    const { machine1, machine2 } = req.body;

    if (!machine1 && !machine2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Provide at least one of: machine1, machine2',
      });
    }

    if (machine1) machinesState.machine1 = buildMachineObject('machine1', 'CNC Machine 1', machine1);
    if (machine2) machinesState.machine2 = buildMachineObject('machine2', 'CNC Machine 2', machine2);

    hasLiveData = true;
    io.emit('machines-data', machinesState);

    // Persist to Postgres (fire-and-forget)
    if (machine1) saveReading('machine1', machine1);
    if (machine2) saveReading('machine2', machine2);

    const updated = [machine1 && 'machine1', machine2 && 'machine2'].filter(Boolean);
    auditLog('data_push_bulk', req, { updated });

    res.json({ success: true, updated: { machine1: !!machine1, machine2: !!machine2 }, clients: connectedClients.size, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(400).json({ error: 'Invalid payload', details: err.message });
  }
});

/**
 * POST /api/machines/:id/data
 * Push data for a single machine.
 * Requires: Bearer token + Supervisor or higher role
 */
app.post('/api/machines/:id/data', writeLimiter, authMiddleware, requireSupervisor, validateSinglePush, (req, res) => {
  try {
    const machineId = req.params.id;
    if (!['machine1', 'machine2'].includes(machineId)) {
      return res.status(400).json({ error: 'Invalid machine ID. Use machine1 or machine2.' });
    }

    const machineName = machineId === 'machine1' ? 'CNC Machine 1' : 'CNC Machine 2';
    machinesState[machineId] = buildMachineObject(machineId, machineName, req.body);
    hasLiveData = true;
    io.emit('machines-data', machinesState);

    // Persist to Postgres (fire-and-forget)
    saveReading(machineId, req.body);

    auditLog('data_push_single', req, { machineId });

    res.json({ success: true, machineId, clients: connectedClients.size, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(400).json({ error: 'Invalid payload', details: err.message });
  }
});

/**
 * POST /api/cnn/predict
 * Push CNN model predictions.
 * Requires: Bearer token + Maintenance or higher role
 */
app.post('/api/cnn/predict', writeLimiter, authMiddleware, requireSupervisor, (req, res) => {
  try {
    const { anomalyScore, toolLifeRemaining, qualityClass, confidence, predictedDefectType, uncertainty } = req.body;

    cnnPredictions = {
      anomalyScore: anomalyScore ?? cnnPredictions.anomalyScore,
      toolLifeRemaining: toolLifeRemaining ?? cnnPredictions.toolLifeRemaining,
      qualityClass: qualityClass ?? cnnPredictions.qualityClass,
      confidence: confidence ?? cnnPredictions.confidence,
      predictedDefectType: predictedDefectType ?? null,
      uncertainty: uncertainty ?? cnnPredictions.uncertainty,
      lastUpdate: Date.now(),
      modelAvailable: true,
    };

    io.emit('cnn-predictions', cnnPredictions);
    auditLog('cnn_predict', req, { qualityClass: cnnPredictions.qualityClass });

    res.json({ success: true, predictions: cnnPredictions });
  } catch (err) {
    res.status(400).json({ error: 'Invalid prediction payload', details: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
// Initialise Postgres (safe no-op if DATABASE_URL not set)
initDb();

const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HTTP_PORT = process.env.PORT || 3002;

if (hasCerts) {
  // HTTPS server on 3443
  server.listen(HTTPS_PORT, () => {
    console.log(`\n🔒 HTTPS Server started!`);
    console.log(`🌐 HTTPS:       https://localhost:${HTTPS_PORT}`);
    console.log(`🔌 WebSocket:   wss://localhost:${HTTPS_PORT}`);
    console.log(`📡 Data Push:   POST https://localhost:${HTTPS_PORT}/api/data/push  (Bearer token)`);
    console.log(`❤️  Health:      https://localhost:${HTTPS_PORT}/api/health\n`);
  });

  // HTTP redirect server on 3002 → HTTPS
  http.createServer((req, res) => {
    const host = req.headers.host?.replace(`:${HTTP_PORT}`, `:${HTTPS_PORT}`) || `localhost:${HTTPS_PORT}`;
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  }).listen(HTTP_PORT, () => {
    console.log(`↩️  HTTP:3002 → redirects to HTTPS:${HTTPS_PORT}`);
  });
} else {
  // Fallback: plain HTTP
  server.listen(HTTP_PORT, () => {
    console.log(`\n🚀 HTTP Server started (no TLS certs found)`);
    console.log(`🌐 HTTP:        http://localhost:${HTTP_PORT}`);
    console.log(`🔌 WebSocket:   ws://localhost:${HTTP_PORT}`);
    console.log(`📡 Data Push:   POST http://localhost:${HTTP_PORT}/api/data/push  (Bearer token)`);
    console.log(`❤️  Health:      http://localhost:${HTTP_PORT}/api/health\n`);
  });
}