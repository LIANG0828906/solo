import { useEffect } from 'react';
import ControlPanel from './ControlPanel';
import InfoPanel from './InfoPanel';
import { SceneManager } from './SceneManager';

let sceneManager: SceneManager | null = null;

export default function App() {
  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    sceneManager = new SceneManager();
    sceneManager.init(container);

    return () => {
      if (sceneManager) {
        sceneManager.dispose();
        sceneManager = null;
      }
    };
  }, []);

  return (
    <>
      <ControlPanel />
      <InfoPanel />
    </>
  );
}
