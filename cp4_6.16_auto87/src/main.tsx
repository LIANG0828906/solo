import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { usePodcastStore } from './store'
import './index.css'

usePodcastStore.getState().loadFromDB();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
