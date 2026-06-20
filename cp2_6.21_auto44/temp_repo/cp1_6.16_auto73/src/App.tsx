import { useEffect, useState, useRef, useCallback } from 'react'
import { AppStateProvider, useAppState } from './store/AppState'
import TimerDisplay from './timer/TimerDisplay'
import { useTimer } from './timer/Timer'
import RankingBoard from './ranking/RankingBoard'

function playNatureSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime
    const duration = 3

    const createOceanNoise = () => {
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize
        data[i] = (Math.random() * 2 - 1) * 0.5 * (1 - Math.abs(t - 0.5) * 1.5)
      }
      return buffer
    }

    const source = ctx.createBufferSource()
    source.buffer = createOceanNoise()

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, now)
    filter.frequency.linearRampToValueAtTime(2000, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now + 0.5)
    osc.frequency.setValueAtTime(900, now + 0.7)
    osc.frequency.setValueAtTime(1400, now + 1.2)
    osc.frequency.setValueAtTime(1100, now + 1.4)

    const birdGain = ctx.createGain()
    birdGain.gain.setValueAtTime(0, now)
    birdGain.gain.linearRampToValueAtTime(0.08, now + 0.5)
    birdGain.gain.linearRampToValueAtTime(0, now + 0.8)
    birdGain.gain.linearRampToValueAtTime(0.08, now + 1.2)
    birdGain.gain.linearRampToValueAtTime(0, now + 1.5)

    source.connect(filter).connect(gain).connect(ctx.destination)
    osc.connect(birdGain).connect(ctx.destination)

    source.start(now)
    osc.start(now + 0.5)
    osc.stop(now + 1.5)

    setTimeout(() => ctx.close(), (duration + 0.5) * 1000)
  } catch (e) {
    // Audio might be blocked
  }
}

