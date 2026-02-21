// client/src/components/ToastNotification.jsx
import { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastNotification = () => {
    const { activeAlerts } = useDashboardStore();
    const [toasts, setToasts] = useState([]);
    const [seenAlerts] = useState(() => new Set());

    useEffect(() => {
        const newToasts = [];
        activeAlerts.forEach(alert => {
            if (!seenAlerts.has(alert.id) && (alert.severity === 'critical' || alert.severity === 'warning')) {
                seenAlerts.add(alert.id);
                newToasts.push({ ...alert, toastId: `${alert.id}-${Date.now()}` });
            }
        });
        if (newToasts.length > 0) {
            setToasts(prev => [...prev, ...newToasts].slice(-5));
        }
    }, [activeAlerts, seenAlerts]);

    // Auto dismiss after 6 seconds
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts(prev => prev.slice(1));
        }, 6000);
        return () => clearTimeout(timer);
    }, [toasts]);

    const dismiss = (toastId) => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((toast, i) => (
                <div
                    key={toast.toastId}
                    className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in
            ${toast.severity === 'critical'
                            ? 'bg-red-950/90 border-red-500/30 shadow-red-500/10'
                            : 'bg-amber-950/90 border-amber-500/30 shadow-amber-500/10'
                        }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {toast.severity === 'critical'
                        ? <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                        : <FaExclamationTriangle className="text-amber-400 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">{toast.machineName}</p>
                        <p className={`text-sm font-medium mt-0.5 ${toast.severity === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>
                            {toast.message}
                        </p>
                    </div>
                    <button onClick={() => dismiss(toast.toastId)} className="text-gray-500 hover:text-white transition-colors">
                        <FaTimes size={12} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastNotification;
