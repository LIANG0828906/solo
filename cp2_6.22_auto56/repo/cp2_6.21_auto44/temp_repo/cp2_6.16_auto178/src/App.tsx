import { PresetPanel } from './components/PresetPanel'
import { ControlPanel } from './components/ControlPanel'
import { WaveformVisualizer } from './components/WaveformVisualizer'
import { PlaybackBar } from './components/PlaybackBar'
import { CreatePresetModal } from './components/CreatePresetModal'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <path d="M2 12h2l2-6 4 12 4-16 3 10 3-4 2 4h2" />
            </svg>
          </div>
          <div className="logo-text">
            <h1>MindFreq</h1>
            <span className="logo-subtitle">数字脑波同步音生成器</span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <PresetPanel />

        <div className="workspace">
          <WaveformVisualizer />
          <div className="control-area">
            <ControlPanel />
          </div>
        </div>
      </div>

      <PlaybackBar />
      <CreatePresetModal />
    </div>
  )
}

export default App
