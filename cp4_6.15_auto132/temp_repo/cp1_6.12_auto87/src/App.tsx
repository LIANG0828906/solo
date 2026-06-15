import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CreatePage from './CreatePage';
import EventPage from './EventPage';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/event/:code" element={<EventPage />} />
        <Route path="*" element={<Navigate to="/create" replace />} />
      </Routes>
    </div>
  );
};

export default App;
