import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useLetterStore, PAPER_STYLES } from '@/store/useLetterStore'

const HandwritingAnimator: React.FC = () => {
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
  const playbackSpeed = useLetterStore((s) => s.playbackSpeed)
  const currentCharIndex = useLetterStore((s) => s.currentCharIndex)
  const setIsPlaying = useLetterStore((s) => s.setIsPlaying)
  const setCurrentCharIndex = useLetterStore((s) => s.setCurrentCharIndex)
  const setPlaybackSpeed = useLetterStore((s) => s.setPlaybackSpeed)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const [penPosition, setPenPosition] = useState({ x: 0, y: 0 })
  const [penVisible, setPenVisible] = useState(false)

  const paper = PAPER_STYLES[paperStyle]

  const getFontStack = useCallback((font: string) => {
    if (font === 'xingshu') return "'LXGW WenKai TC', '楷体', 'KaiTi', cursive"
    return "'Dancing Script', 'Georgia', 'Times New Roman', cursive"
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const drawFrame = (visibleChars: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      if (paperStyle === 'kraft') {
        gradient.addColorStop(0, '#F5E6CA')
        gradient.addColorStop(1, '#E8D8C8')
      } else if (paperStyle === 'watermark') {
        gradient.addColorStop(0, '#E6E1D5')
        gradient.addColorStop(1, '#DBD6CA')
      } else {
        gradient.addColorStop(0, '#F0EAD6')
        gradient.addColorStop(1, '#E5DFD0')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = paper.lineColor
      ctx.lineWidth = 0.5
      ctx.globalAlpha = 0.6
      for (let i = 0; i < Math.floor(720 / lineSpacing); i++) {
        const y = 60 + i * lineSpacing
        ctx.beginPath()
        ctx.moveTo(48, y)
        ctx.lineTo(552, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (showDateStamp) {
        ctx.font = '12px Georgia, serif'
        ctx.fillStyle = '#8C7B6E'
        ctx.textAlign = 'right'
        ctx.fillText(dateStamp, 552, 36)
        ctx.textAlign = 'left'
      }

      ctx.font = `${fontSize}px ${getFontStack(fontFamily)}`
      ctx.fillStyle = fontColor

      const lines = text.split('\n')
      let drawnCount = 0
      let currentPenX = 48
      let currentPenY = 60 + fontSize

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]
        let x = 48
        const y = 60 + fontSize + lineIdx * lineSpacing

        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          if (drawnCount >= visibleChars) break
          const char = line[charIdx]
          const isLatest = drawnCount === visibleChars - 1

          if (isLatest) {
            ctx.save()
            ctx.globalAlpha = 0.3
            ctx.beginPath()
            ctx.arc(x + ctx.measureText(char).width / 2, y - fontSize * 0.3, 6, 0, Math.PI * 2)
            ctx.fillStyle = fontColor
            ctx.fill()
            ctx.restore()
            ctx.fillStyle = fontColor
          }

          ctx.fillText(char, x, y)
          currentPenX = x + ctx.measureText(char).width
          currentPenY = y
          x += ctx.measureText(char).width
          drawnCount++
        }

        if (drawnCount < visibleChars && lineIdx < lines.length - 1) {
          drawnCount++
        }
        if (drawnCount >= visibleChars) break
      }

      const sigText = signature || signaturePreset
      if (sigText && visibleChars >= text.replace(/\n/g, '').length) {
        ctx.font = `${fontSize - 2}px ${getFontStack(fontFamily)}`
        ctx.textAlign = 'right'
        ctx.fillText(`— ${sigText}`, 552, 760)
        ctx.textAlign = 'left'
      }

      return { penX: currentPenX, penY: currentPenY, drawnCount }
    }

    if (!isPlaying) {
      drawFrame(text.length)
      setPenVisible(false)
      return
    }

    const totalChars = text.replace(/\n/g, '').length
    if (currentCharIndex >= totalChars) {
      setIsPlaying(false)
      drawFrame(totalChars)
      setPenVisible(false)
      return
    }

    let charIndex = currentCharIndex

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp

      const baseInterval = 600
      const interval = baseInterval / playbackSpeed
      const elapsed = timestamp - lastTimeRef.current

      if (elapsed >= interval) {
        lastTimeRef.current = timestamp
        charIndex++

        if (charIndex >= totalChars) {
          const result = drawFrame(totalChars)
          if (result) setPenPosition({ x: result.penX, y: result.penY })
          setCurrentCharIndex(totalChars)
          setIsPlaying(false)
          setPenVisible(false)
          return
        }

        setCurrentCharIndex(charIndex)
        const result = drawFrame(charIndex)
        if (result) setPenPosition({ x: result.penX, y: result.penY })
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = 0
    setPenVisible(true)
    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, playbackSpeed, currentCharIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isPlaying) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    if (paperStyle === 'kraft') {
      gradient.addColorStop(0, '#F5E6CA')
      gradient.addColorStop(1, '#E8D8C8')
    } else if (paperStyle === 'watermark') {
      gradient.addColorStop(0, '#E6E1D5')
      gradient.addColorStop(1, '#DBD6CA')
    } else {
      gradient.addColorStop(0, '#F0EAD6')
      gradient.addColorStop(1, '#E5DFD0')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = paper.lineColor
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.6
    for (let i = 0; i < Math.floor(720 / lineSpacing); i++) {
      const y = 60 + i * lineSpacing
      ctx.beginPath()
      ctx.moveTo(48, y)
      ctx.lineTo(552, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    if (showDateStamp) {
      ctx.font = '12px Georgia, serif'
      ctx.fillStyle = '#8C7B6E'
      ctx.textAlign = 'right'
      ctx.fillText(dateStamp, 552, 36)
      ctx.textAlign = 'left'
    }

    ctx.font = `${fontSize}px ${getFontStack(fontFamily)}`
    ctx.fillStyle = fontColor
    const lines = text.split('\n')
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      let x = 48
      const y = 60 + fontSize + lineIdx * lineSpacing
      for (const char of line) {
        ctx.fillText(char, x, y)
        x += ctx.measureText(char).width
      }
    }

    const sigText = signature || signaturePreset
    if (sigText) {
      ctx.font = `${fontSize - 2}px ${getFontStack(fontFamily)}`
      ctx.textAlign = 'right'
      ctx.fillText(`— ${sigText}`, 552, 760)
      ctx.textAlign = 'left'
    }
  }, [text, fontSize, fontColor, fontFamily, lineSpacing, paperStyle, showDateStamp, dateStamp, signature, signaturePreset, isPlaying])

  const totalChars = text.replace(/\n/g, '').length
  const progress = totalChars > 0 ? (currentCharIndex / totalChars) * 100 : 0

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setPenVisible(false)
    } else {
      if (currentCharIndex >= totalChars) {
        setCurrentCharIndex(0)
      }
      setIsPlaying(true)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentCharIndex(0)
    setPenVisible(false)
  }

  const speeds: Array<{ label: string; value: 0.5 | 1 | 2 }> = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: 600, height: 800 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={800}
          style={{
            width: 600,
            height: 800,
            borderRadius: 4,
            boxShadow: '4px 4px 20px rgba(0,0,0,0.15)',
          }}
        />

        {penVisible && (
          <svg
            style={{
              position: 'absolute',
              left: penPosition.x - 5,
              top: penPosition.y - 40,
              width: 20,
              height: 40,
              pointerEvents: 'none',
              transition: 'left 0.05s linear, top 0.05s linear',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))',
            }}
            viewBox="0 0 20 40"
          >
            <path
              d="M10 0 L13 28 L10 40 L7 28 Z"
              fill="#C9A96E"
              stroke="#A88B5A"
              strokeWidth="0.5"
            />
            <path
              d="M8 28 L10 36 L12 28"
              fill="#8B7355"
            />
            <ellipse cx="10" cy="5" rx="2.5" ry="3" fill="#D4B87A" />
          </svg>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <button
          onClick={handleReset}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #D5C4A1',
            background: '#F5E6CA',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#4A3728',
            transition: 'box-shadow 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          title="重置"
        >
          ⟲
        </button>

        <button
          onClick={handlePlayPause}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #C9A96E, #A88B5A)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#FFF',
            boxShadow: '0 2px 8px rgba(201,169,110,0.4)',
            transition: 'box-shadow 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,169,110,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(201,169,110,0.4)'; e.currentTarget.style.transform = 'translateY(0)' }}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          {speeds.map((s) => (
            <button
              key={s.value}
              onClick={() => setPlaybackSpeed(s.value)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: playbackSpeed === s.value ? '1px solid #C9A96E' : '1px solid #D5C4A1',
                background: playbackSpeed === s.value ? '#C9A96E' : '#F5E6CA',
                color: playbackSpeed === s.value ? '#FFF' : '#4A3728',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: playbackSpeed === s.value ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ width: 120 }}>
          <div style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: '#E8D8C8',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #C9A96E, #A88B5A)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#8C7B6E', textAlign: 'center', marginTop: 2 }}>
            {currentCharIndex} / {totalChars}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HandwritingAnimator
