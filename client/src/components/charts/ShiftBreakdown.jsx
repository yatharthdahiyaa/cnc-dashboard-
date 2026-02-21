// client/src/components/charts/ShiftBreakdown.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const ShiftBreakdown = ({ data = [], target = 0 }) => {
    // data: [{ shift: 'Morning', machine1: 45, machine2: 38 }]
    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>📊</span> Shift-wise Production
            </h3>
            <p className="text-xs text-gray-500 mb-4">Parts produced per shift across machines</p>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="shift" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        {target > 0 && (
                            <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `Target: ${target}`, fill: '#f59e0b', fontSize: 10 }} />
                        )}
                        <Bar dataKey="machine1" name="Machine 1" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                        <Bar dataKey="machine2" name="Machine 2" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ShiftBreakdown;
