import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CaveProvider } from './context/CaveContext';

const loader = document.getElementById('loader');
if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 600);
    }, 500);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaveProvider>
      <App />
    </CaveProvider>
  </React.StrictMode>
);
