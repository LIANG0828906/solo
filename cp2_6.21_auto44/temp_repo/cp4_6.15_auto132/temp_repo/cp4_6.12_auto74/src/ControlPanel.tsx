import { useEffect, useRef, useState } from 'react'
import { useStore } from './useStore'

function Seismograph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waves = useStore((s) => s.waves)
  const dataRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let offset = 0

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = '#0f0f23'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = '#1a1a3e'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      let amplitude = 0
      const now = performance.now()
      waves.forEach((wave) => {
        const elapsed = (now - wave.startTime) / 1000
        if (elapsed < 8) {
          const decay = Math.exp(-elapsed * 0.5)
          const freq = 2 + Math.random() * 3
          amplitude += Math.sin(elapsed * freq * Math.PI * 2) * decay * 25 * wave.magnitude
        }
      })

      amplitude += (Math.random() - 0.5) * 2

      const newData = [...dataRef.current, amplitude]
      if (newData.length > width) newData.shift()
      dataRef.current = newData

      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height / 2)

      dataRef.current.forEach((val, i) => {
        ctx.lineTo(i, height / 2 + val)
      })
      ctx.stroke()

      offset += 2
      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationId)
  }, [waves])

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={80}
      style={{
        width: '260px',
        height: '80px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}
    />
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  displayValue
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
  displayValue?: string
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div
        style={{
          color: '#e0e0e0',
          fontSize: '14px',
          marginBottom: '8px',
          fontWeight: 500
        }}
      >
        {label}
      </div>
      <div style={{ position: 'relative', height: '30px' }}>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: '#555',
            borderRadius: '3px'
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '30px',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: `${((value - min) / (max - min)) * 100}%`,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#ff8844',
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 8px rgba(255, 136, 68, 0.5)',
            zIndex: 1
          }}
        />
      </div>
      <div
        style={{
          color: '#e0e0e0',
          fontSize: '14px',
          fontWeight: 'bold',
          marginTop: '6px',
          textAlign: 'center'
        }}
      >
        {displayValue ?? value.toFixed(1)}
        {unit ?? ''}
      </div>
    </div>
  )
}

export default function ControlPanel() {
  const slipAmount = useStore((s) => s.slipAmount)
  const densities = useStore((s) => s.densities)
  const isPlaying = useStore((s) => s.isPlaying)
  const playDirection = useStore((s) => s.playDirection)
  const setSlipAmount = useStore((s) => s.setSlipAmount)
  const setDensity = useStore((s) => s.setDensity)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const setPlayDirection = useStore((s) => s.setPlayDirection)
  const reset = useStore((s) => s.reset)

  useEffect(() => {
    if (!isPlaying) return

    let animationId: number
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime

      const speed = 8
      setSlipAmount((prev) => {
        let next = prev + playDirection * speed * delta
        if (next >= 20) {
          next = 20
          setPlayDirection(-1)
        } else if (next <= 0) {
          next = 0
          setPlayDirection(1)
        }
        return next
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying, playDirection, setSlipAmount, setPlayDirection])

  return (
    <div
      style={{
        width: '300px',
        minWidth: '300px',
        backgroundColor: '#1a1a2e',
        borderRadius: '8px',
        padding: '15px',
        color: '#e0e0e0',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#ff8844',
          textAlign: 'center'
        }}
      >
        控制面板
      </div>

      <Seismograph />

      <Slider
        label="断层滑移量"
        value={slipAmount}
        min={0}
        max={20}
        step={0.5}
        onChange={setSlipAmount}
        unit=" 米"
      />

      <div
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '12px',
          marginTop: '8px',
          color: '#8888aa'
        }}
      >
        岩层密度 (g/cm³)
      </div>

      <Slider
        label="🟧 砂岩 Sandstone"
        value={densities.sandstone}
        min={0.5}
        max={3.0}
        step={0.1}
        onChange={(v) => setDensity('sandstone', v)}
      />

      <Slider
        label="🟫 泥岩 Mudstone"
        value={densities.mudstone}
        min={0.5}
        max={3.0}
        step={0.1}
        onChange={(v) => setDensity('mudstone', v)}
      />

      <Slider
        label="⬜ 花岗岩 Granite"
        value={densities.granite}
        min={0.5}
        max={3.0}
        step={0.1}
        onChange={(v) => setDensity('granite', v)}
      />

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => {
            setIsPlaying(!isPlaying)
          }}
          style={{
            width: '200px',
            height: '40px',
            alignSelf: 'center',
            backgroundColor: isPlaying ? '#44aa88' : '#4477aa',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'filter 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)'
          }}
        >
          {isPlaying ? '⏸ 暂停 Pause' : '▶ 播放 Play'}
        </button>

        <button
          onClick={reset}
          style={{
            width: '200px',
            height: '40px',
            alignSelf: 'center',
            backgroundColor: '#e94560',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'filter 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)'
          }}
        >
          🔄 重置 Reset
        </button>
      </div>
    </div>
  )
}
