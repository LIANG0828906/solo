import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import { SyncManager } from './SyncManager';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    SyncManager.start();
    return () => {
      SyncManager.stop();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game" element={<GameBoard />} />
      </Routes>
    </Router>
  );
}
