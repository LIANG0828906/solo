import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { soundManager } from './utils/sound';

soundManager.preload().catch(() => {
  console.info('[Garden] 音效预加载失败，将使用备用合成音');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
