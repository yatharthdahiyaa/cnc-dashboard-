// client/src/pages/WorkpiecePage.jsx
import { useState, useMemo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import SPCChart from '../components/charts/SPCChart';
import { FaCubes, FaSearch, FaCheckCircle, FaTimesCircle, FaRedoAlt } from 'react-icons/fa';
import { format } from 'date-fns';

const qualityBadge = {
    'Pass': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Fail': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Rework': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const qualityIcon = {
    'Pass': FaCheckCircle,
    'Fail': FaTimesCircle,
    'Rework': FaRedoAlt,
};

const WorkpiecePage = () => {
    const { workpieces = [] } = useDashboardStore();
    const [search, setSearch] = useState('');
    const [qualityFilter, setQualityFilter] = useState('all');
    const [selectedPiece, setSelectedPiece] = useState(null);

    const filtered = useMemo(() => {
        return workpieces
            .filter(w => qualityFilter === 'all' || w.quality === qualityFilter)
            .filter(w => {
                if (!search) return true;
                const q = search.toLowerCase();
                return w.partId?.toLowerCase().includes(q) || w.machineId?.toLowerCase().includes(q) || w.material?.toLowerCase().includes(q);
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [workpieces, search, qualityFilter]);

    // SPC data from workpieces
    const spcData = useMemo(() => {
        return workpieces
            .filter(w => w.dimensions?.diameter)
            .slice(-30)
            .map(w => ({ id: w.partId, value: w.dimensions.diameter }));
    }, [workpieces]);

    const stats = useMemo(() => {
        const total = workpieces.length;
        const pass = workpieces.filter(w => w.quality === 'Pass').length;
        const fail = workpieces.filter(w => w.quality === 'Fail').length;
        const rework = workpieces.filter(w => w.quality === 'Rework').length;
        return { total, pass, fail, rework, yieldRate: total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0' };
    }, [workpieces]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaCubes className="text-accent-cyan" /> Workpiece Tracking
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{stats.total} workpieces • {stats.yieldRate}% yield rate</p>
                </div>
            </div>

            {/* Quality Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-white font-mono">{stats.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Tracked</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 font-mono">{stats.pass}</div>
                    <div className="text-xs text-gray-400 mt-1">Passed</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-red-400 font-mono">{stats.fail}</div>
                    <div className="text-xs text-gray-400 mt-1">Failed</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-amber-400 font-mono">{stats.rework}</div>
                    <div className="text-xs text-gray-400 mt-1">Rework</div>
                </div>
            </div>

            {/* SPC Chart */}
            {spcData.length > 5 && (
                <SPCChart data={spcData} ucl={25.05} lcl={24.95} mean={25.0} label="Diameter" unit="mm" />
            )}

            {/* Empty state when no workpieces yet */}
            {workpieces.length === 0 && (
                <div className="glass-card-static p-16 text-center space-y-4">
                    <FaCubes className="text-6xl text-gray-700 mx-auto" />
                    <p className="text-gray-300 font-semibold text-lg">No workpieces tracked yet</p>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Workpieces will appear here automatically as machines complete production cycles.
                        Connect a machine via the data push API to start tracking.
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card-static p-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by Part ID, machine, material..."
                        className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/40"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'Pass', 'Fail', 'Rework'].map(q => (
                        <button key={q} onClick={() => setQualityFilter(q)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border
                ${qualityFilter === q
                                    ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30'
                                    : 'bg-dark-700 text-gray-400 border-white/5 hover:border-white/10'}`}>
                            {q === 'all' ? 'All' : q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card-static overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="text-left py-3 px-4">Part ID</th>
                                <th className="text-left py-3 px-4">Machine</th>
                                <th className="text-right py-3 px-4">Cycle Time</th>
                                <th className="text-right py-3 px-4">Diameter</th>
                                <th className="text-center py-3 px-4">Quality</th>
                                <th className="text-left py-3 px-4">Material</th>
                                <th className="text-right py-3 px-4">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-500">No workpieces match your filter</td>
                                </tr>
                            ) : (
                                filtered.slice(0, 50).map((wp, i) => {
                                    const QIcon = qualityIcon[wp.quality] || FaCheckCircle;
                                    return (
                                        <tr key={wp.partId || i}
                                            onClick={() => setSelectedPiece(wp)}
                                            className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer">
                                            <td className="py-3 px-4 font-mono text-accent-cyan font-medium">{wp.partId}</td>
                                            <td className="py-3 px-4 text-gray-300">{wp.machineName || wp.machineId}</td>
                                            <td className="py-3 px-4 text-right text-gray-300 font-mono">{wp.cycleTime?.toFixed(1)}s</td>
                                            <td className="py-3 px-4 text-right text-gray-300 font-mono">{wp.dimensions?.diameter?.toFixed(3) || '-'}mm</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${qualityBadge[wp.quality] || ''}`}>
                                                    <QIcon size={10} /> {wp.quality}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400">{wp.material || '-'}</td>
                                            <td className="py-3 px-4 text-right text-gray-500 font-mono text-xs">
                                                {wp.timestamp ? format(new Date(wp.timestamp), 'HH:mm:ss') : '--'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedPiece && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedPiece(null)}>
                    <div className="glass-card-static p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Part {selectedPiece.partId}</h3>
                            <button onClick={() => setSelectedPiece(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500">Machine:</span><br /><span className="text-white">{selectedPiece.machineName}</span></div>
                            <div><span className="text-gray-500">Quality:</span><br /><span className={`font-medium ${selectedPiece.quality === 'Pass' ? 'text-green-400' : selectedPiece.quality === 'Fail' ? 'text-red-400' : 'text-amber-400'}`}>{selectedPiece.quality}</span></div>
                            <div><span className="text-gray-500">Cycle Time:</span><br /><span className="text-white font-mono">{selectedPiece.cycleTime?.toFixed(1)}s</span></div>
                            <div><span className="text-gray-500">Diameter:</span><br /><span className="text-white font-mono">{selectedPiece.dimensions?.diameter?.toFixed(3)}mm</span></div>
                            <div><span className="text-gray-500">Material:</span><br /><span className="text-white">{selectedPiece.material}</span></div>
                            <div><span className="text-gray-500">Waste:</span><br /><span className="text-white font-mono">{selectedPiece.waste?.toFixed(1)}g</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Batch:</span><br /><span className="text-white font-mono">{selectedPiece.batchId}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkpiecePage;
