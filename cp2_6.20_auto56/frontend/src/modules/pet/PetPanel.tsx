import { useEffect, useState } from 'react'
import useUserStore from '../user/UserStore'
import PetAvatar from '../../components/PetAvatar'

interface ProgressBarProps {
  label: string
  value: number
  color: string
  gradient: string
}

function ProgressBar({ label, value, color, gradient }: ProgressBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{Math.round(value)}%</span>
      </div>
      <div style={{
        width: '100%',
        height: 14,
        background: '#f0ebe0',
        borderRadius: 7,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-inner)',
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: gradient,
          borderRadius: 7,
          transition: 'width 0.5s ease-out',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
            borderRadius: '7px 7px 0 0',
          }} />
        </div>
      </div>
    </div>
  )
}

function PetPanel() {
  const user = useUserStore((s) => s.user)
  const pet = user?.pet
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!pet) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <p style={{ color: 'var(--text-secondary)' }}>还没有宠物，快去领养一只吧！</p>
      </div>
    )
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{pet.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {pet.type === 'cat' ? '🐱 小猫咪' : pet.type === 'dog' ? '🐶 小狗狗' : '🐲 小龙龙'}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
        background: 'linear-gradient(180deg, rgba(255,248,220,0.5), transparent)',
        borderRadius: 'var(--radius-md)',
      }}>
        <PetAvatar pet={pet} size={120} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ProgressBar
          label="🍗 饥饿"
          value={pet.hunger}
          color="orange"
          gradient="linear-gradient(90deg, #ffb347, #ff7e5f)"
        />
        <ProgressBar
          label="💖 快乐"
          value={pet.happiness}
          color="pink"
          gradient="linear-gradient(90deg, #ffb3c6, #ff6b9d)"
        />
        <ProgressBar
          label="⚡ 精力"
          value={pet.energy}
          color="blue"
          gradient="linear-gradient(90deg, #a8d8ea, #5eb8e0)"
        />
      </div>
    </div>
  )
}

export default PetPanel
