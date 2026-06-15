import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BookProvider } from './context/BookContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookProvider>
      <App />
    </BookProvider>
  </StrictMode>,
)
