import React from 'react'
import ReactDOM from 'react-dom/client'
import { MainScene } from './scene'
import { MeditationPanel } from './ui/MeditationPanel'

let mainScene: MainScene | null = null

function initScene() {
  const container = document.getElementById('canvas-container')
  if (!container) {
    console.error('Canvas container not found')
    return
  }

  mainScene = new MainScene(container)
  
  animate()
}

function animate() {
  requestAnimationFrame(animate)
  
  if (mainScene) {
    mainScene.update()
  }
}

function App() {
  return <MeditationPanel />
}

function initUI() {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Root element not found')
    return
  }

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

function init() {
  initScene()
  initUI()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
