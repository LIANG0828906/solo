import { useEffect, useRef } from 'react'
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
  const socket = useUserStore((s) => s.socket)
  const fetchUser = useUserStore((s) => s.fetchUser)
  const updatePetStats = useUserStore((s) => s.updatePetStats)
  const pet = user?.pet

  const lastUpdateRef = useRef<number>(Date.now())
  const localStatsRef = useRef<{ hunger: number; happiness: number; energy: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (pet) {
      localStatsRef.current = {
        hunger: pet.hunger,
        happiness: pet.happiness,
        energy: pet.energy,
      }
      lastUpdateRef.current = pet.lastUpdate * 1000
    }
  }, [pet?.id, pet?.hunger, pet?.happiness, pet?.energy])

  useEffect(() => {
    if (!pet) return

    const tick = () => {
      if (!pet || !localStatsRef.current) return

      const isSocketConnected = socket?.connected ?? false
      const now = Date.now()
      const elapsed = now - lastUpdateRef.current
      const cycles = Math.floor(elapsed / 30000)

      if (!isSocketConnected) {
        if (cycles > 0) {
          const newHunger = Math.max(0, localStatsRef.current.hunger - cycles * 2)
          const newHappiness = Math.max(0, localStatsRef.current.happiness - cycles * 3)
          const newEnergy = Math.max(0, localStatsRef.current.energy - cycles * 1)

          localStatsRef.current = {
            hunger: newHunger,
            happiness: newHappiness,
            energy: newEnergy,
          }
          lastUpdateRef.current = lastUpdateRef.current + cycles * 30000

          updatePetStats({
            id: pet.id,
            hunger: newHunger,
            happiness: newHappiness,
            energy: newEnergy,
          })
        }
      } else {
        fetchUser().then(() => {
          const latestPet = useUserStore.getState().user?.pet
          if (latestPet && latestPet.id === pet.id) {
            localStatsRef.current = {
              hunger: latestPet.hunger,
              happiness: latestPet.happiness,
              energy: latestPet.energy,
            }
            lastUpdateRef.current = latestPet.lastUpdate * 1000
          }
        })
      }
    }

    timerRef.current = setInterval(tick, 10000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pet?.id, socket?.connected, fetchUser, updatePetStats, pet])

  const displayStats = localStatsRef.current || {
    hunger: pet?.hunger || 0,
    happiness: pet?.happiness || 0,
    energy: pet?.energy || 0,
  }

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

  const displayPet = {
    ...pet,
    hunger: displayStats.hunger,
    happiness: displayStats.happiness,
    energy: displayStats.energy,
  }

  const isSocketConnected = socket?.connected ?? false

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 999,
          background: isSocketConnected ? 'rgba(126,196,160,0.15)' : 'rgba(255,100,100,0.1)',
          fontSize: 11,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isSocketConnected ? 'var(--accent-green)' : '#ff6464',
            animation: isSocketConnected ? 'twinkle 2s ease-in-out infinite' : undefined,
          }} />
          <span style={{ color: isSocketConnected ? 'var(--accent-green)' : '#ff6464', fontWeight: 600 }}>
            {isSocketConnected ? '在线同步' : '离线计算'}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
        background: 'linear-gradient(180deg, rgba(255,248,220,0.5), transparent)',
        borderRadius: 'var(--radius-md)',
      }}>
        <PetAvatar pet={displayPet} size={120} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ProgressBar
          label="🍗 饥饿"
          value={displayStats.hunger}
          color="orange"
          gradient="linear-gradient(90deg, #ffb347, #ff7e5f)"
        />
        <ProgressBar
          label="💖 快乐"
          value={displayStats.happiness}
          color="pink"
          gradient="linear-gradient(90deg, #ffb3c6, #ff6b9d)"
        />
        <ProgressBar
          label="⚡ 精力"
          value={displayStats.energy}
          color="blue"
          gradient="linear-gradient(90deg, #a8d8ea, #5eb8e0)"
        />
      </div>
    </div>
  )
}

export default PetPanel
