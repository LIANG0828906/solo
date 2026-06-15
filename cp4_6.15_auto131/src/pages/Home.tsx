import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store'
import { calculateCarbon, getCategoryActivities, getCarbonLevel, type Category, type ActivityItem } from '@/carbonCalculator'
import CarbonDashboard from '@/components/CarbonDashboard'
import { Car, Utensils, Zap, Plus, Trash2, Send, Leaf } from 'lucide-react'

const categoryConfig: { key: Category; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { key: 'transport', label: '交通', icon: <Car size={24} />, color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200' },
  { key: 'food', label: '饮食', icon: <Utensils size={24} />, color: 'text-orange-700', bgColor: 'bg-orange-100 hover:bg-orange-200' },
  { key: 'electricity', label: '用电', icon: <Zap size={24} />, color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200' },
]

export default function Home() {
  const { activities, totalCarbon, addActivity, removeActivity, submitRecord, dailyRecord } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddActivity = (category: Category, name: string) => {
    addActivity(category, name)
  }

  const handleSubmit = async () => {
    if (activities.length === 0) return
    setIsSubmitting(true)
    try {
      await submitRecord()
    } finally {
      setIsSubmitting(false)
    }
  }

  const level = getCarbonLevel(totalCarbon)

  const levelEmoji = level === 'low' ? '🍃' : level === 'medium' ? '🍂' : '🍁'
  const levelText = level === 'low' ? '低碳' : level === 'medium' ? '中等' : '高碳'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#a8e6cf] via-[#66bb6a] to-[#1b5e20] flex flex-col items-center py-6 px-4">
      <header className="w-full max-w-[480px] mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="text-white" size={28} />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">碳足迹实验室</h1>
        </div>
        <p className="text-white/80 text-sm font-semibold">追踪你的每日碳排放</p>
      </header>

      <div className="w-full max-w-[480px] bg-white/20 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">碳足迹速算器</h2>
          <span className="text-sm font-semibold text-white/80">{levelEmoji} {levelText}</span>
        </div>

        <CarbonDashboard totalCarbon={totalCarbon} />

        <div className="mt-6 grid grid-cols-3 gap-3">
          {categoryConfig.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 ${cat.bgColor} ${selectedCategory === cat.key ? 'ring-2 ring-white scale-105' : ''}`}
            >
              <span className={cat.color}>{cat.icon}</span>
              <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="mt-4 bg-white/30 rounded-2xl p-4 space-y-2 animate-fadeIn">
            <p className="text-sm font-bold text-white mb-2">选择活动：</p>
            {getCategoryActivities(selectedCategory).map((name) => (
              <button
                key={name}
                onClick={() => handleAddActivity(selectedCategory, name)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/50 hover:bg-white/70 rounded-xl transition-all duration-150 text-sm font-semibold text-gray-800 active:scale-95"
              >
                <span>{name}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Plus size={14} />
                  {calculateCarbon(selectedCategory, name).toFixed(1)}kg
                </span>
              </button>
            ))}
          </div>
        )}

        {activities.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-bold text-white">已选活动：</p>
            {activities.map((act: ActivityItem) => (
              <div
                key={act.id}
                className="flex items-center justify-between bg-white/40 rounded-xl px-4 py-2 animate-slideIn"
              >
                <span className="text-sm font-semibold text-gray-800">{act.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">{act.carbonKg.toFixed(1)}kg</span>
                  <button
                    onClick={() => removeActivity(act.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={activities.length === 0 || isSubmitting}
          className={`mt-6 w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            activities.length === 0 || isSubmitting
              ? 'bg-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 active:scale-[0.98] shadow-lg'
          }`}
        >
          <Send size={18} />
          {isSubmitting ? '提交中...' : '提交今日记录'}
        </button>
      </div>

      {dailyRecord && (
        <div className="w-full max-w-[480px] mt-4">
          <Link
            to="/card"
            className="block w-full py-3 text-center rounded-2xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all duration-200"
          >
            📊 查看今日碳足迹卡片 →
          </Link>
        </div>
      )}

      <div className="w-full max-w-[480px] mt-4">
        <Link
          to="/community"
          className="block w-full py-3 text-center rounded-2xl bg-white/10 text-white/80 font-semibold hover:bg-white/20 hover:text-white transition-all duration-200"
        >
          🏆 社区碳减排挑战 →
        </Link>
      </div>
    </div>
  )
}
