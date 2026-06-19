import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const styleEl = document.createElement('style')
styleEl.textContent = `
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #062C36;
    font-family: 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    color: #7EC8B8;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  canvas {
    display: block;
    touch-action: none;
  }

  @keyframes causticShimmer {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  @keyframes floatUp {
    0% { transform: translateY(0) scale(1); opacity: 0.4; }
    100% { transform: translateY(-20px) scale(0.5); opacity: 0; }
  }

  @media (max-width: 1024px) {
    .app-container {
      flex-direction: column !important;
    }
    .scene-canvas {
      height: 60vh !important;
    }
    .ui-overlay {
      position: relative !important;
      height: 40vh !important;
      overflow-y: auto;
    }
  }
`
document.head.appendChild(styleEl)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