function StatusBar() {
  const { onlineCount, currentUser } = useAppState()
  const todayProgress = Math.min(1, (currentUser?.todayMinutes || 0) / 480)
  const progressRef = useRef(todayProgress)
  const displayRef = useRef(0)
  const rafRef = useRef(0)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    progressRef.current = todayProgress
    const start = displayRef.current
    const target = todayProgress
    const startTime = performance.now()
    const animDur = 800

    const animate = () => {
      const t = Math.min(1, (performance.now() - startTime) / animDur)
      const ease = 1 - Math.pow(1 - t, 3)
      displayRef.current = start + (target - start) * ease
      setDisplayProgress(displayRef.current)
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
      else rafRef.current = requestAnimationFrame(() => {
        displayRef.current = (displayRef.current + 0.01 / 100) % 1
        setDisplayProgress(displayRef.current)
      })
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [todayProgress])

  const minutes = currentUser?.todayMinutes || 0
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return (
    <div style={{
      position: 'relative',
      margin: '0 auto 28px',
      maxWidth: 560,
      padding: '16px 28px',
      borderRadius: '0 0 28px 28px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.7)',
      borderTop: 'none',
      boxShadow: '0 8px 32px rgba(92, 107, 122, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: '#4CAF50',
          boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
        }} />
        <span className="breathe" style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#2D3748',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {onlineCount}
        </span>
        <span style={{ fontSize: 13, color: '#5C6B7A', fontWeight: 500 }}>
          人在线
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(92,107,122,0.12)" strokeWidth="4" />
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#66BB6A" />
                <stop offset="100%" stopColor="#FFD54F" />
              </linearGradient>
            </defs>
            <circle
              cx="26" cy="26" r="22"
              fill="none"
              stroke="url(#ring-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - displayProgress)}`}
              transform="rotate(-90 26 26)"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#8B95A5', marginBottom: 2 }}>今日专注</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748' }}>
            {hours}h {mins}m
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryWindow({ onClose }: { onClose: () => void }) {
  const { currentUser, lastSessionMinutes } = useAppState()
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 300)
  }

  const flameColor = (() => {
    const days = currentUser?.consecutiveDays || 0
    if (days >= 7) return { main: '#FFD700', glow: '#FFA500' }
    const ratio = Math.max(0, Math.min(1, (days - 1) / 6))
    const r = Math.round(59 + ratio * (239 - 59))
    const g = Math.round(130 + ratio * (83 - 130))
    const b = Math.round(246 + ratio * (80 - 246))
    return { main: `rgb(${r}, ${g}, ${b})`, glow: `rgba(${r}, ${g}, ${b}, 0.5)` }
  })()

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '28px 24px 32px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.15)',
          animation: closing ? 'slide-up 0.3s ease reverse' : 'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div className={(currentUser?.consecutiveDays || 0) >= 7 ? 'flame-flicker' : ''} style={{
            filter: `drop-shadow(0 0 8px ${flameColor.glow})`
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24">
              <path
                d="M12 2C12 2 7 8 7 14C7 17.31 9.69 20 13 20C16.31 20 19 17.31 19 14C19 10 16 8 14 6C14 9 12 10 12 12C12 9 13 6 12 2Z"
                fill={flameColor.main}
              />
            </svg>
          </div>
          <button
            onClick={handleClose}
            className="close-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#E2E8F0',
              color: '#5C6B7A',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#2D3748' }}>
          专注完成 🎉
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#8B95A5' }}>
          休息一下，给大脑充充电吧
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12
        }}>
          <div style={{
            padding: '16px 18px',
            borderRadius: 14,
            backgroundColor: 'rgba(91, 143, 185, 0.08)',
            border: '1px solid rgba(91, 143, 185, 0.15)'
          }}>
            <div style={{ fontSize: 12, color: '#5B8FB9', marginBottom: 4, fontWeight: 500 }}>本次专注</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2D3748' }}>{lastSessionMinutes}分钟</div>
          </div>
          <div style={{
            padding: '16px 18px',
            borderRadius: 14,
            backgroundColor: 'rgba(255, 152, 0, 0.08)',
            border: '1px solid rgba(255, 152, 0, 0.15)'
          }}>
            <div style={{ fontSize: 12, color: '#FF9800', marginBottom: 4, fontWeight: 500 }}>连续天数</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2D3748' }}>
              {currentUser?.consecutiveDays || 0}天
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            marginTop: 24,
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            backgroundColor: '#5B8FB9',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7BAFD9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5B8FB9')}
        >
          继续加油
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { timerMode, showSummary, setShowSummary } = useAppState()
  const { startFocus, exitMode } = useTimer()
  const [showEdgeButtons, setShowEdgeButtons] = useState(false)
  const [showHourglassAnim, setShowHourglassAnim] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)

  useEffect(() => {
    if (timerMode === 'break' && !soundPlayed) {
      playNatureSound()
      setSoundPlayed(true)
      setShowHourglassAnim(true)
    }
    if (timerMode === 'idle') {
      setSoundPlayed(false)
      setShowHourglassAnim(false)
    }
  }, [timerMode, soundPlayed])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (timerMode === 'focus' || timerMode === 'break')) {
        exitMode()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [timerMode, exitMode])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (timerMode === 'idle') return
    const edge = 60
    const near = e.clientX < edge || e.clientX > window.innerWidth - edge
      || e.clientY < edge || e.clientY > window.innerHeight - edge
    setShowEdgeButtons(near)
  }, [timerMode])

  const isFocusOverlay = timerMode === 'focus'
  const isBreakOverlay = timerMode === 'break'
  const showOverlay = isFocusOverlay || isBreakOverlay

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: showOverlay ? 'transparent' : 'linear-gradient(160deg, #F5F0E8 0%, #E8EDF2 40%, #D8E4EF 100%)',
        overflow: 'hidden',
        cursor: isFocusOverlay ? 'wait' : 'default'
      }}
    >
      {!showOverlay && (
        <>
          <div style={{
            position: 'absolute',
            top: -80, right: -80,
            width: 400, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 220, 150, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -100, left: -60,
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180, 210, 240, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        </>
      )}

      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <StatusBar />

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 32px 120px',
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          scrollbarWidth: 'thin'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: 24,
            opacity: showOverlay ? 0.25 : 1,
            transition: 'opacity 0.3s'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: '#5C6B7A',
              letterSpacing: 1
            }}>
              📚 专注度排名榜
            </h1>
          </div>
          <RankingBoard />
        </div>
      </div>

      {showOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: isFocusOverlay
            ? 'rgba(30, 50, 80, 0.88)'
            : 'rgba(255, 180, 120, 0.35)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          transition: 'background-color 0.5s'
        }}>
          <div style={{ position: 'relative' }}>
            {showHourglassAnim && isBreakOverlay && (
              <div style={{
                position: 'absolute',
                top: -48,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 36,
                animation: 'hourglass-rise 0.8s ease-out'
              }}>
                ⏳
              </div>
            )}
            <TimerDisplay />
          </div>
          <div style={{
            marginTop: 32,
            padding: '8px 24px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: isFocusOverlay
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(255, 255, 255, 0.6)',
            color: isFocusOverlay ? 'rgba(255,255,255,0.9)' : '#5C6B7A',
            letterSpacing: 0.5
          }}>
            {isFocusOverlay ? '专注中 · 保持心流' : '休息中 · 放松一下'}
          </div>
          <div style={{
            position: 'fixed',
            top: 20,
            opacity: showEdgeButtons ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showEdgeButtons ? 'auto' : 'none'
          }}>
            <button
              onClick={exitMode}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                letterSpacing: 0.5
              }}
            >
              按 ESC 结束
            </button>
          </div>
        </div>
      )}

      {timerMode === 'idle' && (
        <button
          onClick={startFocus}
          className="pomodoro-btn"
          style={{
            position: 'fixed',
            bottom: 36,
            right: 36,
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: '#5B8FB9',
            border: 'none',
            color: '#fff',
            fontSize: 24,
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(91, 143, 185, 0.35), 0 4px 12px rgba(91, 143, 185, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease, transform 0.4s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#7BAFD9'
            e.currentTarget.style.transform = 'rotate(360deg)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#5B8FB9'
            e.currentTarget.style.transform = 'rotate(0deg)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </button>
      )}

      {showSummary && (
        <SummaryWindow onClose={() => setShowSummary(false)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  )
}
