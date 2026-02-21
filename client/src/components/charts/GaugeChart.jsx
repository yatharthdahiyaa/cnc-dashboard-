// client/src/components/charts/GaugeChart.jsx
const GaugeChart = ({ value = 0, max = 100, label = '', unit = '', size = 140, zones }) => {
    const defaultZones = [
        { end: 0.6, color: '#10b981' },  // green
        { end: 0.8, color: '#f59e0b' },  // yellow
        { end: 1.0, color: '#ef4444' },  // red
    ];
    const colorZones = zones || defaultZones;
    const pct = Math.min(value / max, 1);

    // Arc math
    const cx = size / 2;
    const cy = size / 2 + 10;
    const radius = size / 2 - 16;
    const startAngle = -210;
    const endAngle = 30;
    const totalAngle = endAngle - startAngle; // 240 degrees

    const polarToCartesian = (angle) => {
        const rad = (angle * Math.PI) / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    };

    const arcPath = (startPct, endPct) => {
        const a1 = startAngle + totalAngle * startPct;
        const a2 = startAngle + totalAngle * endPct;
        const p1 = polarToCartesian(a1);
        const p2 = polarToCartesian(a2);
        const largeArc = (a2 - a1) > 180 ? 1 : 0;
        return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
    };

    // Needle
    const needleAngle = startAngle + totalAngle * pct;
    const needleTip = polarToCartesian(needleAngle);
    const needleLen = radius - 8;
    const needleRad = (needleAngle * Math.PI) / 180;
    const tipX = cx + needleLen * Math.cos(needleRad);
    const tipY = cy + needleLen * Math.sin(needleRad);

    // Current zone color
    let currentColor = colorZones[colorZones.length - 1].color;
    for (const z of colorZones) {
        if (pct <= z.end) { currentColor = z.color; break; }
    }

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
                {/* Track */}
                <path d={arcPath(0, 1)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />

                {/* Color zones */}
                {colorZones.map((zone, i) => {
                    const start = i === 0 ? 0 : colorZones[i - 1].end;
                    return (
                        <path key={i} d={arcPath(start, zone.end)} fill="none" stroke={zone.color} strokeWidth="10" strokeLinecap="round" opacity="0.2" />
                    );
                })}

                {/* Value arc */}
                {pct > 0.005 && (
                    <path d={arcPath(0, pct)} fill="none" stroke={currentColor} strokeWidth="10" strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${currentColor}40)` }} />
                )}

                {/* Needle */}
                <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke="white" strokeWidth="2" strokeLinecap="round"
                    className="transition-all duration-500 ease-out" />
                <circle cx={cx} cy={cy} r="4" fill="white" />
            </svg>

            <div className="text-center -mt-1">
                <div className="font-mono font-bold text-xl text-white" style={{ color: currentColor }}>
                    {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
                    <span className="text-xs text-gray-500 ml-1">{unit}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
        </div>
    );
};

export default GaugeChart;
