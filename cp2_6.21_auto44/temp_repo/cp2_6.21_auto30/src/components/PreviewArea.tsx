import { useEffect, useMemo, useRef, useState } from 'react'
import { useBadgeStore } from '../store'
import { generateSimpleBadgeSVG, ICONS } from '../modules/svgGenerator'

const SHAPE_LABELS: Record<string, string> = {
  circle: '圆形',
  roundedRect: '圆角矩形',
  hexagon: '六边形',
}

export default function PreviewArea() {
  const params = useBadgeStore()
  const svgRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const summary = useMemo(() => {
    const iconDef = ICONS.find((i) => i.id === params.icon)
    return {
      shapeLabel: SHAPE_LABELS[params.shape] || params.shape,
      iconLabel: iconDef?.name || params.icon,
    }
  }, [params.shape, params.icon])

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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: 24,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #fafbff 0%, #f5f7fd 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
            transition: 'box-shadow 0.25s ease',
          }}
          className="badge-stage"
        >
          <div ref={svgRef} />
        </div>
      </div>
      <div
        style={{
          width: '100%',
          marginTop: 8,
          marginBottom: 14,
          padding: '10px 16px',
          background: '#f5f6fa',
          borderRadius: 10,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'center',
          fontSize: 12,
          color: '#555',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#888', fontWeight: 500 }}>形状:</span>
          <span style={{ fontWeight: 600, color: '#333' }}>{summary.shapeLabel}</span>
        </span>
        <span style={{ width: 1, height: 14, background: '#d8dae0', display: 'inline-block' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#888', fontWeight: 500 }}>图标:</span>
          <span style={{ fontWeight: 600, color: '#333' }}>{summary.iconLabel}</span>
        </span>
        <span style={{ width: 1, height: 14, background: '#d8dae0', display: 'inline-block' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#888', fontWeight: 500 }}>配色:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span
              title={`背景色 ${params.backgroundColor}`}
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                background: params.backgroundColor,
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
              }}
            />
            <span
              title={`前景色 ${params.foregroundColor}`}
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                background: params.foregroundColor,
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
              }}
            />
            <span
              title={`边框色 ${params.borderColor}`}
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                background: params.borderColor,
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
              }}
            />
          </span>
        </span>
      </div>
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
          .badge-stage:hover {
            box-shadow: 0 8px 20px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.8);
          }
        }
      `}</style>
    </div>
  )
}
