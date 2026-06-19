import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

const loadingEl = document.getElementById('loading')
if (loadingEl) {
  loadingEl.style.opacity = '0'
  loadingEl.style.transition = 'opacity 0.5s ease'
  setTimeout(() => {
    loadingEl.remove()
  }, 500)
}
