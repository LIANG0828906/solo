import React, { useEffect, useRef, useState } from 'react'
import type { PoemAnalysis, CoupletInfo } from '@/analyzers/poemParser'
import { resizeCanvas, drawInkParticles, createInkParticles, type InkParticle } from '@/utils/canvasUtils'

interface MetricsPanelProps {
  analysis: PoemAnalysis
  pulseKey: number
}

const ANTI_LABELS: Record<string, string> = {
  strict: '工对',
  wide: '宽对',
  borrowed: '借对',
  none: '无对仗'
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ analysis, pulseKey }) => {
  const ringCanvasRef = useRef<HTMLCanvasElement>(null)
  const cloudCanvasRef = useRef<HTMLCanvasElement>(null)
  const inkCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<InkParticle[]>([])
  const animRef = useRef<number>(0)
  const [pulseMap, setPulseMap] = useState<Record<string, boolean>>({})
  const [ringAnim, setRingAnim] = useState(0)

  useEffect(() => {
    const keys: Record<string, boolean> = {}
    analysis.couplets.forEach((c, i) => { keys[`c${i}`] = true })
    keys.ring = true
    keys.star = true
    setPulseMap(keys)
    const t = setTimeout(() => setPulseMap({}), 350)
    setRingAnim(a => a + 1)
    return () => clearTimeout(t)
  }, [pulseKey, analysis.couplets.length])

  useEffect(() => {
    if (!ringCanvasRef.current) return
    const { width } = resizeCanvas(ringCanvasRef.current)
    const size = Math.min(width, 180)
    const ctx = ringCanvasRef.current.getContext('2d')
    if (!ctx) return
    ringCanvasRef.current.style.width = size + 'px'
    ringCanvasRef.current.style.height = size + 'px'
    ringCanvasRef.current.width = size * (window.devicePixelRatio || 1)
    ringCanvasRef.current.height = size * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    const cx = size / 2
    const cy = size / 2
    const R = size * 0.38
    const r = size * 0.26
    let progress = 0
    const target = analysis.rhymeDensity / 100

    let raf = 0
    const animateRing = () => {
      progress += 0.04
      const cur = Math.min(1, progress) * target
      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true)
      ctx.fillStyle = 'rgba(93,64,55,0.06)'
      ctx.fill('evenodd')

      const startA = -Math.PI / 2
      const endA = startA + Math.PI * 2 * cur
      if (cur > 0) {
        const grad = ctx.createLinearGradient(cx, cy - R, cx, cy + R)
        grad.addColorStop(0, '#ce93d8')
        grad.addColorStop(0.5, '#ab47bc')
        grad.addColorStop(1, '#7b1fa2')
        ctx.beginPath()
        ctx.arc(cx, cy, R, startA, endA)
        ctx.arc(cx, cy, r, endA, startA, true)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()
      }

      ctx.save()
      ctx.shadowColor = 'rgba(171,71,188,0.6)'
      ctx.shadowBlur = 8
      const tipAngle = endA
      const tipX = cx + Math.cos(tipAngle) * (R + r) / 2
      const tipY = cy + Math.sin(tipAngle) * (R + r) / 2
      ctx.beginPath()
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.restore()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = "600 32px 'Noto Serif SC', serif"
      ctx.fillStyle = '#5d4037'
      ctx.fillText(`${Math.round(cur * 100)}`, cx, cy - 8)
      ctx.font = "500 13px 'Ma Shan Zheng', cursive"
      ctx.fillStyle = '#8d6e63'
      ctx.fillText('韵脚密度 %', cx, cy + 16)

      if (cur < target || progress < 1.1) {
        raf = requestAnimationFrame(animateRing)
      }
    }
    animateRing()
    return () => cancelAnimationFrame(raf)
  }, [analysis.rhymeDensity, ringAnim])

  useEffect(() => {
    if (!cloudCanvasRef.current) return
    const { width, height } = resizeCanvas(cloudCanvasRef.current)
    const ctx = cloudCanvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    const items = analysis.rhymeGroups
    if (items.length === 0) return

    const cx = width / 2
    const cy = height / 2
    const positions: { x: number; y: number }[] = []
    const angleStep = (Math.PI * 2) / Math.max(items.length, 1)
    let radius = 0

    for (let i = 0; i < items.length; i++) {
      if (i === 0) {
        positions.push({ x: cx, y: cy })
        radius = Math.min(width, height) * 0.28
        continue
      }
      const angle = angleStep * (i - 1) - Math.PI / 2
      positions.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      })
      radius += 0
    }

    items.forEach((item, i) => {
      const pos = positions[i]
      if (!pos) return
      const isCenter = i === 0
      const baseSize = isCenter ? 40 : 26
      const fontSize = baseSize + Math.round(item.count * 3)

      ctx.save()
      if (item.chars[0]) {
        ctx.font = `700 ${fontSize}px 'Noto Serif SC', serif`
      } else {
        ctx.font = `500 ${fontSize}px 'Noto Serif SC', serif`
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = item.color
      ctx.shadowBlur = isCenter ? 18 : 10
      ctx.fillStyle = item.color
      ctx.globalAlpha = isCenter ? 1 : 0.9
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 2.5
      const txt = item.chars.join('') || '—'
      ctx.strokeText(txt, pos.x, pos.y)
      ctx.fillText(txt, pos.x, pos.y)
      ctx.restore()
    })
  }, [analysis.rhymeGroups, ringAnim])

  useEffect(() => {
    if (!inkCanvasRef.current) return
    const canvas = inkCanvasRef.current
    resizeCanvas(canvas)
    particlesRef.current = createInkParticles(canvas, 30)

    const ctx = canvas.getContext('2d')!
    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      particlesRef.current = drawInkParticles(ctx, particlesRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const renderProgressBar = (couplet: CoupletInfo, idx: number) => {
    const match = couplet.pingzeMatch
    const pulse = pulseMap[`c${idx}`]
    return (
      <div key={idx} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '12px',
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '10px',
        border: '1px solid rgba(93,64,55,0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#5d4037'
        }}>
          <span style={{ fontFamily: "'Ma Shan Zheng', cursive", letterSpacing: '2px' }}>
            第{idx + 1}联（{ANTI_LABELS[couplet.antithesis]}）
          </span>
          <span style={{ fontWeight: 700, color: match >= 80 ? '#2e7d32' : match >= 60 ? '#1565c0' : '#c62828' }}>
            {match}%
          </span>
        </div>
        <div style={{
          height: '10px',
          background: 'rgba(93,64,55,0.08)',
          borderRadius: '5px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s ease',
          transform: pulse ? 'scaleX(1.02)' : 'scaleX(1)'
        }}>
          <div
            style={{
              height: '100%',
              width: `${match}%`,
              background: `linear-gradient(90deg, #ff5252 0%, #ffab40 ${50 - match * 0.2}%, #69f0ae 100%)`,
              borderRadius: '5px',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: pulse ? '0 0 14px rgba(105,240,174,0.7)' : '0 1px 3px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
          >
            {pulse && (
              <span style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                animation: 'pulseBar 0.3s ease-out'
              }} />
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStars = (score: number) => {
    const full = Math.floor(score)
    const half = score - full >= 0.5
    const stars: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const filled = i < full || (i === full && half)
      const isPartial = i === full && half
      const pct = filled ? (isPartial ? 50 : 100) : 0
      const hue = 50 - (i / 5) * 30
      const colorFilled = `hsl(${hue}, 100%, 58%)`
      stars.push(
        <svg
          key={i}
          width="30"
          height="30"
          viewBox="0 0 24 24"
          style={{
            filter: filled ? `drop-shadow(0 0 6px ${colorFilled}88)` : 'none',
            transform: pulseMap.star && i === full - 1 ? 'scale(1.25)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}
        >
          <defs>
            <linearGradient id={`star-${i}-${pulseKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset={`${pct}%`} stopColor={colorFilled} />
              <stop offset={`${pct}%`} stopColor="#d7ccc8" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l2.9 6.26 6.88.71-5.14 4.63 1.49 6.74L12 16.9l-6.13 3.44 1.49-6.74L2.22 8.97l6.88-.71L12 2z"
            fill={`url(#star-${i}-${pulseKey})`}
            stroke="#8d6e63"
            strokeWidth="0.5"
          />
        </svg>
      )
    }
    return <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>{stars}</div>
  }

  return (
    <div
      className="fade-in-up"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '20px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        border: '2px solid #5d4037',
        boxShadow: '2px 4px 8px rgba(0,0,0,0.15)',
        height: '100%',
        overflow: 'auto',
        animationDelay: '0.3s'
      }}
    >
      <canvas
        ref={inkCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: '10px',
          zIndex: 0
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 className="zhuanshu" style={{
          margin: 0,
          fontSize: '24px',
          color: '#5d4037',
          letterSpacing: '3px',
          textAlign: 'center'
        }}>韵律指标总览</h3>
        <div style={{
          textAlign: 'center',
          marginTop: '6px',
          fontSize: '12px',
          color: '#8d6e63',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '3px'
        }}>
          {analysis.formType} · {analysis.lines.length}句 · {analysis.totalChars}字
        </div>
      </div>

      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #8d6e63, transparent)',
        opacity: 0.5,
        position: 'relative',
        zIndex: 1
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        background: 'rgba(255,255,255,0.55)',
        borderRadius: '10px',
        border: '1px solid rgba(93,64,55,0.15)',
        position: 'relative',
        zIndex: 1,
        transition: 'transform 0.3s ease',
        transform: pulseMap.ring ? 'scale(1.03)' : 'scale(1)'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#5d4037',
          marginBottom: '6px',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '2px'
        }}>韵脚密度分布</div>
        <canvas ref={ringCanvasRef} style={{ width: '180px', height: '180px' }} />
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '6px'
        }}>
          {analysis.rhymeGroups.map((rg, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '3px 8px',
              background: rg.color + '44',
              borderRadius: '10px',
              color: '#5d4037'
            }}>
              <span style={{
                width: '10px', height: '10px',
                borderRadius: '50%', background: rg.color,
                border: '1px solid #fff',
                boxShadow: '0 0 2px rgba(0,0,0,0.2)'
              }} />
              {rg.chars.join('')} × {rg.count}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        background: 'rgba(255,255,255,0.55)',
        borderRadius: '10px',
        border: '1px solid rgba(93,64,55,0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '14px',
          color: '#5d4037',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '2px'
        }}>各联平仄匹配度</div>
        {analysis.couplets.length > 0 ? analysis.couplets.map(renderProgressBar) : (
          <div style={{ textAlign: 'center', color: '#bdbdbd', padding: '16px', fontSize: '13px' }}>
            暂无足够联句数据
          </div>
        )}
      </div>

      <div style={{
        padding: '14px',
        background: 'rgba(255,255,255,0.55)',
        borderRadius: '10px',
        border: '1px solid rgba(93,64,55,0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '14px',
          color: '#5d4037',
          textAlign: 'center',
          marginBottom: '8px',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '2px'
        }}>整体对仗质量评分</div>
        {renderStars(analysis.overallScore)}
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: '12px',
          color: '#8d6e63'
        }}>
          {analysis.overallScore >= 4.5 ? '格律精工，对仗谨严' :
           analysis.overallScore >= 3.5 ? '韵律和谐，属对工稳' :
           analysis.overallScore >= 2.5 ? '平仄协调，略有参差' :
           analysis.overallScore >= 1.5 ? '基本合规，可作调整' : '格律尚需打磨'}
        </div>
      </div>

      <div style={{
        padding: '10px',
        background: 'rgba(255,255,255,0.55)',
        borderRadius: '10px',
        border: '1px solid rgba(93,64,55,0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '14px',
          color: '#5d4037',
          textAlign: 'center',
          marginBottom: '6px',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '2px'
        }}>韵脚字词云</div>
        <canvas ref={cloudCanvasRef} style={{ width: '100%', height: '140px', display: 'block' }} />
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '10px 14px',
        background: 'rgba(93,64,55,0.06)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6d4c41',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '10px',
        position: 'relative',
        zIndex: 1
      }}>
        <span>平声：<strong style={{ color: '#00838f' }}>{analysis.pingCount}</strong></span>
        <span>仄声：<strong style={{ color: '#d84315' }}>{analysis.zeCount}</strong></span>
        <span>平仄比：<strong>{Math.round(analysis.pingCount / Math.max(1, analysis.zeCount) * 10) / 10} : 1</strong></span>
      </div>

      <style>{`
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

export default MetricsPanel
