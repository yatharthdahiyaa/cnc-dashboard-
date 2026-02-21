import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';

const AlertSettings = ({ onClose }) => {
    const { alertThresholds, updateThresholds } = useDashboardStore();
    const [localThresholds, setLocalThresholds] = useState({ ...alertThresholds });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalThresholds(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSave = () => {
        updateThresholds(localThresholds);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaExclamationTriangle className="text-accent-amber" />
                    Alert Configuration
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Max Spindle Speed (RPM)
                        </label>
                        <input
                            type="number"
                            name="spindleSpeed"
                            value={localThresholds.spindleSpeed}
                            onChange={handleChange}
                            className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Alert if speed exceeds this value</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Max Spindle Load (%)
                        </label>
                        <input
                            type="number"
                            name="spindleLoad"
                            value={localThresholds.spindleLoad}
                            onChange={handleChange}
                            className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Alert if load exceeds this value</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Max Temperature (°C)
                        </label>
                        <input
                            type="number"
                            name="temperature"
                            value={localThresholds.temperature}
                            onChange={handleChange}
                            className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Alert if temp exceeds this value</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Min OEE (%)
                        </label>
                        <input
                            type="number"
                            name="oee"
                            value={localThresholds.oee}
                            onChange={handleChange}
                            className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Alert if OEE drops below this value</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FaSave />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertSettings;
