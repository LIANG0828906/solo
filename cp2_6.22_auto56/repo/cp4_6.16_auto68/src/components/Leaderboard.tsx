import { ArrowLeft, Trophy, Clock, Flame, Zap } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'

export function Leaderboard() {
  const { setScreen } = useGameStore()
  const { lapRecords } = usePlayerStore()

  const sortedRecords = [...lapRecords].sort((a, b) => a.time - b.time).slice(0, 10)

  const formatTime = (time: number) => {
    return time.toFixed(2) + 's'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-purple-300'
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30'
    if (rank === 2) return 'bg-gray-500/10 border-gray-500/30'
    if (rank === 3) return 'bg-amber-500/10 border-amber-500/30'
    return 'bg-white/5 border-white/10'
  }

  return (
    <div className="relative w-full h-screen min-h-[720px] flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #db2777 0%, transparent 70%)',
            bottom: '-5%',
            right: '5%',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between p-6">
        <button
          onClick={() => setScreen('menu')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回主菜单</span>
        </button>

        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          排行榜
        </h2>

        <div className="w-32" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-8 pb-8">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              历史最佳圈速
            </span>
          </div>

          {sortedRecords.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-black/30 backdrop-blur-md border border-purple-500/30">
              <Trophy className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
              <p className="text-purple-300 text-lg mb-2">暂无记录</p>
              <p className="text-purple-400/60 text-sm">去比赛创造你的第一个记录吧!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${getRankBg(index + 1)}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${getRankColor(index + 1)}`}
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        {formatTime(record.time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-orange-400/80">
                        <Flame className="w-3.5 h-3.5" />
                        {record.driftScore}分
                      </span>
                      <span className="flex items-center gap-1 text-purple-400/80">
                        <Zap className="w-3.5 h-3.5" />
                        {record.nitroUses}次
                      </span>
                    </div>
                  </div>

                  <div className="text-purple-400/60 text-sm">
                    {formatDate(record.date)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center text-purple-400/60 text-sm">
            <p>共 {lapRecords.length} 条记录 · 仅显示前10名</p>
          </div>
        </div>
      </div>
    </div>
  )
}
