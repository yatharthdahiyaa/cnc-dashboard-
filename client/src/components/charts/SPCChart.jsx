// client/src/components/charts/SPCChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SPCChart = ({ data = [], ucl, lcl, mean, label = 'Dimension', unit = 'mm' }) => {
    // data: [{ id: 'WP-001', value: 25.02 }, ...]
    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>📐</span> SPC — {label}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                UCL: {ucl}{unit} | Mean: {mean}{unit} | LCL: {lcl}{unit}
            </p>

            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="id" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                        <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={[lcl - (ucl - lcl) * 0.2, ucl + (ucl - lcl) * 0.2]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(v) => [`${v.toFixed(3)} ${unit}`, label]}
                        />
                        <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'UCL', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                        <ReferenceLine y={mean} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#10b981', fontSize: 10, position: 'right' }} />
                        <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'LCL', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                        <Line
                            type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}
                            dot={({ cx, cy, payload }) => {
                                const isOutOfSpec = payload.value > ucl || payload.value < lcl;
                                return (
                                    <circle key={payload.id} cx={cx} cy={cy} r={isOutOfSpec ? 5 : 3}
                                        fill={isOutOfSpec ? '#ef4444' : '#3b82f6'} stroke={isOutOfSpec ? '#fca5a5' : 'none'} strokeWidth={2} />
                                );
                            }}
                            name={label}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SPCChart;
