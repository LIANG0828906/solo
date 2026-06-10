import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const globalStyles = document.createElement('style');
globalStyles.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #2b1a0a;
    font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  }
`;
document.head.appendChild(globalStyles);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
