import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PetSelection from './pages/PetSelection';
import PetRoom from './pages/PetRoom';
import SocialSquare from './pages/SocialSquare';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PetSelection />} />
      <Route path="/room" element={<PetRoom />} />
      <Route path="/square" element={<SocialSquare />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
