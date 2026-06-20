import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import EditorPage from './pages/EditorPage';
import ArenaPage from './pages/ArenaPage';
import LeaderboardPage from './pages/LeaderboardPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="scanline-overlay" />
      <ParticleBackground />
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
