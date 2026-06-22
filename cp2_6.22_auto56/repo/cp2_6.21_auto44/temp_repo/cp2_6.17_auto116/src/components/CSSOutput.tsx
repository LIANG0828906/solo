import { useState, useEffect, useRef } from 'react'
import { useGradientStore, generateGradientCSS } from '../stores/gradientStore'

function CSSOutput() {
  const [copied, setCopied] = useState(false)
  const [displayedCSS, setDisplayedCSS] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const colorStops = useGradientStore((s) => s.colorStops)
  const gradientType = useGradientStore((s) => s.gradientType)
  const angle = useGradientStore((s) => s.angle)
  const radialShape = useGradientStore((s) => s.radialShape)
  const ellipseScaleX = useGradientStore((s) => s.ellipseScaleX)
  const ellipseScaleY = useGradientStore((s) => s.ellipseScaleY)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      const css = generateGradientCSS(
        colorStops,
        gradientType,
        angle,
        radialShape,
        ellipseScaleX,
        ellipseScaleY
      )
      setDisplayedCSS(css)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [colorStops, gradientType, angle, radialShape, ellipseScaleX, ellipseScaleY])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedCSS)
      setCopied(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        width: '320px',
        background: '#2D2D3D',
        padding: '20px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#E0E0E0',
        }}
      >
        CSS 代码
      </div>
      <pre
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
          color: '#F8F8F2',
          background: '#1E1E2E',
          padding: '16px',
          borderRadius: '8px',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          flex: 1,
          minHeight: '80px',
        }}
      >
        {displayedCSS}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          height: '40px',
          background: copied ? '#3A7BC8' : '#4A90D9',
          borderRadius: '8px',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          marginTop: '16px',
          transition: 'background 0.2s ease',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.background = '#3A7BC8'
        }}
        onMouseUp={(e) => {
          if (!copied) {
            e.currentTarget.style.background = '#4A90D9'
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.background = '#4A90D9'
          }
        }}
      >
        {copied ? '已复制' : '复制代码'}
      </button>
    </div>
  )
}

export default CSSOutput
