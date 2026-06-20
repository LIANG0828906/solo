import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const styleEl = document.createElement('style');
styleEl.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #212121;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    font-family: '"Segoe UI", system-ui, -apple-system, sans-serif';
    color: #ffffff;
    user-select: none;
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  canvas {
    display: block;
    outline: none;
  }
  button {
    font-family: inherit;
  }
`;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
