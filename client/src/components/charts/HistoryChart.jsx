// client/src/components/charts/HistoryChart.jsx
import { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const SERVER = import.meta.env.VITE_WS_URL || '';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-dark-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
            <p className="text-gray-400 mb-2">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {p.value ?? '—'}
                </p>
            ))}
        </div>
    );
};

const HistoryChart = ({ machineId = 'machine1', limit = 120 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            const url = `${SERVER}/api/history?machine=${machineId}&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            const formatted = (json.rows || []).map((row) => ({
                time: format(new Date(row.ts), 'HH:mm:ss'),
                'Spindle RPM': row.spindle_speed ?? null,
                'Load %': row.spindle_load ?? null,
                'Parts Made': row.parts_completed ?? null,
            }));

            setData(formatted);
            setLastFetch(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [machineId, limit]);

    // Fetch on mount and every 10 s
    useEffect(() => {
        fetchHistory();
        const id = setInterval(fetchHistory, 10_000);
        return () => clearInterval(id);
    }, [fetchHistory]);

    if (loading) return (
        <div className="glass-card p-6 flex items-center justify-center h-56">
            <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm ml-3">Loading history…</span>
        </div>
    );

    if (error) return (
        <div className="glass-card p-6 text-center text-red-400 text-sm">
            ⚠ Could not load history: {error}
            <p className="text-gray-600 text-xs mt-1">
                Make sure the Railway Postgres addon is connected and the server has been redeployed.
            </p>
        </div>
    );

    if (!data.length) return (
        <div className="glass-card p-6 text-center text-gray-500 text-sm">
            No historical data yet — start pushing readings to see trends.
        </div>
    );

    return (
        <div className="glass-card p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-sm">Historical Trend</h3>
                    <p className="text-gray-500 text-xs">Last {data.length} readings</p>
                </div>
                <div className="flex items-center gap-2">
                    {lastFetch && (
                        <span className="text-gray-600 text-xs">
                            Updated {format(lastFetch, 'HH:mm:ss')}
                        </span>
                    )}
                    <button
                        onClick={fetchHistory}
                        className="text-xs text-accent-cyan hover:text-accent-cyan/70 transition-colors px-2 py-1 rounded border border-accent-cyan/20 hover:border-accent-cyan/40"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Spindle RPM chart */}
            <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Spindle Speed (RPM)</p>
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="Spindle RPM"
                            stroke="#00d4ff"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Parts made chart */}
            <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Parts Completed</p>
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                        <Line
                            type="monotone"
                            dataKey="Parts Made"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HistoryChart;
