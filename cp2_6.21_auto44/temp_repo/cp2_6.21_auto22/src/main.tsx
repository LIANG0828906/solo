import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

const loadingScreen = document.getElementById('loading-screen')
if (loadingScreen) {
  loadingScreen.style.transition = 'opacity 0.5s'
  loadingScreen.style.opacity = '0'
  setTimeout(() => loadingScreen.remove(), 500)
}
