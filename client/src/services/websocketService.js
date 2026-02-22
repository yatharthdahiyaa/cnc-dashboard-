// client/src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      onMachinesData: [],
      onConnect: [],
      onDisconnect: []
    };
    this.isConnecting = false;
    this.lastData = null;
  }

  connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;

    // Connect via the Vite dev proxy (empty string = same origin).
    // Vite proxies /socket.io → https://localhost:3443 transparently.
    // In production, set VITE_WS_URL to your actual server URL.
    const serverUrl = import.meta.env.VITE_WS_URL || '';

    console.log(`🔌 Connecting via ${serverUrl || 'Vite proxy → https://localhost:3443'}`);

    this.socket = io(serverUrl, {
      // Start with polling (works on all devices/networks) then upgrade to WS
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnecting = false;
      this.callbacks.onConnect.forEach(cb => cb());
      this.requestData();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      this.isConnecting = false;
    });

    // Multi-machine data event
    this.socket.on('machines-data', (data) => {
      this.lastData = data;
      this.socket.emit('cnc-data-received', { received: true, timestamp: new Date().toISOString() });
      this.callbacks.onMachinesData.forEach(cb => cb(data));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnecting = false;
      this.callbacks.onDisconnect.forEach(cb => cb());
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ WebSocket error:', error);
      this.isConnecting = false;
    });

    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  sendCommand(command) {
    if (this.socket?.connected) {
      this.socket.emit('control-command', command);
    }
  }

  requestData() {
    if (this.socket?.connected) {
      this.socket.emit('request-data');
    }
  }

  onMachinesData(callback) {
    this.callbacks.onMachinesData.push(callback);
  }

  onConnect(callback) {
    this.callbacks.onConnect.push(callback);
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect.push(callback);
  }

  removeCallback(callback) {
    this.callbacks.onMachinesData = this.callbacks.onMachinesData.filter(cb => cb !== callback);
    this.callbacks.onConnect = this.callbacks.onConnect.filter(cb => cb !== callback);
    this.callbacks.onDisconnect = this.callbacks.onDisconnect.filter(cb => cb !== callback);
  }

  getConnectionStatus() {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
    };
  }
}

export const websocketService = new WebSocketService();