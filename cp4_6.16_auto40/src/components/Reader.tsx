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

  const flipClass =
    flipState === 'enter'
      ? 'flip-enter'
      : flipState === 'exit'
      ? 'flip-exit'
      : ''

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center
                  ${exiting ? 'reader-exit' : 'reader-enter'}`}
      style={{
        background: `
          radial-gradient(ellipse at center, rgba(22, 33, 62, 1) 0%, rgba(26, 26, 46, 1) 50%, #0d0d1a 100%)
        `,
        perspective: '1500px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 85%, rgba(0, 255, 213, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 85% 15%, rgba(255, 0, 127, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <button
        onClick={handleExit}
        className="absolute top-4 right-4 z-50 group flex items-center gap-2
                   px-4 py-2.5 rounded-xl glass-panel transition-all duration-200
                   hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,0,127,0.4)]
                   hover:border-magenta/50 border border-white/10"
        style={{
          transition: 'all 0.2s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff007f" strokeWidth="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span
          className="text-xs font-bold tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#ff007f',
          }}
        >
          退出阅读
        </span>
      </button>

      <div
        className="absolute top-4 left-4 z-50 glass-panel rounded-xl px-4 py-3
                   border border-white/10"
      >
        <div
          className="text-[10px] uppercase tracking-widest font-bold mb-1"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#00ffd5',
          }}
        >
          WordWeaver
        </div>
        <div className="text-[11px] text-gray-400">
          已探索 <span style={{ color: '#00ffd5', fontWeight: 600 }}>{visitedNodeIds.size}</span>
          <span className="text-gray-600"> / </span>
          <span className="text-gray-300">{totalNodes}</span> 个场景
        </div>
        {endNodes > 0 && (
          <div className="text-[11px] text-gray-400 mt-0.5">
            解锁结局 <span style={{ color: '#ff007f', fontWeight: 600 }}>{visitedEnds}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-gray-300">{endNodes}</span>
          </div>
        )}
      </div>

      {currentNode && (
        <div
          key={animateKey}
          className={`relative max-w-2xl w-[90%] md:w-full md:max-w-3xl mx-4
                      ${flipClass}`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div
            className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: `
                0 0 60px rgba(0, 255, 213, 0.05),
                0 0 120px rgba(255, 0, 127, 0.03),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: currentNode.isEnd
                  ? 'linear-gradient(90deg, transparent 0%, #ff007f 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, #00ffd5 50%, transparent 100%)',
                boxShadow: currentNode.isEnd
                  ? '0 0 20px rgba(255, 0, 127, 0.3)'
                  : '0 0 20px rgba(0, 255, 213, 0.3)',
              }}
            />

            <div className="flex items-center gap-3 mb-6">
              {currentNode.isStart && (
                <span
                  className="text-[10px] px-3 py-1 rounded-full font-bold tracking-wider"
                  style={{
                    backgroundColor: 'rgba(0, 255, 213, 0.15)',
                    color: '#00ffd5',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(0, 255, 213, 0.2)',
                  }}
                >
                  ⬤ 序章
                </span>
              )}
              {currentNode.isEnd && (
                <span
                  className="text-[10px] px-3 py-1 rounded-full font-bold tracking-wider"
                  style={{
                    backgroundColor: 'rgba(255, 0, 127, 0.15)',
                    color: '#ff007f',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(255, 0, 127, 0.2)',
                  }}
                >
                  ★ 结局
                </span>
              )}
            </div>

            <h1
              className="text-2xl md:text-4xl font-bold mb-6 leading-tight"
              style={{
                fontFamily: "'Orbitron', 'Noto Sans SC', sans-serif",
                background: 'linear-gradient(135deg, #00ffd5 0%, #ffffff 50%, #ff007f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {currentNode.title}
            </h1>

            <div
              className="text-gray-300 leading-loose text-base md:text-lg mb-10
                         whitespace-pre-line"
              style={{
                letterSpacing: '0.02em',
                lineHeight: '2',
              }}
            >
              {currentNode.description}
            </div>

            {currentNode.options.length > 0 ? (
              <div className="space-y-3">
                <div
                  className="text-[10px] uppercase tracking-widest font-bold mb-4 text-gray-500"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  ◆ 你的选择 ◆
                </div>
                {currentNode.options.map((option, idx) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.targetNodeId)}
                    disabled={!option.targetNodeId}
                    className="w-full group relative overflow-hidden
                               py-4 px-6 rounded-2xl text-left transition-all duration-300
                               disabled:opacity-30 disabled:cursor-not-allowed
                               disabled:hover:translate-y-0 disabled:hover:shadow-none
                               hover:-translate-y-1"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        !option.targetNodeId
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 255, 213, 0.2)'
                      }`,
                      animation: !option.targetNodeId
                        ? undefined
                        : `neon-flicker ${3 + idx * 0.5}s infinite`,
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg,
                          rgba(0, 255, 213, 0.08) 0%,
                          transparent 50%,
                          rgba(255, 0, 127, 0.08) 100%
                        )`,
                      }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `linear-gradient(135deg,
                            rgba(0, 255, 213, 0.2) 0%,
                            rgba(255, 0, 127, 0.2) 100%
                          )`,
                          color: '#00ffd5',
                          fontFamily: "'Orbitron', sans-serif",
                          border: '1px solid rgba(0, 255, 213, 0.3)',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-gray-200 text-sm md:text-base font-medium">
                        {option.text || '（未设置文案）'}
                      </span>
                      <svg
                        className="ml-auto w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={option.targetNodeId ? '#00ffd5' : '#666'}
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-10 rounded-2xl"
                style={{
                  background: 'rgba(255, 0, 127, 0.03)',
                  border: '1px dashed rgba(255, 0, 127, 0.2)',
                }}
              >
                <div className="text-4xl mb-4">✦</div>
                <div
                  className="text-xl font-bold mb-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#ff007f',
                  }}
                >
                  故事到此结束
                </div>
                <div className="text-sm text-gray-500 mb-6">
                  感谢你的探索，愿你在另一条道路上发现更多惊喜
                </div>
                <button
                  onClick={handleExit}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all
                             hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,255,213,0.4)]"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00ffd5',
                    border: '1px solid rgba(0, 255, 213, 0.3)',
                    background: 'rgba(0, 255, 213, 0.05)',
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
        <div className="text-center">
          <div className="text-gray-400 mb-4">没有找到起始节点</div>
          <button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg"
            style={{
              color: '#00ffd5',
              border: '1px solid rgba(0, 255, 213, 0.3)',
            }}
          >
            返回编辑器
          </button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 md:px-8 pb-6 pt-16 pointer-events-none">
        <div
          className="max-w-4xl mx-auto"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(26, 26, 46, 0.9) 30%, rgba(26, 26, 46, 0.98) 100%)',
            padding: '24px 0 0',
            margin: '0 -20px',
            width: 'calc(100% + 40px)',
            paddingLeft: '20px',
            paddingRight: '20px',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="text-[10px] uppercase tracking-widest font-bold mb-2 flex justify-between"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <span>探索进度</span>
            <span style={{ color: '#00ffd5' }}>{completion}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${completion}%`,
                background: `linear-gradient(90deg,
                  #00ffd5 0%,
                  #00ffff 30%,
                  #ffffff 50%,
                  #ff66b2 70%,
                  #ff007f 100%
                )`,
                boxShadow: `
                  0 0 10px rgba(0, 255, 213, 0.5),
                  0 0 20px rgba(255, 0, 127, 0.3)
                `,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#00ffd5',
                  boxShadow: '0 0 4px rgba(0, 255, 213, 0.8)',
                }}
              />
              <span className="text-[10px] text-gray-500">已访问</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#3a3a5a' }}
              />
              <span className="text-[10px] text-gray-500">待探索</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reader
