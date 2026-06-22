import { useEffect, useRef, useState } from 'react'
import { audioEngine } from '../audio/engine'
import { useAudioStore } from '../store/audioStore'
import './WaveformVisualizer.css'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

interface FlipDigitProps {
  value: string
}

function FlipDigit({ value }: FlipDigitProps) {
  return (
    <div className="flip-digit">
      <span className="flip-digit-inner">{value}</span>
    </div>
  )
}

interface TimeDisplayProps {
  time: number
  label: string
}

function TimeDisplay({ time, label }: TimeDisplayProps) {
  const timeStr = formatTime(time)
  const digits = timeStr.split('')

  return (
    <div className="time-display">
      <div className="time-label">{label}</div>
      <div className="time-digits">
        {digits.map((digit, index) => (
          <FlipDigit key={`${index}-${digit}`} value={digit} />
        ))}
      </div>
    </div>
  )
}

export function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const dataArrayRef = useRef<Uint8Array>()
  const { isPlaying, currentTime, duration, setCurrentTime, volume } = useAudioStore()
  const startTimeRef = useRef<number>(0)
  const accumulatedTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const initAnalyser = () => {
      const analyser = audioEngine.getAnalyser()
      if (analyser) {
        analyser.fftSize = 2048
        const bufferLength = analyser.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLength)
      }
    }

    if (audioEngine.getAnalyser()) {
      initAnalyser()
    }

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      const analyser = audioEngine.getAnalyser()
      const dataArray = dataArrayRef.current

      if (analyser && dataArray && isPlaying) {
        analyser.getByteTimeDomainData(dataArray)

        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.8)'
        ctx.shadowColor = '#58A6FF'
        ctx.shadowBlur = 10
        ctx.beginPath()

        const sliceWidth = width / dataArray.length
        let x = 0

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
        ctx.shadowBlur = 0

        ctx.strokeStyle = 'rgba(88, 166, 255, 0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
      } else {
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()

        if (isPlaying && !dataArray) {
          initAnalyser()
        }
      }
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now()
    } else {
      accumulatedTimeRef.current = currentTime
    }
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newTime = accumulatedTimeRef.current + elapsed
      if (newTime < duration) {
        setCurrentTime(newTime)
      } else {
        setCurrentTime(duration)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, duration, setCurrentTime])

  const remainingTime = Math.max(0, duration - currentTime)

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} className="waveform-canvas" />
      <div className="time-info">
        <TimeDisplay time={currentTime} label="当前时长" />
        <div className="time-divider" />
        <TimeDisplay time={remainingTime} label="剩余时间" />
      </div>
    </div>
  )
}
