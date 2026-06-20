import React, { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { captureScene } from '@/utils/Screenshot'
import { getThreeContext } from '@/utils/threeContext'
import { Layers, CrossSection, Camera } from 'lucide-react'

export default function Toolbar() {
  const { viewMode, setViewMode, isCapturing, setCapturing } = useAppStore()

  const handleScreenshot = useCallback(() => {
    const { renderer, scene, camera } = getThreeContext()
    if (!renderer || !scene || !camera) return

    setCapturing(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        captureScene(renderer, scene, camera)
        setTimeout(() => setCapturing(false), 100)
      })
    })
  }, [setCapturing])

  if (isCapturing) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: 'rgba(20, 25, 50, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => setViewMode('structure')}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '8px',
          background: viewMode === 'structure' ? '#4a90d9' : '#2a2f52',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'structure') {
            ;(e.currentTarget as HTMLElement).style.background = '#3a3f62'
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'structure') {
            ;(e.currentTarget as HTMLElement).style.background = '#2a2f52'
          }
        }}
        onMouseDown={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
        title="结构图"
      >
        <Layers size={18} />
      </button>
      <button
        onClick={() => setViewMode('section')}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '8px',
          background: viewMode === 'section' ? '#4a90d9' : '#2a2f52',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'section') {
            ;(e.currentTarget as HTMLElement).style.background = '#3a3f62'
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'section') {
            ;(e.currentTarget as HTMLElement).style.background = '#2a2f52'
          }
        }}
        onMouseDown={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
        title="剖面图"
      >
        <CrossSection size={18} />
      </button>
      <div
        style={{
          width: '1px',
          height: '24px',
          background: 'rgba(255,255,255,0.15)',
          margin: '0 4px',
        }}
      />
      <button
        onClick={handleScreenshot}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '8px',
          background: '#2a2f52',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = '#3a3f62'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = '#2a2f52'
        }}
        onMouseDown={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
        title="截图"
      >
        <Camera size={18} />
      </button>
    </div>
  )
}
