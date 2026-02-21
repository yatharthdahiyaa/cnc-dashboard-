import React from 'react';

const JobProgress = ({ partsCompleted, partsTarget }) => {
    const percentage = Math.min(Math.round((partsCompleted / partsTarget) * 100), 100) || 0;

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-xl">📋</span> Current Job
                    </h3>
                    <div className="text-accent-cyan font-mono text-sm mt-1">PRG: OP-450-ALU-REV2.Nc</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400">Batch ID</div>
                    <div className="text-sm font-mono text-gray-200">#89-22-L</div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-dark-700 h-3 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Parts Done</div>
                    <div className="text-xl font-mono text-white">{partsCompleted}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Target</div>
                    <div className="text-xl font-mono text-gray-400">{partsTarget}</div>
                </div>
            </div>
        </div>
    );
};

export default JobProgress;
