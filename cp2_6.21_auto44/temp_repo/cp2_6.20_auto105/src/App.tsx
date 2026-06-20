import React, { useEffect } from 'react';
import { ControlPanel } from '@/ui/ControlPanel';
import { SceneManager } from '@/scene/SceneManager';
import { useSceneStore } from '@/store/useSceneStore';
import { loadStateFromUrl } from '@/utils/urlState';

const App: React.FC = () => {
  const setStateFromUrl = useSceneStore((state) => state.setStateFromUrl);

  useEffect(() => {
    const savedState = loadStateFromUrl();
    if (savedState) {
      setStateFromUrl(savedState);
    }

    const handleHashChange = () => {
      const savedState = loadStateFromUrl();
      if (savedState) {
        setStateFromUrl(savedState);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setStateFromUrl]);

  return (
    <div className="app-container">
      <div className="scene-background" />
      <ControlPanel />
      <main className="scene-container">
        <SceneManager />
      </main>
    </div>
  );
};

export default App;
