import React, { useState, useEffect, useRef } from 'react'
import type { IPuzzleState } from '../puzzle/PuzzleCore'

interface InfoPanelProps {
  state: IPuzzleState
  accuracy: string
  formatTime: (seconds: number) => string
  onReset: () => void
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  state,
  accuracy,
  formatTime,
  onReset,
}) => {
  const [displayedTip, setDisplayedTip] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const writeRafRef = useRef<number>()
  const tipRef = useRef('')
  const charIndexRef = useRef(0)

  useEffect(() => {
    if (!state.currentTip || state.currentTip === tipRef.current) return

    tipRef.current = state.currentTip
    charIndexRef.current = 0
    setDisplayedTip('')
    setIsWriting(true)

    const tip = state.currentTip

    const writeChar = () => {
      if (charIndexRef.current < tip.length) {
        charIndexRef.current += 1
        setDisplayedTip(tip.slice(0, charIndexRef.current))
        writeRafRef.current = requestAnimationFrame(() => {
          setTimeout(() => {
            writeRafRef.current = requestAnimationFrame(writeChar)
          }, 1500 / tip.length)
        })
      } else {
        setIsWriting(false)
      }
    }

    writeRafRef.current = requestAnimationFrame(writeChar)

    return () => {
      if (writeRafRef.current) {
        cancelAnimationFrame(writeRafRef.current)
      }
    }
  }, [state.tipKey, state.currentTip])

  const progressPercent = (state.placedCount / state.totalPieces) * 100

  return (
    <div
      style={{
        width: '300px',
        height: '500px',
        borderRadius: '12px',
        background: '#2C3E50',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: 'border-box',
        color: '#ECF0F1',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '14px',
            marginBottom: '8px',
            color: '#BDC3C7',
            textShadow: 'none',
          }}
        >
          拼接进度
        </div>
        <div
          style={{
            height: '12px',
            borderRadius: '6px',
            background: '#1a252f',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #E74C3C 0%, #F39C12 50%, #2ECC71 100%)',
              borderRadius: '6px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px rgba(46, 204, 113, 0.5)',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            textAlign: 'right',
            color: '#BDC3C7',
            textShadow: 'none',
          }}
        >
          {state.placedCount} / {state.totalPieces}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            marginBottom: '10px',
            color: '#F39C12',
            textShadow: 'none',
          }}
        >
          📜 历史小贴士
        </div>
        <div
          key={state.tipKey}
          style={{
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#ECF0F1',
            lineHeight: '1.8',
            textShadow: 'none',
            minHeight: '60px',
          }}
        >
          {displayedTip}
          {isWriting && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '16px',
                background: '#ECF0F1',
                marginLeft: '2px',
                animation: 'blink 0.8s infinite',
                verticalAlign: 'text-bottom',
              }}
            />
          )}
          {!displayedTip && !isWriting && (
            <span style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
              拼合碎片解锁历史知识...
            </span>
          )}
        </div>
      </div>

      <div style={{ paddingTop: '16px' }}>
        <div
          style={{
            fontSize: '14px',
            marginBottom: '12px',
            color: '#BDC3C7',
            textShadow: 'none',
          }}
        >
          鉴赏计数器
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            color: '#F39C12',
            fontSize: '18px',
            textShadow: 'none',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            用时：{formatTime(state.elapsedTime)}
          </div>
          <div>准确率：{accuracy}%</div>
        </div>

        {state.isCompleted && (
          <button
            onClick={onReset}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#E74C3C',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLButtonElement).style.background = '#C0392B'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLButtonElement).style.background = '#E74C3C'
            }}
          >
            🔄 重新生成
          </button>
        )}

        {state.isCompleted && (
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#95A5A6',
              textAlign: 'center',
              textShadow: 'none',
            }}
          >
            总触碰：{state.touchCount} 次
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default InfoPanel
