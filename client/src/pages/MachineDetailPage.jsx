// client/src/pages/MachineDetailPage.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import MetricsChart from '../components/MetricsChart';
import AxisPosition from '../components/AxisPosition';
import OEEBreakdown from '../components/OEEBreakdown';
import SystemStatus from '../components/SystemStatus';
import JobProgress from '../components/JobProgress';
import GaugeChart from '../components/charts/GaugeChart';
import HeatmapChart from '../components/charts/HeatmapChart';
import HistoryChart from '../components/charts/HistoryChart';
import { useEffect, useMemo } from 'react';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const statusConfig = {
    RUNNING: { color: 'text-green-400', bg: 'bg-green-400', label: 'Running' },
    IDLE: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Idle' },
    PAUSED: { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Paused' },
    ALARM: { color: 'text-red-400', bg: 'bg-red-400', label: 'Alarm' },
    MAINTENANCE: { color: 'text-purple-400', bg: 'bg-purple-400', label: 'Maintenance' },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500', label: 'Offline' },
};

const MachineDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getMachineData, isConnected } = useDashboardStore();
    const machine = getMachineData(id);

    useEffect(() => {
        if (isConnected && !machine) {
            navigate('/');
        }
    }, [isConnected, machine, navigate]);

    // Simulated heatmap data (would come from real sensors)
    const heatmapData = useMemo(() => [
        { zone: 'Spindle', values: Array.from({ length: 10 }, () => Math.round(38 + Math.random() * 25)) },
        { zone: 'X-Axis Motor', values: Array.from({ length: 10 }, () => Math.round(30 + Math.random() * 18)) },
        { zone: 'Y-Axis Motor', values: Array.from({ length: 10 }, () => Math.round(28 + Math.random() * 16)) },
        { zone: 'Z-Axis Motor', values: Array.from({ length: 10 }, () => Math.round(32 + Math.random() * 14)) },
        { zone: 'Coolant', values: Array.from({ length: 10 }, () => Math.round(18 + Math.random() * 10)) },
    ], []);

    if (!machine) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const { name, raw, derived } = machine;
    const status = raw?.status || 'OFFLINE';
    const cfg = statusConfig[status] || statusConfig['OFFLINE'];

    return (
        <div className="space-y-6">
            {/* Breadcrumb + Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-1" aria-label="Breadcrumb">
                    <Link to="/" className="flex items-center gap-1 hover:text-accent-cyan transition-colors">
                        <FaHome size={12} /> Dashboard
                    </Link>
                    <FaChevronRight size={10} className="text-gray-700" />
                    <span className="text-white font-semibold">{name}</span>
                </nav>

                {/* Status badge */}
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 self-start sm:self-auto">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} ${status === 'RUNNING' ? 'animate-pulse' : ''}`}></span>
                    <span className={`font-mono text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
            </div>

            {/* Page title */}
            <h1 className="text-2xl font-bold text-white -mt-2">{name}</h1>

            {/* Gauge Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 flex justify-center">
                    <GaugeChart
                        value={raw?.spindle?.speed || 0} max={15000}
                        label="Spindle Speed" unit="RPM" size={130}
                    />
                </div>
                <div className="glass-card p-4 flex justify-center">
                    <GaugeChart
                        value={raw?.spindle?.load || 0} max={100}
                        label="Spindle Load" unit="%" size={130}
                    />
                </div>
                <div className="glass-card p-4 flex justify-center">
                    <GaugeChart
                        value={raw?.spindle?.temperature || 0} max={80}
                        label="Temperature" unit="°C" size={130}
                        zones={[{ end: 0.5, color: '#10b981' }, { end: 0.75, color: '#f59e0b' }, { end: 1.0, color: '#ef4444' }]}
                    />
                </div>
                <div className="glass-card p-4 flex justify-center">
                    <GaugeChart
                        value={derived?.feedRate || 0} max={2000}
                        label="Feed Rate" unit="mm/min" size={130}
                        zones={[{ end: 0.7, color: '#3b82f6' }, { end: 0.9, color: '#10b981' }, { end: 1.0, color: '#f59e0b' }]}
                    />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* OEE Breakdown */}
                <OEEBreakdown
                    availability={derived?.availability || 0}
                    performance={derived?.performance || 0}
                    quality={derived?.quality || 100}
                    oee={derived?.oee || 0}
                />

                {/* Machine Runtime */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">⏱️</span>
                        <h3 className="text-lg font-semibold text-gray-300">Runtime & Production</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Runtime Today</div>
                            <div className="text-2xl font-mono text-white font-bold">
                                {raw?.runtime?.today ? (raw.runtime.today / 3600).toFixed(1) : '0.0'}
                                <span className="text-sm text-gray-500 ml-1">hrs</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Lifetime</div>
                            <div className="text-xl font-mono text-gray-300">
                                {raw?.runtime?.total ? (raw.runtime.total / 3600).toFixed(0) : '0'}
                                <span className="text-sm text-gray-500 ml-1">hrs</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Production Rate</div>
                            <div className="text-xl font-mono text-accent-cyan font-bold">
                                {derived?.productionRate || 0}
                                <span className="text-sm text-gray-500 ml-1">pcs/hr</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cycle Time</div>
                            <div className="text-xl font-mono text-white">
                                {raw?.production?.cycleTime || 0}
                                <span className="text-sm text-gray-500 ml-1">sec</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Axis Position */}
                <AxisPosition axis={raw?.axis} />

                {/* Job Progress */}
                <JobProgress
                    partsCompleted={raw?.production?.partsCompleted || 0}
                    partsTarget={raw?.production?.partsTarget || 0}
                />
            </div>

            {/* Heatmap */}
            <HeatmapChart data={heatmapData} title="Machine Zone Temperatures" unit="°C" />

            {/* Historical Trend from Postgres */}
            <HistoryChart machineId={id} limit={120} />

            {/* Charts */}
            <MetricsChart machineId={id} />

            {/* System Status */}
            <SystemStatus />
        </div>
    );
};

export default MachineDetailPage;
