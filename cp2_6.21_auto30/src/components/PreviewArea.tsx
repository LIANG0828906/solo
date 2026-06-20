import { useEffect, useRef, useState } from 'react'
import { useBadgeStore } from '../store'
import { generateSimpleBadgeSVG } from '../modules/svgGenerator'

export default function PreviewArea() {
  const params = useBadgeStore()
  const svgRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.innerHTML = generateSimpleBadgeSVG(params)
      const svgEl = svgRef.current.querySelector('svg')
      if (svgEl) {
        svgEl.setAttribute('width', String(200 * (params.scale / 100)))
        svgEl.setAttribute('height', String(200 * (params.scale / 100)))
        const allShapes = svgEl.querySelectorAll('circle, rect, polygon, path, g')
        allShapes.forEach((el) => {
          ;(el as SVGElement).style.transition = 'all 0.2s ease'
        })
      }
    }
  }, [params.shape, params.icon, params.backgroundColor, params.foregroundColor, params.borderColor, params.borderWidth, params.borderRadius, params.scale])

  async function handleDownload() {
    const svgStr = generateSimpleBadgeSVG(params)
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'badge.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleCopy() {
    const svgStr = generateSimpleBadgeSVG(params)
    try {
      await navigator.clipboard.writeText(svgStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = svgStr
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 800,
        height: 600,
        background: '#ffffff',
        borderRadius: 16,
        border: '2px solid #e0e0e0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        ref={svgRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
        }}
      />
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleDownload}
          className="download-btn"
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.2s ease',
            minWidth: 44,
            minHeight: 44,
            letterSpacing: 0.3,
          }}
        >
          <span
            className="shimmer"
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
              transform: 'skewX(-20deg)',
              animation: 'shimmer 2.8s infinite',
              pointerEvents: 'none',
            }}
          />
          <i className="fa-solid fa-download" style={{ marginRight: 8 }} />
          下载 SVG
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="copy-btn"
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            border: '1.5px solid #e0e0e0',
            background: '#ffffff',
            color: copied ? '#10b981' : '#333',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: 44,
            minHeight: 44,
            letterSpacing: 0.3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {copied ? (
            <>
              <svg
                width={16}
                height={16}
                viewBox="0 0 512 512"
                fill="#10b981"
                style={{ display: 'inline-block', animation: 'tick 0.4s ease' }}
              >
                <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <i className="fa-regular fa-copy" />
              复制代码
            </>
          )}
        </button>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          60% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes tick {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (hover: hover) {
          .download-btn:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          }
          .copy-btn:hover {
            border-color: #6366f1;
            color: #6366f1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  )
}
