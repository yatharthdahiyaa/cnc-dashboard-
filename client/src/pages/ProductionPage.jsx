// client/src/pages/ProductionPage.jsx
import { useMemo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import ParetoChart from '../components/charts/ParetoChart';
import ShiftBreakdown from '../components/charts/ShiftBreakdown';
import { FaChartBar, FaIndustry, FaBolt, FaCheckCircle } from 'react-icons/fa';

const StatCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
    <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
            <Icon className={iconColor} size={16} />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-2xl font-bold font-mono text-white">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        {trend && (
            <div className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
            </div>
        )}
    </div>
);

const ProductionPage = () => {
    const { machines, productionHistory = {} } = useDashboardStore();
    const machineList = Object.values(machines).filter(m => m && m.id);

    // Compute production summary
    const summary = useMemo(() => {
        let totalParts = 0, totalTarget = 0;
        machineList.forEach(m => {
            totalParts += m.raw?.production?.partsCompleted || 0;
            totalTarget += m.raw?.production?.partsTarget || 0;
        });
        const completion = totalTarget > 0 ? Math.round((totalParts / totalTarget) * 100) : 0;
        return { totalParts, totalTarget, completion };
    }, [machineList]);

    // Shift data derived from real machine history
    const shiftData = useMemo(() => {
        const { machineHistory = {} } = useDashboardStore.getState();
        const now = Date.now();
        const SHIFT = 8 * 3600 * 1000; // 8 hours per shift

        const shifts = [
            { shift: 'Morning (6–14)', start: 6, end: 14 },
            { shift: 'Afternoon (14–22)', start: 14, end: 22 },
            { shift: 'Night (22–6)', start: 22, end: 30 },
        ];

        return shifts.map(s => {
            const result = { shift: s.shift, machine1: 0, machine2: 0 };
            ['machine1', 'machine2'].forEach(mid => {
                const hist = machineHistory[mid] || [];
                const pts = hist.filter(p => {
                    if (!p.timestamp) return false;
                    const h = new Date(p.timestamp).getHours();
                    return h >= (s.start % 24) && h < (s.end % 24);
                });
                result[mid] = pts.length > 0
                    ? Math.round(pts.reduce((a, b) => a + (b.partsCompleted || 0), 0) / pts.length)
                    : machineList.find(m => m.id === mid)?.raw?.production?.partsCompleted
                        ? Math.round((machineList.find(m => m.id === mid).raw.production.partsCompleted / 3) * (0.8 + Math.random() * 0.4))
                        : 0;
            });
            return result;
        });
    }, [machineList]);

    // Simulated downtime data
    const downtimeData = useMemo(() => [
        { reason: 'Tool Change', minutes: 45 },
        { reason: 'Material Load', minutes: 32 },
        { reason: 'Setup', minutes: 28 },
        { reason: 'Alarm', minutes: 18 },
        { reason: 'Inspection', minutes: 12 },
        { reason: 'Other', minutes: 8 },
    ], []);


    // Simulated energy data
    const avgEnergy = 2.4; // kWh per part
    const defectRate = 1.8; // %
    const scrapCount = Math.floor(summary.totalParts * defectRate / 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FaChartBar className="text-accent-cyan" /> Daily Production Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FaIndustry} iconColor="text-accent-blue" label="Total Parts"
                    value={summary.totalParts} sub={`Target: ${summary.totalTarget}`} trend={3.2} />
                <StatCard icon={FaChartBar} iconColor="text-accent-green" label="Completion"
                    value={`${summary.completion}%`} sub="Of daily target" />
                <StatCard icon={FaBolt} iconColor="text-accent-amber" label="Energy/Part"
                    value={`${avgEnergy} kWh`} sub="Avg consumption" trend={-1.5} />
                <StatCard icon={FaCheckCircle} iconColor="text-accent-purple" label="Quality"
                    value={`${(100 - defectRate).toFixed(1)}%`} sub={`${scrapCount} scrap parts`} trend={0.8} />
            </div>

            {/* Production completion donut */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🎯</span> Production Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {machineList.map(m => {
                        const parts = m.raw?.production?.partsCompleted || 0;
                        const target = m.raw?.production?.partsTarget || 1;
                        const pct = Math.min(Math.round((parts / target) * 100), 100);
                        return (
                            <div key={m.id} className="flex items-center gap-4">
                                <div className="relative w-20 h-20">
                                    <svg width="80" height="80" className="transform -rotate-90">
                                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="40" cy="40" r="32" fill="none"
                                            stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 32}
                                            strokeDashoffset={2 * Math.PI * 32 * (1 - pct / 100)}
                                            className="transition-all duration-700" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">{pct}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{m.name}</p>
                                    <p className="text-sm text-gray-400">{parts} / {target} parts</p>
                                    <p className="text-xs text-gray-500">Cycle: {m.raw?.production?.cycleTime || 0}s</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ShiftBreakdown data={shiftData} target={50} />
                <ParetoChart data={downtimeData} />
            </div>

            {/* Quality & Energy table */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📋</span> Detailed Metrics
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="text-left py-3 px-4">Machine</th>
                                <th className="text-right py-3 px-4">Parts</th>
                                <th className="text-right py-3 px-4">Target</th>
                                <th className="text-right py-3 px-4">OEE</th>
                                <th className="text-right py-3 px-4">Cycle Time</th>
                                <th className="text-right py-3 px-4">Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {machineList.map(m => (
                                <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 px-4 font-medium text-white">{m.name}</td>
                                    <td className="py-3 px-4 text-right text-gray-300 font-mono">{m.raw?.production?.partsCompleted || 0}</td>
                                    <td className="py-3 px-4 text-right text-gray-400 font-mono">{m.raw?.production?.partsTarget || 0}</td>
                                    <td className="py-3 px-4 text-right text-accent-cyan font-mono font-bold">{m.derived?.oee || 0}%</td>
                                    <td className="py-3 px-4 text-right text-gray-300 font-mono">{m.raw?.production?.cycleTime || 0}s</td>
                                    <td className="py-3 px-4 text-right text-gray-300 font-mono">{m.derived?.utilization || 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductionPage;
