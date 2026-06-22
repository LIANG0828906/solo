import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getPlant, getLogsByPlant } from '@/plantManager/core/careLogService'
import type { Plant, CareLog } from '@/plantManager/core/plantModel'
import CareLogList from '@/plantManager/components/CareLogList'

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      try {
        const [plantData, logsData] = await Promise.all([
          getPlant(id),
          getLogsByPlant(id),
        ])
        setPlant(plantData)
        setLogs(logsData)
        if (!plantData) {
          setError('植物不存在')
        }
      } catch (err) {
        console.error('加载植物详情失败:', err)
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            返回列表
          </Link>
          <div className="text-center py-12 text-gray-500">
            {error || '植物不存在'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          返回列表
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{plant.name}</h1>
          <div className="text-gray-500 mb-4">{plant.category}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">浇水周期</div>
              <div className="font-medium">{plant.wateringCycle} 天</div>
            </div>
            <div>
              <div className="text-gray-500">施肥周期</div>
              <div className="font-medium">{plant.fertilizingCycle} 天</div>
            </div>
            <div>
              <div className="text-gray-500">光照需求</div>
              <div className="font-medium">{plant.lightRequirement}</div>
            </div>
            <div>
              <div className="text-gray-500">入手日期</div>
              <div className="font-medium">
                {new Date(plant.purchaseDate).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">养护记录</h2>
          <CareLogList logs={logs} />
        </div>
      </div>
    </div>
  )
}
