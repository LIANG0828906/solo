import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import UIOverlay from './components/UIOverlay';
import Leaderboard from './components/Leaderboard';
import './App.css';

const GamePage: React.FC = () => {
  return (
    <div className="game-page">
      <div className="game-area">
        <GameBoard />
      </div>
      <UIOverlay />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
};

export default App;
