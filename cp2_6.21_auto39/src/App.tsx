import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { useStore } from './store';

function App() {
  const { fetchCards, undo } = useStore();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="app-container">
      <Sidebar />
      <Canvas />
    </div>
  );
}

export default App;
