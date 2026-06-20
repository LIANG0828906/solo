import { useEffect, useRef, useState } from 'react'
import {
  useCoralReelStore,
  DEPTH_LAYERS,
  REGIONS,
  PLASTIC_COLORS,
  PLASTIC_NAMES,
  Region,
  PlasticType,
  Microplastic
} from './store'

const DEPTH_MARKS = [
  { value: 0, label: '表层', layer: 'surface' as const },
  { value: 1000, label: '中层', layer: 'middle' as const },
  { value: 2000, label: '深层', layer: 'deep' as const },
  { value: 4000, label: '深海', layer: 'abyssal' as const },
  { value: 5000, label: '海沟', layer: 'trench' as const }
]

const panelStyle: React.CSSProperties = {
  background: 'rgba(26, 58, 92, 0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(168, 208, 230, 0.2)',
  borderRadius: '8px',
  color: '#A8D0E6',
  transition: 'all 0.3s ease-out'
}

const buttonBaseStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1A3A5C, #0F2A4A)',
  border: '1px solid rgba(168, 208, 230, 0.3)',
  borderRadius: '8px',
  color: '#A8D0E6',
  cursor: 'pointer',
  transition: 'all 0.3s ease-out',
  fontFamily: "'Inter', sans-serif"
}

function getHoverStyle(isActive: boolean): React.CSSProperties {
  return isActive
    ? {
        background: 'linear-gradient(135deg, #2A4A6C, #1F3A5C)',
        boxShadow: '0 0 8px rgba(126, 200, 227, 0.4)',
        borderColor: 'rgba(126, 200, 227, 0.6)'
      }
    : {}
}

