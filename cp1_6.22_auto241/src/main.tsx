import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DrawingApp } from './DrawingApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DrawingApp />
  </StrictMode>,
)
