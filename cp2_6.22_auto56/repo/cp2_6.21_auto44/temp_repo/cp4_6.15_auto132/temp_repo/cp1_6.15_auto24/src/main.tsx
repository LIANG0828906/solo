import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PlantProvider } from './context/PlantContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlantProvider>
      <App />
    </PlantProvider>
  </React.StrictMode>
);
