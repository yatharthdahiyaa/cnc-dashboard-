import React from 'react';

const SystemStatus = () => {
    const systems = [
        { name: 'Coolant System', status: 'OK', icon: '💧' },
        { name: 'Hydraulic Pump', status: 'OK', icon: '🔋' },
        { name: 'Pneumatic Air', status: 'OK', icon: '💨' },
        { name: 'Chip Conveyor', status: 'IDLE', icon: '🏗️' },
        { name: 'Door Interlock', status: 'LOCKED', icon: '🔒' },
        { name: 'Lubrication', status: 'OK', icon: '🛢️' },
    ];

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🛡️</span> System Health
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {systems.map((sys, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{sys.icon}</span>
                            <span className="text-xs text-gray-300 font-medium">{sys.name}</span>
                        </div>
                        <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                        ${sys.status === 'OK' || sys.status === 'LOCKED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                        >
                            {sys.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemStatus;
