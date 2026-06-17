import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 10,
    fontFamily: "'Noto Sans SC', sans-serif",
    color: 'white',
  },
  scoreContainer: {
    position: 'absolute',
    top: '5%',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  score: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(24px, 4vw, 40px)',
    fontWeight: 900,
    color: '#FFFFFF',
    textShadow: '0 0 10px #00BFFF, 0 0 20px #00BFFF, 2px 2px 4px rgba(0,191,255,0.5)',
    letterSpacing: '4px',
    lineHeight: 1,
    margin: 0,
  },
  scoreLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: 'clamp(10px, 1.2vw, 14px)',
    color: '#88AAFF',
    letterSpacing: '2px',
    marginBottom: '4px',
    opacity: 0.8,
  },
  combo: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(16px, 2.5vw, 28px)',
    fontWeight: 700,
    color: '#FF69B4',
    textShadow: '0 0 8px #FF69B4',
    marginTop: '8px',
    opacity: 1,
    transition: 'opacity 0.2s',
  },
  comboEmpty: {
    opacity: 0.3,
  },
  hudLeft: {
    position: 'absolute',
    top: '5%',
    left: '3%',
    pointerEvents: 'none',
  },
  healthBarContainer: {
    width: 'clamp(120px, 18vw, 220px)',
    height: '16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(0,191,255,0.3)',
    boxShadow: '0 0 10px rgba(0,191,255,0.1)',
  },
  healthBar: {
    height: '100%',
    borderRadius: '8px',
    background: 'linear-gradient(90deg, #FF4444 0%, #FF69B4 50%, #00BFFF 100%)',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 12px rgba(255,105,180,0.5)',
  },
  healthLabel: {
    fontSize: 'clamp(10px, 1vw, 12px)',
    color: '#AACCFF',
    marginBottom: '6px',
    letterSpacing: '1px',
  },
  hudRight: {
    position: 'absolute',
    top: '5%',
    right: '3%',
    pointerEvents: 'auto',
  },
  pauseBtn: {
    width: 'clamp(36px, 4vw, 44px)',
    height: 'clamp(36px, 4vw, 44px)',
    background: 'rgba(26, 42, 74, 0.8)',
    border: '1px solid rgba(0,191,255,0.5)',
    borderRadius: '10px',
    color: '#00BFFF',
    fontSize: 'clamp(14px, 1.5vw, 18px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    fontWeight: 'bold',
  },
  startOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  startTitle: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(32px, 6vw, 72px)',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #FF69B4 0%, #00BFFF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
    letterSpacing: '6px',
    textAlign: 'center',
  },
  startSubtitle: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: 'clamp(12px, 1.5vw, 18px)',
    color: '#AACCFF',
    marginBottom: '40px',
    letterSpacing: '2px',
    textAlign: 'center',
    maxWidth: '90%',
  },
  startBtn: {
    width: 'clamp(160px, 20vw, 200px)',
    height: 'clamp(48px, 6vw, 60px)',
    background: 'linear-gradient(135deg, #6C63FF 0%, #483D8B 100%)',
    border: 'none',
    borderRadius: '30px',
    color: 'white',
    fontSize: 'clamp(16px, 2vw, 24px)',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 20px rgba(108, 99, 255, 0.5), 0 4px 15px rgba(0,0,0,0.3)',
    letterSpacing: '2px',
  },
  controlsInfo: {
    marginTop: '40px',
    textAlign: 'center',
    color: '#6688BB',
    fontSize: 'clamp(10px, 1.2vw, 14px)',
    lineHeight: 2,
    letterSpacing: '1px',
  },
  keyBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(26, 42, 74, 0.9)',
    border: '1px solid rgba(0,191,255,0.4)',
    borderRadius: '6px',
    color: '#00BFFF',
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    margin: '0 4px',
  },
  gameoverPanel: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  panel: {
    width: 'clamp(300px, 85vw, 400px)',
    background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: 'clamp(24px, 4vw, 40px)',
    boxShadow: 'inset 0 2px 10px rgba(0,191,255,0.1), 0 10px 40px rgba(0,0,0,0.5)',
    border: '1px solid rgba(0,191,255,0.2)',
    textAlign: 'center',
  },
  panelTitle: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(24px, 3.5vw, 36px)',
    fontWeight: 900,
    color: '#FF69B4',
    marginBottom: '24px',
    textShadow: '0 0 20px rgba(255,105,180,0.5)',
    letterSpacing: '4px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid rgba(0,191,255,0.1)',
  },
  statsLabel: {
    fontSize: 'clamp(12px, 1.4vw, 16px)',
    color: '#88AAFF',
    letterSpacing: '1px',
  },
  statsValue: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(18px, 2.5vw, 28px)',
    fontWeight: 700,
    color: '#00BFFF',
    textShadow: '0 0 10px rgba(0,191,255,0.5)',
  },
  replayBtn: {
    marginTop: '32px',
    width: 'clamp(140px, 80%, 200px)',
    height: 'clamp(44px, 5vw, 54px)',
    background: 'linear-gradient(135deg, #00BFFF 0%, #6C63FF 100%)',
    border: 'none',
    borderRadius: '27px',
    color: 'white',
    fontSize: 'clamp(14px, 1.8vw, 20px)',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 20px rgba(0,191,255,0.4)',
    letterSpacing: '2px',
  },
  edgeFlash: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    boxShadow: 'inset 0 0 80px 20px rgba(0,191,255,0.6)',
    animation: 'none',
  },
  edgeFlashActive: {
    animation: 'edgeFlashAnim 0.5s ease-out',
  },
  fullscreenFlash: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.15)',
    pointerEvents: 'none',
    animation: 'fullscreenFlashAnim 0.8s ease-out',
  },
  comboBreak: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 'clamp(40px, 8vw, 80px)',
    color: '#FF4444',
    fontWeight: 900,
    textShadow: '0 0 20px #FF0000, 0 0 40px #FF0000',
    animation: 'comboBreakAnim 0.3s ease-out forwards',
    pointerEvents: 'none',
    fontFamily: "'Orbitron', monospace",
  },
  pauseOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    backdropFilter: 'blur(4px)',
  },
  pauseTitle: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(28px, 5vw, 48px)',
    color: '#00BFFF',
    textShadow: '0 0 20px #00BFFF',
    marginBottom: '32px',
    letterSpacing: '4px',
  },
}

