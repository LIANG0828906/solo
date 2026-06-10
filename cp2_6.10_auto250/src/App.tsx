import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Event from './pages/Event';
import Report from './pages/Report';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event" element={<Event />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