export function DepthSlider({ onChange }: { onChange: (depth: number) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const currentDepth = useCoralReelStore(s => s.currentDepth)
  const targetDepth = useCoralReelStore(s => s.targetDepth)
  const displayDepth = Math.max(currentDepth, targetDepth)

  const handlePositionChange = (clientY: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const depth = Math.round(ratio * 5000)
    onChange(depth)
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY
      handlePositionChange(clientY)
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging])

  const ratio = Math.min(1, displayDepth / 5000)

  return (
    <div
      style={{
        position: 'absolute',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        ...panelStyle,
        padding: '16px 12px',
        width: '80px',
        zIndex: 10
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>
        深度 (m)
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: '280px',
          width: '8px',
          background: 'rgba(10, 17, 40, 0.6)',
          borderRadius: '4px',
          margin: '0 auto',
          cursor: 'pointer'
        }}
        onMouseDown={(e) => {
          setIsDragging(true)
          handlePositionChange(e.clientY)
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          handlePositionChange(e.touches[0].clientY)
        }}
      >
        {DEPTH_MARKS.map((mark) => (
          <div
            key={mark.value}
            style={{
              position: 'absolute',
              left: '-2px',
              top: `${(mark.value / 5000) * 100}%`,
              transform: 'translateY(-50%)',
              width: '12px',
              height: '2px',
              background: 'rgba(168, 208, 230, 0.5)',
              zIndex: 2
            }}
          >
            <span style={{
              position: 'absolute',
              left: '-45px',
              top: '-6px',
              fontSize: '9px',
              width: '40px',
              textAlign: 'right',
              whiteSpace: 'nowrap'
            }}>
              {mark.value}
            </span>
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: '0',
            bottom: '0',
            width: '100%',
            height: `${ratio * 100}%`,
            background: 'linear-gradient(to top, #7EC8E3, #A8D0E6)',
            borderRadius: '4px',
            transition: 'height 0.5s ease-out'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-6px',
            top: `calc(${ratio * 100}% - 10px)`,
            width: '20px',
            height: '20px',
            background: '#7EC8E3',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(126, 200, 227, 0.6)',
            transition: 'top 0.5s ease-out'
          }}
        />
      </div>
      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>
        {Math.round(displayDepth)}
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
        {DEPTH_LAYERS[useCoralReelStore.getState().getDepthLayer()].name}
      </div>
    </div>
  )
}

export function RegionButtons({ onSelect }: { onSelect: (region: Region) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const selectedRegion = useCoralReelStore(s => s.selectedRegion)

  const regionKeys: Region[] = ['pacific', 'atlantic', 'indian', 'arctic', 'antarctic']
  const regionIcons = ['🌊', '🐋', '🐠', '❄️', '🧊']

  return (
    <div
      style={{
        position: 'absolute',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        ...panelStyle,
        padding: '12px 20px',
        display: 'flex',
        gap: '12px',
        zIndex: 10
      }}
    >
      {regionKeys.map((key, idx) => {
        const isActive = selectedRegion === key
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...buttonBaseStyle,
              ...getHoverStyle(isActive || hovered === key),
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              border: isActive ? '2px solid #7EC8E3' : '1px solid rgba(168, 208, 230, 0.3)'
            }}
            title={REGIONS[key].name}
          >
            <span>{regionIcons[idx]}</span>
            <span style={{ fontSize: '8px', marginTop: '2px' }}>
              {REGIONS[key].name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TimeSlider() {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const currentYear = useCoralReelStore(s => s.currentYear)
  const currentMonth = useCoralReelStore(s => s.currentMonth)
  const setTimeStep = useCoralReelStore(s => s.setTimeStep)

  const totalMonths = (2025 - 2010) * 12 + 12
  const currentMonths = (currentYear - 2010) * 12 + currentMonth
  const ratio = currentMonths / totalMonths

  const handlePositionChange = (clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const months = Math.round(r * totalMonths)
    const year = 2010 + Math.floor(months / 12)
    const month = months % 12
    setTimeStep(year, month)
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
      handlePositionChange(clientX)
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        ...panelStyle,
        padding: '16px 24px',
        width: '600px',
        maxWidth: 'calc(100% - 48px)',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600 }}>时间模拟</div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <span style={{ fontWeight: 700, color: '#7EC8E3' }}>
            {currentYear}年{String(currentMonth + 1).padStart(2, '0')}月
          </span>
          <span style={{ opacity: 0.8 }}>
            已模拟 {currentYear - 2010} 年
          </span>
        </div>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: '8px',
          background: 'rgba(10, 17, 40, 0.6)',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onMouseDown={(e) => {
          setIsDragging(true)
          handlePositionChange(e.clientX)
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          handlePositionChange(e.touches[0].clientX)
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            height: '100%',
            width: `${ratio * 100}%`,
            background: 'linear-gradient(to right, #7EC8E3, #F1C40F)',
            borderRadius: '4px',
            transition: 'width 0.3s ease-out'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: `calc(${ratio * 100}% - 8px)`,
            width: '16px',
            height: '16px',
            background: '#F1C40F',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(241, 196, 15, 0.6)',
            transition: 'left 0.3s ease-out'
          }}
        />
        {[2010, 2015, 2020, 2025].map(year => (
          <span
            key={year}
            style={{
              position: 'absolute',
              top: '14px',
              left: `${((year - 2010) / (2025 - 2010)) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '10px',
              opacity: 0.7
            }}
          >
            {year}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ParticleDetailPanel() {
  const selectedParticle = useCoralReelStore(s => s.selectedParticle)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setVisible(!!selectedParticle)
  }, [selectedParticle])

  if (!selectedParticle) return null

  const originRegions = ['亚洲沿海工业带', '北美西海岸', '欧洲河流流域', '南美洲渔业区', '非洲东海岸']
  const origin = originRegions[Math.abs(selectedParticle.id.charCodeAt(0)) % originRegions.length]

  return (
    <div
      style={{
        position: 'absolute',
        left: '24px',
        top: '50%',
        transform: `translateY(-50%) translateX(${visible ? '0' : '-400px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        ...panelStyle,
        padding: '20px',
        width: '320px',
        zIndex: 10,
        ...getHoverStyle(hovered)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: PLASTIC_COLORS[selectedParticle.type],
            boxShadow: `0 0 20px ${PLASTIC_COLORS[selectedParticle.type]}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          {selectedParticle.type === 'fiber' ? '🧵' : selectedParticle.type === 'fragment' ? '🔶' : '📄'}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {PLASTIC_NAMES[selectedParticle.type]}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
            ID: {selectedParticle.id.slice(0, 8)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '4px' }}>估计尺寸</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {(selectedParticle.size * 1000).toFixed(1)} μm
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '4px' }}>所在深度</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {selectedParticle.depth.toFixed(0)} m
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '4px' }}>深度层级</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {DEPTH_LAYERS[useCoralReelStore.getState().getDepthLayer()].name}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '4px' }}>迁移速度</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {(Math.sqrt(
              Math.pow(selectedParticle.velocity.x, 2) +
              Math.pow(selectedParticle.velocity.y, 2) +
              Math.pow(selectedParticle.velocity.z, 2)
            ) * 100).toFixed(2)} cm/d
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '6px',
          background: 'rgba(10, 17, 40, 0.4)',
          border: '1px solid rgba(168, 208, 230, 0.15)'
        }}
      >
        <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '6px' }}>
          📍 来源预测（洋流反推）
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500 }}>
          {origin}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '6px' }}>
          置信度: {(70 + Math.abs(selectedParticle.id.charCodeAt(1)) % 25)}%
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
        💡 长按颗粒可显示迁移轨迹
      </div>
    </div>
  )
}

export function DensityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const densityHistory = useCoralReelStore(s => s.densityHistory)
  const trackHistory = useCoralReelStore(s => s.trackHistory)
  const currentDepth = useCoralReelStore(s => s.currentDepth)
  const selectedRegion = useCoralReelStore(s => s.selectedRegion)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const data = densityHistory.length > 0 ? densityHistory : new Array(60).fill(0)
    const track = trackHistory.length > 0 ? trackHistory : new Array(60).fill(0)

    const padding = { top: 30, right: 12, bottom: 28, left: 40 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    ctx.strokeStyle = 'rgba(168, 208, 230, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    const maxVal = Math.max(...data, ...track, 1) * 1.1
    const minVal = 0

    ctx.fillStyle = 'rgba(168, 208, 230, 0.5)'
    ctx.font = '9px Inter, sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = maxVal - ((maxVal - minVal) / 4) * i
      const y = padding.top + (chartH / 4) * i
      ctx.fillText(val.toFixed(1), padding.left - 6, y + 3)
    }

    if (track.length > 1) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
      gradient.addColorStop(0, 'rgba(241, 196, 15, 0.3)')
      gradient.addColorStop(1, 'rgba(241, 196, 15, 0)')
      ctx.beginPath()
      track.forEach((v, i) => {
        const x = padding.left + (i / (track.length - 1)) * chartW
        const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.lineTo(padding.left + chartW, padding.top + chartH)
      ctx.lineTo(padding.left, padding.top + chartH)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
    }

    if (data.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = '#7EC8E3'
      ctx.lineWidth = 2
      data.forEach((v, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW
        const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      if (data.length > 10) {
        const lastIdx = data.length - 1
        const lastX = padding.left + chartW
        const lastY = padding.top + chartH - ((data[lastIdx] - minVal) / (maxVal - minVal)) * chartH
        ctx.beginPath()
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#7EC8E3'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    ctx.fillStyle = 'rgba(168, 208, 230, 0.5)'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('-60 月', padding.left, height - 8)
    ctx.fillText('当前', width - padding.right, height - 8)
  }, [densityHistory, trackHistory, currentDepth, selectedRegion])

  return (
    <div
      style={{
        position: 'absolute',
        top: '100px',
        right: '120px',
        ...panelStyle,
        padding: '16px',
        width: '300px',
        height: '200px',
        zIndex: 10
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
        📊 颗粒密度趋势
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '10px', marginBottom: '4px' }}>
        <span style={{ color: '#7EC8E3' }}>● 颗粒密度</span>
        <span style={{ color: '#F1C40F' }}>● 追踪数量</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '140px', display: 'block' }}
      />
    </div>
  )
}

export function FilterPanel() {
  const filterTypes = useCoralReelStore(s => s.filterTypes)
  const toggleFilterType = useCoralReelStore(s => s.toggleFilterType)
  const filteredParticleCount = useCoralReelStore(s => s.filteredParticleCount)
  const [hovered, setHovered] = useState<PlasticType | null>(null)
  const types: PlasticType[] = ['fiber', 'fragment', 'film']

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '24px',
        ...panelStyle,
        padding: '16px',
        width: '240px',
        zIndex: 10
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
        🔍 颗粒类型筛选
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {types.map(type => {
          const isActive = filterTypes.includes(type)
          return (
            <button
              key={type}
              onClick={() => toggleFilterType(type)}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...buttonBaseStyle,
                ...getHoverStyle(isActive || hovered === type),
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                opacity: isActive ? 1 : 0.5
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: PLASTIC_COLORS[type]
                }}
              />
              <span style={{ flex: 1, textAlign: 'left' }}>{PLASTIC_NAMES[type]}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                {isActive ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </div>
      <div
        style={{
          padding: '10px',
          borderRadius: '6px',
          background: 'rgba(10, 17, 40, 0.4)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '10px', opacity: 0.6 }}>当前深度层可见颗粒</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#7EC8E3', marginTop: '2px' }}>
          {filteredParticleCount}
        </div>
      </div>
    </div>
  )
}

export function GuideOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setFade(true)
      setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 300)
    }, 8000)
    return () => clearTimeout(t)
  }, [onDismiss])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: 'none',
        zIndex: 100,
        textAlign: 'center',
        animation: 'pulse 2s ease-in-out infinite'
      }}
    >
      <div
        style={{
          background: 'rgba(10, 17, 40, 0.75)',
          backdropFilter: 'blur(10px)',
          padding: '32px 48px',
          borderRadius: '16px',
          border: '1px solid rgba(168, 208, 230, 0.2)'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#A8D0E6', marginBottom: '8px' }}>
          CoralReel
        </div>
        <div style={{ fontSize: '14px', color: '#7EC8E3', marginBottom: '20px', lineHeight: 1.6 }}>
          海洋微塑料污染可视化系统<br />
          <span style={{ opacity: 0.7, fontSize: '12px' }}>
            拖动鼠标旋转视角 · 滚轮缩放 · 点击颗粒查看详情
          </span>
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            animation: 'blink 1.5s ease-in-out infinite'
          }}
        >
          {['使用右上角滑块选择深度', '选择上方按钮切换海域', '长按颗粒追踪洋流轨迹', '拖动底部时间轴模拟迁移', ''].map((tip, i) => (
            <div key={i} style={{ margin: '4px 0' }}>
              💡 {tip}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.02); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuCollapsed = useCoralReelStore(s => s.menuCollapsed)
  const setMenuCollapsed = useCoralReelStore(s => s.setMenuCollapsed)

  useEffect(() => {
    const check = () => setMenuCollapsed(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setMenuCollapsed])

  if (!menuCollapsed) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          ...buttonBaseStyle,
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 20
        }}
      >
        ☰
      </button>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 17, 40, 0.95)',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 24px 24px'
          }}
        >
          <div style={{ color: '#A8D0E6', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📋 控制面板
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(168, 208, 230, 0.6)' }}>
            在桌面端获得更好的交互体验
          </div>
        </div>
      )}
    </>
  )
}

export function StatsBar() {
  const selectedRegion = useCoralReelStore(s => s.selectedRegion)
  const currentDepth = useCoralReelStore(s => s.currentDepth)
  const filteredParticleCount = useCoralReelStore(s => s.filteredParticleCount)

  return (
    <div
      style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        ...panelStyle,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🐚</span>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>CoralReel</div>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>海洋微塑料可视化</div>
        </div>
      </div>
      <div style={{ height: '32px', width: '1px', background: 'rgba(168, 208, 230, 0.2)' }} />
      <div>
        <div style={{ fontSize: '10px', opacity: 0.6 }}>当前海域</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#7EC8E3' }}>
          {REGIONS[selectedRegion].name}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '10px', opacity: 0.6 }}>观察深度</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1C40F' }}>
          {Math.round(currentDepth)} m
        </div>
      </div>
      <div>
        <div style={{ fontSize: '10px', opacity: 0.6 }}>可见颗粒</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E74C3C' }}>
          {filteredParticleCount}
        </div>
      </div>
    </div>
  )
}
