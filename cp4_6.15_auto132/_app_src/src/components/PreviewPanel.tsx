import React, { useState, useMemo, useRef, useEffect } from 'react'
import type { GradientStop, GradientType } from '../types'
import { getContrastColor } from '../utils/colorUtils'

interface PreviewPanelProps {
  type: GradientType
  angle: number
  stops: GradientStop[]
  onCssChange: (css: string) => void
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ type, angle, stops, onCssChange }) => {
  const [copied, setCopied] = useState(false)
  const [textAreaValue, setTextAreaValue] = useState('')
  const copyTimerRef = useRef<number | null>(null)

  const cssCode = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    if (sorted.length === 0) return 'background: #1a1a2e;'
    const parts = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
    const grad = type === 'linear'
      ? `linear-gradient(${angle}deg, ${parts})`
      : `radial-gradient(circle, ${parts})`
    return `background: ${grad};`
  }, [stops, type, angle])

  const gradientStyle = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    if (sorted.length === 0) return { background: '#1a1a2e' }
    const parts = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
    if (type === 'linear') {
      return { background: `linear-gradient(${angle}deg, ${parts})` }
    }
    return { background: `radial-gradient(circle, ${parts})` }
  }, [stops, type, angle])

  useEffect(() => {
    setTextAreaValue(cssCode)
  }, [cssCode])

  const primaryColor = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    return sorted[Math.floor(sorted.length / 2)]?.color ?? '#6366f1'
  }, [stops])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = cssCode
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 1500)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setTextAreaValue(val)
    onCssChange(val)
  }

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
        copyTimerRef.current = null
      }
    }
  }, [])

  const titleColor = getContrastColor(primaryColor)

  return (
    <>
      <div className="preview-canvas" style={gradientStyle}>
        <div className="preview-overlay">
          <h1 className="preview-title" style={{ color: titleColor }}>Gradient Palette</h1>
          <p className="preview-subtitle" style={{ color: titleColor, opacity: 0.85 }}>
            探索与创造你的专属渐变色彩
          </p>
        </div>
      </div>

      <div className="code-section">
        <div className="code-label">CSS 代码</div>
        <div className="code-container">
          <textarea
            className="code-textarea"
            value={textAreaValue}
            onChange={handleTextChange}
            spellCheck={false}
          />
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={copied ? '已复制' : '复制CSS代码'}
          >
            {copied ? (
              <svg className="check-icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="copy-icon" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default PreviewPanel