const keyframesCss = `
@keyframes edgeFlashAnim {
  0% { opacity: 1; }
  100% { opacity: 0; box-shadow: inset 0 0 0px 0px rgba(0,191,255,0); }
}
@keyframes fullscreenFlashAnim {
  0% { opacity: 0; background: rgba(255,255,255,0); }
  20% { opacity: 1; background: rgba(255,255,255,0.15); }
  100% { opacity: 0; background: rgba(255,255,255,0); }
}
@keyframes comboBreakAnim {
  0% { transform: translateX(-50%) scale(0.5); opacity: 1; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
}
`

export default function UIOverlay() {
  const status = useGameStore(s => s.status)
  const score = useGameStore(s => s.score)
  const combo = useGameStore(s => s.combo)
  const maxCombo = useGameStore(s => s.maxCombo)
  const health = useGameStore(s => s.health)
  const perfectFlash = useGameStore(s => s.perfectFlash)
  const comboBreakFlash = useGameStore(s => s.comboBreakFlash)
  const fullscreenFlash = useGameStore(s => s.fullscreenFlash)
  const startGame = useGameStore(s => s.startGame)
  const pauseGame = useGameStore(s => s.pauseGame)
  const resumeGame = useGameStore(s => s.resumeGame)
  const resetGame = useGameStore(s => s.resetGame)

  const [btnHover, setBtnHover] = useState(false)
  const [replayHover, setReplayHover] = useState(false)
  const [pauseHover, setPauseHover] = useState(false)

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.innerHTML = keyframesCss
    document.head.appendChild(styleEl)
    return () => {
      document.head.removeChild(styleEl)
    }
  }, [])

  const handleStart = () => {
    resetGame()
    setTimeout(() => startGame(), 50)
  }

  const handleReplay = () => {
    resetGame()
    setTimeout(() => startGame(), 50)
  }

  const formatScore = (n: number) => n.toString().padStart(6, '0')

  return (
    <div style={styles.overlay}>
      {(status === 'playing' || status === 'paused') && (
        <>
          <div style={styles.scoreContainer}>
            <div style={styles.scoreLabel}>SCORE 得分</div>
            <div style={styles.score}>{formatScore(score)}</div>
            <div style={{
              ...styles.combo,
              ...(combo <= 0 ? styles.comboEmpty : {}),
            }}>
              {combo > 0 ? `COMBO x${combo}` : 'NO COMBO'}
            </div>
          </div>

          <div style={styles.hudLeft}>
            <div style={styles.healthLabel}>HP 生命值</div>
            <div style={styles.healthBarContainer}>
              <div style={{ ...styles.healthBar, width: `${health}%` }} />
            </div>
          </div>

          <div style={styles.hudRight}>
            <button
              style={{
                ...styles.pauseBtn,
                ...(pauseHover ? {
                  background: 'rgba(0, 191, 255, 0.3)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 15px rgba(0,191,255,0.4)',
                } : {}),
              }}
              onClick={status === 'paused' ? resumeGame : pauseGame}
              onMouseEnter={() => setPauseHover(true)}
              onMouseLeave={() => setPauseHover(false)}
            >
              {status === 'paused' ? '▶' : '⏸'}
            </button>
          </div>
        </>
      )}

      {perfectFlash && (
        <div
          key={`edge-${Date.now()}`}
          style={{
            ...styles.edgeFlash,
            ...styles.edgeFlashActive,
          }}
        />
      )}

      {fullscreenFlash && (
        <div
          key={`fs-${Date.now()}`}
          style={styles.fullscreenFlash}
        />
      )}

      {comboBreakFlash && (
        <div
          key={`cb-${Date.now()}`}
          style={styles.comboBreak}
        >
          ✕
        </div>
      )}

      {status === 'idle' && (
        <div style={styles.startOverlay}>
          <h1 style={styles.startTitle}>RHYTHM RUSH</h1>
          <p style={styles.startSubtitle}>跟随节拍，跃动无限 · 节奏跑酷游戏</p>
          <button
            style={{
              ...styles.startBtn,
              ...(btnHover ? {
                transform: 'scale(1.05)',
                boxShadow: '0 0 30px rgba(108, 99, 255, 0.8), 0 6px 25px rgba(0,0,0,0.4)',
              } : {}),
            }}
            onClick={handleStart}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            开始游戏
          </button>
          <div style={styles.controlsInfo}>
            <div>
              <span style={styles.keyBadge}>空格</span>
              <span style={{ marginRight: 20 }}>跳跃 躲避方块</span>
              <span style={styles.keyBadge}>↓</span>
              <span>滑铲 穿越拱门</span>
            </div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              按节拍完美通过可获得更高分数和连击加成
            </div>
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div style={styles.pauseOverlay}>
          <div style={styles.pauseTitle}>— 已暂停 —</div>
          <button
            style={{
              ...styles.startBtn,
              ...(btnHover ? {
                transform: 'scale(1.05)',
                boxShadow: '0 0 30px rgba(108, 99, 255, 0.8)',
              } : {}),
            }}
            onClick={resumeGame}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            继续游戏
          </button>
          <div style={{ marginTop: 20, color: '#6688BB', fontSize: 12 }}>
            按 ESC 键也可继续游戏
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div style={styles.gameoverPanel}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>GAME OVER</div>

            <div style={styles.statsRow}>
              <span style={styles.statsLabel}>最终得分</span>
              <span style={styles.statsValue}>{formatScore(score)}</span>
            </div>

            <div style={styles.statsRow}>
              <span style={styles.statsLabel}>连击峰值</span>
              <span style={{ ...styles.statsValue, color: '#FF69B4' }}>x{maxCombo}</span>
            </div>

            <div style={{ ...styles.statsRow, borderBottom: 'none' }}>
              <span style={styles.statsLabel}>评级</span>
              <span style={{
                ...styles.statsValue,
                color: score >= 8000 ? '#FFD700' : score >= 5000 ? '#C0C0C0' : score >= 2000 ? '#CD7F32' : '#6688BB',
              }}>
                {score >= 8000 ? 'S' : score >= 5000 ? 'A' : score >= 2000 ? 'B' : score >= 1000 ? 'C' : 'D'}
              </span>
            </div>

            <button
              style={{
                ...styles.replayBtn,
                ...(replayHover ? {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 30px rgba(0,191,255,0.7)',
                } : {}),
              }}
              onClick={handleReplay}
              onMouseEnter={() => setReplayHover(true)}
              onMouseLeave={() => setReplayHover(false)}
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
