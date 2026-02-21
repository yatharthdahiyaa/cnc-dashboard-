// client/src/pages/PortalPage.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import AlertsPanel from '../components/AlertsPanel';
import DataFreshnessIndicator from '../components/DataFreshnessIndicator';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaIndustry, FaClock, FaCogs } from 'react-icons/fa';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const PortalPage = () => {
    const { machines, isConnected, isConnecting, error, activeAlerts, getMachineHistory, getIdleStatus } = useDashboardStore();
    const machine = machines.machine1;
    const history = getMachineHistory('machine1');
    const isIdle = getIdleStatus('machine1');
    const navigate = useNavigate();
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const s1 = machine?.raw?.spindle?.speed ?? 0;
    const master = machine?.raw?.feedRate ?? 0;
    const partsActual = machine?.raw?.production?.partsCompleted ?? 0;
    const partsTarget = machine?.raw?.production?.partsTarget ?? 0;
    const status = isIdle ? 'IDLE' : (machine?.raw?.status || 'OFFLINE');
    const progressPct = partsTarget > 0 ? Math.min(100, Math.round((partsActual / partsTarget) * 100)) : 0;

    const statusConfig = {
        RUNNING: { color: 'text-emerald-400', bg: 'bg-emerald-400', dot: 'bg-emerald-400', label: 'Running', pulse: true },
        IDLE: { color: 'text-amber-400', bg: 'bg-amber-400', dot: 'bg-amber-400', label: 'Idle', pulse: false },
        PAUSED: { color: 'text-blue-400', bg: 'bg-blue-400', dot: 'bg-blue-400', label: 'Paused', pulse: false },
        ALARM: { color: 'text-red-400', bg: 'bg-red-500', dot: 'bg-red-400', label: 'Alarm', pulse: true },
        OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500', dot: 'bg-gray-500', label: 'Offline', pulse: false },
    };
    const cfg = statusConfig[status] || statusConfig.OFFLINE;

    return (
        <div className="space-y-6">
            <AlertsPanel isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-white/5 pb-5">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
                        <span className="gradient-text">CNC Command</span> Center
                    </h1>
                    <p className="text-gray-500 text-sm">Real-time Machine Monitoring — CNC Machine 1</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <DataFreshnessIndicator />

                    <button
                        onClick={() => setIsAlertsOpen(true)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5 relative"
                        aria-label={`Notifications${activeAlerts.length > 0 ? `, ${activeAlerts.length} active` : ''}`}
                    >
                        <FaBell size={16} />
                        {activeAlerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-dark-900">
                                {activeAlerts.length}
                            </span>
                        )}
                    </button>

                    <div className="text-right ml-1 border-l border-white/10 pl-4">
                        <div className="text-2xl font-light text-white font-mono tracking-wider">
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-accent-cyan text-[10px] uppercase tracking-widest font-bold mt-0.5">
                            {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-1 pl-3 border-l border-white/10">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-accent-red'} animate-pulse`} />
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                            {isConnecting ? 'Connecting' : isConnected ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </header>

            {/* ─── Error Banner ────────────────────────────────────────────── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3" role="alert">
                    <span>⚠️</span><span>{error}</span>
                </div>
            )}

            {/* ─── Loading / Connecting ────────────────────────────────────── */}
            {isConnecting && !machine && (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 animate-pulse text-sm">Establishing secure connection to CNC servers...</p>
                </div>
            )}

            {!machine && !isConnecting && (
                <div className="text-center py-20 text-gray-600">
                    <FaIndustry size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Waiting for data stream...</p>
                    <p className="text-sm mt-2">Run push_to_dashboard.py or push_data.py to start sending data.</p>
                </div>
            )}

            {/* ─── Main Dashboard (machine1 only) ──────────────────────────── */}
            {machine && (
                <>
                    {/* Status banner */}
                    {isIdle && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-400 font-semibold text-sm">Machine is IDLE — S1 has been under 10 RPM for 15+ seconds</span>
                        </div>
                    )}

                    {/* ── 4 KPI Cards ─── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* S1 */}
                        <div
                            className="glass-card p-5 flex flex-col gap-2 cursor-pointer hover:border-accent-cyan/30 transition-colors"
                            onClick={() => navigate('/machine/machine1')}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">S1 — Main Spindle</span>
                                <FaCogs size={12} className="text-accent-cyan opacity-60" />
                            </div>
                            <div className="text-3xl font-black text-white font-mono">{s1.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">RPM</div>
                            <div className="h-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history.slice(-20)}>
                                        <Line type="monotone" dataKey="s1" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Master */}
                        <div
                            className="glass-card p-5 flex flex-col gap-2 cursor-pointer hover:border-accent-blue/30 transition-colors"
                            onClick={() => navigate('/machine/machine1')}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Master — Feed</span>
                                <FaCogs size={12} className="text-accent-blue opacity-60" />
                            </div>
                            <div className="text-3xl font-black text-white font-mono">{master.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">%</div>
                            <div className="h-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history.slice(-20)}>
                                        <Line type="monotone" dataKey="master" stroke="#4f8ef7" strokeWidth={1.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Parts */}
                        <div className="glass-card p-5 flex flex-col gap-2 col-span-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Workpiece Count</span>
                                <span className="text-[10px] text-accent-cyan font-mono">{progressPct}%</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <div className="text-3xl font-black text-white font-mono">{partsActual}</div>
                                <div className="text-gray-500 text-sm mb-1">/ {partsTarget > 0 ? partsTarget : '—'} target</div>
                            </div>
                            {partsTarget > 0 && (
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                {partsTarget > 0 ? `${partsTarget - partsActual} remaining` : 'No target set'}
                            </div>
                        </div>
                    </div>

                    {/* ── Machine Status Card ─── */}
                    <div
                        className="glass-card p-6 flex items-center justify-between cursor-pointer hover:border-white/10 transition-colors"
                        onClick={() => navigate('/machine/machine1')}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}/10`}>
                                <FaIndustry size={20} className={cfg.color} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">CNC Machine 1</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                                    <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 text-right">
                            <div>
                                <div className="text-xl font-mono font-bold text-white">{s1}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">S1 RPM</div>
                            </div>
                            <div>
                                <div className="text-xl font-mono font-bold text-white">{master}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Master %</div>
                            </div>
                            <div className="text-accent-cyan text-sm hover:text-accent-cyan/70 transition-colors font-medium">
                                View Details →
                            </div>
                        </div>
                    </div>
                </>
            )}

            <footer className="text-center text-gray-700 text-xs mt-12 pt-6 border-t border-white/5">
                <p>CNC Command Center v3.0 • Industry 4.0 Platform</p>
            </footer>
        </div>
    );
};

export default PortalPage;
