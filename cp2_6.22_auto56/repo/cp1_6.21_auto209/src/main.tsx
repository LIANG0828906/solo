import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LendingProvider } from './LendingModule/LendingContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LendingProvider>
      <App />
    </LendingProvider>
  </React.StrictMode>
);
