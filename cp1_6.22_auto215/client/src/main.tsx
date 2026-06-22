import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardPanel from './dashboardPanel';

const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
  loadingScreen.classList.add('fade-out');
  setTimeout(() => loadingScreen.remove(), 600);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardPanel />
  </React.StrictMode>,
);
