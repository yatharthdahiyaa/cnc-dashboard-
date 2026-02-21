// client/src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
    FaTachometerAlt, FaClipboardList, FaChartBar, FaCubes,
    FaBrain, FaCog, FaBars, FaTimes, FaSignOutAlt, FaUserShield
} from 'react-icons/fa';

const navItems = [
    { path: '/', icon: FaTachometerAlt, label: 'Dashboard', permission: 'dashboard' },
    { path: '/logbook', icon: FaClipboardList, label: 'Logbook', permission: 'logbook_view' },
    { path: '/production', icon: FaChartBar, label: 'Production', permission: 'production' },
    { path: '/workpieces', icon: FaCubes, label: 'Workpieces', permission: 'workpieces' },
    { path: '/cnn', icon: FaBrain, label: 'CNN Model', permission: 'cnn_model' },
    { path: '/settings', icon: FaCog, label: 'Settings', permission: 'dashboard' },
];

const Sidebar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { currentRole, userName, logout, hasPermission } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close drawer on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const visibleItems = navItems.filter(item => hasPermission(item.permission));

    const SidebarContent = () => (
        <aside className={`flex flex-col h-full bg-dark-800/95 backdrop-blur-xl border-r border-white/5`}>
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-white/5 gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-sm">CNC</span>
                </div>
                <span className="font-bold text-white text-lg whitespace-nowrap">Command Center</span>
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
                {visibleItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-lg shadow-accent-cyan/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        <item.icon size={18} className="flex-shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                        <FaUserShield size={14} className="text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{userName}</p>
                        <p className="text-[10px] text-accent-purple uppercase tracking-wider">{currentRole}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 w-full text-sm transition-colors mt-1"
                    aria-label="Sign out"
                >
                    <FaSignOutAlt size={16} className="flex-shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );

    return (
        <>
            {/* ── Desktop sidebar (fixed, icon-only → hover expands) ── */}
            <div className="hidden md:block fixed top-0 left-0 h-full z-40 w-20 hover:w-64 transition-all duration-300 ease-in-out group/sidebar overflow-hidden">
                <aside className="flex flex-col h-full bg-dark-800/90 backdrop-blur-xl border-r border-white/5">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-5 border-b border-white/5 gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-sm">CNC</span>
                        </div>
                        <span className="font-bold text-white text-lg whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                            Command Center
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
                        {visibleItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden
                  ${isActive
                                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-lg shadow-accent-cyan/5'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`
                                }
                            >
                                <item.icon size={18} className="flex-shrink-0" />
                                <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User */}
                    <div className="p-3 border-t border-white/5">
                        <div className="flex items-center gap-3 px-3 py-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                                <FaUserShield size={14} className="text-accent-purple" />
                            </div>
                            <div className="flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                                <p className="text-xs text-white font-medium truncate">{userName}</p>
                                <p className="text-[10px] text-accent-purple uppercase tracking-wider">{currentRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 w-full text-sm transition-colors overflow-hidden mt-1"
                            aria-label="Sign out"
                        >
                            <FaSignOutAlt size={16} className="flex-shrink-0" />
                            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                                Sign Out
                            </span>
                        </button>
                    </div>
                </aside>
            </div>

            {/* ── Mobile: hamburger button ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-dark-700/90 backdrop-blur-sm text-gray-400 hover:text-white border border-white/10 shadow-lg"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
            >
                <FaBars size={18} />
            </button>

            {/* ── Mobile: overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Mobile: slide-in drawer ── */}
            <div
                className={`fixed top-0 left-0 h-full z-50 w-72 md:hidden transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Close button inside drawer */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close navigation menu"
                >
                    <FaTimes size={16} />
                </button>
                <SidebarContent />
            </div>
        </>
    );
};

export default Sidebar;
