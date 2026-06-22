import { useEffect, useRef } from 'react'

interface VisualizerProps {
  frequencyData: Uint8Array
  waveformData: Uint8Array
  volume: number
}

const BAR_COUNT = 64
const WAVEFORM_POINTS = 256
const MAX_BAR_HEIGHT = 300
const SPECTRUM_HEIGHT = 320
const WAVEFORM_HEIGHT = 120
const SEPARATOR_HEIGHT = 20
const CANVAS_PADDING = 10

export function Visualizer({ frequencyData, waveformData, volume }: VisualizerProps) {
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null)
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const scanProgressRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const spectrumCanvas = spectrumCanvasRef.current
    const waveformCanvas = waveformCanvasRef.current
    if (!spectrumCanvas || !waveformCanvas) return

    const spectrumCtx = spectrumCanvas.getContext('2d')
    const waveformCtx = waveformCanvas.getContext('2d')
    if (!spectrumCtx || !waveformCtx) return

    const drawSpectrum = () => {
      const width = spectrumCanvas.width
      const height = spectrumCanvas.height
      spectrumCtx.clearRect(0, 0, width, height)

      const barWidth = (width - CANVAS_PADDING * 2) / BAR_COUNT
      const volumeScale = volume / 100

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = frequencyData[i] || 0
        const barHeight = (value / 255) * MAX_BAR_HEIGHT * volumeScale
        const x = CANVAS_PADDING + i * barWidth
        const jitter = Math.sin(timeRef.current * 0.05 + i * 0.3) * 0.2
        const y = height - barHeight + jitter

        const gradient = spectrumCtx.createLinearGradient(x, y, x, height)
        const hue = 180 - (i / BAR_COUNT) * 120
        gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`)
        gradient.addColorStop(1, `hsl(${hue - 60}, 100%, 40%)`)

        spectrumCtx.fillStyle = gradient
        spectrumCtx.fillRect(x + 1, y, barWidth - 3, barHeight)
      }
    }

    const drawWaveform = () => {
      const width = waveformCanvas.width
      const height = waveformCanvas.height
      waveformCtx.clearRect(0, 0, width, height)

      scanProgressRef.current = (scanProgressRef.current + 2) % WAVEFORM_POINTS

      waveformCtx.beginPath()
      waveformCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      waveformCtx.lineWidth = 2

      for (let i = 0; i < WAVEFORM_POINTS; i++) {
        if (i > scanProgressRef.current) break

        const x = (i / (WAVEFORM_POINTS - 1)) * (width - CANVAS_PADDING * 2) + CANVAS_PADDING
        const value = waveformData[i] || 128
        const normalizedValue = (value - 128) / 128
        const y = (height / 2) + normalizedValue * (height / 2 - 10)

        if (i === 0) {
          waveformCtx.moveTo(x, y)
        } else {
          waveformCtx.lineTo(x, y)
        }
      }

      waveformCtx.stroke()
    }

    const draw = () => {
      timeRef.current += 1
      drawSpectrum()
      drawWaveform()
      requestAnimationFrame(draw)
    }

    const animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [frequencyData, waveformData, volume])

  return (
    <div style={{ width: '100%' }}>
      <canvas
        ref={spectrumCanvasRef}
        width={820}
        height={SPECTRUM_HEIGHT}
        style={{ width: '100%', height: SPECTRUM_HEIGHT, display: 'block' }}
      />
      <div
        style={{
          height: 1,
          backgroundColor: '#30363D',
          margin: `${SEPARATOR_HEIGHT / 2}px 0`,
        }}
      />
      <canvas
        ref={waveformCanvasRef}
        width={820}
        height={WAVEFORM_HEIGHT}
        style={{ width: '100%', height: WAVEFORM_HEIGHT, display: 'block' }}
      />
    </div>
  )
}
