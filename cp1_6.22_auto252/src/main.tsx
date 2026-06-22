import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

(function globalReset() {
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
    body {
      background: #1B1E2F;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    button { font-family: inherit; }
    input, select, textarea { font-family: inherit; }
    ::selection { background: rgba(96,165,250,0.35); color: #fff; }
  `;
  document.head.appendChild(style);
})();
