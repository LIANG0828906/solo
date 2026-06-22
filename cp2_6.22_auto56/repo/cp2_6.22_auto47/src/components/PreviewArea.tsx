import { useState, useRef, useEffect, useCallback } from 'react'
import type { FontData, TypographyParams, CompareState, FontWeight } from '../App'

interface PreviewAreaProps {
  fonts: FontData[]
  params: TypographyParams
  compare: CompareState
  selectedWeightIndex: number
  onWeightSelect: (index: number) => void
  onSplitRatioChange: (ratio: number) => void
}

function FontFaceStyles({ fonts }: { fonts: FontData[] }) {
  return (
    <style>
      {fonts.map(font =>
        font.weights.map((w, i) => `
          @font-face {
            font-family: '${font.name}-${i}';
            src: url('${w.fontUrl}') format('${w.fontUrl.endsWith('.woff2') ? 'woff2' : w.fontUrl.endsWith('.woff') ? 'woff' : 'truetype'}');
            font-weight: ${w.weight};
            font-style: ${w.style};
            font-display: swap;
          }
        `).join('')
      ).join('')}
    </style>
  )
}

interface WeightCardProps {
  font: FontData
  weight: FontWeight
  weightIndex: number
  params: TypographyParams
  selected: boolean
  onClick: () => void
}

function WeightCard({ font, weight, weightIndex, params, selected, onClick }: WeightCardProps) {
  const fontFamily = `${font.name}-${weightIndex}`
  
  return (
    <div
      className={`weight-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="weight-card-header">
        <span className="weight-name">{weight.name}</span>
        <span className="weight-badge">{weight.weight}</span>
      </div>
      <p
        className="preview-text preview-content"
        style={{
          fontFamily,
          fontSize: `${params.fontSize * 0.75}px`,
          lineHeight: params.lineHeight,
          letterSpacing: `${params.letterSpacing}px`,
          fontWeight: weight.weight,
          fontStyle: weight.style
        }}
      >
        {params.sampleText}
      </p>
    </div>
  )
}

interface CompareViewProps {
  fonts: FontData[]
  compare: CompareState
  params: TypographyParams
  onSplitRatioChange: (ratio: number) => void
}

function CompareView({ fonts, compare, params, onSplitRatioChange }: CompareViewProps) {
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isSyncingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastPositionRef = useRef(0)
  const animationRef = useRef<number>()

  const primaryFont = fonts[0]
  const compareFont = fonts.find(f => f.id === compare.compareFontId) || fonts[1] || fonts[0]

  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    
    requestAnimationFrame(() => {
      const sourceEl = source === 'left' ? leftPaneRef.current : rightPaneRef.current
      const targetEl = source === 'left' ? rightPaneRef.current : leftPaneRef.current
      
      if (sourceEl && targetEl) {
        targetEl.scrollTop = sourceEl.scrollTop
        targetEl.scrollLeft = sourceEl.scrollLeft
      }
      
      isSyncingRef.current = false
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    velocityRef.current = 0
    lastTimeRef.current = Date.now()
    lastPositionRef.current = e.clientX
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const now = Date.now()
      const dt = now - lastTimeRef.current
      
      if (dt > 0) {
        velocityRef.current = (e.clientX - lastPositionRef.current) / dt
      }
      
      lastTimeRef.current = now
      lastPositionRef.current = e.clientX
      
      let ratio = (e.clientX - rect.left) / rect.width
      ratio = Math.max(0.1, Math.min(0.9, ratio))
      
      onSplitRatioChange(ratio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      
      if (Math.abs(velocityRef.current) > 0.5) {
        let velocity = velocityRef.current
        const dampen = () => {
          velocity *= 0.92
          
          if (!containerRef.current) return
          
          const rect = containerRef.current.getBoundingClientRect()
          const currentX = rect.left + rect.width * (compare.splitRatio || 0.5)
          const newX = currentX + velocity * 16
          
          let ratio = (newX - rect.left) / rect.width
          ratio = Math.max(0.1, Math.min(0.9, ratio))
          
          onSplitRatioChange(ratio)
          
          if (Math.abs(velocity) > 0.1) {
            animationRef.current = requestAnimationFrame(dampen)
          }
        }
        
        animationRef.current = requestAnimationFrame(dampen)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDragging, onSplitRatioChange, compare.splitRatio])

  const primaryWeight = primaryFont.weights[0]
  const compareWeight = compareFont.weights[0]
  const leftFontFamily = `${primaryFont.name}-0`
  const rightFontFamily = `${compareFont.name}-0`

  return (
    <div
      ref={containerRef}
      className="compare-view"
      style={{ display: 'flex' }}
    >
      <div
        ref={leftPaneRef}
        className="compare-pane left"
        style={{ flex: compare.splitRatio }}
        onScroll={() => handleScroll('left')}
      >
        <div className="compare-pane-header">
          <i className="fas fa-font"></i> {primaryFont.name}
        </div>
        <p
          className="preview-content"
          style={{
            fontFamily: leftFontFamily,
            fontSize: `${params.fontSize}px`,
            lineHeight: params.lineHeight,
            letterSpacing: `${params.letterSpacing}px`,
            width: `${params.paragraphWidth}%`,
            fontWeight: primaryWeight.weight,
            fontStyle: primaryWeight.style,
            color: 'var(--color-text)'
          }}
        >
          {params.sampleText}
        </p>
      </div>

      <div
        ref={dividerRef}
        className={`compare-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />

      <div
        ref={rightPaneRef}
        className="compare-pane right"
        style={{ flex: 1 - compare.splitRatio }}
        onScroll={() => handleScroll('right')}
      >
        <div className="compare-pane-header">
          <i className="fas fa-font"></i> {compareFont.name}
        </div>
        <p
          className="preview-content"
          style={{
            fontFamily: rightFontFamily,
            fontSize: `${params.fontSize}px`,
            lineHeight: params.lineHeight,
            letterSpacing: `${params.letterSpacing}px`,
            width: `${params.paragraphWidth}%`,
            fontWeight: compareWeight.weight,
            fontStyle: compareWeight.style,
            color: 'var(--color-text)'
          }}
        >
          {params.sampleText}
        </p>
      </div>
    </div>
  )
}

export default function PreviewArea({
  fonts,
  params,
  compare,
  selectedWeightIndex,
  onWeightSelect,
  onSplitRatioChange
}: PreviewAreaProps) {
  if (fonts.length === 0) {
    return (
      <div className="preview-area empty-state">
        <i className="fas fa-file-alt"></i>
        <h3>暂无字体</h3>
        <p>上传字体文件后，即可在此预览排版效果</p>
      </div>
    )
  }

  if (compare.enabled && fonts.length > 0) {
    return (
      <>
        <FontFaceStyles fonts={fonts} />
        <CompareView
          fonts={fonts}
          compare={compare}
          params={params}
          onSplitRatioChange={onSplitRatioChange}
        />
      </>
    )
  }

  return (
    <>
      <FontFaceStyles fonts={fonts} />
      <div className="weight-grid animate-stagger">
        {fonts.flatMap(font =>
          font.weights.map((weight, weightIndex) => (
            <WeightCard
              key={`${font.id}-${weightIndex}`}
              font={font}
              weight={weight}
              weightIndex={weightIndex}
              params={params}
              selected={weightIndex === selectedWeightIndex && font === fonts[0]}
              onClick={() => onWeightSelect(weightIndex)}
            />
          ))
        )}
      </div>
    </>
  )
}
