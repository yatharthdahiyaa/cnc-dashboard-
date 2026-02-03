// client/src/store/useDashboardStore.js
import { create } from 'zustand';
import { websocketService } from '../services/websocketService';

export const useDashboardStore = create((set, get) => ({
  // Initial state
  data: null,
  isConnected: false,
  isConnecting: false,
  history: [],
  error: null,
  socketId: null,
  
  // Debug info
  lastUpdate: null,
  updateCount: 0,

  // Initialize connection
  initialize: () => {
    console.log('🔄 Store: Initializing WebSocket connection...');

    const handleConnect = () => {
      console.log('✅ Store: WebSocket connected!');
      set({ 
        isConnected: true, 
        isConnecting: false,
        error: null,
        socketId: websocketService.socket?.id
      });
      
      // Request initial data
      setTimeout(() => {
        websocketService.requestData();
      }, 500);
    };

    const handleDisconnect = () => {
      console.log('❌ Store: WebSocket disconnected');
      set({ 
        isConnected: false, 
        isConnecting: false,
        data: null
      });
    };

    const handleData = (newData) => {
      console.log('📥 Store: RECEIVED DATA!', newData);
      console.log('📊 Data content:', {
        status: newData.status,
        spindleSpeed: newData.spindle?.speed,
        parts: newData.production?.partsCompleted
      });
      
      set((state) => ({
        data: newData,
        history: [...state.history, { 
          ...newData, 
          timestamp: new Date().toISOString() 
        }].slice(-20),
        error: null,
        lastUpdate: new Date().toISOString(),
        updateCount: state.updateCount + 1
      }));
    };

    // Register callbacks
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onData(handleData);

    // Connect
    set({ isConnecting: true });
    websocketService.connect();

    // Return cleanup function
    return () => {
      console.log('🧹 Store: Cleaning up...');
      websocketService.removeCallback(handleConnect);
      websocketService.removeCallback(handleDisconnect);
      websocketService.removeCallback(handleData);
      websocketService.disconnect();
    };
  },

  // Test methods
  testConnection: () => {
    websocketService.testConnection();
  },

  refreshData: () => {
    console.log('🔄 Manually refreshing data...');
    websocketService.requestData();
  },

  getMetricsData: () => {
    return get().history.slice(-10);
  },

  getFormattedData: () => {
    const data = get().data;
    
    if (!data) {
      console.log('📭 No data available in store');
      return {
        status: 'DISCONNECTED',
        spindleSpeed: 0,
        spindleLoad: 0,
        spindleTemp: 0,
        partsCompleted: 0,
        partsTarget: 0,
        cycleTime: 0,
        runtimeTotal: 0,
        runtimeToday: 0,
        axis: { x: 0, y: 0, z: 0 },
        alarms: []
      };
    }

    console.log('📦 Returning formatted data:', data.status);
    return {
      status: data.status || 'UNKNOWN',
      spindleSpeed: data.spindle?.speed || 0,
      spindleLoad: data.spindle?.load || 0,
      spindleTemp: data.spindle?.temperature || 0,
      partsCompleted: data.production?.partsCompleted || 0,
      partsTarget: data.production?.partsTarget || 0,
      cycleTime: data.production?.cycleTime || 0,
      runtimeTotal: data.runtime?.total || 0,
      runtimeToday: data.runtime?.today || 0,
      axis: data.axis || { x: 0, y: 0, z: 0 },
      alarms: data.alarms || []
    };
  }
}));