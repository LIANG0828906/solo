import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CanvasPage } from './components/Canvas/Canvas'
import { GalleryPage } from './components/Gallery/Gallery'
import { GalleryDetail } from './components/Gallery/GalleryDetail'
import './styles/global.css'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/canvas" replace />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/gallery/:id" element={<GalleryDetail />} />
          <Route path="*" element={<Navigate to="/canvas" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
