// client/src/store/useAuthStore.js
import { create } from 'zustand';

const ROLES = {
    OPERATOR: 'Operator',
    SUPERVISOR: 'Supervisor',
    MAINTENANCE: 'Maintenance',
    ADMIN: 'Admin',
    HOST: 'Host',
};

const PERMISSIONS = {
    Operator: ['dashboard', 'machine_detail', 'logbook_view'],
    Supervisor: ['dashboard', 'machine_detail', 'logbook_view', 'logbook_export', 'production', 'alerts_manage'],
    Maintenance: ['dashboard', 'machine_detail', 'logbook_view', 'logbook_export', 'cnn_model', 'workpieces'],
    Admin: ['dashboard', 'machine_detail', 'logbook_view', 'logbook_export', 'production', 'workpieces', 'cnn_model', 'alerts_manage', 'settings', 'users'],
    Host: ['dashboard', 'machine_detail', 'logbook_view', 'logbook_export', 'production', 'workpieces', 'cnn_model', 'alerts_manage', 'settings', 'users', 'host_analytics'],
};

// Roles that require a PIN to log in
export const PIN_REQUIRED_ROLES = new Set(['Admin', 'Host']);

// Role PINs — in production these would be hashed and stored server-side
const ROLE_PINS = {
    Admin: '1234',
    Host: '5678',
};

// Session timeout: 5 hours in milliseconds
const SESSION_TIMEOUT_MS = 5 * 60 * 60 * 1000;

// ─── Session persistence helpers ─────────────────────────────────────────────
const SESSION_KEY = 'cnc_session';

function saveSession(data) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (_) { /* quota exceeded or private mode */ }
}

function loadSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        // Check if session has expired
        if (session.loginAt && Date.now() - session.loginAt > SESSION_TIMEOUT_MS) {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch (_) {
        return null;
    }
}

function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) { }
}

// ─── Sanitize user input (strip HTML tags) ───────────────────────────────────
export function sanitizeInput(str) {
    return String(str)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim()
        .slice(0, 64); // max 64 chars
}

// ─── PIN verification ─────────────────────────────────────────────────────────
export function verifyPin(role, pin) {
    if (!PIN_REQUIRED_ROLES.has(role)) return true; // no PIN needed
    return ROLE_PINS[role] === pin;
}

// ─── Restore session from sessionStorage on load ─────────────────────────────
const restoredSession = loadSession();

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
    currentRole: restoredSession?.currentRole || null,
    userName: restoredSession?.userName || '',
    isAuthenticated: !!restoredSession?.currentRole,
    loginAt: restoredSession?.loginAt || null,
    lastActivity: restoredSession?.loginAt || null,

    // ─── Login ──────────────────────────────────────────────────────────────────
    login: (role, name = '') => {
        const now = Date.now();
        const session = {
            currentRole: role,
            userName: sanitizeInput(name) || role,
            loginAt: now,
        };
        saveSession(session);
        set({
            currentRole: role,
            userName: session.userName,
            isAuthenticated: true,
            loginAt: now,
            lastActivity: now,
        });
    },

    // ─── Logout ─────────────────────────────────────────────────────────────────
    logout: () => {
        clearSession();
        set({
            currentRole: null,
            userName: '',
            isAuthenticated: false,
            loginAt: null,
            lastActivity: null,
        });
    },

    // ─── Touch activity (call on user interaction to reset timeout) ─────────────
    touchActivity: () => {
        const now = Date.now();
        const state = get();
        if (!state.isAuthenticated) return;

        // Update lastActivity in session
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                const session = JSON.parse(raw);
                session.loginAt = now; // reset the timeout clock
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
        } catch (_) { }

        set({ lastActivity: now });
    },

    // ─── Check if session has expired (call periodically) ───────────────────────
    checkSessionExpiry: () => {
        const state = get();
        if (!state.isAuthenticated) return;
        const lastActive = state.lastActivity || state.loginAt;
        if (lastActive && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
            console.warn('⏰ Session expired after 5 hours of inactivity. Logging out.');
            get().logout();
        }
    },

    // ─── Permissions ────────────────────────────────────────────────────────────
    hasPermission: (feature) => {
        const role = get().currentRole;
        if (!role) return false;
        return PERMISSIONS[role]?.includes(feature) ?? false;
    },

    getRoles: () => Object.values(ROLES),
    ROLES,
    PERMISSIONS,
}));
