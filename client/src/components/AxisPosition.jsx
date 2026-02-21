// client/src/components/AxisPosition.jsx
const AxisPosition = ({ axis }) => {
    const { x = 0, y = 0, z = 0 } = axis || {};

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-accent-purple">◈</span> Axis Position
            </h3>

            <div className="space-y-4 font-mono">
                {/* X Axis */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400">X</span>
                        <span className="text-accent-red font-bold">{x.toFixed(3)}</span>
                    </div>
                    <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-accent-red transition-all duration-100"
                            style={{ left: `${((x + 200) / 600) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Y Axis */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Y</span>
                        <span className="text-accent-green font-bold">{y.toFixed(3)}</span>
                    </div>
                    <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-accent-green transition-all duration-100"
                            style={{ left: `${((y + 100) / 400) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Z Axis */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Z</span>
                        <span className="text-accent-blue font-bold">{z.toFixed(3)}</span>
                    </div>
                    <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-accent-blue transition-all duration-100"
                            style={{ left: `${((z + 100) / 100) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Coordinates (mm)</div>
            </div>
        </div>
    );
};

export default AxisPosition;
