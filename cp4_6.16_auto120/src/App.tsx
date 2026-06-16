import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { CreateModal } from './components/CreateModal';
import { useStore } from './store';
import './App.css';

function App() {
  const { loadFromStorage } = useStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="app">
      <Sidebar />
      <Canvas />
      <CreateModal />
    </div>
  );
}

export default App;
