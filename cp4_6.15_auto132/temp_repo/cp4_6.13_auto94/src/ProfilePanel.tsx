import { useRef, useEffect, useState } from 'react'
import { useTerrainStore } from './store'

export default function ProfilePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevDataRef = useRef<{
    distances: number[]
    elevations: number[]
    clickIndex: number
  } | null>(null)
  const animStartRef = useRef<number>(0)
  const animIdRef = useRef<number>(0)
  const [fadeInKey, setFadeInKey] = useState(0)

  const profileData = useTerrainStore((s) => s.profileData)
  const clickedPoint = useTerrainStore((s) => s.clickedPoint)

  const width = 300
  const height = 130
  const paddingL = 42
  const paddingR = 12
  const paddingT = 10
  const paddingB = 22

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      if (!profileData) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('点击地形查看剖面曲线', width / 2, height / 2)
        return
      }

      const prev = prevDataRef.current
      const distLen = profileData.distances.length
      const havePrev = prev && prev.distances.length === distLen
      let animT = 1
      if (havePrev) {
        const elapsed = (performance.now() - animStartRef.current) / 300
        animT = Math.min(1, elapsed)
        const easeT = animT < 0.5 ? 2 * animT * animT : 1 - Math.pow(-2 * animT + 2, 2) / 2
        animT = easeT
      }

      const minDist = profileData.distances[0]
      const maxDist = profileData.distances[distLen - 1]
      const minElev = profileData.minElevation
      const maxElev = profileData.maxElevation

      const plotW = width - paddingL - paddingR
      const plotH = height - paddingT - paddingB

      const gridLines = 5
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])

      for (let i = 0; i <= gridLines; i++) {
        const y = paddingT + (plotH * i) / gridLines
        ctx.beginPath()
        ctx.moveTo(paddingL, y)
        ctx.lineTo(paddingL + plotW, y)
        ctx.stroke()
      }

      for (let i = 0; i <= gridLines; i++) {
        const x = paddingL + (plotW * i) / gridLines
        ctx.beginPath()
        ctx.moveTo(x, paddingT)
        ctx.lineTo(x, paddingT + plotH)
        ctx.stroke()
      }
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'

      for (let i = 0; i <= gridLines; i++) {
        const ratio = 1 - i / gridLines
        const val = minElev + (maxElev - minElev) * ratio
        const y = paddingT + (plotH * i) / gridLines
        ctx.fillText(val.toFixed(1) + 'm', paddingL - 6, y)
      }

      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (let i = 0; i <= gridLines; i++) {
        const ratio = i / gridLines
        const val = minDist + (maxDist - minDist) * ratio
        const x = paddingL + (plotW * i) / gridLines
        ctx.fillText(val.toFixed(0) + 'm', x, paddingT + plotH + 6)
      }

      const mapX = (d: number) => {
        const r = (d - minDist) / (maxDist - minDist || 1)
        return paddingL + plotW * r
      }
      const mapY = (e: number) => {
        const r = (e - minElev) / (maxElev - minElev || 1)
        return paddingT + plotH * (1 - r)
      }

      const gradient = ctx.createLinearGradient(0, paddingT, 0, paddingT + plotH)
      gradient.addColorStop(0, 'rgba(120, 180, 255, 0.85)')
      gradient.addColorStop(0.5, 'rgba(120, 255, 180, 0.85)')
      gradient.addColorStop(1, 'rgba(255, 200, 120, 0.85)')

      ctx.beginPath()
      for (let i = 0; i < distLen; i++) {
        let elev = profileData.elevations[i]
        if (havePrev && prev) {
          elev = prev.elevations[i] + (profileData.elevations[i] - prev.elevations[i]) * animT
        }
        const px = mapX(profileData.distances[i])
        const py = mapY(elev)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }

      const lastX = mapX(profileData.distances[distLen - 1])
      ctx.lineTo(lastX, paddingT + plotH)
      ctx.lineTo(paddingL, paddingT + plotH)
      ctx.closePath()

      ctx.fillStyle = 'rgba(100, 150, 255, 0.12)'
      ctx.fill()

      ctx.beginPath()
      for (let i = 0; i < distLen; i++) {
        let elev = profileData.elevations[i]
        if (havePrev && prev) {
          elev = prev.elevations[i] + (profileData.elevations[i] - prev.elevations[i]) * animT
        }
        const px = mapX(profileData.distances[i])
        const py = mapY(elev)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.stroke()

      let clickIdx = profileData.clickIndex
      if (havePrev && prev) {
        clickIdx = prev.clickIndex + Math.round((profileData.clickIndex - prev.clickIndex) * animT)
        clickIdx = Math.max(0, Math.min(distLen - 1, clickIdx))
      }
      let clickElev = profileData.elevations[clickIdx]
      if (havePrev && prev) {
        clickElev = prev.elevations[clickIdx] + (profileData.elevations[clickIdx] - prev.elevations[clickIdx]) * animT
      }
      const cx = mapX(profileData.distances[clickIdx])
      const cy = mapY(clickElev)

      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 68, 68, 0.9)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      if (havePrev && animT < 1) {
        animIdRef.current = requestAnimationFrame(() => draw(animT))
      }
    }

    draw(1)

    return () => {
      cancelAnimationFrame(animIdRef.current)
    }
  }, [profileData])

  useEffect(() => {
    if (profileData) {
      prevDataRef.current = {
        distances: [...profileData.distances],
        elevations: [...profileData.elevations],
        clickIndex: profileData.clickIndex,
      }
      animStartRef.current = performance.now()
      setFadeInKey((k) => k + 1)
    }
  }, [profileData?.clickIndex, profileData?.elevations?.join(',')])

  const elevation = clickedPoint?.elevation
  const slope = clickedPoint?.slope

  return (
    <div
      style={{
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 300,
        background: 'rgba(10, 15, 25, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(100, 150, 255, 0.25)',
        borderRadius: 12,
        padding: '14px 14px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6af, #f6a)',
            boxShadow: '0 0 8px rgba(100,170,255,0.6)',
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 600, color: '#ccd6e0', letterSpacing: 0.3 }}>
          海拔剖面分析 (X方向)
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 0 10px' }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: '#7a8596', marginBottom: 3, letterSpacing: 0.5 }}>
            海拔高度
          </div>
          <div
            key={`elev-${fadeInKey}`}
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'SF Mono, Consolas, monospace',
              background: 'linear-gradient(90deg, #6af, #a6f)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'numFadeIn 0.5s ease-out',
            }}
          >
            {elevation != null ? elevation.toFixed(1) : '--'}
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 2 }}>m</span>
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#7a8596', marginBottom: 3, letterSpacing: 0.5 }}>
            地面坡度
          </div>
          <div
            key={`slope-${fadeInKey}`}
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'SF Mono, Consolas, monospace',
              background: 'linear-gradient(90deg, #f6a, #fa6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'numFadeIn 0.5s ease-out',
            }}
          >
            {slope != null ? Math.round(slope) : '--'}
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 2 }}>°</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes numFadeIn {
          0% { opacity: 0; transform: translateY(4px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  )
}
