import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStateProvider } from '@/context/GlobalState';
import Dock from '@/pages/Dock';
import Lighthouse from '@/pages/Lighthouse';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dock />} />
          <Route path="/lighthouse" element={<Lighthouse />} />
        </Routes>
      </BrowserRouter>
    </GlobalStateProvider>
  </React.StrictMode>
);
