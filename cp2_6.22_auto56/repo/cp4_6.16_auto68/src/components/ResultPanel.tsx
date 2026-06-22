import { useState, useEffect } from 'react'
import { Clock, Zap, Flame, Coins, RotateCcw, Home } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'

interface ResultPanelProps {
  time: number
  driftScore: number
  nitroUses: number
  onContinue: () => void
  onBackToMenu: () => void
}

export function ResultPanel({
  time,
  driftScore,
  nitroUses,
  onContinue,
  onBackToMenu,
}: ResultPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [displayTime, setDisplayTime] = useState(0)
  const [displayDrift, setDisplayDrift] = useState(0)
  const [displayNitro, setDisplayNitro] = useState(0)
  const [coinsAdded, setCoinsAdded] = useState(false)
  const { addCoins, addLapRecord } = usePlayerStore()

  const totalCoins = driftScore

  useEffect(() => {
    setMounted(true)

    const duration = 1500
    const startTime = performance.now()

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayTime(time * eased)
      setDisplayDrift(Math.floor(driftScore * eased))
      setDisplayNitro(Math.floor(nitroUses * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [time, driftScore, nitroUses])

  const handleConfirm = async () => {
    if (!coinsAdded) {
      await addCoins(totalCoins)
      await addLapRecord({
        time,
        driftScore,
        nitroUses,
      })
      setCoinsAdded(true)
    }
    onContinue()
  }

  const stats = [
    {
      icon: Clock,
      label: '圈速时间',
      value: `${displayTime.toFixed(2)}s`,
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-500/30',
    },
    {
      icon: Flame,
      label: '漂移积分',
      value: displayDrift,
      color: 'text-orange-400',
      bgColor: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: Zap,
      label: '氮气使用',
      value: displayNitro,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300"
      style={{
        opacity: mounted ? 1 : 0,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 p-8 rounded-3xl border border-purple-400/40 shadow-2xl shadow-purple-500/30 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.7) 0%, rgba(49, 46, 129, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          opacity: mounted ? 1 : 0,
        }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />

        <div className="text-center mb-6">
          <h2
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            圈速完成!
          </h2>
          <p className="text-purple-300">精彩的漂移表现</p>
        </div>

        <div className="space-y-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${stat.bgColor} border ${stat.borderColor} transition-all duration-500`}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                transitionDelay: `${200 + index * 100}ms`,
              }}
            >
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center border ${stat.borderColor}`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-purple-300 text-sm">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-center gap-3 py-4 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transitionDelay: '500ms',
          }}
        >
          <Coins className="w-6 h-6 text-yellow-400" />
          <span className="text-yellow-300 text-lg">+{totalCoins} 积分</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBackToMenu}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span>主菜单</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30"
          >
            <RotateCcw className="w-5 h-5" />
            <span>继续</span>
          </button>
        </div>
      </div>
    </div>
  )
}
