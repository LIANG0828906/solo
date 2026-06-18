import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './modules/shared/StoreContext';
import { ProjectPanel } from './modules/projects/ProjectPanel';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectPanel />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
);
