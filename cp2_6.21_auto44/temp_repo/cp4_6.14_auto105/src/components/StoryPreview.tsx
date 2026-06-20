import { useState, useEffect, useCallback } from 'react'
import { useStoryStore } from '../stores/storyStore'
import { StoryPlayer, type StoryState } from '../utils/storyPlayer'

interface StoryPreviewProps {
  onClose: () => void
}

export default function StoryPreview({ onClose }: StoryPreviewProps) {
  const { nodes, connections } = useStoryStore()
  const [player, setPlayer] = useState<StoryPlayer | null>(null)
  const [currentState, setCurrentState] = useState<StoryState | null>(null)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const p = new StoryPlayer(nodes, connections, 'start')
    setPlayer(p)
    setCurrentState(p.getState())
  }, [nodes, connections])

  const handleChoose = useCallback(
    (index: number) => {
      if (!player || isFading) return
      setIsFading(true)
      setTimeout(() => {
        const newState = player.choose(index)
        setCurrentState(newState)
        setIsFading(false)
      }, 300)
    },
    [player, isFading]
  )

  const handleRestart = useCallback(() => {
    if (!player) return
    setIsFading(true)
    setTimeout(() => {
      const newState = player.restart()
      setCurrentState(newState)
      setIsFading(false)
    }, 300)
  }, [player])

  const handleBack = useCallback(() => {
    if (!player || isFading) return
    setIsFading(true)
    setTimeout(() => {
      const newState = player.goBack()
      if (newState) {
        setCurrentState(newState)
      }
      setIsFading(false)
    }, 300)
  }, [player, isFading])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!currentState || !currentState.currentNode) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '480px',
            padding: '24px',
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            color: '#e2e8f0',
            textAlign: 'center',
          }}
        >
          未找到起始节点，请确保存在 ID 为 'start' 的节点。
        </div>
      </div>
    )
  }

  const canGoBack = currentState.history.length > 1

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '24px',
          boxSizing: 'border-box',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          opacity: isFading ? 0 : 1,
          transform: isFading ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              color: '#3b82f6',
              fontSize: '16px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {currentState.currentNode.title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#64748b',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444'
              e.currentTarget.style.backgroundColor = '#1e293b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            color: '#e2e8f0',
            fontSize: '18px',
            lineHeight: '1.8',
            marginBottom: '24px',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {currentState.currentNode.text || '（暂无内容）'}
        </div>

        {currentState.isEnd ? (
          <div
            style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
              padding: '20px 0',
            }}
          >
            — 故事结束 —
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {currentState.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleChoose(index)}
                style={{
                  width: '200px',
                  height: '48px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155'
                  e.currentTarget.style.borderColor = '#475569'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b'
                  e.currentTarget.style.borderColor = '#334155'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #334155',
          }}
        >
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: canGoBack ? '#94a3b8' : '#475569',
              fontSize: '13px',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (canGoBack) e.currentTarget.style.backgroundColor = '#1e293b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ← 返回
          </button>
          <button
            onClick={handleRestart}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ↻ 重新开始
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
