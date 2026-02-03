// server/src/index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

app.use(cors());
app.use(express.json());

// Simple CNC state
let cncState = {
  status: 'RUNNING',
  spindle: { speed: 12000, load: 75.5, temperature: 42.3 },
  axis: { x: 150.25, y: 75.80, z: -25.10 },
  production: { partsCompleted: 245, partsTarget: 300, cycleTime: 125 },
  runtime: { total: 64800, today: 21600, lastJob: 125 },
  alarms: [],
  timestamp: new Date().toISOString()
};

// Track connected clients
const connectedClients = new Set();

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  connectedClients.add(socket.id);
  console.log(`📊 Total connected clients: ${connectedClients.size}`);
  
  // Send initial state IMMEDIATELY
  console.log(`📤 Sending INITIAL data to ${socket.id}:`, cncState);
  socket.emit('cnc-data', cncState);
  
  // Log that we sent the data
  socket.on('cnc-data-received', (data) => {
    console.log(`📥 Client ${socket.id} acknowledged receiving data`);
  });

  // Set up periodic updates every 2 seconds
  const intervalId = setInterval(() => {
    // Update state
    cncState = {
      ...cncState,
      spindle: {
        ...cncState.spindle,
        speed: Math.max(5000, Math.min(20000, cncState.spindle.speed + (Math.random() * 200 - 100))),
        load: Math.max(0, Math.min(100, cncState.spindle.load + (Math.random() * 10 - 5)))
      },
      production: {
        ...cncState.production,
        partsCompleted: cncState.status === 'RUNNING' 
          ? cncState.production.partsCompleted + (Math.random() > 0.8 ? 1 : 0)
          : cncState.production.partsCompleted
      },
      timestamp: new Date().toISOString()
    };

    console.log(`🔄 Sending UPDATE to ${socket.id} at ${new Date().toLocaleTimeString()}`);
    console.log(`   Spindle Speed: ${cncState.spindle.speed}, Parts: ${cncState.production.partsCompleted}`);
    
    socket.emit('cnc-data', cncState);
  }, 2000);

  // Handle client requests
  socket.on('request-data', () => {
    console.log(`📥 Received MANUAL data request from ${socket.id}`);
    socket.emit('cnc-data', { ...cncState, timestamp: new Date().toISOString() });
  });

  socket.on('control-command', (command) => {
    console.log(`🎮 Received command from ${socket.id}:`, command);
    
    switch (command.type) {
      case 'START':
        cncState.status = 'RUNNING';
        break;
      case 'STOP':
        cncState.status = 'IDLE';
        break;
      case 'RESET_PART_COUNT':
        cncState.production.partsCompleted = 0;
        break;
      case 'SET_SPINDLE_SPEED':
        cncState.spindle.speed = command.value;
        break;
    }
    
    socket.emit('cnc-data', { ...cncState, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
    connectedClients.delete(socket.id);
    console.log(`📊 Total connected clients: ${connectedClients.size}`);
    clearInterval(intervalId);
  });

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error from ${socket.id}:`, error);
  });
});

// Add a REST endpoint to test server is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running',
    cncState,
    connectedClients: Array.from(connectedClients),
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: 3001 
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
});