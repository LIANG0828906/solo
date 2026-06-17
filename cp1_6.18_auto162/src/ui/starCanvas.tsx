import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useUserStore } from '../stores/userStore'
import { generateStars, findNearestStar, getSeasonName, type Season, type StarPoint } from '../engine/starMapEngine'
import { getTrailPoints, type Constellation, type Node } from '../engine/constellationEngine'

const SEASONS: { season: Season; label: string; symbol: string }[] = [
  { season: 'spring', label: '春季', symbol: '🌸' },
  { season: 'summer', label: '夏季', symbol: '☀️' },
  { season: 'autumn', label: '秋季', symbol: '🍂' },
  { season: 'winter', label: '冬季', symbol: '❄️' },
]

function ConstellationThumbnail({ constellation }: { constellation: Constellation }) {
  const nodes = constellation.nodes
  if (nodes.length === 0) return null
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = Math.max(maxX - minX, 1)
  const h = Math.max(maxY - minY, 1)
  const scale = Math.min(56 / w, 40 / h)
  const offsetX = (60 - w * scale) / 2 - minX * scale
  const offsetY = (44 - h * scale) / 2 - minY * scale
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg width="60" height="44" style={{ flexShrink: 0 }}>
      {constellation.edges.map((e) => {
        const from = nodeMap.get(e.fromNodeId)
        const to = nodeMap.get(e.toNodeId)
        if (!from || !to) return null
        return (
          <line
            key={e.id}
            x1={from.x * scale + offsetX}
            y1={from.y * scale + offsetY}
            x2={to.x * scale + offsetX}
            y2={to.y * scale + offsetY}
            stroke={constellation.themeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      {nodes.map((n) => (
        <circle
          key={n.id}
          cx={n.x * scale + offsetX}
          cy={n.y * scale + offsetY}
          r="2.5"
          fill={n.isManual ? '#ffffff' : constellation.themeColor}
        />
      ))}
    </svg>
  )
}

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(performance.now())
  const lastClickRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const panelDragRef = useRef<{ startY: number; startOffset: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [, forceUpdate] = useState(0)

  const {
    viewport,
    season,
    constellations,
    drawingState,
    transitionOpacity,
    shareLink,
    shareCopied,
    showMobilePanel,
    panelDragOffset,
    setViewport,
    setSeason,
    startDrawing,
    updateDrawing,
    endDrawing,
    addManualNode,
    deleteConstellation,
    generateShareLink,
    setShowMobilePanel,
    setPanelDragOffset,
  } = useUserStore()

  const stars = useMemo(
    () =>
      generateStars({
        width: viewport.width,
        height: viewport.height,
        season,
        centerX: viewport.centerX,
        centerY: viewport.centerY,
        zoom: viewport.zoom,
      }),
    [viewport.width, viewport.height, season, viewport.centerX, viewport.centerY, viewport.zoom]
  )

  useEffect(() => {
    const onResize = () => {
      setViewport(window.innerWidth, window.innerHeight)
      setIsMobile(window.innerWidth < 768)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setViewport])

  const trailPoints = useMemo(
    () => (drawingState.isDragging ? getTrailPoints(drawingState.currentPath, 30) : []),
    [drawingState.isDragging, drawingState.currentPath]
  )

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const { width, height } = viewport
      const elapsed = (time - startTimeRef.current) / 1000

      ctx.clearRect(0, 0, width, height)

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#0A0E2A')
      bgGrad.addColorStop(1, '#1A2A4A')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      ctx.globalAlpha = transitionOpacity

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        const appearT = Math.min(1, Math.max(0, (elapsed * 1000 - star.appearDelay) / 400))
        if (appearT <= 0) continue

        const twinkle =
          0.75 + 0.25 * Math.sin((elapsed / star.twinklePeriod) * Math.PI * 2 + star.twinkleOffset)
        const alpha = star.brightness * twinkle * appearT

        if (star.brightness >= 0.3) {
          const glowR = star.size * 4
          const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR)
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`)
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * appearT, 0, Math.PI * 2)
        ctx.fill()
      }

      const drawLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number = 2
      ) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      for (const c of constellations) {
        const nodeMap = new Map(c.nodes.map((n) => [n.id, n]))
        for (const edge of c.edges) {
          const from = nodeMap.get(edge.fromNodeId)
          const to = nodeMap.get(edge.toNodeId)
          if (!from || !to) continue
          ctx.strokeStyle = c.themeColor
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.shadowColor = c.themeColor
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
        for (const node of c.nodes) {
          const r = node.isManual ? 6 : 4
          if (node.isManual) {
            const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3)
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.fillStyle = node.isManual ? '#ffffff' : c.themeColor
          ctx.beginPath()
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (drawingState.tempNodes.length > 1) {
        const tempColor = '#ffffff'
        for (let i = 0; i < drawingState.tempNodes.length - 1; i++) {
          const a = drawingState.tempNodes[i]
          const b = drawingState.tempNodes[i + 1]
          drawLine(a.x, a.y, b.x, b.y, 'rgba(255,255,255,0.5)', 2)
        }
      }

      for (const node of drawingState.tempNodes) {
        const r = node.isManual ? 6 : 4
        if (node.isManual) {
          const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3)
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (trailPoints.length > 1) {
        for (let i = 0; i < trailPoints.length - 1; i++) {
          const a = trailPoints[i]
          const b = trailPoints[i + 1]
          const avgAlpha = (a.alpha + b.alpha) / 2
          ctx.strokeStyle = `rgba(255, 255, 255, ${avgAlpha})`
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      if (drawingState.isDragging && drawingState.tempNodes.length > 0 && trailPoints.length > 0) {
        const last = trailPoints[trailPoints.length - 1]
        const firstNode = drawingState.tempNodes[drawingState.tempNodes.length - 1]
        drawLine(firstNode.x, firstNode.y, last.x, last.y, 'rgba(255, 215, 0, 0.7)', 2)
      }

      ctx.globalAlpha = 1
    },
    [viewport, stars, constellations, drawingState, trailPoints, transitionOpacity]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (t: number) => {
      render(ctx, t)
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationRef.current)
  }, [render])

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
      }
    }
    const me = e as React.MouseEvent
    return { x: me.clientX - rect.left, y: me.clientY - rect.top }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const { x, y } = getCanvasPos(e)
    dragStartRef.current = { x, y, moved: false }
    startDrawing(x, y, stars)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e)
    if (dragStartRef.current) {
      const dx = x - dragStartRef.current.x
      const dy = y - dragStartRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 3) {
        dragStartRef.current.moved = true
      }
    }
    updateDrawing(x, y)
  }

  const onMouseUp = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e)
    const now = Date.now()
    const last = lastClickRef.current
    const moved = dragStartRef.current?.moved ?? false

    if (!moved && last && now - last.time < 300 && Math.abs(x - last.x) < 10 && Math.abs(y - last.y) < 10) {
      addManualNode(x, y, stars)
      lastClickRef.current = null
    } else if (!moved) {
      lastClickRef.current = { time: now, x, y }
    }

    endDrawing(stars)
    dragStartRef.current = null
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const { x, y } = getCanvasPos(e)
    dragStartRef.current = { x, y, moved: false }
    startDrawing(x, y, stars)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const { x, y } = getCanvasPos(e)
    if (dragStartRef.current) {
      const dx = x - dragStartRef.current.x
      const dy = y - dragStartRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 3) {
        dragStartRef.current.moved = true
      }
    }
    updateDrawing(x, y)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const { x, y } = getCanvasPos(e)
    const now = Date.now()
    const last = lastClickRef.current
    const moved = dragStartRef.current?.moved ?? false

    if (!moved && last && now - last.time < 300 && Math.abs(x - last.x) < 12 && Math.abs(y - last.y) < 12) {
      addManualNode(x, y, stars)
      lastClickRef.current = null
    } else if (!moved) {
      lastClickRef.current = { time: now, x, y }
    }

    endDrawing(stars)
    dragStartRef.current = null
  }

  const onPanelTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    panelDragRef.current = { startY: e.touches[0].clientY, startOffset: panelDragOffset }
  }

  const onPanelTouchMove = (e: React.TouchEvent) => {
    if (!panelDragRef.current || e.touches.length !== 1) return
    const delta = e.touches[0].clientY - panelDragRef.current.startY
    const newOffset = Math.max(0, panelDragRef.current.startOffset + delta)
    setPanelDragOffset(newOffset)
  }

  const onPanelTouchEnd = () => {
    if (panelDragOffset > 100) {
      setShowMobilePanel(false)
    } else {
      setPanelDragOffset(0)
    }
    panelDragRef.current = null
  }

  const toolbarStyles = isMobile
    ? ({
        position: 'fixed',
        bottom: showMobilePanel ? `${-panelDragOffset}px` : '-280px',
        left: 0,
        right: 0,
        width: '100%',
        height: '280px',
        borderRadius: '20px 20px 0 0',
        transition: panelDragRef.current ? 'none' : 'bottom 300ms ease-in-out',
        zIndex: 50,
      } as React.CSSProperties)
    : ({
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        width: '240px',
        maxHeight: 'calc(100vh - 40px)',
        borderRadius: '12px',
        transition: 'all 200ms ease-in-out',
        zIndex: 50,
      } as React.CSSProperties)

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        cursor: drawingState.isDragging ? 'crosshair' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        width={viewport.width}
        height={viewport.height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          gap: '10px',
          zIndex: 40,
        }}
      >
        {SEASONS.map(({ season: s, label, symbol }) => {
          const active = season === s
          return (
            <button
              key={s}
              onClick={() => setSeason(s)}
              title={label}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: active ? '#3A4A6C' : '#2A3A5A',
                color: '#E0E8F0',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 200ms ease-in-out',
                boxShadow: active
                  ? '0 0 18px rgba(168, 230, 207, 0.7), inset 0 0 8px rgba(168, 230, 207, 0.2)'
                  : 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#3A4A6C'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = '#2A3A5A'
              }}
            >
              {symbol}
            </button>
          )
        })}
      </div>

      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '18px',
          fontWeight: 500,
          color: '#E0E8F0',
          letterSpacing: '4px',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          opacity: 0.85,
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        ✦ 宇宙速写本 · {getSeasonName(season)}季星空 ✦
      </div>

      <div
        style={{
          ...toolbarStyles,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {isMobile && (
          <div
            style={{
              padding: '10px 0 6px',
              display: 'flex',
              justifyContent: 'center',
              cursor: 'grab',
              touchAction: 'none',
            }}
            onTouchStart={onPanelTouchStart}
            onTouchMove={onPanelTouchMove}
            onTouchEnd={onPanelTouchEnd}
          >
            <div
              style={{
                width: '44px',
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.3)',
              }}
            />
          </div>
        )}

        <div
          style={{
            padding: isMobile ? '6px 16px 12px' : '18px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#E0E8F0' }}>
            我的星座 <span style={{ opacity: 0.6, fontSize: '13px' }}>({constellations.length})</span>
          </div>
          {constellations.length > 0 && (
            <button
              onClick={generateShareLink}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                background: shareCopied ? '#A8E6CF' : '#1A2A3A',
                color: shareCopied ? '#0A1A1A' : '#E0E8F0',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 200ms ease-in-out',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {shareCopied ? '✓ 已复制' : '🔗 分享'}
            </button>
          )}
        </div>

        {shareLink && (
          <div
            style={{
              padding: '8px 12px',
              margin: '8px',
              fontSize: '11px',
              color: '#A8E6CF',
              background: 'rgba(168, 230, 207, 0.1)',
              borderRadius: '6px',
              wordBreak: 'break-all',
              border: '1px solid rgba(168, 230, 207, 0.2)',
              flexShrink: 0,
            }}
          >
            {shareCopied ? '链接已复制到剪贴板！' : '点击右上角复制链接'}
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          }}
        >
          {constellations.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'rgba(224, 232, 240, 0.45)',
                fontSize: '12.5px',
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌌</div>
              <div>按住鼠标拖拽连线</div>
              <div>双击空白添加节点</div>
              <div style={{ marginTop: '6px', opacity: 0.7 }}>开始绘制你的第一个星座吧</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {constellations.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 200ms ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  <ConstellationThumbnail constellation={c} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#E0E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: c.themeColor,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${c.themeColor}`,
                        }}
                      />
                      {c.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(224,232,240,0.5)', marginTop: '2px' }}>
                      {c.nodes.length} 颗星
                    </div>
                  </div>
                  <button
                    onClick={() => deleteConstellation(c.id)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(255, 107, 107, 0.12)',
                      color: '#FF6B6B',
                      cursor: 'pointer',
                      fontSize: '13px',
                      flexShrink: 0,
                      transition: 'all 200ms ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.12)'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '10px 12px',
            fontSize: '11px',
            color: 'rgba(224, 232, 240, 0.4)',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            lineHeight: 1.6,
            flexShrink: 0,
          }}
        >
          {isMobile ? '滑动面板顶部条向下可关闭' : '拖拽连线 · 双击添加节点'}
        </div>
      </div>

      {isMobile && (
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            color: '#E0E8F0',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: 45,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'all 200ms ease-in-out',
          }}
        >
          {showMobilePanel ? '✕' : '✨'}
        </button>
      )}
    </div>
  )
}
