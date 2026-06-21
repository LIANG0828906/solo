import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AdLab from './frontend/AdLab'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdLab />
  </StrictMode>,
)
