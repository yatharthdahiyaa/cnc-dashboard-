// src/components/MetricsCards.jsx
import { useDashboardStore } from '../store/useDashboardStore';

const MetricsCards = () => {
  const { data } = useDashboardStore();

  // Safe data access with defaults
  const cncData = data || {
    status: 'IDLE',
    spindle: { speed: 0, load: 0 },
    production: { partsCompleted: 0, partsTarget: 100 },
    runtime: { total: 0, today: 0 }
  };

  // Helper function to format runtime
  const formatRuntime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const metrics = [
    {
      title: 'Machine Status',
      value: cncData.status === 'RUNNING' ? 'Running' : 'Idle',
      color: cncData.status === 'RUNNING' ? 'text-green-600' : 'text-yellow-600',
      bgColor: cncData.status === 'RUNNING' ? 'bg-green-50' : 'bg-yellow-50',
      icon: cncData.status === 'RUNNING' ? '⚙️' : '⏸️',
      trend: cncData.status === 'RUNNING' ? 'normal' : 'low'
    },
    {
      title: 'S1 — Main Spindle Speed',
      value: `${(cncData.spindle?.speed || 0).toLocaleString()} RPM`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '🌀',
      trend: 'normal'
    },
    {
      title: 'Part Count',
      value: (cncData.production?.partsCompleted || 0).toLocaleString(),
      subValue: `Target: ${cncData.production?.partsTarget || 0}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: '📦',
      trend: 'normal'
    },
    {
      title: 'Machine Runtime',
      value: formatRuntime(cncData.runtime?.today),
      subValue: `Total: ${formatRuntime(cncData.runtime?.total)}`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: '⏱️',
      trend: 'normal'
    },
    {
      title: 'Spindle Load',
      value: `${(cncData.spindle?.load || 0).toFixed(1)}%`,
      color: (cncData.spindle?.load || 0) > 90 ? 'text-red-600' :
        (cncData.spindle?.load || 0) > 70 ? 'text-yellow-600' : 'text-green-600',
      bgColor: (cncData.spindle?.load || 0) > 90 ? 'bg-red-50' :
        (cncData.spindle?.load || 0) > 70 ? 'bg-yellow-50' : 'bg-green-50',
      icon: '📊',
      trend: (cncData.spindle?.load || 0) > 90 ? 'high' :
        (cncData.spindle?.load || 0) > 70 ? 'medium' : 'low'
    }
  ];

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'high': return { text: 'text-red-600', bg: 'bg-red-500' };
      case 'medium': return { text: 'text-yellow-600', bg: 'bg-yellow-500' };
      case 'low': return { text: 'text-green-600', bg: 'bg-green-500' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-500' };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metric.value}
              </p>
              {metric.subValue && (
                <p className="text-sm text-gray-500 mt-1">
                  {metric.subValue}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <span className="text-2xl">{metric.icon}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className={`font-medium ${getTrendColor(metric.trend).text}`}>
                {metric.trend === 'high' ? 'High' :
                  metric.trend === 'medium' ? 'Medium' :
                    metric.trend === 'low' ? 'Low' : 'Normal'}
              </span>
              <div className={`ml-2 w-2 h-2 rounded-full ${getTrendColor(metric.trend).bg}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;