import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useDashboardStore } from './data/DataStore'
import './styles/global.css'
import './styles/editor.css'

declare global {
  interface Window {
    useDashboardStore: typeof useDashboardStore
  }
}

window.useDashboardStore = useDashboardStore

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
