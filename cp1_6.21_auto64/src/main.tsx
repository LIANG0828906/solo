import React from 'react';
import ReactDOM from 'react-dom/client';
import GameUI from './components/GameUI';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameUI />
  </React.StrictMode>
);
