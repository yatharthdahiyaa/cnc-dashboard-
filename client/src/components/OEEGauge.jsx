// client/src/components/OEEGauge.jsx
const OEEGauge = ({ value, size = 120, items = [] }) => {
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const getColor = (v) => {
        if (v >= 85) return '#10b981'; // Green
        if (v >= 65) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const color = getColor(value);

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1f2937"
                    strokeWidth="8"
                    fill="transparent"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{value}%</span>
                <span className="text-xs text-gray-400">OEE</span>
            </div>
        </div>
    );
};

export default OEEGauge;
