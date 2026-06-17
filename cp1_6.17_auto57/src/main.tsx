import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import GameUI from './ui/GameUI';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameUI />
  </StrictMode>,
);
