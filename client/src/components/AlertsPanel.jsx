// client/src/components/AlertsPanel.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import { FaTimes, FaBell, FaExclamationTriangle, FaInfoCircle, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useState } from 'react';

const AlertsPanel = ({ isOpen, onClose }) => {
    const { activeAlerts, alertHistory, dismissAlert, acknowledgeAlert, resolveAlert, clearAllAlerts } = useDashboardStore();
    const [tab, setTab] = useState('active');

    if (!isOpen) return null;

    const displayAlerts = tab === 'active' ? activeAlerts : alertHistory;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-dark-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <FaBell className="text-accent-blue" />
                        <h2 className="text-lg font-bold text-white">Alerts</h2>
                        {activeAlerts.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {activeAlerts.length}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                        <FaTimes />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setTab('active')}
                        className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors
              ${tab === 'active' ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Active ({activeAlerts.length})
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors
              ${tab === 'history' ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        History ({alertHistory.length})
                    </button>
                </div>

                {/* Alert List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {displayAlerts.length === 0 ? (
                        <div className="text-center py-16 text-gray-600">
                            <FaBell className="text-3xl mx-auto mb-3 opacity-20" />
                            <p className="text-sm">{tab === 'active' ? 'No active alerts' : 'No alert history'}</p>
                        </div>
                    ) : (
                        displayAlerts.map((alert) => (
                            <div
                                key={alert.id + '-' + alert.timestamp}
                                className={`rounded-xl p-3.5 border-l-[3px] relative group transition-colors
                  ${alert.resolved ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/60 hover:bg-dark-600/60'}
                  ${alert.severity === 'critical' ? 'border-l-red-500' :
                                        alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'
                                    }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    {alert.severity === 'critical' ? (
                                        <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={13} />
                                    ) : alert.severity === 'warning' ? (
                                        <FaExclamationTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={13} />
                                    ) : (
                                        <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0" size={13} />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-semibold text-white text-xs truncate">
                                                {alert.machineName}
                                            </h4>
                                            {alert.acknowledged && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">ACK</span>
                                            )}
                                            {alert.resolved && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">RESOLVED</span>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-xs">{alert.message}</p>
                                        <span className="text-[10px] text-gray-600 mt-1 block font-mono">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {tab === 'active' && !alert.resolved && (
                                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-white/5">
                                        {!alert.acknowledged && (
                                            <button
                                                onClick={() => acknowledgeAlert(alert.id)}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-medium transition-colors"
                                            >
                                                <FaCheck size={8} /> Acknowledge
                                            </button>
                                        )}
                                        <button
                                            onClick={() => resolveAlert(alert.id)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-[10px] font-medium transition-colors"
                                        >
                                            <FaCheckDouble size={8} /> Resolve
                                        </button>
                                        <button
                                            onClick={() => dismissAlert(alert.id)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-gray-500 hover:text-white text-[10px] font-medium transition-colors ml-auto"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {tab === 'active' && activeAlerts.length > 0 && (
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={clearAllAlerts}
                            className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs font-medium"
                        >
                            Clear All Alerts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPanel;
