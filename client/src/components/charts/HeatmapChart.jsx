// client/src/components/charts/HeatmapChart.jsx
const HeatmapChart = ({ data = [], title = 'Temperature Heatmap', unit = '°C' }) => {
    // data: [{ zone: 'Spindle', values: [42, 44, 45, 43, 46, 48, 50, 47, 45, 44] }]
    // Each 'values' array = time series across 10 intervals

    const getColor = (value, min, max) => {
        const pct = max > min ? (value - min) / (max - min) : 0;
        if (pct < 0.33) return { bg: 'rgba(16, 185, 129, 0.3)', border: 'rgba(16, 185, 129, 0.5)' };
        if (pct < 0.66) return { bg: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.5)' };
        return { bg: 'rgba(239, 68, 68, 0.5)', border: 'rgba(239, 68, 68, 0.6)' };
    };

    const allValues = data.flatMap(d => d.values);
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 100);

    const timeLabels = Array.from({ length: 10 }, (_, i) => `T${i + 1}`);

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>🌡️</span> {title}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Zone temperatures over recent intervals</p>

            <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                    {/* Time header */}
                    <div className="flex mb-1">
                        <div className="w-24 flex-shrink-0" />
                        {timeLabels.map(t => (
                            <div key={t} className="flex-1 text-center text-[10px] text-gray-500 font-mono">{t}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    {data.map(row => (
                        <div key={row.zone} className="flex items-center mb-1">
                            <div className="w-24 flex-shrink-0 text-xs text-gray-400 font-medium pr-2 truncate">{row.zone}</div>
                            <div className="flex-1 flex gap-0.5">
                                {row.values.map((val, i) => {
                                    const c = getColor(val, minVal, maxVal);
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 h-8 rounded-sm flex items-center justify-center text-[9px] font-mono text-white/80 transition-all duration-300 hover:scale-110 cursor-default"
                                            style={{ background: c.bg, border: `1px solid ${c.border}` }}
                                            title={`${row.zone} at ${timeLabels[i]}: ${val}${unit}`}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-4 mt-4 text-[10px] text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(16, 185, 129, 0.3)' }} /> Low
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(245, 158, 11, 0.4)' }} /> Medium
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.5)' }} /> High
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapChart;
