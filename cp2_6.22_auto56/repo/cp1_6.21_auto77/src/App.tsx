import { useState, useEffect, useRef, useCallback } from 'react'
import { Difficulty, SONGS, Song } from './AudioManager'
import { gameEngine, GameState } from './GameEngine'
import { renderer } from './Renderer'

type Scene = 'songSelect' | 'playing' | 'gameOver'

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function HeartIcon({ active, breaking }: { active: boolean; breaking: boolean }) {
  const baseColor = active ? '#ff4466' : '#444444'
  const glowStyle = active ? { filter: 'drop-shadow(0 0 6px #ff4466)' } : {}
  const animStyle = breaking ? { animation: 'heartBreak 0.3s forwards' } : {}

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ ...glowStyle, ...animStyle }}
    >
      <path
        d="M8 14L6.6 12.7C3.8 10.2 2 8.6 2 6.6C2 5 3.2 3.6 4.8 3.6C5.7 3.6 6.5 4 7.2 4.7L8 5.5L8.8 4.7C9.5 4 10.3 3.6 11.2 3.6C12.8 3.6 14 5 14 6.6C14 8.6 12.2 10.2 9.4 12.7L8 14Z"
        fill={baseColor}
        stroke={active ? '#ff6688' : '#555555'}
        strokeWidth="0.5"
      />
    </svg>
  )
}

