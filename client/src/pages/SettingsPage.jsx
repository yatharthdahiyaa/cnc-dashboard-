// client/src/pages/SettingsPage.jsx
import { useAuthStore } from '../store/useAuthStore';
import { useDashboardStore } from '../store/useDashboardStore';
import { FaCog, FaUserShield, FaBell, FaDatabase, FaShieldAlt, FaClock } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const SESSION_TIMEOUT_MS = 5 * 60 * 60 * 1000; // 5 hours

const SettingsPage = () => {
    const { currentRole, userName, loginAt } = useAuthStore();
    const { alertThresholds, updateThresholds } = useDashboardStore();
    const [timeRemaining, setTimeRemaining] = useState('');

    // Live session countdown
    useEffect(() => {
        const tick = () => {
            if (!loginAt) { setTimeRemaining('Unknown'); return; }
            const elapsed = Date.now() - loginAt;
            const remaining = SESSION_TIMEOUT_MS - elapsed;
            if (remaining <= 0) { setTimeRemaining('Expired'); return; }
            const h = Math.floor(remaining / 3_600_000);
            const m = Math.floor((remaining % 3_600_000) / 60_000);
            const s = Math.floor((remaining % 60_000) / 1_000);
            setTimeRemaining(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [loginAt]);

    const handleThresholdChange = (key, value) => {
        updateThresholds({ [key]: Number(value) });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FaCog className="text-accent-cyan" /> Settings
                </h1>
                <p className="text-gray-500 text-sm mt-1">System configuration and preferences</p>
            </div>

            {/* User Info */}
            <div className="glass-card p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FaUserShield className="text-accent-purple" size={14} /> User Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Name</label>
                        <p className="text-white font-medium mt-1">{userName}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Role</label>
                        <p className="text-accent-cyan font-medium mt-1">{currentRole}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FaClock size={10} /> Session Expires In
                        </label>
                        <p className={`mt-1 text-sm font-mono font-bold ${timeRemaining.startsWith('0h') ? 'text-amber-400' : 'text-green-400'
                            }`}>{timeRemaining}</p>
                    </div>
                </div>
            </div>


            {/* Alert Thresholds */}
            <div className="glass-card p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FaBell className="text-accent-amber" size={14} /> Alert Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { key: 'spindleSpeed', label: 'Max Spindle Speed (RPM)', min: 1000, max: 20000, step: 100 },
                        { key: 'spindleLoad', label: 'Max Spindle Load (%)', min: 10, max: 100, step: 5 },
                        { key: 'temperature', label: 'Max Temperature (°C)', min: 30, max: 100, step: 5 },
                        { key: 'oee', label: 'Min OEE (%)', min: 10, max: 100, step: 5 },
                    ].map(({ key, label, min, max, step }) => (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-400">{label}</label>
                                <span className="text-sm font-mono text-accent-cyan">{alertThresholds[key]}</span>
                            </div>
                            <input
                                type="range" min={min} max={max} step={step}
                                value={alertThresholds[key]}
                                onChange={e => handleThresholdChange(key, e.target.value)}
                                className="w-full accent-accent-cyan h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                <span>{min}</span><span>{max}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Architecture Info */}
            <div className="glass-card p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FaDatabase className="text-accent-blue" size={14} /> Data Architecture
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Data Source</span>
                        <span className="text-gray-200 font-mono">Google Sheets + Simulated</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Update Frequency</span>
                        <span className="text-gray-200 font-mono">2 seconds</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Protocol</span>
                        <span className="text-gray-200 font-mono">WebSocket (Socket.IO)</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Data Retention</span>
                        <span className="text-gray-200 font-mono">Raw: 90 days · Aggregated: 2 years</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Compatibility</span>
                        <span className="text-gray-200 font-mono">OPC UA / MTConnect / FOCAS</span>
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="glass-card p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FaShieldAlt className="text-accent-green" size={14} /> Access Permissions
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-500 uppercase tracking-wider border-b border-white/5">
                                <th className="text-left py-2 px-3">Feature</th>
                                <th className="text-center py-2 px-3">Operator</th>
                                <th className="text-center py-2 px-3">Supervisor</th>
                                <th className="text-center py-2 px-3">Maintenance</th>
                                <th className="text-center py-2 px-3">Admin</th>
                                <th className="text-center py-2 px-3">Host</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { feature: 'Dashboard', roles: [true, true, true, true, true] },
                                { feature: 'Machine Detail', roles: [true, true, true, true, true] },
                                { feature: 'Logbook', roles: [true, true, true, true, true] },
                                { feature: 'Production', roles: [false, true, false, true, true] },
                                { feature: 'Workpieces', roles: [false, false, true, true, true] },
                                { feature: 'CNN Model', roles: [false, false, true, true, true] },
                                { feature: 'Alert Mgmt', roles: [false, true, false, true, true] },
                                { feature: 'Settings', roles: [false, false, false, true, true] },
                            ].map(row => (
                                <tr key={row.feature} className="border-b border-white/[0.03]">
                                    <td className="py-2 px-3 text-gray-300">{row.feature}</td>
                                    {row.roles.map((has, i) => (
                                        <td key={i} className="py-2 px-3 text-center">
                                            {has ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
