import React, { useEffect, useRef } from 'react'
import { Card } from '../types'
import { computeShadows } from '../utils/shadowSimulator'

interface Props {
  cards: Card[]
  canvasBounds: { width: number; height: number }
}

const PreviewPanel: React.FC<Props> = ({ cards, canvasBounds }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const lastRenderRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const canvasSizeRef = useRef({ w: 0, h: 0 })

  const scheduleRender = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      render()
      lastRenderRef.current = performance.now()
    })
  }

  const render = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const cssW = wrap.clientWidth
    const cssH = wrap.clientHeight
    if (cssW <= 0 || cssH <= 0) return

    const pw = Math.floor(cssW * dpr)
    const ph = Math.floor(cssH * dpr)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
    }
    canvasSizeRef.current = { w: pw, h: ph }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, pw, ph)

    if (cards.length === 0) return
    const srcW = canvasBounds.width
    const srcH = canvasBounds.height
    if (srcW <= 0 || srcH <= 0) return

    const scaleX = pw / srcW
    const scaleY = ph / srcH
    const scale = Math.min(scaleX, scaleY) * 0.92

    const img = computeShadows(cards, {
      canvasWidth: pw,
      canvasHeight: ph,
      lightAngleDeg: 135,
      shadowOffset: 28,
      scale,
    })
    if (!img) return
    ctx.putImageData(img, 0, 0)
  }

  useEffect(() => {
    scheduleRender()
    const id = window.setInterval(() => {
      const now = performance.now()
      if (now - lastRenderRef.current >= 500) {
        scheduleRender()
      }
    }, 500)
    const wrap = wrapRef.current
    let ro: ResizeObserver | null = null
    if (wrap && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => scheduleRender())
      ro.observe(wrap)
    }
    return () => {
      window.clearInterval(id)
      if (ro) ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, canvasBounds.width, canvasBounds.height])

  return (
    <aside className="preview-panel">
      <div className="preview-header">
        <i className="fa fa-sun-o" style={{ color: '#fbbf24' }} />
        <div className="preview-title">光影预览</div>
        <div className="preview-sub">每 0.5s 刷新</div>
      </div>
      <div className="preview-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>
    </aside>
  )
}

export default PreviewPanel
