import { useEffect } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { WordCanvas } from './components/WordCanvas'

function App() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div
      className="w-screen h-screen flex overflow-hidden"
      style={{
        background: '#1B2838',
        fontFamily: '"Noto Sans SC", sans-serif',
      }}
    >
      <ControlPanel />
      <WordCanvas />
    </div>
  )
}

export default App
