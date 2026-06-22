import React from 'react'
import ReactDOM from 'react-dom/client'
import { SceneEditor } from './modules/scene/SceneEditor'
import { TimelinePanel } from './modules/timeline/TimelinePanel'
import { AnimationCanvas } from './modules/animation/AnimationCanvas'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        color: '#e5e5e5',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Left: Scene Editor */}
      <SceneEditor />

      {/* Right: Timeline + Canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top: Timeline Panel */}
        <div style={{ height: 200, minHeight: 200 }}>
          <TimelinePanel />
        </div>

        {/* Bottom: Canvas */}
        <AnimationCanvas />
      </div>
    </div>
  </React.StrictMode>
)
