import { useEffect, useRef } from 'react';
import { SceneManager } from './modules/scene/SceneManager';
import { Panel } from './components/Panel';
import { InfoCard } from './components/InfoCard';
import { useAppStore } from './store/useAppStore';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const { nodes, edges, selectedNode, isLoading } = useAppStore();

  useEffect(() => {
    if (containerRef.current && !sceneManagerRef.current) {
      sceneManagerRef.current = new SceneManager(containerRef.current);
    }

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateScene();
    }
  }, [nodes, edges, isLoading]);

  return (
    <div style={appStyle}>
      <div ref={containerRef} style={sceneContainerStyle} />
      <Panel />
      <InfoCard />
    </div>
  );
}

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
};

const sceneContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
};

export default App;
