import { useEffect } from 'react';
import { BuildScene } from './scene/BuildScene';
import { ToolPanel } from './ui/ToolPanel';
import { StatusBar } from './ui/StatusBar';
import { MenuButton } from './ui/MenuButton';
import { useGameStore } from './store/gameStore';

function App() {
  const { undo, redo, isCollapsed } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (!isCollapsed) {
          undo();
        }
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        if (!isCollapsed) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isCollapsed]);

  return (
    <div className="app">
      <BuildScene />
      <ToolPanel />
      <StatusBar />
      <MenuButton />

      <style>{`
        .app {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default App;
