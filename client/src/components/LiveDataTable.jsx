import { useDashboardStore } from '../store/useDashboardStore';

const LiveDataTable = () => {
  const { data } = useDashboardStore();

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">CNC Machine Status</div>
            <div className="text-sm">Waiting for data...</div>
          </div>
        </div>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getEventTextColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Machine Details</h3>
      
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-xs font-medium">Status</p>
            <p className="text-lg font-semibold text-gray-900">{data.status || 'UNKNOWN'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs font-medium">Last Update</p>
            <p className="text-lg font-semibold text-gray-900">{formatTimestamp(data.timestamp)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Position X:</span>
            <span className="font-semibold text-gray-900">{(data.axis?.x || 0).toFixed(2)} mm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Position Y:</span>
            <span className="font-semibold text-gray-900">{(data.axis?.y || 0).toFixed(2)} mm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Position Z:</span>
            <span className="font-semibold text-gray-900">{(data.axis?.z || 0).toFixed(2)} mm</span>
          </div>
        </div>

        {data.alarms && data.alarms.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-red-600 font-medium">Active Alarms: {data.alarms.length}</p>
            <div className="mt-2 space-y-1">
              {data.alarms.map((alarm, idx) => (
                <p key={idx} className="text-xs text-red-600">• {alarm}</p>
              ))}
            </div>
          </div>
        )}

        {(!data.alarms || data.alarms.length === 0) && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-green-600 font-medium">✓ No Active Alarms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDataTable; 