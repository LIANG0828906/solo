import React, { useRef, useEffect, useState } from 'react'
import { UploadPanel } from '@/components/UploadPanel'
import { ControlPanel } from '@/components/ControlPanel'
import { Visualizer } from '@/visual/Visualizer'
import { useAppStore } from '@/store/useAppStore'
import { CANVAS_CONFIG, BREAKPOINTS } from '@/config/constants'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizerRef = useRef<Visualizer | null>(null)
  const animationRef = useRef<number | null>(null)
  const { audioAnalyzer, hueShift, particleCount, audioBuffer } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MEDIUM)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const visualizer = new Visualizer(canvasRef.current)
    visualizerRef.current = visualizer

    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const aspectRatio = CANVAS_CONFIG.ASPECT_RATIO

      let canvasWidth: number
      let canvasHeight: number

      if (containerWidth / containerHeight > aspectRatio) {
        canvasHeight = containerHeight
        canvasWidth = canvasHeight * aspectRatio
      } else {
        canvasWidth = containerWidth
        canvasHeight = canvasWidth / aspectRatio
      }

      const dpr = window.devicePixelRatio || 1
      canvasRef.current.width = canvasWidth * dpr
      canvasRef.current.height = canvasHeight * dpr
      canvasRef.current.style.width = `${canvasWidth}px`
      canvasRef.current.style.height = `${canvasHeight}px`

      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      if (visualizerRef.current) {
        visualizerRef.current.setSize(canvasWidth, canvasHeight)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    visualizer.start()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      visualizer.destroy()
    }
  }, [])

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.setParams({
        hueShift,
        particleCount,
      })
    }
  }, [hueShift, particleCount])

  useEffect(() => {
    if (!visualizerRef.current || !audioAnalyzer) return

    const updateVisualizer = () => {
      if (!audioAnalyzer || !visualizerRef.current) return

      const spectrum = audioAnalyzer.getSpectrum()
      const waveform = audioAnalyzer.getWaveform()
      const energy = audioAnalyzer.getEnergy()
      const lowEnergy = audioAnalyzer.getBandEnergy('low')
      const midEnergy = audioAnalyzer.getBandEnergy('mid')
      const highEnergy = audioAnalyzer.getBandEnergy('high')

      visualizerRef.current.updateAudioData(
        spectrum,
        waveform,
        energy,
        lowEnergy,
        midEnergy,
        highEnergy
      )

      animationRef.current = requestAnimationFrame(updateVisualizer)
    }

    updateVisualizer()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioAnalyzer, audioBuffer])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: CANVAS_CONFIG.BACKGROUND_COLOR,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, #4ECDC4, #FF6B6B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          声纹画廊
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
          Voiceprint Gallery
        </div>
      </div>

      <UploadPanel />
      <ControlPanel />

      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'transparent',
            zIndex: 90,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
