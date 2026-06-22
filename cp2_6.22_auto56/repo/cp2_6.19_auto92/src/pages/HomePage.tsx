import { useEffect, useState } from 'react'
import { getAllPlants } from '@/plantManager/core/careLogService'
import type { Plant } from '@/plantManager/core/plantModel'
import PlantList from '@/plantManager/components/PlantList'

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const data = await getAllPlants()
        setPlants(data)
      } catch (error) {
        console.error('加载植物列表失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPlants()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">我的植物</h1>
          <p className="text-gray-600">共 {plants.length} 盆植物</p>
        </header>
        <PlantList plants={plants} />
      </div>
    </div>
  )
}
