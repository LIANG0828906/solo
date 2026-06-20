import { useRef, useEffect } from 'react'
import { useSpeechStore } from '../store/speechStore'
import { drawWaveform, generateSimulatedWaveform } from '../utils/canvasRenderer'

interface WaveformCanvasProps {
  width?: number
  height?: number
}

export default function WaveformCanvas({ width = 600, height = 200 }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  const analyserNode = useSpeechStore((s) => s.analyserNode)
  const isPlaying = useSpeechStore((s) => s.isPlaying)
  const rate = useSpeechStore((s) => s.rate)
  const pitch = useSpeechStore((s) => s.pitch)
  const volume = useSpeechStore((s) => s.volume)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      timeRef.current += 0.016

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserNode.getByteTimeDomainData(dataArray)
        drawWaveform(canvas, dataArray, bufferLength)
      } else if (isPlaying) {
        const bufferLength = 128
        const dataArray = generateSimulatedWaveform(
          bufferLength,
          timeRef.current,
          rate,
          pitch,
          volume
        )
        drawWaveform(canvas, dataArray, bufferLength)
      } else {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#1A1A2E'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.strokeStyle = '#00D2FF'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, canvas.height / 2)
          ctx.lineTo(canvas.width, canvas.height / 2)
          ctx.stroke()
        }
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [analyserNode, isPlaying, rate, pitch, volume, width, height])

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
