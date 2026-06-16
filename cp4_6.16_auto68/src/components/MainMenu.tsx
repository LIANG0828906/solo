import { useState, useEffect } from 'react'
import { Play, Palette, Trophy, Coins } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'

export function MainMenu() {
  const { setScreen, setGameStatus, resetGame } = useGameStore()
  const { player, isLoaded } = usePlayerStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStartGame = () => {
    resetGame()
    setGameStatus('racing')
    setScreen('game')
  }

  const menuItems = [
    {
      icon: Play,
      title: '开始比赛',
      description: '在蜿蜒山路上驰骋漂移',
      onClick: handleStartGame,
      delay: 100,
      color: 'from-purple-500 to-fuchsia-600',
    },
    {
      icon: Palette,
      title: '涂装工坊',
      description: '自由定制你的专属战车',
      onClick: () => setScreen('customize'),
      delay: 200,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trophy,
      title: '排行榜',
      description: '查看历史最佳圈速',
      onClick: () => setScreen('leaderboard'),
      delay: 300,
      color: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <div className="relative w-full h-screen min-h-[720px] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950" />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
            animation: 'float1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #db2777 0%, transparent 70%)',
            bottom: '-10%',
            right: '-5%',
            animation: 'float2 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            top: '30%',
            right: '20%',
            animation: 'float3 12s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div
          className="mb-4 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-30px)',
          }}
        >
          <h1
            className="text-7xl font-black tracking-wider"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(168, 85, 247, 0.5)',
            }}
          >
            DRIFTCRAFT
          </h1>
          <p className="text-center text-purple-300 text-lg mt-2 tracking-widest">
            漂移 · 加速 · 定制
          </p>
        </div>

        {isLoaded && player && (
          <div
            className="mb-12 flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-purple-500/30 transition-all duration-700 delay-100"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
            }}
          >
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {player.totalCoins}
            </span>
            <span className="text-purple-300 text-sm">积分</span>
          </div>
        )}

        <div className="flex flex-col gap-5 w-full max-w-md">
          {menuItems.map((item, index) => (
            <button
              key={item.title}
              onClick={item.onClick}
              className="group relative flex items-center gap-5 p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-50px)',
                transition: `opacity 0.6s ease ${item.delay}ms, transform 0.6s ease ${item.delay}ms, box-shadow 0.3s, border-color 0.3s`,
              }}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
              >
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-purple-300 text-sm">{item.description}</p>
              </div>
              <div className="text-purple-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />
            </button>
          ))}
        </div>

        <div
          className="mt-12 text-purple-400/60 text-sm transition-opacity duration-1000 delay-500"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <p>WASD 控制方向 · 空格键 + 转向 = 漂移</p>
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -30px) scale(1.15); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 50px) scale(0.9); }
        }
      `}</style>
    </div>
  )
}
