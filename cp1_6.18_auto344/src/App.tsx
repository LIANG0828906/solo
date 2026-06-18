import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MapView from '@/components/MapView'
import ModalRecorder from '@/components/ModalRecorder'

const HomePage: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapView />
      <ModalRecorder />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container" style={{ width: '100%', height: '100%' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
