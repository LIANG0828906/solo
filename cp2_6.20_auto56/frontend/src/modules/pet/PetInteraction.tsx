import { useState, useEffect } from 'react'
import useUserStore from '../user/UserStore'
import PetAvatar from '../../components/PetAvatar'

type AnimationType = 'feed' | 'play' | 'clean' | null

function PetInteraction() {
  const user = useUserStore((s) => s.user)
  const feedPet = useUserStore((s) => s.feedPet)
  const playPet = useUserStore((s) => s.playPet)
  const cleanPet = useUserStore((s) => s.cleanPet)
  const pet = user?.pet

  const [animation, setAnimation] = useState<AnimationType>(null)
  const [gainedText, setGainedText] = useState<string | null>(null)

  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => {
        setAnimation(null)
        setGainedText(null)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [animation])

  if (!pet) return null

  const handleFeed = async () => {
    if (animation) return
    const gained = await feedPet()
    setAnimation('feed')
    setGainedText(`+${gained} 饱食`)
  }

  const handlePlay = async () => {
    if (animation) return
    const gained = await playPet()
    setAnimation('play')
    setGainedText(`+${gained} 快乐`)
  }

  const handleClean = async () => {
    if (animation) return
    const gained = await cleanPet()
    setAnimation('clean')
    setGainedText(`+${gained} 精力`)
  }

  const getAnimationStyle = (): React.CSSProperties => {
    switch (animation) {
      case 'play':
        return { animation: 'jump-spin 1.5s ease-in-out' }
      case 'feed':
        return {}
      case 'clean':
        return {}
      default:
        return {}
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>互动</h3>

      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 160,
        background: 'linear-gradient(180deg, rgba(255,248,220,0.3), transparent)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <div style={getAnimationStyle()}>
          <PetAvatar pet={pet} size={100} showEffects={false} />
        </div>

        {animation === 'feed' && (
          <>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '35%',
              transform: 'translateX(-50%)',
              width: 14,
              height: 14,
              background: '#ff6b6b',
              borderRadius: '50% 50% 50% 0',
              transformOrigin: 'center top',
              animation: 'mouth-open 0.5s ease-in-out 3',
            }} />
            {[0, 0.3, 0.6].map((delay, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${40 + i * 10}%`,
                  bottom: '40%',
                  fontSize: 20,
                  animation: 'float-up 1.5s ease-out forwards',
                  animationDelay: `${delay}s`,
                }}
              >🍖</span>
            ))}
          </>
        )}

        {animation === 'clean' && (
          <>
            <span style={{
              position: 'absolute',
              top: '30%',
              fontSize: 32,
              animation: 'brush-sweep 1.5s ease-in-out',
            }}>🧹</span>
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${30 + i * 8}%`,
                  top: '55%',
                  fontSize: 12,
                  animation: 'dust-fall 1.2s ease-out forwards',
                  animationDelay: `${i * 0.1}s`,
                  ['--dx' as string]: `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
                } as React.CSSProperties}
              >💨</span>
            ))}
          </>
        )}

        {gainedText && (
          <span style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--accent-green)',
            animation: 'float-up 1.5s ease-out forwards',
          }}>
            {gainedText}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={handleFeed}
          disabled={!!animation}
          className="btn-press"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 999,
            border: 'none',
            background: animation ? '#ccc' : 'linear-gradient(135deg, #ffb347, #ff9a5a)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: animation ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(255,154,90,0.4)',
          }}
        >
          <span>🍗</span> 喂食
        </button>
        <button
          onClick={handlePlay}
          disabled={!!animation}
          className="btn-press"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 999,
            border: 'none',
            background: animation ? '#ccc' : 'linear-gradient(135deg, #ffb3c6, #ff8fab)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: animation ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(255,143,171,0.4)',
          }}
        >
          <span>🎾</span> 玩耍
        </button>
        <button
          onClick={handleClean}
          disabled={!!animation}
          className="btn-press"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 999,
            border: 'none',
            background: animation ? '#ccc' : 'linear-gradient(135deg, #a8d8ea, #7ec8e3)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: animation ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(126,200,227,0.4)',
          }}
        >
          <span>🧼</span> 清洁
        </button>
      </div>
    </div>
  )
}

export default PetInteraction
