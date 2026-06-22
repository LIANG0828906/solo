import React from 'react'
import CellScene from '@/components/CellScene'
import Toolbar from '@/components/Toolbar'
import InfoPanel from '@/components/InfoPanel'

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CellScene />
      <Toolbar />
      <InfoPanel />

      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '28px',
          zIndex: 100,
          fontFamily: "'Inter', sans-serif",
          fontSize: '20px',
          fontWeight: 300,
          color: '#ffffff',
          textShadow: '0 0 8px rgba(100, 200, 255, 0.5)',
          letterSpacing: '2px',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Cell Explorer
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '28px',
          zIndex: 100,
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.35)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        点击细胞器查看详情 · 拖拽旋转视角 · 滚轮缩放
      </div>
    </div>
  )
}
