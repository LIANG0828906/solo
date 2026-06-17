import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

const keyframes = `
@keyframes edgeFlashAnim {
  0% { opacity: 1; }
  100% { opacity: 0; box-shadow: inset 0 0 0 0 rgba(255,107,157,0); }
}
@keyframes fullscreenFlashAnim {
  0% { opacity: 0; background: rgba(255,255,255,0); }
  15% { opacity: 1; background: rgba(255,255,255,0.15); }
  100% { opacity: 0; background: rgba(255,255,255,0); }
}
@keyframes comboBreakAnim {
  0% { transform: translateX(-50%) scale(0.4); opacity: 0; }
  30% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.9); opacity: 0; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
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

  const [startHover, setStartHover] = useState(false)
  const [replayHover, setReplayHover] = useState(false)
  const [pauseHover, setPauseHover] = useState(false)
  const [resumeHover, setResumeHover] = useState(false)

  useEffect(() => {
    const el = document.createElement('style')
    el.innerHTML = keyframes
    document.head.appendChild(el)
    return () => { document.head.removeChild(el) }
  }, [])

  const handleStart = () => {
    resetGame()
    setTimeout(() => startGame(), 30)
  }
  const handleReplay = () => {
    resetGame()
    setTimeout(() => startGame(), 30)
  }
  const padScore = (n: number) => n.toString().padStart(6, '0')

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 10, fontFamily: "'Noto Sans SC', sans-serif", color: 'white',
    }}>
      {(status === 'playing' || status === 'paused') && (
        <>
          <div style={{
            position: 'absolute', top: '5%', left: '4%', pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '11px', color: '#8899CC', letterSpacing: '2px',
              marginBottom: '4px', opacity: 0.8,
            }}>SCORE 得分</div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(22px, 3.8vw, 40px)',
              fontWeight: 900, color: '#FFFFFF',
              textShadow: '0 0 10px #FF6B9D, 0 0 20px rgba(255,107,157,0.5), 2px 2px 4px rgba(0,0,0,0.4)',
              letterSpacing: '3px', lineHeight: 1, margin: 0,
            }}>
              {padScore(score)}
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '11px', color: '#8899CC', letterSpacing: '2px',
              marginBottom: '2px', opacity: 0.8,
            }}>COMBO 连击</div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(14px, 2.2vw, 26px)',
              fontWeight: 700,
              color: combo > 0 ? '#FF6B9D' : '#445577',
              textShadow: combo > 0 ? '0 0 8px #FF6B9D, 0 0 16px rgba(255,107,157,0.4)' : 'none',
              animation: combo >= 10 ? 'pulse 0.5s ease-in-out infinite' : 'none',
              transition: 'all 0.15s',
            }}>
              {combo > 0 ? `x${combo}` : 'x0'}
            </div>
          </div>

          <div style={{
            position: 'absolute', top: '5%', left: '50%',
            transform: 'translateX(-50%)', pointerEvents: 'none',
            width: 'clamp(200px, 35vw, 420px)',
          }}>
            <div style={{
              fontSize: '11px', color: '#8899CC', letterSpacing: '2px',
              marginBottom: '6px', textAlign: 'center', opacity: 0.8,
            }}>HP 生命值</div>
            <div style={{
              height: '18px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '9px',
              overflow: 'hidden',
              border: '1px solid rgba(123, 104, 238, 0.3)',
              boxShadow: '0 0 12px rgba(123,104,238,0.1), inset 0 1px 2px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '9px',
                width: `${health}%`,
                background: health > 50
                  ? 'linear-gradient(90deg, #7B68EE 0%, #00BFFF 60%, #66FF99 100%)'
                  : health > 25
                  ? 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)'
                  : 'linear-gradient(90deg, #FF4444 0%, #FF0000 100%)',
                transition: 'width 0.25s ease',
                boxShadow: health > 50
                  ? '0 0 14px rgba(0,191,255,0.5)'
                  : health > 25
                  ? '0 0 14px rgba(255,140,0,0.5)'
                  : '0 0 14px rgba(255,0,0,0.6)',
              }} />
            </div>
            <div style={{
              marginTop: '4px', textAlign: 'center',
              fontSize: '10px', color: '#AABBEE', opacity: 0.7,
            }}>
              {health} / 100
            </div>
          </div>

          <div style={{
            position: 'absolute', top: '5%', right: '4%', pointerEvents: 'auto',
          }}>
            <button
              style={{
                width: '42px', height: '42px',
                background: 'rgba(26, 32, 58, 0.85)',
                border: '1px solid rgba(123, 104, 238, 0.4)',
                borderRadius: '10px',
                color: '#7B68EE', fontSize: '16px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                fontWeight: 'bold',
                backdropFilter: 'blur(4px)',
                ...(pauseHover ? {
                  background: 'rgba(123, 104, 238, 0.25)',
                  transform: 'scale(1.06)',
                  boxShadow: '0 0 16px rgba(123,104,238,0.4)',
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
        <div key={`ef-${Date.now()}`} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: 'inset 0 0 100px 25px rgba(255,107,157,0.7)',
          animation: 'edgeFlashAnim 0.5s ease-out',
        }} />
      )}

      {fullscreenFlash && (
        <div key={`fs-${Date.now()}`} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(255,255,255,0.15)',
          animation: 'fullscreenFlashAnim 0.8s ease-out',
        }} />
      )}

      {comboBreakFlash && (
        <div key={`cb-${Date.now()}`} style={{
          position: 'absolute',
          top: '18%', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(36px, 7vw, 72px)',
          color: '#FF4444',
          fontWeight: 900,
          textShadow: '0 0 20px #FF0000, 0 0 40px #FF0000',
          animation: 'comboBreakAnim 0.3s ease-out forwards',
          pointerEvents: 'none',
          fontFamily: "'Orbitron', monospace",
        }}>
          ✕
        </div>
      )}

      {status === 'idle' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(30px, 6vw, 70px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #7B68EE 50%, #00BFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px', letterSpacing: '5px',
            textAlign: 'center',
          }}>RHYTHM RUSH</h1>
          <p style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: 'clamp(12px, 1.5vw, 18px)',
            color: '#8899CC', marginBottom: '44px',
            letterSpacing: '2px', textAlign: 'center',
            maxWidth: '90%',
          }}>跟随节拍 · 跃动无限 · 节奏跑酷</p>

          <button
            style={{
              width: 'clamp(150px, 20vw, 200px)',
              height: 'clamp(46px, 6vw, 58px)',
              background: 'linear-gradient(135deg, #6C63FF 0%, #483D8B 100%)',
              border: 'none', borderRadius: '30px',
              color: 'white',
              fontSize: 'clamp(15px, 2vw, 22px)',
              fontFamily: "'Noto Sans SC', sans-serif",
              fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 22px rgba(108, 99, 255, 0.5), 0 4px 18px rgba(0,0,0,0.3)',
              letterSpacing: '2px',
              ...(startHover ? {
                transform: 'scale(1.05)',
                boxShadow: '0 0 36px rgba(108, 99, 255, 0.8), 0 6px 26px rgba(0,0,0,0.4)',
              } : {}),
            }}
            onClick={handleStart}
            onMouseEnter={() => setStartHover(true)}
            onMouseLeave={() => setStartHover(false)}
          >
            开始游戏
          </button>

          <div style={{
            marginTop: '40px', textAlign: 'center',
            color: '#667799', fontSize: 'clamp(11px, 1.2vw, 14px)',
            lineHeight: 2.2, letterSpacing: '1px',
          }}>
            <div>
              <span style={{
                display: 'inline-block', padding: '4px 12px',
                background: 'rgba(26, 42, 74, 0.9)',
                border: '1px solid rgba(255,107,157,0.35)',
                borderRadius: '6px', color: '#FF6B9D',
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700, margin: '0 6px',
              }}>空格</span>
              <span style={{ marginRight: 22 }}>跳跃 躲避红色方块</span>
              <span style={{
                display: 'inline-block', padding: '4px 12px',
                background: 'rgba(26, 42, 74, 0.9)',
                border: '1px solid rgba(123, 104, 238, 0.35)',
                borderRadius: '6px', color: '#7B68EE',
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700, margin: '0 6px',
              }}>↓</span>
              <span>滑铲 穿过紫色拱门</span>
            </div>
            <div style={{ marginTop: 10, opacity: 0.75 }}>
              节拍前后 150ms 内操作 = 完美 +100 分，300ms 内 = 普通 +50 分
            </div>
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(26px, 5vw, 46px)',
            color: '#7B68EE',
            textShadow: '0 0 20px rgba(123, 104, 238, 0.6)',
            marginBottom: '32px', letterSpacing: '4px',
          }}>— 已 暂 停 —</div>
          <button
            style={{
              width: 'clamp(150px, 20vw, 200px)',
              height: 'clamp(46px, 6vw, 58px)',
              background: 'linear-gradient(135deg, #6C63FF 0%, #483D8B 100%)',
              border: 'none', borderRadius: '30px',
              color: 'white',
              fontSize: 'clamp(15px, 2vw, 22px)',
              fontFamily: "'Noto Sans SC', sans-serif",
              fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 22px rgba(108, 99, 255, 0.5)',
              letterSpacing: '2px',
              ...(resumeHover ? {
                transform: 'scale(1.05)',
                boxShadow: '0 0 36px rgba(108, 99, 255, 0.8)',
              } : {}),
            }}
            onClick={resumeGame}
            onMouseEnter={() => setResumeHover(true)}
            onMouseLeave={() => setResumeHover(false)}
          >
            继续游戏
          </button>
          <div style={{ marginTop: 22, color: '#556688', fontSize: 12 }}>
            按 ESC 键可快速继续
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          <div style={{
            width: 'clamp(280px, 85vw, 400px)',
            background: 'linear-gradient(145deg, #12122A 0%, #1A1035 100%)',
            borderRadius: '16px',
            padding: 'clamp(22px, 4vw, 38px)',
            boxShadow: 'inset 0 2px 12px rgba(123, 104, 238, 0.12), 0 12px 42px rgba(0,0,0,0.55)',
            border: '1px solid rgba(123, 104, 238, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(22px, 3.5vw, 34px)',
              fontWeight: 900,
              color: '#FF6B9D',
              marginBottom: '24px',
              textShadow: '0 0 20px rgba(255,107,157,0.5)',
              letterSpacing: '4px',
            }}>GAME OVER</div>

            {[
              { label: '最终得分', value: padScore(score), color: '#00BFFF' },
              { label: '连击峰值', value: `x${maxCombo}`, color: '#FFD700' },
              { label: '评级', value: (
                score >= 8000 ? 'S' :
                score >= 5000 ? 'A' :
                score >= 2000 ? 'B' :
                score >= 1000 ? 'C' : 'D'
              ), color: (
                score >= 8000 ? '#FFD700' :
                score >= 5000 ? '#C0C0C0' :
                score >= 2000 ? '#CD7F32' :
                score >= 1000 ? '#7B68EE' : '#445577'
              )},
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(123, 104, 238, 0.1)' : 'none',
              }}>
                <span style={{
                  fontSize: 'clamp(12px, 1.4vw, 15px)',
                  color: '#8899CC', letterSpacing: '1px',
                }}>{row.label}</span>
                <span style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(17px, 2.4vw, 26px)',
                  fontWeight: 700, color: row.color,
                  textShadow: `0 0 8px ${row.color}66`,
                }}>{row.value}</span>
              </div>
            ))}

            <button
              style={{
                marginTop: '30px',
                width: 'clamp(130px, 80%, 200px)',
                height: 'clamp(42px, 5vw, 52px)',
                background: 'linear-gradient(135deg, #00BFFF 0%, #7B68EE 100%)',
                border: 'none', borderRadius: '26px',
                color: 'white',
                fontSize: 'clamp(13px, 1.8vw, 19px)',
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 22px rgba(0,191,255,0.45)',
                letterSpacing: '2px',
                ...(replayHover ? {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 36px rgba(0,191,255,0.7)',
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
