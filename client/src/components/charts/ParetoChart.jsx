// client/src/components/charts/ParetoChart.jsx
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const ParetoChart = ({ data = [] }) => {
    // data should be: [{ reason: string, minutes: number }]
    // Sort descending by minutes
    const sorted = [...data].sort((a, b) => b.minutes - a.minutes);
    const total = sorted.reduce((s, d) => s + d.minutes, 0);

    // Add cumulative percentage
    let cumulative = 0;
    const chartData = sorted.map(d => {
        cumulative += d.minutes;
        return { ...d, cumPct: total > 0 ? Math.round((cumulative / total) * 100) : 0 };
    });

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>📉</span> Downtime Pareto Analysis
            </h3>
            <p className="text-xs text-gray-500 mb-4">Top causes of downtime by duration</p>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="reason" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar yAxisId="left" dataKey="minutes" fill="#ef4444" radius={[6, 6, 0, 0]} name="Minutes" opacity={0.8} />
                        <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Cumulative %" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ParetoChart;