function AlbumCover({ color, size }: { color: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${color}, ${color}aa)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 20px ${color}44`,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.6)" />
        <path d="M12 2V12L17 14.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function App() {
  const [scene, setScene] = useState<Scene>('songSelect')
  const [selectedSongId, setSelectedSongId] = useState<string>(SONGS[0].id)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [finalScore, setFinalScore] = useState(0)
  const [gameState, setGameState] = useState<GameState>(gameEngine.getState())
  const [prevHeartStates, setPrevHeartStates] = useState<number[]>([0, 0, 0, 0, 0])
  const [breakingHearts, setBreakingHearts] = useState<Set<number>>(new Set())

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderLoopRef = useRef<number>(0)

  const selectedSong = SONGS.find(s => s.id === selectedSongId) || SONGS[0]

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes heartBreak {
        0% { transform: scale(1); opacity: 1; }
        30% { transform: scale(1.3) rotate(-10deg); }
        50% { transform: scale(0.9) rotate(5deg); }
        100% { transform: scale(0) rotate(30deg); opacity: 0; }
      }
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(136, 102, 255, 0.3); }
        50% { box-shadow: 0 0 40px rgba(136, 102, 255, 0.6); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes scorePop {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    if (canvas) {
      canvasRef.current = canvas
      renderer.init(canvas)
      gameEngine.setCanvasSize(window.innerWidth, window.innerHeight)
    }

    const handleResize = () => {
      if (canvasRef.current) {
        renderer.init(canvasRef.current)
        renderer.resize()
        gameEngine.setCanvasSize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (scene !== 'playing') {
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current)
      return
    }

    const renderLoop = () => {
      const state = gameEngine.getState()
      renderer.render(state)
      setGameState({ ...state })
      renderLoopRef.current = requestAnimationFrame(renderLoop)
    }
    renderLoopRef.current = requestAnimationFrame(renderLoop)

    return () => {
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current)
    }
  }, [scene])

  useEffect(() => {
    const newBreaking = new Set<number>()
    for (let i = 0; i < gameState.heartBreakStates.length; i++) {
      if (gameState.heartBreakStates[i] === 1 && prevHeartStates[i] !== 1) {
        newBreaking.add(i)
      }
    }
    if (newBreaking.size > 0) {
      setBreakingHearts(newBreaking)
      setTimeout(() => setBreakingHearts(new Set()), 300)
    }
    setPrevHeartStates([...gameState.heartBreakStates])
  }, [gameState.heartBreakStates])

  useEffect(() => {
    gameEngine.setStateChangeCallback((state) => {
      setGameState({ ...state })
    })
    gameEngine.setGameOverCallback((score) => {
      setFinalScore(score)
      setTimeout(() => setScene('gameOver'), 500)
    })
  }, [])

  const getCanvasCoords = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      if (e.touches.length === 0 && 'changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else if (e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        return null
      }
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const handlePointerDown = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    const coords = getCanvasCoords(e)
    if (coords) gameEngine.handlePointerDown(coords.x, coords.y)
  }, [getCanvasCoords])

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    const coords = getCanvasCoords(e)
    if (coords) gameEngine.handlePointerMove(coords.x, coords.y)
  }, [getCanvasCoords])

  const handlePointerUp = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    gameEngine.handlePointerUp()
  }, [])

  useEffect(() => {
    if (scene !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', handlePointerDown)
    canvas.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false })
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown)
      canvas.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      canvas.removeEventListener('touchstart', handlePointerDown)
      canvas.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [scene, handlePointerDown, handlePointerMove, handlePointerUp])

  const startGame = () => {
    gameEngine.init(selectedSong, difficulty)
    setScene('playing')
    setTimeout(() => gameEngine.start(), 100)
  }

  const restart = () => {
    setScene('songSelect')
  }

  const renderSongSelect = () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 10,
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 900,
          color: '#ccccff',
          marginBottom: 8,
          letterSpacing: '0.1em',
          textShadow: '0 0 30px rgba(136, 102, 255, 0.5), 0 0 60px rgba(255, 68, 102, 0.3)',
        }}
      >
        节奏光刃斩
      </h1>
      <p
        style={{
          color: '#8888aa',
          marginBottom: 32,
          fontSize: 14,
          letterSpacing: '0.2em',
        }}
      >
        RHYTHM BLADE SLASH
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: 32,
          maxWidth: 900,
          width: '100%',
          alignItems: window.innerWidth < 768 ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <AlbumCover color={selectedSong.coverColor} size={200} />
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ccccff', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {selectedSong.title}
            </div>
            <div style={{ color: '#8888aa', fontSize: 14 }}>
              {selectedSong.artist} · {formatDuration(selectedSong.duration)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
              const isSelected = difficulty === d
              const btnColors: Record<Difficulty, string> = {
                easy: '#44ff88',
                normal: '#8866ff',
                hard: '#ff4466',
              }
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    width: 100,
                    height: 44,
                    borderRadius: 22,
                    border: isSelected ? `2px solid ${btnColors[d]}` : '2px solid transparent',
                    background: isSelected
                      ? `linear-gradient(135deg, ${btnColors[d]}, ${btnColors[d]}aa)`
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#ffffff' : '#aaaacc',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? `0 0 20px ${btnColors[d]}66` : 'none',
                  }}
                >
                  {DIFFICULTY_NAMES[d]}
                </button>
              )
            })}
          </div>

          <button
            onClick={startGame}
            style={{
              width: 180,
              height: 56,
              borderRadius: 28,
              border: 'none',
              background: 'linear-gradient(135deg, #ff4466, #ff8844)',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 0 30px rgba(255, 68, 102, 0.4)',
              letterSpacing: '0.1em',
              marginTop: 12,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 68, 102, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 68, 102, 0.4)'
            }}
          >
            开始游戏
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 420,
            overflowY: 'auto',
            padding: '8px 8px 8px 0',
            scrollbarWidth: 'thin',
            scrollbarColor: '#443366 transparent',
          }}
        >
          <div style={{ color: '#8888aa', fontSize: 12, marginBottom: 8, letterSpacing: '0.1em' }}>
            歌 曲 列 表
          </div>
          {SONGS.map((song, idx) => {
            const isSelected = song.id === selectedSongId
            return (
              <div
                key={song.id}
                onClick={() => setSelectedSongId(song.id)}
                style={{
                  height: 60,
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  borderRadius: 8,
                  background: isSelected ? '#332244' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: isSelected ? '1px solid rgba(136, 102, 255, 0.3)' : '1px solid transparent',
                  animation: `slideIn 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(51, 34, 68, 0.4)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <AlbumCover color={song.coverColor} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#ccccff',
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {song.title}
                  </div>
                  <div style={{ color: '#777799', fontSize: 12 }}>
                    {song.artist} · {formatDuration(song.duration)}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: '#8866ff', fontSize: 18 }}>▶</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          color: '#666688',
          fontSize: 12,
          textAlign: 'center',
          width: '100%',
        }}
      >
        按方块颜色方向划动切割 · 红↓ 蓝← 绿→ 黄↑
      </div>
    </div>
  )

  const renderGameHUD = () => (
    <>
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 5,
        }}
      >
        {Array.from({ length: gameState.maxHealth }).map((_, i) => {
          const heartIndex = gameState.maxHealth - 1 - i
          const isActive = heartIndex < gameState.currentHealth
          return (
            <HeartIcon
              key={i}
              active={isActive}
              breaking={breakingHearts.has(heartIndex)}
            />
          )
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          textAlign: 'right',
          zIndex: 5,
        }}
      >
        <div
          style={{
            color: '#ccccff',
            fontSize: 36,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 20px rgba(136, 102, 255, 0.5)',
          }}
        >
          {gameState.score.toLocaleString()}
        </div>
        {gameState.combo >= 3 && (
          <div
            style={{
              color: '#ffdd44',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 4,
              textShadow: '0 0 10px rgba(255, 221, 68, 0.5)',
            }}
          >
            {gameState.combo} COMBO
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
          zIndex: 5,
        }}
      >
        {[
          { color: '#ff4466', dir: '↓' },
          { color: '#4488ff', dir: '←' },
          { color: '#44ff88', dir: '→' },
          { color: '#ffdd44', dir: '↑' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${item.color}22`,
              border: `1.5px solid ${item.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {item.dir}
          </div>
        ))}
      </div>
    </>
  )

  const renderGameOver = () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(30, 20, 50, 0.95), rgba(20, 15, 35, 0.98))',
          borderRadius: 20,
          padding: '48px 64px',
          border: '1px solid rgba(136, 102, 255, 0.2)',
          boxShadow: '0 0 60px rgba(136, 102, 255, 0.15), 0 0 100px rgba(255, 68, 102, 0.08)',
          textAlign: 'center',
          minWidth: 360,
          animation: 'fadeIn 0.6s ease 0.1s both',
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: '#8866ff',
            letterSpacing: '0.3em',
            marginBottom: 8,
          }}
        >
          G  A  M  E    O  V  E  R
        </div>
        <h2
          style={{
            color: '#ccccff',
            fontSize: 28,
            marginBottom: 32,
            fontWeight: 700,
          }}
        >
          {gameState.currentHealth > 0 ? '演奏完成！' : '挑战失败'}
        </h2>

        <div style={{ marginBottom: 32 }}>
          <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 8, letterSpacing: '0.1em' }}>
            最 终 得 分
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #8866ff, #ff4466)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: 24,
            }}
          >
            {finalScore.toLocaleString()}
          </div>

          {gameState.totalNotes > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                paddingTop: 20,
                borderTop: '1px solid rgba(136, 102, 255, 0.15)',
              }}
            >
              <div>
                <div style={{ color: '#8888aa', fontSize: 11, marginBottom: 4 }}>完美命中</div>
                <div style={{ color: '#ffdd44', fontSize: 20, fontWeight: 700 }}>
                  {gameState.perfectHits}
                </div>
              </div>
              <div>
                <div style={{ color: '#8888aa', fontSize: 11, marginBottom: 4 }}>精准率</div>
                <div style={{ color: '#44ff88', fontSize: 20, fontWeight: 700 }}>
                  {Math.round((gameState.perfectHits / gameState.totalNotes) * 100)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#8888aa', fontSize: 11, marginBottom: 4 }}>剩余生命</div>
                <div style={{ color: '#ff4466', fontSize: 20, fontWeight: 700 }}>
                  {gameState.currentHealth}/{gameState.maxHealth}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={restart}
          style={{
            width: 180,
            height: 52,
            borderRadius: 26,
            border: 'none',
            background: 'linear-gradient(135deg, #ff4466, #ff8844)',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 25px rgba(255, 68, 102, 0.4)',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 0 45px rgba(255, 68, 102, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 68, 102, 0.4)'
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  )

  return (
    <>
      {scene === 'songSelect' && renderSongSelect()}
      {scene === 'playing' && renderGameHUD()}
      {scene === 'gameOver' && renderGameOver()}
    </>
  )
}
