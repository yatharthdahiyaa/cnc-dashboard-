// client/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, PIN_REQUIRED_ROLES, verifyPin, sanitizeInput } from '../store/useAuthStore';
import { FaUserShield, FaArrowRight, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const roleDescriptions = {
    Operator: 'Monitor machine status, view alerts and basic logbook',
    Supervisor: 'Full production oversight, manage alerts, export reports',
    Maintenance: 'Access CNN predictions, workpiece analytics, and diagnostics',
    Admin: 'Complete system access including settings and user management',
    Host: 'All access plus host-level analytics and historical data',
};

const roleColors = {
    Operator: 'from-green-500 to-emerald-600',
    Supervisor: 'from-blue-500 to-indigo-600',
    Maintenance: 'from-amber-500 to-orange-600',
    Admin: 'from-purple-500 to-violet-600',
    Host: 'from-cyan-500 to-blue-600',
};

const LoginPage = () => {
    const { login, getRoles, loginAt } = useAuthStore();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState('');
    const [userName, setUserName] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [pinError, setPinError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const requiresPin = PIN_REQUIRED_ROLES.has(selectedRole);
    const isLocked = attempts >= 5;

    const handleLogin = () => {
        if (!selectedRole || isLocked) return;

        if (requiresPin) {
            if (!pin) { setPinError('PIN is required for this role.'); return; }
            if (!verifyPin(selectedRole, pin)) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPinError(newAttempts >= 5
                    ? 'Too many failed attempts. Please refresh the page.'
                    : `Incorrect PIN. ${5 - newAttempts} attempt(s) remaining.`
                );
                return;
            }
        }

        login(selectedRole, sanitizeInput(userName));
        navigate('/');
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setPin('');
        setPinError('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    // Format last login time
    const lastLoginText = loginAt
        ? `Last session: ${new Date(loginAt).toLocaleString()}`
        : null;

    return (
        <div className="min-h-screen bg-dark-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark-800 via-dark-900 to-black flex items-center justify-center p-6">
            {/* Skip to content */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-cyan focus:text-black focus:rounded-lg focus:font-semibold text-sm">
                Skip to content
            </a>

            <div className="w-full max-w-md" id="main-content">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-cyan/20">
                        <span className="text-white font-black text-xl">CNC</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">
                        <span className="gradient-text">Command Center</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Industry 4.0 CNC Monitoring Platform</p>
                    {lastLoginText && (
                        <p className="text-gray-600 text-xs mt-1">{lastLoginText}</p>
                    )}
                </div>

                {/* Login Card */}
                <div className="glass-card-static p-8 space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                        <input
                            id="userName"
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your name"
                            maxLength={64}
                            autoComplete="name"
                            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30 transition-colors text-sm"
                        />
                    </div>

                    {/* Role selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Select Role</label>
                        <div className="space-y-2" role="radiogroup" aria-label="Select your role">
                            {getRoles().map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleSelect(role)}
                                    role="radio"
                                    aria-checked={selectedRole === role}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 text-left
                    ${selectedRole === role
                                            ? 'border-accent-cyan/40 bg-accent-cyan/5 shadow-lg shadow-accent-cyan/5'
                                            : 'border-white/5 bg-dark-700/50 hover:border-white/10 hover:bg-dark-600/50'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleColors[role]} flex items-center justify-center flex-shrink-0`}>
                                        <FaUserShield size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm ${selectedRole === role ? 'text-accent-cyan' : 'text-white'}`}>
                                            {role}
                                            {PIN_REQUIRED_ROLES.has(role) && (
                                                <FaLock size={10} className="inline ml-1.5 text-gray-500" title="PIN required" />
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{roleDescriptions[role]}</p>
                                    </div>
                                    {selectedRole === role && (
                                        <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PIN field — shown only for Admin / Host */}
                    {requiresPin && (
                        <div className="animate-in fade-in">
                            <label htmlFor="pin" className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <FaLock size={11} className="text-accent-purple" />
                                Access PIN
                            </label>
                            <div className="relative">
                                <input
                                    id="pin"
                                    type={showPin ? 'text' : 'password'}
                                    value={pin}
                                    onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinError(''); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter PIN"
                                    maxLength={8}
                                    disabled={isLocked}
                                    autoComplete="current-password"
                                    inputMode="numeric"
                                    className={`w-full bg-dark-700 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors text-sm pr-10
                    ${pinError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:border-accent-cyan/50 focus:ring-accent-cyan/30'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                                >
                                    {showPin ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                            </div>
                            {pinError && (
                                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                                    ⚠ {pinError}
                                </p>
                            )}
                            <p className="text-gray-600 text-xs mt-1">
                                Default Admin PIN: 1234 · Host PIN: 5678
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleLogin}
                        disabled={!selectedRole || isLocked}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
              ${selectedRole && !isLocked
                                ? 'btn-primary hover:shadow-lg hover:shadow-accent-cyan/20'
                                : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Enter Dashboard
                        <FaArrowRight size={12} />
                    </button>
                </div>

                <p className="text-center text-gray-600 text-xs mt-8">
                    CNC Command Center v3.0 • Industry 4.0 Platform
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
