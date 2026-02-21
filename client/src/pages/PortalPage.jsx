// client/src/pages/PortalPage.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import MachineCard from '../components/MachineCard';
import AlertsPanel from '../components/AlertsPanel';
import AlertSettings from '../components/AlertSettings';
import KPISummaryBar from '../components/KPISummaryBar';
import DataFreshnessIndicator from '../components/DataFreshnessIndicator';
import { useState, useEffect } from 'react';
import { FaBell, FaCog } from 'react-icons/fa';

const PortalPage = () => {
    const { machines, isConnected, isConnecting, error, activeAlerts } = useDashboardStore();
    const machineList = Object.values(machines).filter(m => m && m.id);

    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Live clock
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-6">
            <AlertsPanel isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
            {isSettingsOpen && <AlertSettings onClose={() => setIsSettingsOpen(false)} />}

            {/* ── Header (inverted pyramid: summary first) ── */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-white/5 pb-5">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
                        <span className="gradient-text">CNC Command</span> Center
                    </h1>
                    <p className="text-gray-500 text-sm">Real-time Multi-Machine Monitoring System</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Data freshness */}
                    <DataFreshnessIndicator />

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                        title="Alert Settings"
                        aria-label="Open alert settings"
                    >
                        <FaCog size={16} />
                    </button>

                    <button
                        onClick={() => setIsAlertsOpen(true)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5 relative"
                        title="Notifications"
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

            {/* ── KPI Summary Bar (5-second rule) ── */}
            <KPISummaryBar />

            {/* ── Error Banner ── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3" role="alert">
                    <span>⚠️</span><span>{error}</span>
                </div>
            )}

            {/* ── Loading State ── */}
            {isConnecting && machineList.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 animate-pulse text-sm">Establishing secure connection to CNC servers...</p>
                </div>
            )}

            {/* ── Skeleton loaders while connecting ── */}
            {isConnecting && machineList.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="glass-card-static p-6 min-h-[260px] space-y-4">
                            <div className="skeleton h-5 w-1/2 rounded-lg" />
                            <div className="skeleton h-3 w-1/3 rounded-lg" />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="skeleton h-24 rounded-xl" />
                                <div className="space-y-3">
                                    <div className="skeleton h-4 rounded-lg" />
                                    <div className="skeleton h-4 w-3/4 rounded-lg" />
                                    <div className="skeleton h-4 w-1/2 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty State ── */}
            {!isConnecting && machineList.length === 0 && (
                <div className="text-center py-20 text-gray-600">
                    <p className="text-lg">No machines detected.</p>
                    <p className="text-sm mt-2">Waiting for data stream...</p>
                </div>
            )}

            {/* ── Machine Grid (drill-down: click card → detail page) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {machineList.map((machine) => (
                    <MachineCard key={machine.id} machine={machine} />
                ))}

                {machineList.length > 0 && machineList.length < 3 && (
                    <div className="glass-card-static p-6 border-dashed border-gray-800 flex flex-col items-center justify-center opacity-40 min-h-[260px]">
                        <div className="text-4xl text-gray-700 mb-3">+</div>
                        <p className="text-gray-600 text-sm">Add Machine Connection</p>
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <footer className="text-center text-gray-700 text-xs mt-12 pt-6 border-t border-white/5">
                <p>CNC Command Center v3.0 • Industry 4.0 Dashboard</p>
            </footer>
        </div>
    );
};

export default PortalPage;
