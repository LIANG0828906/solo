import React, { useRef, useEffect, useCallback } from 'react'
import { useLetterStore, FONT_COLORS, PAPER_STYLES } from '@/store/useLetterStore'

const LetterEditor: React.FC = () => {
  const text = useLetterStore((s) => s.text)
  const fontFamily = useLetterStore((s) => s.fontFamily)
  const fontSize = useLetterStore((s) => s.fontSize)
  const fontColor = useLetterStore((s) => s.fontColor)
  const lineSpacing = useLetterStore((s) => s.lineSpacing)
  const paperStyle = useLetterStore((s) => s.paperStyle)
  const showDateStamp = useLetterStore((s) => s.showDateStamp)
  const dateStamp = useLetterStore((s) => s.dateStamp)
  const signature = useLetterStore((s) => s.signature)
  const signaturePreset = useLetterStore((s) => s.signaturePreset)
  const isPlaying = useLetterStore((s) => s.isPlaying)
  const currentCharIndex = useLetterStore((s) => s.currentCharIndex)
  const setText = useLetterStore((s) => s.setText)
  const setFontFamily = useLetterStore((s) => s.setFontFamily)
  const setFontSize = useLetterStore((s) => s.setFontSize)
  const setFontColor = useLetterStore((s) => s.setFontColor)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)

  const paper = PAPER_STYLES[paperStyle]

  const getFontStack = useCallback((font: string) => {
    if (font === 'xingshu') return "'LXGW WenKai TC', '楷体', 'KaiTi', cursive"
    return "'Dancing Script', 'Georgia', 'Times New Roman', cursive"
  }, [])

  const displayText = isPlaying ? text.slice(0, currentCharIndex) : text

  const renderLines = () => {
    const lines = displayText.split('\n')
    return lines.map((line, lineIdx) => (
      <div
        key={lineIdx}
        style={{
          minHeight: fontSize * 1.5,
          lineHeight: `${lineSpacing}px`,
          position: 'relative',
        }}
      >
        {Array.from(line).map((char, charIdx) => {
          const globalIdx = lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0) + charIdx
          const isCurrentChar = isPlaying && globalIdx === currentCharIndex - 1
          return (
            <span
              key={charIdx}
              style={{
                fontFamily: getFontStack(fontFamily),
                fontSize: `${fontSize}px`,
                color: fontColor,
                position: 'relative',
                display: 'inline-block',
                animation: isCurrentChar ? 'inkBleed 0.3s ease-out' : undefined,
              }}
            >
              {char}
              {isCurrentChar && (
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${fontColor}66 0%, transparent 70%)`,
                    animation: 'inkSpread 0.3s ease-out',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </span>
          )
        })}
      </div>
    ))
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes inkBleed {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 0.9; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes inkSpread {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0.3; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const tornEdgeClipPath = `polygon(
    0% 2%, 3% 0%, 7% 1.5%, 12% 0.5%, 18% 1%, 25% 0%, 32% 1.2%, 40% 0.3%, 48% 0.8%, 55% 0%, 62% 1%, 70% 0.5%, 78% 1.3%, 85% 0%, 92% 0.8%, 97% 0.2%, 100% 1%,
    100% 3%, 99.5% 7%, 100% 12%, 99% 18%, 100% 25%, 99.2% 32%, 100% 40%, 99.5% 48%, 100% 55%, 99% 62%, 100% 70%, 99.3% 78%, 100% 85%, 99.5% 92%, 100% 97%,
    97% 100%, 92% 99%, 85% 99.5%, 78% 100%, 70% 99.2%, 62% 100%, 55% 99%, 48% 99.8%, 40% 99.5%, 32% 100%, 25% 99%, 18% 99.7%, 12% 100%, 7% 99.5%, 3% 99.8%, 0% 99%,
    0.5% 92%, 0% 85%, 0.8% 78%, 0% 70%, 0.3% 62%, 0% 55%, 0.5% 48%, 0% 40%, 0.8% 32%, 0% 25%, 0.3% 18%, 0% 12%, 0.5% 7%
  )`

  const renderPaperTexture = () => {
    if (paperStyle === 'watermark') {
      return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }}>
          <defs>
            <pattern id="watermarkPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 30 Q15 20 30 30 Q45 40 60 30" fill="none" stroke="#8B7355" strokeWidth="1" />
              <path d="M0 15 Q15 5 30 15 Q45 25 60 15" fill="none" stroke="#8B7355" strokeWidth="0.5" />
              <path d="M0 45 Q15 35 30 45 Q45 55 60 45" fill="none" stroke="#8B7355" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#watermarkPattern)" />
        </svg>
      )
    }
    if (paperStyle === 'floral') {
      return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}>
          <defs>
            <pattern id="floralPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 10 Q45 20 40 30 Q35 20 40 10" fill="none" stroke="#6B5B3A" strokeWidth="0.8" />
              <path d="M20 50 Q25 60 20 70 Q15 60 20 50" fill="none" stroke="#6B5B3A" strokeWidth="0.6" />
              <path d="M60 50 Q65 60 60 70 Q55 60 60 50" fill="none" stroke="#6B5B3A" strokeWidth="0.6" />
              <line x1="40" y1="30" x2="40" y2="80" stroke="#6B5B3A" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#floralPattern)" />
        </svg>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div
        ref={letterRef}
        style={{
          width: 600,
          height: 800,
          background: paper.bg,
          clipPath: tornEdgeClipPath,
          position: 'relative',
          padding: '40px 48px',
          transition: 'background 1s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 4px 20px rgba(0,0,0,0.15), inset 0 0 30px rgba(211,184,140,0.1)',
          overflow: 'hidden',
        }}
      >
        {renderPaperTexture()}

        {showDateStamp && (
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 36,
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              color: '#8C7B6E',
              letterSpacing: 1,
            }}
          >
            {dateStamp}
          </div>
        )}

        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {Array.from({ length: Math.floor(720 / lineSpacing) }, (_, i) => (
            <line
              key={i}
              x1="48"
              y1={60 + i * lineSpacing}
              x2="552"
              y2={60 + i * lineSpacing}
              stroke={paper.lineColor}
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}
        </svg>

        <div style={{ position: 'relative', zIndex: 2, marginTop: 20 }}>
          {renderLines()}
        </div>

        {(signature || signaturePreset) && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 48,
              fontFamily: getFontStack(fontFamily),
              fontSize: fontSize - 2,
              color: fontColor,
              zIndex: 2,
              opacity: isPlaying ? (currentCharIndex >= text.length ? 1 : 0) : 1,
              transition: 'opacity 0.5s ease',
            }}
          >
            — {signature || signaturePreset}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: 600,
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在这里书写你的信笺..."
          style={{
            width: '100%',
            minHeight: 80,
            border: '1px solid #D5C4A1',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: getFontStack(fontFamily),
            fontSize: 14,
            color: '#4A3728',
            background: 'rgba(245,230,202,0.3)',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A96E' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#D5C4A1' }}
        />

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#8C7B6E' }}>字体风格</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as 'xingshu' | 'italic')}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #D5C4A1',
                background: '#F5E6CA',
                color: '#4A3728',
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="xingshu">潇洒行书</option>
              <option value="italic">优雅斜体</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#8C7B6E' }}>墨色</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {FONT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFontColor(c.value)}
                  title={c.name}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: fontColor === c.value ? '2px solid #C9A96E' : '2px solid transparent',
                    background: c.value,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, border-color 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 160px' }}>
            <label style={{ fontSize: 12, color: '#8C7B6E' }}>字号 {fontSize}px</label>
            <input
              type="range"
              min={16}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#C9A96E',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LetterEditor
