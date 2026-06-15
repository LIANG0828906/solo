import { useEffect, useRef, useState } from 'react'
import SceneSetup from '@/renderer/SceneSetup'
import DNAHelix from '@/renderer/DNAHelix'
import MutationVisualizer from '@/renderer/MutationVisualizer'
import ControlPanel from '@/components/ControlPanel'
import Toolbar from '@/components/Toolbar'
import HistoryPanel from '@/components/HistoryPanel'
import { useSequenceStore } from '@/store/sequenceStore'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { sequence } = useSequenceStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleScreenshot = () => {
    setShowScreenshotFlash(true)
    setTimeout(() => {
      setShowScreenshotFlash(false)
    }, 200)
  }

  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1,
  }))

  return (
    <div
      ref={containerRef}
      className="app-container"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a1a',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0a0a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: fadeOut ? 'none' : 'auto',
          }}
        >
          {particles.map((particle) => (
            <div
              key={particle.id}
              style={{
                position: 'absolute',
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: 'radial-gradient(circle, #667eea 0%, transparent 70%)',
                borderRadius: '50%',
                animation: `pulse ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              }}
            />
          ))}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#e0e0ff',
              letterSpacing: '4px',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            LOADING
          </div>
        </div>
      )}

      <SceneSetup>
        <DNAHelix sequence={sequence} />
        <MutationVisualizer />
      </SceneSetup>

      <Toolbar onScreenshot={handleScreenshot} onToggleRecord={() => setIsRecording(!isRecording)} />
      <ControlPanel />
      <HistoryPanel />

      {isRecording && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ff4444',
            boxShadow: '0 0 20px #ff4444, 0 0 40px #ff4444',
            animation: 'blink 1s ease-in-out infinite',
            zIndex: 1000,
          }}
        />
      )}

      {showScreenshotFlash && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            opacity: 0.8,
            pointerEvents: 'none',
            zIndex: 9998,
            animation: 'shutter 0.2s ease-out forwards',
          }}
        />
      )}
    </div>
  )
}
