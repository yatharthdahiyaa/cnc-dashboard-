// client/src/components/DataFreshnessIndicator.jsx
import { useState, useEffect, memo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';

/**
 * Shows how stale the data is.
 * Green  = updated < 5s ago
 * Amber  = updated 5–15s ago
 * Red    = updated > 15s ago (or never)
 *
 * Satisfies the "Real-Time Data Updates" best practice —
 * users always know if they're looking at fresh data.
 */
const DataFreshnessIndicator = () => {
    const { lastUpdate, isConnected } = useDashboardStore();
    const [secondsAgo, setSecondsAgo] = useState(0);

    useEffect(() => {
        const tick = () => {
            if (!lastUpdate) { setSecondsAgo(999); return; }
            setSecondsAgo(Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lastUpdate]);

    if (!isConnected) return null;

    const { color, label } = secondsAgo < 5
        ? { color: 'text-green-400', label: 'Live' }
        : secondsAgo < 15
            ? { color: 'text-amber-400', label: `${secondsAgo}s ago` }
            : { color: 'text-red-400', label: `${secondsAgo}s ago` };

    return (
        <div className={`flex items-center gap-1.5 text-[10px] font-mono ${color}`} title={`Data last updated ${secondsAgo}s ago`}>
            <span className={`w-1.5 h-1.5 rounded-full ${secondsAgo < 5 ? 'bg-green-400 animate-pulse' : secondsAgo < 15 ? 'bg-amber-400' : 'bg-red-400'}`} />
            {label}
        </div>
    );
};

export default memo(DataFreshnessIndicator);
