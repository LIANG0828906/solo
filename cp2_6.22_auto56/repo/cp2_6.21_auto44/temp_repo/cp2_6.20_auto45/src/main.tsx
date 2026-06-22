import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Farm } from './pages/Farm';
import { Coop } from './pages/Coop';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Farm />} />
        <Route path="/coop" element={<Coop />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
