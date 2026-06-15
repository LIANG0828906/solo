import { useEffect, useState } from 'react'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import Playback from './components/Playback'
import './App.scss'

function App() {
  const [isNarrowScreen, setIsNarrowScreen] = useState(false)

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth <= 768)
    }

    checkScreenWidth()
    window.addEventListener('resize', checkScreenWidth)

    return () => {
      window.removeEventListener('resize', checkScreenWidth)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">水珠墨韵</h1>
        <p className="app-subtitle">古代水珠画模拟器</p>
      </header>
      
      <main className="app-main">
        <div className="canvas-wrapper">
          <Canvas />
          <Playback />
        </div>
        {!isNarrowScreen && <Toolbar />}
      </main>

      <footer className="app-footer">
        <p>使用鼠标点击或拖拽在画纸上滴墨 · 滚轮缩放 · 支持触屏双指缩放</p>
      </footer>
    </div>
  )
}

export default App
