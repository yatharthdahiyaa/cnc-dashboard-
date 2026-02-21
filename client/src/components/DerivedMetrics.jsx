// client/src/components/DerivedMetrics.jsx
const MetricItem = ({ label, value, unit, trend, color = 'blue' }) => {
    const colorMap = {
        blue: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
        green: 'text-accent-green bg-accent-green/10 border-accent-green/20',
        amber: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
        purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
        red: 'text-accent-red bg-accent-red/10 border-accent-red/20',
    };

    return (
        <div className={`p-3 rounded-lg border ${colorMap[color]} transition-all duration-300 hover:scale-105`}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">{value}</span>
                {unit && <span className="text-xs opacity-70">{unit}</span>}
            </div>
        </div>
    );
};

const DerivedMetrics = ({ derived }) => {
    if (!derived) return null;

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-accent-cyan">⚡</span> Performance Analytics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricItem
                    label="Production Rate"
                    value={derived.productionRate}
                    unit="parts/hr"
                    color="blue"
                />
                <MetricItem
                    label="Feed Rate"
                    value={derived.feedRate}
                    unit="mm/min"
                    color="purple"
                />
                <MetricItem
                    label="Est. Completion"
                    value={Math.round(derived.estimatedCompletion / 60)}
                    unit="min"
                    color="green"
                />
                <MetricItem
                    label="Throughput Eff."
                    value={derived.cycleEfficiency}
                    unit="%"
                    color={derived.cycleEfficiency > 90 ? 'green' : 'amber'}
                />
                <MetricItem
                    label="Tool Wear Idx"
                    value={derived.toolWearIndex}
                    unit="/100"
                    color={derived.toolWearIndex > 80 ? 'red' : 'blue'}
                />
                <MetricItem
                    label="Spindle Power"
                    value={(derived.spindlePower / 1000).toFixed(1)}
                    unit="kW"
                    color="amber"
                />
                <MetricItem
                    label="Thermal Risk"
                    value={derived.thermalRisk}
                    unit=""
                    color={derived.thermalRisk === 'HIGH' ? 'red' : derived.thermalRisk === 'MEDIUM' ? 'amber' : 'green'}
                />
                <MetricItem
                    label="Utilization"
                    value={derived.utilization}
                    unit="%"
                    color="blue"
                />
            </div>
        </div>
    );
};

export default DerivedMetrics;
