// client/src/App.jsx
import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useDashboardStore } from './store/useDashboardStore';

function App() {
  useEffect(() => {
    console.log('🚀 App mounting, initializing dashboard...');
    const { initialize } = useDashboardStore.getState();
    try {
      const cleanup = initialize();
      return cleanup;
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  }, []);

  return <Dashboard />;
}

export default App;