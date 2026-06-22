import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BookmarkWall from './BookmarkWall'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookmarkWall />
  </StrictMode>,
)