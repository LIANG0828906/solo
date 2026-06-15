import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import type { StoryNode } from '../store'

interface ReaderProps {
  onExit: () => void
}

const Reader: React.FC<ReaderProps> = ({ onExit }) => {
  const {
    nodes,
    currentReaderNodeId,
    setCurrentReaderNodeId,
    visitedNodeIds,
    resetReader,
    addVisitedNode,
  } = useStore()

  const [flipState, setFlipState] = useState<'enter' | 'exit' | 'idle'>('enter')
  const [exiting, setExiting] = useState(false)
  const [displayedNodeId, setDisplayedNodeId] = useState<string | null>(currentReaderNodeId)
  const [animateKey, setAnimateKey] = useState(0)
  const transitionRef = useRef(false)

  useEffect(() => {
    resetReader()
  }, [])

  const currentNode: StoryNode | undefined =
    nodes.find((n) => n.id === (displayedNodeId || currentReaderNodeId))

  const handleOptionClick = (targetNodeId: string | null) => {
    if (!targetNodeId || transitionRef.current) return
    transitionRef.current = true
    setFlipState('exit')

    setTimeout(() => {
      setDisplayedNodeId(targetNodeId)
      setCurrentReaderNodeId(targetNodeId)
      addVisitedNode(targetNodeId)
      setAnimateKey((k) => k + 1)
      setFlipState('enter')
      setTimeout(() => {
        setFlipState('idle')
        transitionRef.current = false
      }, 500)
    }, 300)
  }

  const handleExit = () => {
    setExiting(true)
    setTimeout(() => {
      onExit()
    }, 400)
  }

  const totalNodes = nodes.length
  const endNodes = nodes.filter((n) => n.isEnd).length
  const visitedEnds = nodes.filter((n) => n.isEnd && visitedNodeIds.has(n.id)).length
  const completion =
    totalNodes > 0 ? Math.round((visitedNodeIds.size / totalNodes) * 100) : 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1500px',
        background:
          'radial-gradient(ellipse at center, rgba(22, 33, 62, 1) 0%, rgba(26, 26, 46, 1) 50%, #0d0d1a 100%)',
        animation: exiting ? 'shrink-back 0.4s cubic-bezier(0.55, 0, 1, 0.45) forwards' : 'grow-from-editor 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 15% 85%, rgba(0, 255, 213, 0.05) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(255, 0, 127, 0.05) 0%, transparent 50%)',
        }}
      />

      <button
        onClick={handleExit}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,0,127,0.2), 0 0 20px rgba(255,0,127,0.15)'
          e.currentTarget.style.borderColor = 'rgba(255, 0, 127, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: "'Orbitron', sans-serif",
            color: '#ff007f',
          }}
        >
          退出阅读
        </span>
      </button>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 50,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.15em',
            fontWeight: 700,
            marginBottom: 4,
            fontFamily: "'Orbitron', sans-serif",
            color: '#00ffd5',
          }}
        >
          WORDWEAVER
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          已探索 <span style={{ color: '#00ffd5', fontWeight: 600 }}>{visitedNodeIds.size}</span>
          <span style={{ color: '#4b5563' }}> / </span>
          <span style={{ color: '#d1d5db' }}>{totalNodes}</span> 个场景
        </div>
        {endNodes > 0 && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            解锁结局 <span style={{ color: '#ff007f', fontWeight: 600 }}>{visitedEnds}</span>
            <span style={{ color: '#4b5563' }}> / </span>
            <span style={{ color: '#d1d5db' }}>{endNodes}</span>
          </div>
        )}
      </div>

      {currentNode && (
        <div
          key={animateKey}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: 700,
            animation:
              flipState === 'enter'
                ? 'flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : flipState === 'exit'
                ? 'flip-out 0.3s ease-in forwards'
                : undefined,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(26, 26, 46, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: '40px 48px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow:
                '0 0 60px rgba(0, 255, 213, 0.05), 0 0 120px rgba(255, 0, 127, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: currentNode.isEnd
                  ? 'linear-gradient(90deg, transparent 0%, #ff007f 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, #00ffd5 50%, transparent 100%)',
                boxShadow: currentNode.isEnd
                  ? '0 0 20px rgba(255, 0, 127, 0.3)'
                  : '0 0 20px rgba(0, 255, 213, 0.3)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              {currentNode.isStart && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    fontFamily: "'Orbitron', sans-serif",
                    backgroundColor: 'rgba(0, 255, 213, 0.15)',
                    color: '#00ffd5',
                    boxShadow: '0 0 10px rgba(0, 255, 213, 0.2)',
                  }}
                >
                  ◆ 序章
                </span>
              )}
              {currentNode.isEnd && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    fontFamily: "'Orbitron', sans-serif",
                    backgroundColor: 'rgba(255, 0, 127, 0.15)',
                    color: '#ff007f',
                    boxShadow: '0 0 10px rgba(255, 0, 127, 0.2)',
                  }}
                >
                  ★ 结局
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                marginBottom: 24,
                lineHeight: 1.2,
                fontFamily: "'Orbitron', 'Noto Sans SC', sans-serif",
                background: 'linear-gradient(135deg, #00ffd5 0%, #ffffff 50%, #ff007f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                marginBottom: 24,
              }}
            >
              {currentNode.title}
            </h1>

            <div
              style={{
                color: '#d1d5db',
                fontSize: 15,
                lineHeight: 2,
                marginBottom: 40,
                whiteSpace: 'pre-line',
                letterSpacing: '0.02em',
              }}
            >
              {currentNode.description}
            </div>

            {currentNode.options.length > 0 ? (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                    marginBottom: 16,
                    color: '#6b7280',
                    fontFamily: "'Orbitron', sans-serif",
                    textAlign: 'center',
                  }}
                >
                  ◆ 你的选择 ◆
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentNode.options.map((option, idx) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.targetNodeId)}
                      disabled={!option.targetNodeId}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        padding: '16px 20px',
                        borderRadius: 14,
                        textAlign: 'left',
                        transition: 'all 0.3s ease-out',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          !option.targetNodeId
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0, 255, 213, 0.2)'
                        }`,
                        animation: !option.targetNodeId
                          ? undefined
                          : `neon-flicker ${3 + idx * 0.5}s infinite`,
                        animationDelay: `${idx * 0.1}s`,
                        cursor: !option.targetNodeId ? 'not-allowed' : 'pointer',
                        opacity: !option.targetNodeId ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (option.targetNodeId) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, rgba(0, 255, 213, 0.1) 0%, transparent 50%, rgba(255, 0, 127, 0.1) 100%)'
                          e.currentTarget.style.borderColor = 'rgba(0, 255, 213, 0.5)'
                          e.currentTarget.style.boxShadow =
                            '0 8px 24px rgba(0,255,213,0.15), 0 0 30px rgba(0,255,213,0.1)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = !option.targetNodeId
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0, 255, 213, 0.2)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                            fontFamily: "'Orbitron', sans-serif",
                            color: '#00ffd5',
                            background:
                              'linear-gradient(135deg, rgba(0, 255, 213, 0.2) 0%, rgba(255, 0, 127, 0.2) 100%)',
                            border: '1px solid rgba(0, 255, 213, 0.3)',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <span
                          style={{
                            color: '#e5e7eb',
                            fontSize: 14,
                            fontWeight: 500,
                            flex: 1,
                          }}
                        >
                          {option.text || '（未设置文案）'}
                        </span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={option.targetNodeId ? '#00ffd5' : '#666'}
                          strokeWidth="2"
                          style={{
                            flexShrink: 0,
                            transition: 'transform 0.3s',
                          }}
                          className="arrow-icon"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  borderRadius: 16,
                  background: 'rgba(255, 0, 127, 0.03)',
                  border: '1px dashed rgba(255, 0, 127, 0.3)',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 8,
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#ff007f',
                  }}
                >
                  故事到此结束
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  感谢你的探索，愿你在另一条道路上发现更多惊喜
                </div>
                <button
                  onClick={handleExit}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00ffd5',
                    border: '1px solid rgba(0, 255, 213, 0.3)',
                    background: 'rgba(0, 255, 213, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,213,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  ← 返回编辑器
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!currentNode && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', marginBottom: 16 }}>没有找到起始节点</div>
          <button
            onClick={handleExit}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              color: '#00ffd5',
              border: '1px solid rgba(0, 255, 213, 0.3)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            返回编辑器
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '40px 20px 24px',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(26, 26, 46, 0.9) 30%, rgba(26, 26, 46, 0.98) 100%)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', pointerEvents: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.15em',
                fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              探索进度
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                color: '#00ffd5',
              }}
            >
              {completion}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              overflow: 'hidden',
              position: 'relative',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                transition: 'width 0.7s ease-out',
                width: `${completion}%`,
                background:
                  'linear-gradient(90deg, #00ffd5 0%, #00ffff 30%, #ffffff 50%, #ff66b2 70%, #ff007f 100%)',
                boxShadow: '0 0 10px rgba(0, 255, 213, 0.5), 0 0 20px rgba(255, 0, 127, 0.3)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#00ffd5',
                  boxShadow: '0 0 4px rgba(0, 255, 213, 0.8)',
                }}
              />
              <span style={{ fontSize: 10, color: '#6b7280' }}>已访问</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#3a3a5a',
                }}
              />
              <span style={{ fontSize: 10, color: '#6b7280' }}>待探索</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reader
