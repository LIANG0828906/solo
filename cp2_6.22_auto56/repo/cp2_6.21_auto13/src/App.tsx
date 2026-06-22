import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FlowFieldScene from '@/modules/particle/FlowFieldScene'
import ControlPanel from '@/modules/control/ControlPanel'
import ExportToolbar from '@/modules/control/ExportToolbar'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{
              width: '100vw',
              height: '100vh',
              background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #050510 70%)',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}>
              <FlowFieldScene />
              <ControlPanel />
              <ExportToolbar />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
