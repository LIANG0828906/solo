import { useEffect } from 'react';
import GraphCanvas from './components/GraphCanvas';
import SidePanel from './components/SidePanel';
import LinkDialog from './components/LinkDialog';
import { useAppStore } from './stores/appStore';

export default function App() {
  const loadInitialData = useAppStore((s) => s.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="app-container">
      <GraphCanvas />
      <SidePanel />
      <LinkDialog />
    </div>
  );
}
