// client/src/components/MetricsChart.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ machineId }) => {
  const { getMachineHistory } = useDashboardStore();
  const data = getMachineHistory(machineId);

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <p>Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="text-accent-blue">📈</span> Performance Trends
      </h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="spindleSpeed"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorSpeed)"
              name="Speed (RPM)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="spindleLoad"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorLoad)"
              name="Load (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent-blue rounded"></div>
          <span className="text-gray-400">Spindle Speed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent-purple rounded"></div>
          <span className="text-gray-400">Spindle Load</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsChart;