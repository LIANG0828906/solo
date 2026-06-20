import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RefereePage from './pages/RefereePage'
import AudiencePage from './pages/AudiencePage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RefereePage />} />
        <Route path="/audience" element={<AudiencePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
