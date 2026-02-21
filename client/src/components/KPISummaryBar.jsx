// client/src/components/KPISummaryBar.jsx
import { memo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { FaExclamationTriangle, FaCheckCircle, FaFire } from 'react-icons/fa';

/**
 * KPI Summary Bar — satisfies the 5-second rule.
 * Shows the 5 most critical fleet-wide numbers at a glance.
 * Placed at the very top of the portal so users can interpret
 * the key status within 5 seconds of opening the dashboard.
 */
const KPISummaryBar = () => {
    const { machines, activeAlerts, machineHistory } = useDashboardStore();
    const machineList = Object.values(machines).filter(m => m && m.id);

    if (machineList.length === 0) return null;

    // ── Fleet OEE (average) ──────────────────────────────────────────────────
    const oeeValues = machineList.map(m => m.derived?.oee || 0);
    const fleetOEE = oeeValues.length > 0
        ? Math.round(oeeValues.reduce((a, b) => a + b, 0) / oeeValues.length)
        : 0;

    // ── Active machines ──────────────────────────────────────────────────────
    const activeMachines = machineList.filter(m => m.raw?.status === 'RUNNING').length;

    // ── Total parts today (sum across machines) ──────────────────────────────
    const totalParts = machineList.reduce((sum, m) => sum + (m.raw?.production?.partsCompleted || 0), 0);

    // ── Worst thermal risk ───────────────────────────────────────────────────
    const thermalRisks = machineList.map(m => m.derived?.thermalRisk || 'LOW');
    const worstThermal = thermalRisks.includes('HIGH') ? 'HIGH'
        : thermalRisks.includes('MEDIUM') ? 'MEDIUM' : 'LOW';

    // ── OEE trend (last 5 history points for machine1) ───────────────────────
    const m1History = machineHistory?.machine1 || [];
    const recentOEE = m1History.slice(-5).map(p => p.oee || 0);
    const oeeTrend = recentOEE.length >= 2
        ? recentOEE[recentOEE.length - 1] - recentOEE[0]
        : 0;

    const kpis = [
        {
            label: 'Fleet OEE',
            value: `${fleetOEE}%`,
            trend: oeeTrend,
            status: fleetOEE >= 75 ? 'good' : fleetOEE >= 50 ? 'warn' : 'bad',
            icon: null,
        },
        {
            label: 'Running',
            value: `${activeMachines} / ${machineList.length}`,
            status: activeMachines === machineList.length ? 'good' : activeMachines > 0 ? 'warn' : 'bad',
            icon: null,
        },
        {
            label: 'Parts Today',
            value: totalParts.toLocaleString(),
            status: 'neutral',
            icon: null,
        },
        {
            label: 'Active Alerts',
            value: activeAlerts.length,
            status: activeAlerts.length === 0 ? 'good' : activeAlerts.some(a => a.severity === 'critical') ? 'bad' : 'warn',
            icon: activeAlerts.length > 0 ? FaExclamationTriangle : FaCheckCircle,
        },
        {
            label: 'Thermal Risk',
            value: worstThermal,
            status: worstThermal === 'HIGH' ? 'bad' : worstThermal === 'MEDIUM' ? 'warn' : 'good',
            icon: worstThermal !== 'LOW' ? FaFire : null,
        },
    ];

    const statusStyles = {
        good: 'text-green-400 border-green-500/20 bg-green-500/5',
        warn: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        bad: 'text-red-400 border-red-500/20 bg-red-500/5',
        neutral: 'text-gray-300 border-white/10 bg-white/5',
    };

    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            role="region"
            aria-label="Fleet KPI Summary"
        >
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const style = statusStyles[kpi.status];
                return (
                    <div
                        key={kpi.label}
                        className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border ${style} transition-all duration-300`}
                    >
                        <div className="flex items-center gap-1.5 mb-0.5">
                            {Icon && <Icon size={11} className="flex-shrink-0" />}
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                                {kpi.label}
                            </span>
                        </div>
                        <div className="text-xl font-black font-mono leading-none">
                            {kpi.value}
                        </div>
                        {kpi.trend !== undefined && Math.abs(kpi.trend) >= 0.5 && (
                            <div className={`text-[10px] mt-0.5 font-semibold ${kpi.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {kpi.trend > 0 ? '▲' : '▼'} {Math.abs(kpi.trend).toFixed(1)}%
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default memo(KPISummaryBar);
