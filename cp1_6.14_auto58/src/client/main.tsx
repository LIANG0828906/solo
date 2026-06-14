import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>团队OKR管理系统</h1>
    </div>
  );
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found. Failed to find #root element in the DOM.');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
