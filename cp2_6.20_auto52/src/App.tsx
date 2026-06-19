import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Desktop from './modules/desktop/components/Desktop';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Desktop />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
