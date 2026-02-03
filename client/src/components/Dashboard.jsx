// client/src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import MetricsCards from './MetricsCards';
import MetricsChart from './MetricsChart';
import ConnectionStatus from './ConnectionStatus';
import LiveDataTable from './LiveDataTable';
import { useDashboardStore } from '../store/useDashboardStore';
import { websocketService } from '../services/websocketService';

const Dashboard = () => {
  const { 
    data, 
    isConnected, 
    isConnecting, 
    error, 
    refreshData,
    updateCount,
    lastUpdate 
  } = useDashboardStore();

  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('📊 Dashboard mounted');
  }, []);

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        connection: websocketService.getConnectionStatus(),
        storeData: !!data,
        updateCount,
        lastUpdate
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data, updateCount, lastUpdate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CNC Machine Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time monitoring and analytics</p>
        </header>
        
        {/* Connection Status */}
        <ConnectionStatus />
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {/* Debug Panel - Always Visible */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-blue-800">Debug Information</h3>
            <div className="flex gap-2">
              <button 
                onClick={refreshData}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh Data
              </button>
              <button 
                onClick={() => websocketService.connect()}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Reconnect
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">WebSocket:</span>{' '}
              <span className={isConnected ? 'text-green-600 font-medium' : 'text-red-600'}>
                {isConnected ? 'Connected ✅' : 'Disconnected ❌'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Socket ID:</span>{' '}
              <span className="font-mono">{debugInfo.connection?.socketId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Transport:</span>{' '}
              <span>{debugInfo.connection?.transport || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Updates:</span>{' '}
              <span>{updateCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Has Data:</span>{' '}
              <span className={data ? 'text-green-600' : 'text-red-600'}>
                {data ? 'Yes ✅' : 'No ❌'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Update:</span>{' '}
              <span>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</span>
            </div>
            <div>
              <span className="text-gray-600">Server Status:</span>{' '}
              <span className={data?.status === 'RUNNING' ? 'text-green-600' : 'text-yellow-600'}>
                {data?.status || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Data Age:</span>{' '}
              <span>
                {lastUpdate ? `${Math.round((new Date() - new Date(lastUpdate)) / 1000)}s ago` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isConnecting && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-yellow-800">Connecting to CNC machine...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          <MetricsCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MetricsChart />
            </div>
            <div className="lg:col-span-1">
              <LiveDataTable />
            </div>
          </div>
        </div>

        {/* Raw Data View (for debugging) */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-700">Raw Data View</h3>
          <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(data || { message: 'No data received yet' }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;