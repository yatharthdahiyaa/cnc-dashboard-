// client/src/components/MachineCard.jsx
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import OEEGauge from './OEEGauge';

const statusConfig = {
    RUNNING: { color: 'text-green-400', bg: 'bg-green-400', glow: 'shadow-green-500/20', label: 'Running' },
    IDLE: { color: 'text-amber-400', bg: 'bg-amber-400', glow: 'shadow-amber-500/20', label: 'Idle' },
    PAUSED: { color: 'text-blue-400', bg: 'bg-blue-400', glow: 'shadow-blue-500/20', label: 'Paused' },
    ALARM: { color: 'text-red-400', bg: 'bg-red-400', glow: 'shadow-red-500/20', label: 'Alarm' },
    MAINTENANCE: { color: 'text-purple-400', bg: 'bg-purple-400', glow: 'shadow-purple-500/20', label: 'Maintenance' },
    OFFLINE: { color: 'text-gray-500', bg: 'bg-gray-500', glow: '', label: 'Offline' },
};

// Skeleton placeholder while data is loading
const MachineCardSkeleton = () => (
    <div className="glass-card-static p-6 min-h-[220px] space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <div className="skeleton h-5 w-32 rounded-lg" />
                <div className="skeleton h-3 w-16 rounded-lg" />
            </div>
            <div className="skeleton h-10 w-16 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-24 rounded-xl" />
            <div className="space-y-3 pt-2">
                <div className="skeleton h-4 rounded-lg" />
                <div className="skeleton h-2 rounded-full" />
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-2 w-3/4 rounded-full" />
            </div>
        </div>
        <div className="skeleton h-3 rounded-lg" />
    </div>
);

// Context badge: shows if a metric is above/below a threshold
const ContextBadge = ({ value, target, unit, higherIsBetter = true }) => {
    if (!target || !value) return null;
    const pct = ((value - target) / target) * 100;
    const isGood = higherIsBetter ? value >= target : value <= target;
    const sign = pct > 0 ? '+' : '';
    if (Math.abs(pct) < 1) return null; // no badge if within 1%
    return (
        <span className={`text-[9px] font-bold ml-1 ${isGood ? 'text-green-400' : 'text-red-400'}`}>
            {isGood ? '▲' : '▼'} {sign}{pct.toFixed(0)}%
        </span>
    );
};

const MachineCard = ({ machine }) => {
    const navigate = useNavigate();
    const { machineHistory } = useDashboardStore();

    // Skeleton while data hasn't arrived yet
    if (!machine || !machine.raw) return <MachineCardSkeleton />;

    const { id, name, raw, derived } = machine;
    const status = raw?.status || 'OFFLINE';
    const cfg = statusConfig[status] || statusConfig['OFFLINE'];

    // ── OEE trend from history ──────────────────────────────────────────────
    const history = machineHistory?.[id] || [];
    const recentOEE = history.slice(-5).map(p => p.oee || 0);
    const oeeTrend = recentOEE.length >= 2
        ? recentOEE[recentOEE.length - 1] - recentOEE[0]
        : null;

    // ── Spindle speed trend ─────────────────────────────────────────────────
    const recentSpeed = history.slice(-5).map(p => p.spindleSpeed || 0);
    const speedTrend = recentSpeed.length >= 2
        ? recentSpeed[recentSpeed.length - 1] - recentSpeed[0]
        : null;

    return (
        <div
            onClick={() => navigate(`/machine/${id}`)}
            className="glass-card p-6 cursor-pointer group relative overflow-hidden"
            role="button"
            tabIndex={0}
            aria-label={`${name} — ${cfg.label}. Click for details.`}
            onKeyDown={e => e.key === 'Enter' && navigate(`/machine/${id}`)}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-accent-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-accent-cyan transition-colors">
                            {name}
                        </h3>
                        <div className={`w-2 h-2 rounded-full ${cfg.bg} ${status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                        </span>
                        {status === 'ALARM' && <span className="text-red-400 text-xs animate-pulse">⚠</span>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Parts</p>
                    <p className="text-lg font-mono text-white font-bold">
                        {raw?.production?.partsCompleted || 0}
                        <span className="text-gray-600 text-sm"> / {raw?.production?.partsTarget || 0}</span>
                    </p>
                    {/* Context: parts completion % */}
                    {raw?.production?.partsTarget > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            {Math.round((raw.production.partsCompleted / raw.production.partsTarget) * 100)}% of target
                        </p>
                    )}
                </div>
            </div>

            {/* OEE + Quick Stats */}
            <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col items-center">
                    <OEEGauge value={derived?.oee || 0} size={90} />
                    {/* OEE trend indicator */}
                    {oeeTrend !== null && Math.abs(oeeTrend) >= 0.5 && (
                        <span className={`text-[10px] font-bold mt-1 ${oeeTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {oeeTrend > 0 ? '▲' : '▼'} {Math.abs(oeeTrend).toFixed(1)}% OEE
                        </span>
                    )}
                </div>

                <div className="space-y-2.5">
                    <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                            S1 — Main Spindle Speed
                            {speedTrend !== null && Math.abs(speedTrend) > 100 && (
                                <span className={`ml-1 font-bold ${speedTrend > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                    {speedTrend > 0 ? '▲' : '▼'}
                                </span>
                            )}
                        </p>
                        <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-white font-mono">
                                {(raw?.spindle?.speed || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-accent-blue mb-0.5">RPM</span>
                            <ContextBadge value={raw?.spindle?.speed} target={10000} unit="RPM" higherIsBetter={false} />
                        </div>
                        <div className="w-full bg-dark-700 h-1 mt-1 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue transition-all duration-500" style={{ width: `${Math.min((raw?.spindle?.speed || 0) / 12000 * 100, 100)}%` }} />
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Load</p>
                        <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-white font-mono">
                                {(raw?.spindle?.load || 0).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-accent-purple mb-0.5">%</span>
                            <ContextBadge value={raw?.spindle?.load} target={90} unit="%" higherIsBetter={false} />
                        </div>
                        <div className="w-full bg-dark-700 h-1 mt-1 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${(raw?.spindle?.load || 0) > 90 ? 'bg-red-500' : 'bg-accent-purple'}`}
                                style={{ width: `${Math.min(raw?.spindle?.load || 0, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] text-gray-500">
                <span>Util: <span className={derived?.utilization >= 70 ? 'text-green-400' : 'text-amber-400'}>{derived?.utilization || 0}%</span></span>
                <span>Rate: {derived?.productionRate || 0} pcs/hr</span>
                <span>ETA: {Math.round((derived?.estimatedCompletion || 0) / 60)}m</span>
            </div>
        </div>
    );
};

export default memo(MachineCard);
