import { useEffect, useRef, useState } from 'react'
import { useAnalysisStore } from '../stores/analysisStore'
import type { SentenceSentiment } from '../types'

export const SentimentChart = () => {
  const { result, status } = useAnalysisStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: '',
    x: 0,
    y: 0,
    visible: false
  })
  const [canvasTooltip, setCanvasTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: '',
    x: 0,
    y: 0,
    visible: false
  })
  const dataPointsRef = useRef<{ x: number; y: number; sentence: SentenceSentiment }[]>([])

  const sentences = result?.sentiment.sentences || []

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || sentences.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = 200

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#1E1E2E'
    ctx.fillRect(0, 0, width, height)

    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.strokeStyle = '#2D2D44'
    ctx.lineWidth = 1

    const yTicks = [-10, -5, 0, 5, 10]
    yTicks.forEach(tick => {
      const y = padding.top + ((10 - tick) / 20) * chartHeight
      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#606080'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${tick}`, padding.left - 6, y)
    })

    ctx.strokeStyle = '#3D3D5C'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    const dataPoints: { x: number; y: number; sentence: SentenceSentiment }[] = []
    
    if (sentences.length === 1) {
      const x = padding.left + chartWidth / 2
      const score = sentences[0].sentimentScore
      const clampedScore = Math.max(-10, Math.min(10, score))
      const y = padding.top + ((10 - clampedScore) / 20) * chartHeight
      dataPoints.push({ x, y, sentence: sentences[0] })
    } else {
      sentences.forEach((sentence, i) => {
        const x = padding.left + (i / (sentences.length - 1)) * chartWidth
        const score = sentence.sentimentScore
        const clampedScore = Math.max(-10, Math.min(10, score))
        const y = padding.top + ((10 - clampedScore) / 20) * chartHeight
        dataPoints.push({ x, y, sentence })
      })
    }

    dataPointsRef.current = dataPoints

    if (dataPoints.length >= 2) {
      const gradient = ctx.createLinearGradient(
        padding.left, 0,
        width - padding.right, 0
      )
      gradient.addColorStop(0, '#6C5CE7')
      gradient.addColorStop(1, '#E17055')

      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(dataPoints[0].x, dataPoints[0].y)
      for (let i = 1; i < dataPoints.length; i++) {
        ctx.lineTo(dataPoints[i].x, dataPoints[i].y)
      }
      ctx.stroke()
    }

    dataPoints.forEach(point => {
      const t = (point.x - padding.left) / Math.max(1, chartWidth)
      const r = Math.floor(108 + (225 - 108) * t)
      const g = Math.floor(92 + (112 - 92) * t)
      const b = Math.floor(231 + (85 - 231) * t)

      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fill()
    })

    if (sentences.length > 0) {
      ctx.fillStyle = '#606080'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const labelStep = Math.max(1, Math.ceil(sentences.length / 6))
      dataPoints.forEach((point, i) => {
        if (i % labelStep === 0 || i === dataPoints.length - 1) {
          ctx.fillText(`S${i + 1}`, point.x, height - padding.bottom + 8)
        }
      })
    }
  }, [sentences])

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let found = false
    for (const point of dataPointsRef.current) {
      const dist = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2)
      if (dist <= 12) {
        setCanvasTooltip({
          text: point.sentence.text,
          x: e.clientX,
          y: e.clientY,
          visible: true
        })
        found = true
        break
      }
    }
    if (!found && canvasTooltip.visible) {
      setCanvasTooltip(prev => ({ ...prev, visible: false }))
    }
  }

  const handleCanvasMouseLeave = () => {
    setCanvasTooltip(prev => ({ ...prev, visible: false }))
  }

  const handleBarHover = (e: React.MouseEvent<HTMLDivElement>, text: string) => {
    const x = e.clientX
    const y = e.clientY
    setTooltip({ text, x, y, visible: true })
  }

  const handleBarLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  if (status === 'idle') {
    return (
      <div className="card">
        <h3 className="section-title">情感与语气分析</h3>
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="empty-text">输入文本并点击"开始分析"查看结果</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <h3 className="section-title">句子情感得分 & 语气标签</h3>
        
        {sentences.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">未识别到句子</p>
          </div>
        ) : (
          <div className="sentiment-list">
            {sentences.map((sentence, index) => {
              const absScore = Math.abs(sentence.sentimentScore)
              const barWidth = Math.max(2, (absScore / 10) * 100)
              const barClass = sentence.sentimentLabel

              return (
                <div key={sentence.id} className="sentiment-row">
                  <span className="sentence-index">{index + 1}</span>
                  
                  <div
                    className="bar-container"
                    onMouseEnter={(e) => handleBarHover(e, sentence.text)}
                    onMouseLeave={handleBarLeave}
                  >
                    <div className="bar-wrapper">
                      <div
                        className={`bar-fill ${barClass}`}
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="bar-score">
                          {sentence.sentimentScore > 0 ? '+' : ''}{sentence.sentimentScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tone-tags">
                    {sentence.toneTags.length > 0 ? (
                      sentence.toneTags.map((tag, i) => (
                        <span key={i} className="tone-tag">{tag}</span>
                      ))
                    ) : (
                      <span className="tone-tag">中性</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">情感趋势折线图</h3>
        <div
          ref={containerRef}
          className="linechart-container"
          style={{ background: '#1E1E2E' }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '200px', display: 'block' }}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>
      </div>

      {tooltip.visible && (
        <div
          className="tooltip"
          style={{
            left: `${tooltip.x + 12}px`,
            top: `${tooltip.y + 12}px`,
            opacity: 1
          }}
        >
          {tooltip.text}
        </div>
      )}

      {canvasTooltip.visible && (
        <div
          className="tooltip"
          style={{
            left: `${canvasTooltip.x + 12}px`,
            top: `${canvasTooltip.y + 12}px`,
            opacity: 1
          }}
        >
          {canvasTooltip.text}
        </div>
      )}
    </>
  )
}
