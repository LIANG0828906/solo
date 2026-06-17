import ColorWheel from './components/ColorWheel'
import PalettePanel from './components/PalettePanel'
import ColorHistory from './components/ColorHistory'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="app-container">
        <div className="left-section">
          <h1 className="app-title">色彩调和实验室</h1>
          <ColorWheel />
        </div>
        <div className="right-section">
          <PalettePanel />
          <div style={{ marginTop: 16 }}>
            <ColorHistory />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
