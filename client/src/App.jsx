// client/src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ToastNotification from './components/ToastNotification';
import { useDashboardStore } from './store/useDashboardStore';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './ErrorBoundary';

// ─── Lazy-loaded pages (each becomes its own JS chunk) ────────────────────────
const PortalPage = lazy(() => import('./pages/PortalPage'));
const MachineDetailPage = lazy(() => import('./pages/MachineDetailPage'));
const LogbookPage = lazy(() => import('./pages/LogbookPage'));
const ProductionPage = lazy(() => import('./pages/ProductionPage'));
const WorkpiecePage = lazy(() => import('./pages/WorkpiecePage'));
const CNNModelPage = lazy(() => import('./pages/CNNModelPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// ─── Page-level loading fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Route → permission mapping ───────────────────────────────────────────────
const ROUTE_PERMISSIONS = {
  '/': 'dashboard',
  '/logbook': 'logbook_view',
  '/production': 'production',
  '/workpieces': 'workpieces',
  '/cnn': 'cnn_model',
  '/settings': 'dashboard',
};

// ─── App layout (sidebar + main) ─────────────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-dark-900">
    <Sidebar />
    <main id="main-content" className="flex-1 md:ml-20 p-6 md:p-8 lg:p-10">
      {children}
    </main>
    <ToastNotification />
  </div>
);

// ─── Protected route with RBAC ────────────────────────────────────────────────
const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, hasPermission, checkSessionExpiry, touchActivity } = useAuthStore();
  const location = useLocation();

  // Check session expiry on every route change
  useEffect(() => {
    checkSessionExpiry();
    touchActivity();
  }, [location.pathname, checkSessionExpiry, touchActivity]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Your current role doesn't have permission to view this page.
          </p>
          <Navigate to="/" replace />
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
};

// ─── Session activity tracker (global mouse/key listener) ────────────────────
const ActivityTracker = () => {
  const { touchActivity, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    // Throttle: only update at most once per minute
    let lastTouch = 0;
    const handler = () => {
      const now = Date.now();
      if (now - lastTouch > 60_000) {
        lastTouch = now;
        touchActivity();
      }
    };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [isAuthenticated, touchActivity]);

  return null;
};

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    const { initialize } = useDashboardStore.getState();
    try {
      const cleanup = initialize();
      return cleanup;
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  }, []);

  return (
    <BrowserRouter>
      <ActivityTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute permission="dashboard">
              <ErrorBoundary><PortalPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/machine/:id" element={
            <ProtectedRoute permission="machine_detail">
              <ErrorBoundary><MachineDetailPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/logbook" element={
            <ProtectedRoute permission="logbook_view">
              <ErrorBoundary><LogbookPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/production" element={
            <ProtectedRoute permission="production">
              <ErrorBoundary><ProductionPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/workpieces" element={
            <ProtectedRoute permission="workpieces">
              <ErrorBoundary><WorkpiecePage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/cnn" element={
            <ProtectedRoute permission="cnn_model">
              <ErrorBoundary><CNNModelPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute permission="dashboard">
              <ErrorBoundary><SettingsPage /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;