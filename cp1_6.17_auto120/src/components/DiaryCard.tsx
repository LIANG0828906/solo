import React, { useState, useCallback } from 'react'
import { useAppStore, COLORS, hexToRgba } from '../store'

const DiaryCard: React.FC = () => {
  const {
    selectedColorIndex,
    inputText,
    setSelectedColorIndex,
    setInputText,
    addEntry,
    isFlipping,
    setIsFlipping,
  } = useAppStore()

  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null)
  const [flipComplete, setFlipComplete] = useState(false)

  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`

  const selectedColor = COLORS[selectedColorIndex]
  const cardBgColor = hexToRgba(selectedColor, 0.1)

  const handleColorClick = useCallback((index: number) => {
    setSelectedColorIndex(index)
    setPulsingIndex(index)
    setTimeout(() => setPulsingIndex(null), 600)
  }, [setSelectedColorIndex])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value)
    },
    [setInputText]
  )

  const handleSave = useCallback(() => {
    if (!inputText.trim()) return

    setIsFlipping(true)

    setTimeout(() => {
      addEntry({
        date: dateKey,
        colorIndex: selectedColorIndex,
        content: inputText.trim(),
      })
      setFlipComplete(true)
    }, 250)
  }, [inputText, selectedColorIndex, dateKey, addEntry, setIsFlipping])

  const underlineWidth = inputText.length > 0 ? Math.min((inputText.length / 50) * 100, 100) : 0

  const frontStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: '36px 28px',
    backfaceVisibility: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    backgroundColor: flipComplete ? 'transparent' : '#ffffff',
    transition: 'transform 0.5s ease-in-out, background-color 0.4s ease-out',
    transform: isFlipping ? 'rotateY(-180deg)' : 'rotateY(0deg)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  }

  const backStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '16px',
    backgroundColor: '#FAFAFA',
    transition: 'transform 0.5s ease-in-out',
    transform: isFlipping ? 'rotateY(0deg)' : 'rotateY(180deg)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  }

  return (
    <div style={{ perspective: '1000px' }}>
      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '520px',
          transformStyle: 'preserve-3d',
          transition: 'background-color 0.4s ease-out',
        }}
      >
        <div
          style={{
            ...frontStyle,
            backgroundColor: flipComplete ? 'transparent' : cardBgColor || '#ffffff',
          }}
        >
          <div style={{ fontSize: '27px', fontWeight: 200, color: '#333333', marginBottom: '28px' }}>
            {dateStr}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '28px',
              justifyContent: 'space-between',
            }}
          >
            {COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorClick(index)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  transition: 'transform 0.2s ease',
                  transform: pulsingIndex === index ? 'scale(1.1)' : 'scale(1)',
                  boxShadow:
                    pulsingIndex === index
                      ? `0 0 0 0 rgba(255,255,255,0.8), 0 0 0 10px rgba(255,255,255,0)`
                      : selectedColorIndex === index
                      ? `0 0 0 3px ${color}40`
                      : 'none',
                  animation: pulsingIndex === index ? 'pulseGlow 0.6s ease-out' : 'none',
                }}
                aria-label={`选择颜色 ${index + 1}`}
              />
            ))}
          </div>

          <div style={{ position: 'relative', marginBottom: 'auto' }}>
            <textarea
              className="diary-card-textarea"
              value={inputText}
              onChange={handleInputChange}
              placeholder="今天发生了什么？"
              style={{
                width: '100%',
                height: '120px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '16px',
                color: '#555555',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = selectedColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E0E0E0'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '12px',
                height: '2px',
                width: `${underlineWidth}%`,
                background: `linear-gradient(to right, ${selectedColor}, transparent)`,
                transition: 'width 0.3s ease-out',
                borderRadius: '1px',
                pointerEvents: 'none',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!inputText.trim()}
            style={{
              alignSelf: 'center',
              backgroundColor: inputText.trim() ? '#333333' : '#BDBDBD',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: 300,
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              transform: inputText.trim() ? 'translateY(0)' : 'translateY(0)',
              marginTop: '24px',
            }}
            onMouseEnter={(e) => {
              if (inputText.trim()) {
                e.currentTarget.style.backgroundColor = '#555555'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = inputText.trim() ? '#333333' : '#BDBDBD'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            保存今日
          </button>
        </div>

        <div style={backStyle}>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 200,
              color: '#9E9E9E',
              animation: isFlipping && !flipComplete ? 'none' : 'fadeIn 0.5s ease 0.3s both',
            }}
          >
            已记录
          </span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(DiaryCard)
