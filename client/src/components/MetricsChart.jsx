// src/components/MetricsChart.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import { useEffect, useState } from 'react';

const MetricsChart = () => {
  const { data } = useDashboardStore();
  const [chartData, setChartData] = useState([]);

  // Initialize with some sample data if no data exists
  useEffect(() => {
    if (data) {
      // Create or update chart data
      const newPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spindleSpeed: data.spindle?.speed || 0,
        spindleLoad: data.spindle?.load || 0,
        partsCompleted: data.production?.partsCompleted || 0
      };
      
      setChartData(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 20 points for performance
        return updated.slice(-20);
      });
    }
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">CNC Performance Chart</div>
            <div className="text-sm">Waiting for data...</div>
          </div>
        </div>
      </div>
    );
  }

  const chartHeight = 200;
  const chartWidth = 600;
  const maxSpindleSpeed = Math.max(...chartData.map(d => d.spindleSpeed), 1000) * 1.1;
  const maxSpindleLoad = 100;

  // Simple line path generator
  const createPath = (data, key, maxValue, offset = 0) => {
    if (data.length < 2) return '';
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((item[key] / maxValue) * chartHeight) + offset;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">CNC Performance Trends</h3>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Spindle Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Spindle Load</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Parts Count</span>
          </div>
        </div>
      </div>
      
      <div className="relative overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <line
              key={value}
              x1="0"
              y1={chartHeight - (value / 100) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - (value / 100) * chartHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Spindle Speed line */}
          <path
            d={createPath(chartData, 'spindleSpeed', maxSpindleSpeed, 0)}
            stroke="#3b82f6"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Spindle Load line */}
          <path
            d={createPath(chartData, 'spindleLoad', maxSpindleLoad, 0)}
            stroke="#22c55e"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Current Status</p>
          <p className={`text-xl font-bold ${data?.cnc?.status === 'RUNNING' ? 'text-green-600' : 'text-yellow-600'}`}>
            {data?.cnc?.status || 'IDLE'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Current Speed</p>
          <p className="text-xl font-bold text-gray-900">
            {data?.cnc?.spindleSpeed?.toLocaleString() || '0'} RPM
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Parts Made</p>
          <p className="text-xl font-bold text-gray-900">
            {data?.cnc?.partsCompleted || 0}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Updated: {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">Showing {chartData.length} data points</p>
      </div>
    </div>
  );
};

export default MetricsChart;