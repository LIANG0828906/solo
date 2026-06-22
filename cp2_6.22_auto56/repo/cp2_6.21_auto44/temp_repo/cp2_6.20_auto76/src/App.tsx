import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DebateList from './pages/DebateList';
import DebateRoom from './pages/DebateRoom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<DebateList />} />
          <Route path="/room/:roomId" element={<DebateRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
