import { useRef, useEffect, useState } from 'react'
import { ArrowLeft, Copy, Share2, Check } from 'lucide-react'
import type { ReportData } from '../utils/helpers'
import { generateReportSummary, generateShortCode, formatDate } from '../utils/helpers'

interface ReportViewProps {
  reportData: ReportData
  onBack: () => void
  onShare: (shortCode: string, reportData: ReportData) => void
}

export default function ReportView({ reportData, onBack, onShare }: ReportViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 50, right: 30, bottom: 60, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const barGap = 30
    const barCount = reportData.projects.length
    const barWidth = barCount > 0 ? (chartWidth - barGap * (barCount - 1)) / barCount : 0

    let progress = 0
    const duration = 500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = '#DEE2E6'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()

        ctx.fillStyle = '#6C757D'
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${100 - i * 25}%`, padding.left - 10, y)
      }

      reportData.projects.forEach((project, index) => {
        const comp = reportData.completions.find((c) => c.projectId === project.id)
        const completionPercent = comp ? comp.completion : 0
        const x = padding.left + index * (barWidth + barGap)
        const barHeight = chartHeight * (completionPercent / 100) * easeProgress
        const y = padding.top + chartHeight - barHeight

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
        gradient.addColorStop(0, project.color)
        gradient.addColorStop(1, adjustColor(project.color, -20))

        ctx.fillStyle = gradient
        roundRect(ctx, x, y, barWidth, barHeight, 6)
        ctx.fill()

        ctx.fillStyle = '#333333'
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`${completionPercent}%`, x + barWidth / 2, y - 8)

        ctx.fillStyle = '#6C757D'
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        ctx.textBaseline = 'top'
        const maxLabelWidth = barWidth
        let label = project.name
        if (ctx.measureText(label).width > maxLabelWidth) {
          while (ctx.measureText(label + '...').width > maxLabelWidth && label.length > 0) {
            label = label.slice(0, -1)
          }
          label += '...'
        }
        ctx.fillText(label, x + barWidth / 2, padding.top + chartHeight + 10)
      })

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reportData])

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height)
    ctx.lineTo(x, y + height)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const handleCopyMarkdown = async () => {
    const markdown = generateReportSummary(reportData)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const shortCode = generateShortCode()
    onShare(shortCode, reportData)
  }

  const summary = generateReportSummary(reportData)

  return (
    <div className="report-view-page">
      <div className="report-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="report-header-info">
          <h1 className="report-title">项目进度报告</h1>
          <p className="report-period">
            报告周期: {formatDate(reportData.startDate)} ~ {formatDate(reportData.endDate)}
          </p>
        </div>
        <div className="report-header-actions">
          <button className="btn-secondary" onClick={handleCopyMarkdown}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制 Markdown'}
          </button>
          <button className="btn-primary" onClick={handleShare}>
            <Share2 size={16} />
            生成共享链接
          </button>
        </div>
      </div>

      <div className="report-chart-card">
        <h2 className="chart-title">完成度概览</h2>
        <div className="chart-container">
          <canvas ref={canvasRef} className="report-canvas" />
        </div>
      </div>

      <div className="report-summary-card">
        <h2 className="summary-title">文本摘要</h2>
        <div className="summary-content">
          {reportData.projects.map((project) => {
            const comp = reportData.completions.find((c) => c.projectId === project.id)
            const percent = comp ? comp.completion : 0
            return (
              <div key={project.id} className="summary-project-item">
                <div className="summary-project-header">
                  <span
                    className="project-color-dot"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="summary-project-name">{project.name}</h3>
                  <span
                    className="summary-completion-badge"
                    style={{ backgroundColor: project.color }}
                  >
                    {percent}%
                  </span>
                </div>
                <p className="summary-project-desc">
                  周期: {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
                </p>
                {project.milestones.length > 0 && (
                  <div className="summary-milestones">
                    {project.milestones.slice(0, 5).map((m) => (
                      <div key={m.id} className="summary-milestone-item">
                        <span
                          className={`milestone-status-dot ${
                            m.completion >= 100
                              ? 'status-done'
                              : m.completion > 0
                              ? 'status-progress'
                              : 'status-todo'
                          }`}
                        />
                        <span className="milestone-name">{m.title}</span>
                        <span className="milestone-percent">{m.completion}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="report-markdown-card">
        <h2 className="markdown-title">Markdown 格式</h2>
        <pre className="markdown-preview">{summary}</pre>
      </div>
    </div>
  )
}
