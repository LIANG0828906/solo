import React, { useState, useEffect } from 'react'
import CultureDish from './components/CultureDish'
import ControlPanel from './components/ControlPanel'

type ToolMode = 'food' | 'toxin' | null

const App: React.FC = () => {
  const [toolMode, setToolMode] = useState<ToolMode>(null)
  const [isNarrow, setIsNarrow] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 900
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 900)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const appContainerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0F0F1A',
    display: 'flex',
    flexDirection: isNarrow ? 'column' : 'row',
    padding: '16px',
    boxSizing: 'border-box',
    gap: '16px',
    overflow: isNarrow ? 'auto' : 'hidden'
  }

  const dishContainerStyle: React.CSSProperties = {
    flex: isNarrow ? '0 0 auto' : '0 0 70%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isNarrow ? '700px' : '0',
    overflow: 'hidden'
  }

  const panelContainerStyle: React.CSSProperties = {
    flex: isNarrow ? '1 1 auto' : '1 1 30%',
    minWidth: '300px',
    minHeight: isNarrow ? '500px' : '0'
  }

  return (
    <div style={appContainerStyle}>
      <div style={dishContainerStyle}>
        <CultureDish toolMode={toolMode} />
      </div>
      <div style={panelContainerStyle}>
        <ControlPanel toolMode={toolMode} setToolMode={setToolMode} />
      </div>
    </div>
  )
}

export default App
