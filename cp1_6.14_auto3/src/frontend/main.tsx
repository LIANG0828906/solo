import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Global, css } from '@emotion/react'

const globalStyles = css`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #05060d;
    color: #e6e9f5;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, .display-font {
    font-family: 'Orbitron', 'Noto Sans SC', sans-serif;
    letter-spacing: 0.02em;
  }
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
  }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #00f0ff 0%, #c56cf0 100%);
    border-radius: 4px;
  }
  input, textarea { font-family: inherit; }
`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Global styles={globalStyles} />
    <App />
  </React.StrictMode>
)
