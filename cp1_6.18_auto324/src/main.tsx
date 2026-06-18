import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import UniverseScene from './scene/UniverseScene'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UniverseScene />
  </StrictMode>,
)
