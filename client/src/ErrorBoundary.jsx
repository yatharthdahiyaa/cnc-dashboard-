// client/src/ErrorBoundary.jsx
import React from 'react';

// Detects Vite chunk-load errors caused by stale Vercel deployments.
// On first occurrence, reloads the page once (guarded to avoid reload loops).
function isChunkLoadError(error) {
    return (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('error loading dynamically imported module')
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        if (isChunkLoadError(error)) {
            const reloadKey = 'chunk_reload_at';
            const last = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
            if (Date.now() - last > 10_000) {
                sessionStorage.setItem(reloadKey, Date.now().toString());
                window.location.reload();
                return { hasError: false, error: null, errorInfo: null };
            }
        }
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('ErrorBoundary caught:', error, errorInfo?.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-8">
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                    <p className="text-gray-500 text-sm max-w-sm">
                        {this.state.error?.message || 'An unexpected error occurred in this section.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="btn-primary text-sm px-6 py-2 mt-2"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
