import React from 'react';
import ReactDOM from 'react-dom/client';
import Board from './components/Board';
import StatusPanel from './components/StatusPanel';
import { useGameStore } from './store/gameStore';
import { useEffect } from 'react';
import './styles.css';

const App = () => {
  const { loadFromStorage, turnTransition } = useGameStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <div className="app-container">
      <Board />
      <StatusPanel />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
