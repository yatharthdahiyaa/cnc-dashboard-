// client/src/components/OEEBreakdown.jsx
const RingGauge = ({ value, label, color, size = 80 }) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / 100, 1);
    const dashOffset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke={color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{value.toFixed(1)}%</span>
                </div>
            </div>
            <span className="text-xs text-gray-400 mt-2 font-medium">{label}</span>
        </div>
    );
};

const OEEBreakdown = ({ availability = 0, performance = 0, quality = 100, oee = 0 }) => {
    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">📊</span>
                <h3 className="text-lg font-semibold text-gray-300">OEE Breakdown</h3>
            </div>

            <div className="flex items-center justify-center mb-6">
                <RingGauge value={oee} label="Overall OEE" color="#00d4ff" size={110} />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <RingGauge value={availability} label="Availability" color="#10b981" size={75} />
                <RingGauge value={performance} label="Performance" color="#3b82f6" size={75} />
                <RingGauge value={quality} label="Quality" color="#8b5cf6" size={75} />
            </div>
        </div>
    );
};

export default OEEBreakdown;
