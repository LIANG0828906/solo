import { useRef, useEffect } from 'react'
import { useSpeechStore } from '../store/speechStore'
import { drawSpectrum, generateSimulatedSpectrum } from '../utils/canvasRenderer'

interface SpectrumCanvasProps {
  width?: number
  height?: number
}

export default function SpectrumCanvas({ width = 600, height = 150 }: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  const analyserNode = useSpeechStore((s) => s.analyserNode)
  const isPlaying = useSpeechStore((s) => s.isPlaying)
  const rate = useSpeechStore((s) => s.rate)
  const pitch = useSpeechStore((s) => s.pitch)
  const volume = useSpeechStore((s) => s.volume)
  const preset = useSpeechStore((s) => s.preset)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      timeRef.current += 0.016

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserNode.getByteFrequencyData(dataArray)
        drawSpectrum(canvas, dataArray, 64)
      } else if (isPlaying) {
        const dataArray = generateSimulatedSpectrum(
          64,
          timeRef.current,
          rate,
          pitch,
          volume,
          preset
        )
        drawSpectrum(canvas, dataArray, 64)
      } else {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#16213E'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [analyserNode, isPlaying, rate, pitch, volume, preset, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        maxWidth: width,
        height: 'auto',
        aspectRatio: `${width}/${height}`,
        borderRadius: '8px',
        display: 'block',
      }}
    />
  )
}
