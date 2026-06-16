import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore, type Spell } from './game/GameStore'
import { HandTracker, type GestureResult } from './game/HandTracker'
import { ParticleSystem } from './game/ParticleSystem'
import { MagicCircle } from './game/MagicCircle'
import './App.css'

const App: React.FC = () => {
  const {
    spells,
    history,
    currentScore,
    isCasting,
    activeSpell,
    addHistory,
    setScore,
    setCasting,
    setActiveSpell
  } = useGameStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handTrackerRef = useRef<HandTracker | null>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const animationRef = useRef<number>(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scoreAnimation, setScoreAnimation] = useState<number | null>(null)
  const [scoreSpellName, setScoreSpellName] = useState<string>('')
  const [isHighScore, setIsHighScore] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const scoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const effectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGestureDetected = useCallback((result: GestureResult) => {
    if (!result.spellId || isCasting) return

    const spell = spells.find(s => s.id === result.spellId)
    if (!spell) return

    const baseScore = Math.round(result.confidence * 70)
    const speedBonus = Math.round(result.speed * 30)
    const totalScore = Math.min(baseScore + speedBonus, 100)

    setActiveSpell(spell)
    setCasting(true)
    triggerScoreAnimation(totalScore, spell)

    addHistory(spell, totalScore)

    const canvas = canvasRef.current
    if (canvas && particleSystemRef.current) {
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      particleSystemRef.current.addSpellEffect({
        centerX,
        centerY,
        spellId: spell.id,
        color: spell.color
      })
    }

    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current)
    }
    effectTimeoutRef.current = setTimeout(() => {
      setCasting(false)
      setActiveSpell(null)
    }, 2000)
  }, [spells, isCasting, addHistory, setActiveSpell, setCasting])

  const triggerScoreAnimation = (score: number, spell: Spell) => {
    if (scoreTimeoutRef.current) {
      clearTimeout(scoreTimeoutRef.current)
    }

    setScoreSpellName(spell.name)
    setIsHighScore(score >= 80)
    setScore(score)
    setScoreAnimation(0)

    let start = 0
    const startTime = performance.now()
    const duration = 600

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const elasticProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      const currentScore = Math.round(elasticProgress * score)
      setScoreAnimation(currentScore)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)

    scoreTimeoutRef.current = setTimeout(() => {
      setScoreAnimation(null)
      setScore(null)
    }, 2500)
  }

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraReady(true)
        }
      } catch (err) {
        setCameraError('无法访问摄像头，请确保已授权摄像头权限')
        console.error('Camera error:', err)
      }
    }

    initCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!cameraReady || !videoRef.current) return

    const initTracker = async () => {
      const tracker = new HandTracker()
      await tracker.init(videoRef.current!)
      tracker.setOnGestureDetected(handleGestureDetected)
      handTrackerRef.current = tracker
      tracker.start()
    }

    initTracker()

    return () => {
      if (handTrackerRef.current) {
        handTrackerRef.current.stop()
        handTrackerRef.current.destroy()
      }
    }
  }, [cameraReady, handleGestureDetected])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getMagicCircleSize = () => {
    const { width, height } = windowSize
    const minDim = Math.min(width, height)
    if (width < 768) {
      return Math.min(minDim * 0.7, 400)
    }
    return Math.min(minDim * 0.65, 600)
  }

  useEffect(() => {
    particleSystemRef.current = new ParticleSystem()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const render = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      if (particleSystemRef.current) {
        particleSystemRef.current.update()
        particleSystemRef.current.render(ctx)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    const ratio = score / 100
    const r = Math.round(255 * (1 - ratio))
    const g = Math.round(255 * ratio)
    return `rgb(${r + 68}, ${g + 68}, 68)`
  }

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.particleCanvas}
      />

      <MagicCircle
        size={getMagicCircleSize()}
        isCasting={isCasting}
        activeColor={activeSpell?.color || '#9b59ff'}
      />

      {/* Left Panel - History */}
      <div style={styles.leftPanel} className="left-panel">
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>✨ 施法记录</span>
        </div>
        <div style={styles.panelContent} className="panel-content">
          {history.length === 0 ? (
            <div style={styles.emptyHistory}>
              <p style={styles.emptyText}>尚无施法记录</p>
              <p style={styles.emptySubtext}>在魔法阵中做出手势开始施法</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="history-item"
                  style={{
                    ...styles.historyItem,
                    animation: `float ${2 + index * 0.3}s ease-in-out infinite`
                  }}
                >
                  <span style={styles.historyIcon}>{entry.icon}</span>
                  <div style={styles.historyInfo}>
                    <span style={{ ...styles.historyName, color: entry.color }}>
                      {entry.spellName}
                    </span>
                    <span style={styles.historyTime}>
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <span style={{
                    ...styles.historyScore,
                    color: getScoreColor(entry.score)
                  }}>
                    {entry.score}分
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Spells */}
      <div style={styles.rightPanel} className="right-panel">
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>📜 咒语图鉴</span>
        </div>
        <div style={styles.panelContent} className="panel-content">
          <div style={styles.spellList}>
            {spells.map((spell) => (
              <div
                key={spell.id}
                className="spell-item"
                style={{
                  ...styles.spellItem,
                  borderColor: activeSpell?.id === spell.id ? spell.color : '#d4af37',
                  boxShadow: activeSpell?.id === spell.id
                    ? `0 0 20px ${spell.color}66`
                    : 'none'
                }}
              >
                <span style={styles.spellIcon}>{spell.icon}</span>
                <div style={styles.spellInfo}>
                  <span style={{ ...styles.spellName, color: spell.color }}>
                    {spell.name}
                  </span>
                  <span style={styles.spellDesc}>{spell.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Camera Preview */}
      <div style={styles.cameraContainer} className="camera-container">
        <video
          ref={videoRef}
          style={styles.cameraVideo}
          muted
          playsInline
        />
        {cameraError && (
          <div style={styles.cameraError}>{cameraError}</div>
        )}
        {!cameraReady && !cameraError && (
          <div style={styles.cameraLoading}>
            <span>📷 正在启动摄像头...</span>
          </div>
        )}
      </div>

      {/* Score Bar */}
      {scoreAnimation !== null && (
        <div style={styles.scoreContainer} className="score-container">
          <div style={styles.scoreHeader}>
            <span style={styles.scoreSpellName}>{scoreSpellName}</span>
            <span style={{ ...styles.scoreValue, color: getScoreColor(scoreAnimation) }}>
              {scoreAnimation}
            </span>
          </div>
          <div style={styles.scoreBarBg}>
            <div
              style={{
                ...styles.scoreBarFill,
                width: `${scoreAnimation}%`,
                background: `linear-gradient(90deg, #ff4444, #ffaa00, #44ff44)`,
                transition: 'none'
              }}
            />
          </div>
          {isHighScore && (
            <div style={styles.highScoreBadge}>
              ⚡ 完美施法！效果翻倍！
            </div>
          )}
        </div>
      )}

      {/* Bottom hint */}
      <div style={styles.bottomHint} className="bottom-hint">
        <p>将手放在摄像头前，在中央魔法阵区域内做出对应手势施放咒语</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#1a0f2e',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  particleCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2
  },

  leftPanel: {
    position: 'absolute',
    left: '24px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '300px',
    backgroundColor: 'rgba(42, 31, 62, 0.9)',
    border: '2px solid #d4af37',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(212, 175, 55, 0.05)',
    zIndex: 10,
    backdropFilter: 'blur(10px)'
  },

  rightPanel: {
    position: 'absolute',
    right: '24px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '300px',
    backgroundColor: 'rgba(42, 31, 62, 0.9)',
    border: '2px solid #d4af37',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(212, 175, 55, 0.05)',
    zIndex: 10,
    backdropFilter: 'blur(10px)'
  },

  panelHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
    textAlign: 'center'
  },

  panelTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d4af37',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
    letterSpacing: '2px'
  },

  panelContent: {
    padding: '16px'
  },

  emptyHistory: {
    textAlign: 'center',
    padding: '30px 10px'
  },

  emptyText: {
    color: 'rgba(212, 175, 55, 0.6)',
    fontSize: '14px',
    marginBottom: '8px'
  },

  emptySubtext: {
    color: 'rgba(212, 175, 55, 0.4)',
    fontSize: '12px'
  },

  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.2)'
  },

  historyIcon: {
    fontSize: '24px'
  },

  historyInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },

  historyName: {
    fontSize: '14px',
    fontWeight: 'bold'
  },

  historyTime: {
    fontSize: '11px',
    color: 'rgba(212, 175, 55, 0.5)'
  },

  historyScore: {
    fontSize: '16px',
    fontWeight: 'bold'
  },

  spellList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  spellItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: '8px',
    border: '1.5px solid #d4af37',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },

  spellIcon: {
    fontSize: '28px'
  },

  spellInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  spellName: {
    fontSize: '15px',
    fontWeight: 'bold',
    textShadow: '0 0 8px currentColor'
  },

  spellDesc: {
    fontSize: '11px',
    color: 'rgba(212, 175, 55, 0.6)'
  },

  cameraContainer: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    width: '200px',
    height: '150px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5)',
    border: '2px solid rgba(212, 175, 55, 0.6)',
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },

  cameraVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)'
  },

  cameraError: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ff6b6b',
    fontSize: '12px',
    textAlign: 'center',
    padding: '10px'
  },

  cameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#d4af37',
    fontSize: '12px'
  },

  scoreContainer: {
    position: 'absolute',
    left: '360px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '200px',
    padding: '16px',
    backgroundColor: 'rgba(42, 31, 62, 0.95)',
    border: '2px solid #d4af37',
    borderRadius: '12px',
    boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)',
    zIndex: 15,
    animation: 'scoreSlideIn 0.4s ease-out'
  },

  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },

  scoreSpellName: {
    fontSize: '14px',
    color: '#d4af37',
    fontWeight: 'bold'
  },

  scoreValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    textShadow: '0 0 10px currentColor'
  },

  scoreBarBg: {
    width: '100%',
    height: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },

  scoreBarFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    boxShadow: '0 0 10px currentColor'
  },

  highScoreBadge: {
    marginTop: '10px',
    textAlign: 'center',
    padding: '6px 10px',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    border: '1px solid #ffd700',
    borderRadius: '6px',
    color: '#ffd700',
    fontSize: '12px',
    fontWeight: 'bold',
    animation: 'pulse 1s ease-in-out infinite'
  },

  bottomHint: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(212, 175, 55, 0.5)',
    fontSize: '13px',
    textAlign: 'center',
    zIndex: 5
  }
}

export default App
