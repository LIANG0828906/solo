import React from 'react'
import ControlPanel from './ui/ControlPanel'
import MindMapCanvas from './ui/MindMapCanvas'
import NoteEditor from './ui/NoteEditor'
import { useMapStore } from './core/MapEngine'
import { THEMES } from './types'

const App: React.FC = () => {
  const { theme } = useMapStore()
  const themeData = THEMES[theme]

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: themeData.background,
        '--line-color': themeData.lineColor,
        '--glow-color': themeData.glowColor,
      } as React.CSSProperties}
    >
      <ControlPanel />
      <div className="canvas-container">
        <MindMapCanvas />
      </div>
      <div className="right-panel">
        <NoteEditor />
      </div>
    </div>
  )
}

export default App
