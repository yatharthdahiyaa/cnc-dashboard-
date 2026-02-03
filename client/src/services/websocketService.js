// client/src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      onData: [],
      onConnect: [],
      onDisconnect: []
    };
    this.isConnecting = false;
    this.lastData = null;
  }

  connect() {
    if (this.isConnecting || this.socket?.connected) {
      console.log('Already connecting or connected');
      return;
    }

    this.isConnecting = true;
    console.log('🔗 Attempting to connect to WebSocket...');

    this.socket = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
      autoConnect: true,
      forceNew: true
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket CONNECTED successfully! Socket ID:', this.socket.id);
      console.log('📡 Connection details:', this.socket.io.engine.transport.name);
      this.isConnecting = false;
      this.callbacks.onConnect.forEach(callback => callback());
      
      // Immediately request data
      this.requestData();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection FAILED:', error.message);
      console.error('Error details:', error);
      this.isConnecting = false;
    });

    // Data events - MAKE SURE THIS IS WORKING
    this.socket.on('cnc-data', (data) => {
      console.log('📥 RECEIVED CNC DATA from server:', data);
      console.log('📊 Data details - Status:', data.status, 'Speed:', data.spindle?.speed, 'Parts:', data.production?.partsCompleted);
      this.lastData = data;
      
      // Send acknowledgment back to server
      this.socket.emit('cnc-data-received', { received: true, timestamp: new Date().toISOString() });
      
      // Call all registered callbacks
      this.callbacks.onData.forEach(callback => callback(data));
    });

    // Connection status
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket DISCONNECTED. Reason:', reason);
      this.isConnecting = false;
      this.callbacks.onDisconnect.forEach(callback => callback());
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ WebSocket ERROR:', error);
      this.isConnecting = false;
    });

    // Log all events for debugging
    this.socket.onAny((eventName, ...args) => {
      if (eventName !== 'cnc-data') { // Don't spam console with data events
        console.log('📡 Socket event:', eventName, args);
      }
    });

    // Manual connection
    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  sendCommand(command) {
    if (this.socket?.connected) {
      console.log('Sending command:', command);
      this.socket.emit('control-command', command);
    } else {
      console.warn('Cannot send command: WebSocket not connected');
    }
  }

  requestData() {
    if (this.socket?.connected) {
      console.log('🔄 Requesting data from server...');
      this.socket.emit('request-data');
    } else {
      console.warn('Cannot request data: WebSocket not connected');
    }
  }

  onData(callback) {
    console.log('📋 Registering data callback');
    this.callbacks.onData.push(callback);
  }

  onConnect(callback) {
    this.callbacks.onConnect.push(callback);
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect.push(callback);
  }

  removeCallback(callback) {
    this.callbacks.onData = this.callbacks.onData.filter(cb => cb !== callback);
    this.callbacks.onConnect = this.callbacks.onConnect.filter(cb => cb !== callback);
    this.callbacks.onDisconnect = this.callbacks.onDisconnect.filter(cb => cb !== callback);
  }

  getConnectionStatus() {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      lastData: this.lastData
    };
  }

  // Test connection
  testConnection() {
    if (this.socket?.connected) {
      console.log('🔄 Testing connection...');
      this.socket.emit('ping', { timestamp: new Date().toISOString() });
    }
  }
}

export const websocketService = new WebSocketService();