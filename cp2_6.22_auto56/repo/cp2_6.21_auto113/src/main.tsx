import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSocket } from './moduleC';
import { useBoardStore } from './store';
import './styles.css';

initSocket();

(window as any).__store = useBoardStore;

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
