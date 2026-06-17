import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { eventBus } from './engine/EventBus';
import { stateSync } from './engine/StateSync';

console.log('[Quantum Particle Shuttle] 事件总线已初始化', eventBus);
console.log('[Quantum Particle Shuttle] 状态同步模块已初始化', stateSync);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
