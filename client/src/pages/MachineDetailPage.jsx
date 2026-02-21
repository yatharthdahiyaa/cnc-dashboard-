// client/src/pages/MachineDetailPage.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import HistoryChart from '../components/charts/HistoryChart';
import { useEffect } from 'react';
import { FaChevronRight, FaHome, FaIndustry, FaCogs, FaTachometerAlt } from 'react-icons/fa';

// ── Small reusable metric card ─────────────────────────────────────────────────
const MetricCard = ({ label, value, unit, color = 'text-white', sub }) => (
    <div className="glass-card p-5 flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{label}</span>
        <div className="flex items-end gap-2">
            <span className={`text-3xl font-black font-mono ${color}`}>{value ?? '—'}</span>
            {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
        </div>
        {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
);

// ── Custom tooltip for dual chart ──────────────────────────────────────────────
const DualTooltip = ({ active, payload, label }) => {
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

// ── Gauge bar component ────────────────────────────────────────────────────────
const GaugeBar = ({ value, max, label, unit, color }) => {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="font-mono text-sm font-bold text-white">{value} <span className="text-gray-500 text-[10px]">{unit}</span></span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
                <span>0</span><span>{max} {unit}</span>
            </div>
        </div>
    );
};

const MachineDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getMachineData, getMachineHistory, getIdleStatus, isConnected } = useDashboardStore();
    const machine = getMachineData(id);
    const history = getMachineHistory(id);
    const isIdle = getIdleStatus(id);

    useEffect(() => {
        if (isConnected && !machine) navigate('/');
    }, [isConnected, machine, navigate]);

    if (!machine) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { name, raw } = machine;
    const s1 = raw?.spindle?.speed ?? 0;
    const master = raw?.feedRate ?? 0;
    const partsActual = raw?.production?.partsCompleted ?? 0;
    const partsTarget = raw?.production?.partsTarget ?? 0;
    const progressPct = partsTarget > 0 ? Math.min(100, Math.round((partsActual / partsTarget) * 100)) : 0;
    const remaining = partsTarget > 0 ? partsTarget - partsActual : null;

    const status = isIdle ? 'IDLE' : (raw?.status || 'OFFLINE');
    const statusConfig = {
        RUNNING: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400', label: 'Running', pulse: true },
        IDLE: { color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400', label: 'Idle (S1 < 10 RPM)', pulse: false },
        PAUSED: { color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-400', label: 'Paused', pulse: false },
        ALARM: { color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400', label: 'Alarm', pulse: true },
        OFFLINE: { color: 'text-gray-500', bg: 'bg-white/5', dot: 'bg-gray-500', label: 'Offline', pulse: false },
    };
    const cfg = statusConfig[status] || statusConfig.OFFLINE;

    // Relationship: S1 vs Master correlation label
    let relationLabel = 'Measuring…';
    if (history.length >= 5) {
        const recent = history.slice(-10);
        const s1Avg = recent.reduce((a, p) => a + p.s1, 0) / recent.length;
        const masterAvg = recent.reduce((a, p) => a + p.master, 0) / recent.length;
        if (s1Avg > 500 && masterAvg > 50) relationLabel = 'Both active — machining in progress';
        else if (s1Avg > 500 && masterAvg < 20) relationLabel = 'Spindle running, feed low — positioning';
        else if (s1Avg < 50 && masterAvg < 20) relationLabel = 'Machine idle';
        else relationLabel = 'Transitioning…';
    }

    return (
        <div className="space-y-6">

            {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-1" aria-label="Breadcrumb">
                    <Link to="/" className="flex items-center gap-1 hover:text-accent-cyan transition-colors">
                        <FaHome size={12} /> Dashboard
                    </Link>
                    <FaChevronRight size={10} className="text-gray-700" />
                    <span className="text-white font-semibold">{name}</span>
                </nav>

                {/* Status badge */}
                <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 ${cfg.bg} self-start sm:self-auto`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                    <span className={`font-mono text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-white -mt-2">{name}</h1>

            {/* ── Idle warning ───────────────────────────────────────────────── */}
            {isIdle && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 font-semibold text-sm">
                        ⚠ Machine IDLE — S1 has been under 10 RPM for 15+ seconds
                    </span>
                </div>
            )}

            {/* ── 4 Metric Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="S1 — Main Spindle Speed" value={s1.toLocaleString()} unit="RPM" color="text-accent-cyan"
                    sub={s1 < 10 ? '⚠ Near zero' : s1 > 8000 ? '🔺 High speed' : 'Normal'} />
                <MetricCard label="Master — Feed Rate" value={master} unit="%" color="text-blue-400"
                    sub={master === 0 ? 'Feed stopped' : master > 80 ? 'High feed' : 'Normal feed'} />
                <MetricCard label="Workpiece Actual" value={partsActual} unit="pcs" color="text-violet-400"
                    sub={partsTarget > 0 ? `${progressPct}% of target` : 'No target set'} />
                <MetricCard label="Workpiece Target" value={partsTarget > 0 ? partsTarget : '—'} unit={partsTarget > 0 ? 'pcs' : ''}
                    color="text-gray-300"
                    sub={remaining !== null ? `${remaining} remaining` : 'Not configured'} />
            </div>

            {/* ── Gauge bars ─────────────────────────────────────────────────── */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Live Gauges</h2>
                <GaugeBar label="S1 Main Spindle Speed" value={s1} max={12000} unit="RPM"
                    color="linear-gradient(90deg,#00d4ff,#4f8ef7)" />
                <GaugeBar label="Master Feed Rate" value={master} max={100} unit="%"
                    color="linear-gradient(90deg,#4f8ef7,#a78bfa)" />
                {partsTarget > 0 && (
                    <GaugeBar label="Workpiece Progress" value={partsActual} max={partsTarget} unit="pcs"
                        color="linear-gradient(90deg,#a78bfa,#10b981)" />
                )}
            </div>

            {/* ── S1 vs Master relationship ───────────────────────────────────── */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">S1 × Master Relationship</h2>
                        <p className="text-xs text-gray-500 mt-1">{relationLabel}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-accent-cyan inline-block rounded" /> S1 (RPM)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" /> Master (%)</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={history} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip content={<DualTooltip />} />
                        <ReferenceLine yAxisId="left" y={10} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Idle threshold', fill: '#f59e0b', fontSize: 10 }} />
                        <Line yAxisId="left" type="monotone" dataKey="s1" name="S1 RPM" stroke="#00d4ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="master" name="Master %" stroke="#4f8ef7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* ── Workpiece progress card ─────────────────────────────────────── */}
            {partsTarget > 0 && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Production Progress</h2>
                    <div className="flex items-end gap-4">
                        <span className="text-5xl font-black text-white font-mono">{partsActual}</span>
                        <span className="text-gray-500 text-xl mb-2">/ {partsTarget} pcs</span>
                        <span className="ml-auto text-2xl font-bold text-accent-cyan">{progressPct}%</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{partsActual} completed</span>
                        <span>{remaining} remaining</span>
                        <span>{partsTarget} target</span>
                    </div>
                </div>
            )}

            {/* ── Workpiece trend (parts over time) ──────────────────────────── */}
            {history.length > 1 && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Parts Completed — Over Time</h2>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={history} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<DualTooltip />} />
                            <Line type="monotone" dataKey="partsCompleted" name="Parts" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Cloud history chart (Postgres) ─────────────────────────────── */}
            <HistoryChart machineId={id} limit={120} />
        </div>
    );
};

export default MachineDetailPage;
