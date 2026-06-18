import React, { useEffect, useRef, useState } from 'react'
import { useRecallStore } from '@/stores/recallStore'
import type { Location } from '@/types'

const MapView: React.FC = () => {
  const {
    locations,
    heatData,
    selectedLocation,
    particleEffects,
    setSelectedLocation,
    setModalOpen,
    loadHeatData,
    loadRecalls,
    addParticleEffect,
    removeParticleEffect,
  } = useRecallStore()

  const mapRef = useRef<HTMLDivElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastTouchDistance = useRef(0)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    loadHeatData()
  }, [loadHeatData])

  useEffect(() => {
    if (selectedLocation) {
      loadRecalls(selectedLocation.id)
    }
  }, [selectedLocation, loadRecalls])

  const handleLocationClick = (location: Location, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLocation(location)
    setModalOpen(true)

    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      addParticleEffect(location.id, x, y)
      setTimeout(() => removeParticleEffect(location.id), 2000)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale((prev) => Math.max(0.8, Math.min(2, prev + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const delta = (distance - lastTouchDistance.current) * 0.01
      setScale((prev) => Math.max(0.8, Math.min(2, prev + delta)))
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const getHeatColor = (heat: number) => {
    const ratio = heat / 100
    const r = Math.round(30 + (229 - 30) * ratio)
    const g = Math.round(136 + (57 - 136) * ratio)
    const b = Math.round(229 + (53 - 229) * ratio)
    return `rgba(${r}, ${g}, ${b}, 0.3)`
  }

  return (
    <div
      ref={mapRef}
      className="map-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <svg
          width="900"
          height="700"
          viewBox="0 0 900 700"
          style={{ display: 'block' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="woodGrain" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="#F5F0E1" />
              <line x1="0" y1="0" x2="4" y2="0" stroke="#E8E0CC" strokeWidth="0.5" />
              <line x1="0" y1="2" x2="4" y2="2" stroke="#EDE6D3" strokeWidth="0.3" />
            </pattern>
            <linearGradient id="heatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E88E5" />
              <stop offset="50%" stopColor="#FFC107" />
              <stop offset="100%" stopColor="#E53935" />
            </linearGradient>
          </defs>

          <rect width="900" height="700" fill="url(#woodGrain)" rx="8" />

          <line x1="450" y1="50" x2="450" y2="650" stroke="#5D4037" strokeWidth="3" strokeDasharray="8,4" opacity="0.3" />
          <line x1="100" y1="350" x2="800" y2="350" stroke="#5D4037" strokeWidth="3" strokeDasharray="8,4" opacity="0.3" />

          <g id="buildings" stroke="#5D4037" strokeWidth="1.5" fill="none">
            <rect x="240" y="140" width="140" height="100" rx="4" fill="rgba(93, 64, 55, 0.08)" />
            <rect x="250" y="150" width="120" height="80" rx="3" />
            <line x1="310" y1="150" x2="310" y2="230" />
            <line x1="250" y1="190" x2="370" y2="190" />
            <text x="310" y="260" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">图书馆</text>

            <rect x="510" y="260" width="120" height="80" rx="4" fill="rgba(93, 64, 55, 0.08)" />
            <line x1="540" y1="260" x2="540" y2="340" />
            <line x1="570" y1="260" x2="570" y2="340" />
            <line x1="600" y1="260" x2="600" y2="340" />
            <line x1="510" y1="300" x2="630" y2="300" />
            <text x="570" y="360" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">食堂</text>

            <rect x="100" y="330" width="100" height="140" rx="4" fill="rgba(76, 175, 80, 0.15)" />
            <ellipse cx="150" cy="400" rx="35" ry="55" fill="rgba(76, 175, 80, 0.3)" stroke="#4CAF50" strokeWidth="1.5" />
            <text x="150" y="490" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">操场</text>

            <rect x="380" y="180" width="160" height="90" rx="4" fill="rgba(93, 64, 55, 0.08)" />
            <line x1="420" y1="180" x2="420" y2="270" />
            <line x1="460" y1="180" x2="460" y2="270" />
            <line x1="500" y1="180" x2="500" y2="270" />
            <line x1="380" y1="225" x2="540" y2="225" />
            <text x="460" y="295" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">教学楼</text>

            <rect x="620" y="120" width="110" height="90" rx="4" fill="rgba(93, 64, 55, 0.08)" />
            <line x1="647" y1="120" x2="647" y2="210" />
            <line x1="674" y1="120" x2="674" y2="210" />
            <line x1="701" y1="120" x2="701" y2="210" />
            <line x1="620" y1="165" x2="730" y2="165" />
            <text x="675" y="230" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">宿舍区</text>

            <ellipse cx="400" cy="380" rx="80" ry="50" fill="rgba(30, 136, 229, 0.2)" stroke="#1E88E5" strokeWidth="1.5" strokeDasharray="4,2" />
            <ellipse cx="400" cy="380" rx="50" ry="30" fill="rgba(30, 136, 229, 0.3)" />
            <rect x="390" y="365" width="20" height="25" fill="rgba(93, 64, 55, 0.15)" stroke="#5D4037" strokeWidth="1" />
            <text x="400" y="450" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">沁心湖</text>

            <path d="M 350 80 Q 400 50 450 80 Q 500 50 550 80 L 550 100 L 350 100 Z" fill="rgba(93, 64, 55, 0.08)" stroke="#5D4037" strokeWidth="1.5" />
            <text x="450" y="115" textAnchor="middle" fill="#5D4037" fontSize="12" fontFamily="Noto Serif SC">校门</text>

            <ellipse cx="450" cy="95" rx="15" ry="20" fill="rgba(76, 175, 80, 0.4)" stroke="#4CAF50" strokeWidth="1.5" />
            <line x1="450" y1="75" x2="450" y2="100" stroke="#5D4037" strokeWidth="2" />
          </g>

          <g id="roads" stroke="#8D6E63" strokeWidth="4" fill="none" opacity="0.4">
            <path d="M 100 350 L 800 350" strokeDasharray="12,6" />
            <path d="M 450 100 L 450 600" strokeDasharray="12,6" />
            <path d="M 240 100 L 240 240" />
            <path d="M 750 100 L 750 210" />
            <path d="M 100 470 L 320 470" />
          </g>

          <g id="trees" fill="rgba(76, 175, 80, 0.5)">
            {Array.from({ length: 15 }).map((_, i) => {
              const x = 80 + (i * 53) % 750
              const y = 520 + (i * 29) % 120
              return (
                <g key={i}>
                  <ellipse cx={x} cy={y} rx={8 + (i % 3) * 3} ry={10 + (i % 4) * 3} />
                  <line x1={x} y1={y + 8} x2={x} y2={y + 15} stroke="#5D4037" strokeWidth="2" />
                </g>
              )
            })}
          </g>

          <g id="compass" transform="translate(800, 600)">
            <circle r="35" fill="rgba(255, 255, 255, 0.8)" stroke="#5D4037" strokeWidth="2" />
            <circle r="28" fill="none" stroke="#5D4037" strokeWidth="1" strokeDasharray="4,2" />
            <polygon points="0,-25 5,0 0,5 -5,0" fill="#E53935" />
            <polygon points="0,25 5,0 0,-5 -5,0" fill="#5D4037" />
            <polygon points="-25,0 0,5 0,-5" fill="#5D4037" />
            <polygon points="25,0 0,5 0,-5" fill="#5D4037" />
            <text y="-32" textAnchor="middle" fill="#5D4037" fontSize="10" fontWeight="bold" fontFamily="Noto Serif SC">北</text>
            <text y="42" textAnchor="middle" fill="#5D4037" fontSize="10" fontFamily="Noto Serif SC">南</text>
            <text x="-32" y="4" textAnchor="middle" fill="#5D4037" fontSize="10" fontFamily="Noto Serif SC">西</text>
            <text x="32" y="4" textAnchor="middle" fill="#5D4037" fontSize="10" fontFamily="Noto Serif SC">东</text>
            <text y="58" textAnchor="middle" fill="#5D4037" fontSize="9" fontFamily="Noto Serif SC">比例尺 1:200</text>
          </g>

          <g id="heatmap-overlay">
            {locations.map((loc) => {
              const heat = heatData[loc.id]?.heat_score || 0
              if (heat <= 0) return null
              const cx = (loc.x / 100) * 900
              const cy = (loc.y / 100) * 700
              const radius = 30 + (heat / 100) * 40
              return (
                <ellipse
                  key={`heat-${loc.id}`}
                  cx={cx}
                  cy={cy}
                  rx={radius}
                  ry={radius * 0.7}
                  fill={getHeatColor(heat)}
                  style={{ pointerEvents: 'none', transition: 'all 0.5s ease-out' }}
                />
              )
            })}
          </g>

          <g id="location-markers">
            {locations.map((loc) => {
              const cx = (loc.x / 100) * 900
              const cy = (loc.y / 100) * 700
              const isHovered = hoveredLocation === loc.id
              const isSelected = selectedLocation?.id === loc.id
              const radius = isHovered || isSelected ? 10 : 7

              return (
                <g
                  key={loc.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredLocation(loc.id)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  onClick={(e) => handleLocationClick(loc, e as unknown as React.MouseEvent)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 8}
                    fill="rgba(255, 224, 130, 0.3)"
                    style={{
                      animation: 'glow-pulse 2s ease-in-out infinite',
                      transition: 'all 0.2s ease-out',
                    }}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="#FFE082"
                    stroke="#FFA000"
                    strokeWidth="2"
                    filter="url(#glow)"
                    style={{
                      transition: 'all 0.2s ease-out',
                    }}
                  />
                  <circle
                    cx={cx - 2}
                    cy={cy - 2}
                    r={radius * 0.3}
                    fill="rgba(255, 255, 255, 0.8)"
                    style={{ pointerEvents: 'none' }}
                  />

                  {isHovered && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect
                        x={cx + 15}
                        y={cy - 12}
                        width={loc.name.length * 14 + 20}
                        height="28"
                        rx="6"
                        fill="rgba(255, 255, 255, 0.95)"
                        stroke="#5D4037"
                        strokeWidth="1"
                        filter="url(#glow)"
                      />
                      <text
                        x={cx + 25}
                        y={cy + 7}
                        fill="#3E2723"
                        fontSize="14"
                        fontWeight="300"
                        fontFamily="Noto Serif SC"
                      >
                        {loc.name}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {particleEffects.map((effect) => (
          <div
            key={effect.locationId}
            style={{
              position: 'absolute',
              left: `${effect.x}%`,
              top: `${effect.y}%`,
              pointerEvents: 'none',
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '4px',
                  height: '4px',
                  background: 'radial-gradient(circle, #FFD700 0%, #FFA000 100%)',
                  borderRadius: '50%',
                  animation: `float-up 2s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-10px)`,
                  boxShadow: '0 0 8px #FFD700, 0 0 16px #FFA000',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="map-controls" style={mapControlsStyle}>
        <div className="glass-card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: '16px' }}
            onClick={() => setScale((prev) => Math.min(2, prev + 0.2))}
          >
            +
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: '16px' }}
            onClick={() => setScale((prev) => Math.max(0.8, prev - 0.2))}
          >
            −
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => {
              setScale(1)
              setPosition({ x: 0, y: 0 })
            }}
          >
            重置
          </button>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', marginTop: '12px' }}>
          <div style={{ fontSize: '12px', color: '#5D4037', marginBottom: '6px', fontWeight: '500' }}>
            热度图例
          </div>
          <div
            style={{
              width: '120px',
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(to right, #1E88E5, #FFC107, #E53935)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8D6E63', marginTop: '4px' }}>
            <span>冷</span>
            <span>热</span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: 'ZCOOL XiaoWei, serif',
            fontSize: '32px',
            color: '#5D4037',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
            letterSpacing: '4px',
          }}
        >
          校舍回声日志
        </h1>
        <p style={{ fontSize: '13px', color: '#8D6E63', marginTop: '4px', letterSpacing: '2px' }}>
          点击发光圆点，聆听校园角落的故事
        </p>
      </div>
    </div>
  )
}

const mapControlsStyle: React.CSSProperties = {
  position: 'absolute',
  right: '20px',
  bottom: '20px',
  zIndex: 10,
}

export default MapView
