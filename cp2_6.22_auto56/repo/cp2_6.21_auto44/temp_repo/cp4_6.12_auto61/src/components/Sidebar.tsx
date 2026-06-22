import { useEffect, useRef, useState } from 'react'
import { useAppStore, ObstacleType } from '@/store'
import * as TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'
import { generateId } from '@/store'

interface SidebarProps {
  isMobile: boolean
}

const obstacleTypeLabels: Record<ObstacleType, string> = {
  building: '建筑',
  tower: '塔',
  hill: '山丘',
}

export default function Sidebar({ isMobile }: SidebarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastDrawTime = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)

  const [draggingSlider, setDraggingSlider] = useState<string | null>(null)
  const [buttonHover, setButtonHover] = useState<string | null>(null)

  const power = useAppStore((s) => s.power)
  const frequency = useAppStore((s) => s.frequency)
  const permittivity = useAppStore((s) => s.permittivity)
  const obstacles = useAppStore((s) => s.obstacles)
  const selectedObstacleId = useAppStore((s) => s.selectedObstacleId)
  const fieldStrengthData = useAppStore((s) => s.fieldStrengthData)
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen)

  const setPower = useAppStore((s) => s.setPower)
  const setFrequency = useAppStore((s) => s.setFrequency)
  const setPermittivity = useAppStore((s) => s.setPermittivity)
  const loadPreset = useAppStore((s) => s.loadPreset)
  const clearObstacles = useAppStore((s) => s.clearObstacles)
  const removeObstacle = useAppStore((s) => s.removeObstacle)
  const selectObstacle = useAppStore((s) => s.selectObstacle)
  const addObstacle = useAppStore((s) => s.addObstacle)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const [selectedType, setSelectedType] = useState<ObstacleType>('building')

  const animate = (
    target: { power?: number; frequency?: number; permittivity?: number },
    duration: number = 500
  ) => {
    const current = { power, frequency, permittivity }
    new TWEEN.Tween(current)
      .to(target, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        if (target.power !== undefined) setPower(Math.round(current.power))
        if (target.frequency !== undefined) setFrequency(Math.round(current.frequency))
        if (target.permittivity !== undefined) setPermittivity(Math.round(current.permittivity))
      })
      .start()
  }

  useEffect(() => {
    const draw = (timestamp: number) => {
      if (timestamp - lastDrawTime.current < 100) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }
      lastDrawTime.current = timestamp

      const canvas = canvasRef.current
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height
      const padL = 40
      const padR = 15
      const padT = 15
      const padB = 30
      const plotW = w - padL - padR
      const plotH = h - padT - padB

      ctx.fillStyle = '#0f3460'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1

      const xTicks = 5
      const yTicks = 4
      for (let i = 0; i <= xTicks; i++) {
        const x = padL + (i / xTicks) * plotW
        ctx.beginPath()
        ctx.moveTo(x, padT)
        ctx.lineTo(x, padT + plotH)
        ctx.stroke()
      }
      for (let i = 0; i <= yTicks; i++) {
        const y = padT + (i / yTicks) * plotH
        ctx.beginPath()
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, padT + plotH)
      ctx.lineTo(padL + plotW, padT + plotH)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i <= xTicks; i++) {
        const x = padL + (i / xTicks) * plotW
        const label = `${(i * 20).toFixed(0)}m`
        ctx.fillText(label, x, padT + plotH + 14)
      }
      ctx.textAlign = 'right'
      for (let i = 0; i <= yTicks; i++) {
        const y = padT + (i / yTicks) * plotH
        const val = (1 - i / yTicks) * 100
        ctx.fillText(`${val.toFixed(0)}`, padL - 5, y + 3)
      }
      ctx.textAlign = 'center'
      ctx.fillText('距离', padL + plotW / 2, h - 5)
      ctx.save()
      ctx.translate(10, padT + plotH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('场强', 0, 0)
      ctx.restore()

      if (fieldStrengthData.length > 1) {
        const gradient = ctx.createLinearGradient(padL, padT, padL + plotW, padT + plotH)
        gradient.addColorStop(0, '#00ff00')
        gradient.addColorStop(1, '#00aa00')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()

        const maxDist = Math.max(...fieldStrengthData.map((d) => d.distance), 1)
        const maxStrength = Math.max(...fieldStrengthData.map((d) => d.strength), 1)

        fieldStrengthData.forEach((pt, idx) => {
          const x = padL + (pt.distance / maxDist) * plotW
          const y = padT + plotH - (pt.strength / maxStrength) * plotH
          if (idx === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      } else {
        const gradient = ctx.createLinearGradient(padL, padT, padL + plotW, padT + plotH)
        gradient.addColorStop(0, '#00ff00')
        gradient.addColorStop(1, '#00aa00')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padL, padT + plotH - 10)
        for (let i = 1; i <= 40; i++) {
          const x = padL + (i / 40) * plotW
          const baseDecay = Math.exp(-i / 15) * 0.9 + 0.05
          const noise = Math.sin(i * 0.7) * 0.05
          const y = padT + plotH - (baseDecay + noise) * plotH
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    animationFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [fieldStrengthData])

  useEffect(() => {
    const animateLoop = () => {
      TWEEN.update()
      requestAnimationFrame(animateLoop)
    }
    const id = requestAnimationFrame(animateLoop)
    return () => cancelAnimationFrame(id)
  }, [])

  const handleSliderChange = (
    key: 'power' | 'frequency' | 'permittivity',
    value: number
  ) => {
    if (key === 'power') setPower(value)
    if (key === 'frequency') setFrequency(value)
    if (key === 'permittivity') setPermittivity(value)
  }

  const sliderConfig = {
    power: { min: 1, max: 100, unit: 'W', label: '发射功率' },
    frequency: { min: 100, max: 3000, unit: 'MHz', label: '频率' },
    permittivity: { min: 1, max: 10, unit: '', label: '介电常数' },
  }

  const getSliderGradient = (
    key: 'power' | 'frequency' | 'permittivity',
    value: number
  ) => {
    const cfg = sliderConfig[key]
    const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100
    const isDragging = draggingSlider === key
    const colorStops = isDragging
      ? `linear-gradient(to right, #3a7bd5 0%, #ff7e5f ${pct}%, #333 ${pct}%, #333 100%)`
      : `linear-gradient(to right, #4a9eff 0%, #4a9eff ${pct}%, #333 ${pct}%, #333 100%)`
    return colorStops
  }

  const handlePresetClick = () => {
    new TWEEN.Tween({})
      .to({}, 500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onStart(() => loadPreset())
      .start()
  }

  const handleClearClick = () => {
    new TWEEN.Tween({})
      .to({}, 500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onStart(() => clearObstacles())
      .start()
  }

  const handleAddObstacle = (type: ObstacleType) => {
    setSelectedType(type)
    const sizeMap: Record<ObstacleType, THREE.Vector3> = {
      building: new THREE.Vector3(10, 10, 10),
      tower: new THREE.Vector3(3, 15, 3),
      hill: new THREE.Vector3(10, 8, 10),
    }
    const radiusMap: Record<ObstacleType, number> = {
      building: 0,
      tower: 3,
      hill: 10,
    }
    const obstacle = {
      id: generateId(),
      type,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        0,
        (Math.random() - 0.5) * 60
      ),
      rotation: new THREE.Euler(0, 0, 0),
      size: sizeMap[type],
      radius: radiusMap[type],
      selected: false,
    }
    addObstacle(obstacle)
  }

  const handleDeleteSelected = () => {
    if (selectedObstacleId) {
      removeObstacle(selectedObstacleId)
    }
  }

  const sidebarBaseStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '280px',
    background: '#16213e',
    display: 'flex',
    flexDirection: 'column',
    color: '#e0e0e0',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  }

  const mobileStyle: React.CSSProperties = isMobile
    ? {
        height: isSidebarOpen ? 'auto' : '50px',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        zIndex: 100,
      }
    : { height: '100%' }

  return (
    <div style={{ ...sidebarBaseStyle, ...mobileStyle }}>
      {isMobile && (
        <div
          onClick={toggleSidebar}
          style={{
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderBottom: isSidebarOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              background: '#e0e0e0',
              borderRadius: '2px',
              transform: isSidebarOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
        </div>
      )}

      {(!isMobile || isSidebarOpen) && (
        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#e0e0e0',
              marginBottom: '4px',
            }}
          >
            控制面板
          </div>

          {(['power', 'frequency', 'permittivity'] as const).map((key) => {
            const cfg = sliderConfig[key]
            const val =
              key === 'power' ? power : key === 'frequency' ? frequency : permittivity
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#c0c0c0',
                  }}
                >
                  <span>{cfg.label}</span>
                  <span style={{ color: '#4a9eff', fontWeight: 500 }}>
                    {val}
                    {cfg.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  value={val}
                  onMouseDown={() => setDraggingSlider(key)}
                  onMouseUp={() => setDraggingSlider(null)}
                  onTouchStart={() => setDraggingSlider(key)}
                  onTouchEnd={() => setDraggingSlider(null)}
                  onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: getSliderGradient(key, val),
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                />
              </div>
            )
          })}

          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              border: 2px solid #4a9eff;
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              border: 2px solid #4a9eff;
            }
          `}</style>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { key: 'preset', label: '预设布局', action: handlePresetClick },
              { key: 'clear', label: '全清场景', action: handleClearClick },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={btn.action}
                onMouseEnter={() => setButtonHover(btn.key)}
                onMouseLeave={() => setButtonHover(null)}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: buttonHover === btn.key ? '#ff5e7a' : '#e94560',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.5s ease',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: '#c0c0c0', fontWeight: 500 }}>
              场强分布曲线
            </div>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '200px',
                background: '#0f3460',
                borderRadius: '6px',
                display: 'block',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: '#c0c0c0', fontWeight: 500 }}>
              障碍物类型
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['building', 'tower', 'hill'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddObstacle(type)}
                  style={{
                    flex: 1,
                    minWidth: '70px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: selectedType === type ? '#4a9eff' : '#1a2744',
                    color: '#ffffff',
                    border: selectedType === type ? '1px solid #4a9eff' : '1px solid #2a3a5c',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {obstacleTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedObstacleId}
            onMouseEnter={() => setButtonHover('delete')}
            onMouseLeave={() => setButtonHover(null)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: selectedObstacleId
                ? buttonHover === 'delete'
                  ? '#ff5e7a'
                  : '#e94560'
                : '#3a3a4a',
              color: selectedObstacleId ? '#ffffff' : '#7a7a8a',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: selectedObstacleId ? 'pointer' : 'not-allowed',
              transition: 'background 0.5s ease',
            }}
          >
            删除选中障碍物
            {selectedObstacleId && obstacles.find((o) => o.id === selectedObstacleId)
              ? ` (${obstacleTypeLabels[obstacles.find((o) => o.id === selectedObstacleId)!.type]})`
              : ''}
          </button>

          {obstacles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', color: '#8a8a9a' }}>
                当前障碍物 ({obstacles.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {obstacles.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => selectObstacle(o.selected ? null : o.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: o.selected ? '#4a9eff' : '#1a2744',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: o.selected ? '1px solid #4a9eff' : '1px solid #2a3a5c',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {obstacleTypeLabels[o.type]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
