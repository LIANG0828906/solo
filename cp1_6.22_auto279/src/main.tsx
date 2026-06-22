import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ClimateExplorer from './ClimateExplorer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClimateExplorer />
  </StrictMode>,
)
