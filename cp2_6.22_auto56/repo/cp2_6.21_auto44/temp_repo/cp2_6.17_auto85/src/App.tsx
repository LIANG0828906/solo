import { useRef } from 'react'
import { InputPanel } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { ParticleCanvas } from './components/ParticleCanvas'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🔐</span>
          CipherCanvas
        </h1>
        <p className="app-subtitle">文字加密可视化沙盒</p>
      </header>

      <main className="app-main">
        <InputPanel canvasRef={canvasRef} />
        <ParticleCanvas canvasRef={canvasRef} />
        <OutputPanel canvasRef={canvasRef} />
      </main>

      <footer className="app-footer">
        <span>按 Ctrl + Enter 快速加密</span>
      </footer>
    </div>
  )
}

export default App
