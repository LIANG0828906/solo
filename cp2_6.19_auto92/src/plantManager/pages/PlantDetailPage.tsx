import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets, Leaf, Scissors, RefreshCw, Clover, Flower2, Sprout } from 'lucide-react'
import AnalyticsCharts from '@/analyticsModules/components/AnalyticsCharts'
import CareLogList from '@/plantManager/components/CareLogList'
import CareLogForm from '@/plantManager/components/CareLogForm'
import type { Plant, CareLog, CareLogType } from '@/plantManager/core/plantModel'
import { getPlant, getLogsByPlant, addLog } from '@/plantManager/core/careLogService'
import { cn, generateGradient, formatDate } from '@/shared/utils'

const categoryIcons = {
  succulent: Clover,
  foliage: Leaf,
  flowering: Flower2,
  other: Sprout,
}

const actionButtons: { type: CareLogType; icon: typeof Droplets; color: string; bgColor: string; shadowColor: string }[] = [
  {
    type: 'watering',
    icon: Droplets,
    color: 'bg-blue-500 hover:bg-blue-600',
    bgColor: 'bg-blue-100',
    shadowColor: 'shadow-blue-500/40',
  },
  {
    type: 'fertilizing',
    icon: Leaf,
    color: 'bg-green-500 hover:bg-green-600',
    bgColor: 'bg-green-100',
    shadowColor: 'shadow-green-500/40',
  },
  {
    type: 'pruning',
    icon: Scissors,
    color: 'bg-orange-500 hover:bg-orange-600',
    bgColor: 'bg-orange-100',
    shadowColor: 'shadow-orange-500/40',
  },
  {
    type: 'rotating',
    icon: RefreshCw,
    color: 'bg-purple-500 hover:bg-purple-600',
    bgColor: 'bg-purple-100',
    shadowColor: 'shadow-purple-500/40',
  },
]

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [activeFormType, setActiveFormType] = useState<CareLogType | null>(null)
  const [newLogId, setNewLogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPlantData(id)
    }
  }, [id])

  const loadPlantData = async (plantId: string) => {
    try {
      setLoading(true)
      const [plantData, logsData] = await Promise.all([
        getPlant(plantId),
        getLogsByPlant(plantId),
      ])
      setPlant(plantData)
      setLogs(logsData)
    } catch (error) {
      console.error('Failed to load plant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLog = async (log: CareLog) => {
    try {
      const newLog = await addLog({
        plantId: log.plantId,
        type: log.type,
        date: log.date,
        note: log.note,
      })
      setLogs((prev) => [newLog, ...prev])
      setNewLogId(newLog.id)
      setTimeout(() => setNewLogId(null), 1000)

      if (plant && (log.type === 'watering' || log.type === 'fertilizing')) {
        const updatedPlant = await getPlant(plant.id)
        if (updatedPlant) {
          setPlant(updatedPlant)
        }
      }
    } catch (error) {
      console.error('Failed to add log:', error)
    }
  }

  const generateChartData = () => {
    const wateringData = Array.from({ length: 4 }, (_, i) => ({
      week: `第${4 - i}周`,
      count: logs.filter((log) => {
        if (log.type !== 'watering') return false
        const logDate = new Date(log.date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - (4 - i) * 7)
        const weekEnd = new Date(weekAgo)
        weekEnd.setDate(weekEnd.getDate() + 7)
        return logDate >= weekAgo && logDate < weekEnd
      }).length,
    })).reverse()

    const fertilizingData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return {
        month: `${date.getMonth() + 1}月`,
        count: logs.filter((log) => {
          if (log.type !== 'fertilizing') return false
          const logDate = new Date(log.date)
          return logDate.getMonth() === date.getMonth() && logDate.getFullYear() === date.getFullYear()
        }).length,
      }
    })

    const lightData = [
      { name: '低光照', value: 30, color: '#86efac' },
      { name: '中光照', value: 50, color: '#22c55e' },
      { name: '高光照', value: 20, color: '#15803d' },
    ]

    return { wateringData, fertilizingData, lightData }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">植物不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          返回首页
        </button>
      </div>
    )
  }

  const CategoryIcon = categoryIcons[plant.category as keyof typeof categoryIcons] ?? Sprout
  const gradientStyle = generateGradient(plant.name + plant.category)
  const chartData = generateChartData()

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div
        className="relative h-[200px] w-full overflow-hidden"
        style={{ background: gradientStyle }}
      >
        <div className="absolute inset-0 backdrop-blur-md bg-white/10" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 text-white/10 text-[120px] font-bold select-none">
            {plant.name.charAt(0)}
          </div>
          <div className="absolute right-20 top-20 text-white/5 text-sm font-medium select-none">
            {plant.category}
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className={cn(
            'absolute top-4 left-4 z-10 w-10 h-10 rounded-full',
            'bg-white/20 backdrop-blur-md border border-white/30',
            'flex items-center justify-center text-white',
            'hover:bg-white/30 active:bg-white/40 transition-colors'
          )}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
              <CategoryIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{plant.name}</h1>
              <p className="text-sm text-white/80 mt-0.5">{plant.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{plant.wateringCycle}</p>
              <p className="text-xs text-gray-500 mt-1">浇水周期（天）</p>
            </div>
            <div className="border-x border-gray-100">
              <p className="text-2xl font-bold text-green-600">{plant.fertilizingCycle}</p>
              <p className="text-xs text-gray-500 mt-1">施肥周期（天）</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{logs.length}</p>
              <p className="text-xs text-gray-500 mt-1">养护记录</p>
            </div>
          </div>
          {plant.lastWateringDate && (
            <p className="text-center text-xs text-gray-400 mt-3">
              上次浇水：{formatDate(plant.lastWateringDate, 'MM月dd日')}
            </p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">养护统计</h2>
          <AnalyticsCharts
            wateringData={chartData.wateringData}
            fertilizingData={chartData.fertilizingData}
            lightData={chartData.lightData}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">养护日志</h2>
          <div className="bg-white rounded-2xl shadow-sm p-4 max-h-[400px] overflow-hidden">
            <CareLogList logs={logs} newLogId={newLogId ?? undefined} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30',
          'bg-white/70 backdrop-blur-xl border-t border-gray-200/50',
          'safe-area-bottom'
        )}
      >
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex justify-around items-center">
            {actionButtons.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.type}
                  onClick={() => setActiveFormType(action.type)}
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-white',
                    'shadow-lg transition-all duration-200',
                    'hover:scale-110 hover:shadow-xl active:scale-95',
                    action.color,
                    action.shadowColor
                  )}
                >
                  <Icon size={24} strokeWidth={2} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {activeFormType && id && (
        <CareLogForm
          plantId={id}
          type={activeFormType}
          isOpen={activeFormType !== null}
          onClose={() => setActiveFormType(null)}
          onSubmit={handleAddLog}
        />
      )}
    </div>
  )
}
