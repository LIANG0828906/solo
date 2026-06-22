import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import UI from './UI'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UI />
  </StrictMode>,
)
