// client/src/pages/LogbookPage.jsx
import { useState, useMemo, useCallback } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { FaSearch, FaDownload, FaFilter, FaClipboardList } from 'react-icons/fa';
import { format } from 'date-fns';

const eventTypeColors = {
    'start': 'bg-green-500/10 text-green-400 border-green-500/20',
    'stop': 'bg-red-500/10 text-red-400 border-red-500/20',
    'alarm': 'bg-red-500/10 text-red-400 border-red-500/20',
    'downtime': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'maintenance': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'parameter_change': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'info': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const eventTypeIcons = {
    'start': '▶️', 'stop': '⏹️', 'alarm': '🚨', 'downtime': '⏸️',
    'maintenance': '🔧', 'parameter_change': '⚙️', 'info': 'ℹ️',
};

const PAGE_SIZE = 20;

const LogbookPage = () => {
    const { logbookEvents = [] } = useDashboardStore();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [machineFilter, setMachineFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Reset pagination when filters change
    const handleSearch = useCallback((v) => { setSearch(v); setVisibleCount(PAGE_SIZE); }, []);
    const handleType = useCallback((v) => { setTypeFilter(v); setVisibleCount(PAGE_SIZE); }, []);
    const handleMachine = useCallback((v) => { setMachineFilter(v); setVisibleCount(PAGE_SIZE); }, []);

    const eventTypes = ['all', 'start', 'stop', 'alarm', 'downtime', 'maintenance', 'parameter_change'];
    const machines = ['all', ...new Set(logbookEvents.map(e => e.machineId))];

    const filteredEvents = useMemo(() => {
        return logbookEvents
            .filter(e => typeFilter === 'all' || e.type === typeFilter)
            .filter(e => machineFilter === 'all' || e.machineId === machineFilter)
            .filter(e => {
                if (!search) return true;
                const q = search.toLowerCase();
                return e.message?.toLowerCase().includes(q) ||
                    e.machineName?.toLowerCase().includes(q) ||
                    e.operator?.toLowerCase().includes(q);
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [logbookEvents, search, typeFilter, machineFilter]);

    const exportCSV = () => {
        const headers = ['Timestamp', 'Machine', 'Type', 'Message', 'Operator', 'Details'];
        const rows = filteredEvents.map(e => [
            new Date(e.timestamp).toISOString(),
            e.machineName || e.machineId,
            e.type,
            e.message,
            e.operator || '-',
            e.details || '-',
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logbook_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaClipboardList className="text-accent-cyan" /> Machine Logbook
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{filteredEvents.length} events recorded</p>
                </div>

                <button
                    onClick={exportCSV}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <FaDownload size={12} /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card-static p-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                    <input
                        type="text" value={search} onChange={e => handleSearch(e.target.value)}
                        placeholder="Search events..."
                        className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/40"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={typeFilter} onChange={e => handleType(e.target.value)}
                        className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accent-cyan/40"
                    >
                        {eventTypes.map(t => (
                            <option key={t} value={t}>{t === 'all' ? '🔍 All Types' : `${eventTypeIcons[t] || ''} ${t.replace('_', ' ')}`}</option>
                        ))}
                    </select>

                    <select
                        value={machineFilter} onChange={e => handleMachine(e.target.value)}
                        className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accent-cyan/40"
                    >
                        {machines.map(m => (
                            <option key={m} value={m}>{m === 'all' ? '🏭 All Machines' : m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                    <div className="glass-card-static p-12 text-center space-y-3">
                        <FaClipboardList className="text-5xl text-gray-700 mx-auto" />
                        <p className="text-gray-400 font-medium">No events match your filters</p>
                        <p className="text-gray-600 text-sm">Try adjusting the search or filter criteria above.</p>
                        {(search || typeFilter !== 'all' || machineFilter !== 'all') && (
                            <button
                                onClick={() => { handleSearch(''); handleType('all'); handleMachine('all'); }}
                                className="text-accent-cyan text-sm hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    filteredEvents.slice(0, visibleCount).map((event, i) => (
                        <div key={event.id || i} className="glass-card-static p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="text-xl flex-shrink-0 mt-0.5">{eventTypeIcons[event.type] || 'ℹ️'}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${eventTypeColors[event.type] || eventTypeColors['info']}`}>
                                        {event.type?.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {event.machineName || event.machineId}
                                    </span>
                                    {event.operator && (
                                        <span className="text-xs text-gray-600">by {event.operator}</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-200">{event.message}</p>
                                {event.details && <p className="text-xs text-gray-500 mt-1">{event.details}</p>}
                            </div>
                            <div className="text-xs text-gray-600 font-mono whitespace-nowrap flex-shrink-0">
                                {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : '--:--:--'}
                                <div className="text-[10px] text-gray-700 mt-0.5">
                                    {event.timestamp ? format(new Date(event.timestamp), 'dd MMM') : ''}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More */}
            {filteredEvents.length > visibleCount && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                        className="btn-primary text-sm px-8 py-2.5"
                    >
                        Load More ({filteredEvents.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default LogbookPage;
