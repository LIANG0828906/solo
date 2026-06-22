import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StarChartPage from './pages/StarChartPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<StarChartPage />} />
    </Routes>
  );
};

export default App;
