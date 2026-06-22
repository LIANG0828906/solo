import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { getCarbonLevel } from '@/carbonCalculator'
import CarbonCard from '@/components/CarbonCard'
import confetti from 'canvas-confetti'
import { ArrowLeft, RotateCcw } from 'lucide-react'

export default function CardPage() {
  const { activities, totalCarbon, dailyRecord, submitRecord } = useStore()

  useEffect(() => {
    if (dailyRecord && dailyRecord.level === 'low') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4caf50', '#81c784', '#a5d6a7', '#66bb6a'],
      })
    }
  }, [dailyRecord])

  const transportCarbon = useMemo(
    () => activities.filter((a) => a.category === 'transport').reduce((s, a) => s + a.carbonKg, 0),
    [activities]
  )
  const foodCarbon = useMemo(
    () => activities.filter((a) => a.category === 'food').reduce((s, a) => s + a.carbonKg, 0),
    [activities]
  )
  const electricityCarbon = useMemo(
    () => activities.filter((a) => a.category === 'electricity').reduce((s, a) => s + a.carbonKg, 0),
    [activities]
  )

  const level = getCarbonLevel(totalCarbon)

  const advice = dailyRecord?.advice || '今天记录你的碳排放，开始低碳生活之旅吧！🌱'

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (activities.length === 0 && !dailyRecord) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#a8e6cf] via-[#66bb6a] to-[#1b5e20] flex flex-col items-center justify-center px-4">
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 text-center max-w-[400px]">
          <p className="text-6xl mb-4">🌱</p>
          <h2 className="text-xl font-bold text-white mb-2">还没有今日记录</h2>
          <p className="text-white/80 text-sm mb-6">先去首页添加今天的活动吧</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/30 text-white font-bold hover:bg-white/40 transition-all"
          >
            <ArrowLeft size={18} />
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#a8e6cf] via-[#66bb6a] to-[#1b5e20] flex flex-col items-center py-6 px-4">
      <header className="w-full max-w-[480px] mb-6">
        <Link to="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </header>

      <CarbonCard
        totalCarbon={totalCarbon}
        transportCarbon={transportCarbon}
        foodCarbon={foodCarbon}
        electricityCarbon={electricityCarbon}
        level={level}
        advice={advice}
        date={today}
      />

      <div className="w-full max-w-[360px] mt-6 flex gap-3">
        <Link
          to="/"
          className="flex-1 py-3 text-center rounded-2xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          重新记录
        </Link>
        <Link
          to="/community"
          className="flex-1 py-3 text-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold hover:from-green-500 hover:to-emerald-400 transition-all shadow-lg"
        >
          🏆 挑战排行
        </Link>
      </div>
    </div>
  )
}
