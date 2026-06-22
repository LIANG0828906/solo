import React from 'react';
import ReactDOM from 'react-dom/client';
import { PixelTown } from './PixelTown';
import { ControlPanel } from './ControlPanel';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <PixelTown />
      <ControlPanel />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
