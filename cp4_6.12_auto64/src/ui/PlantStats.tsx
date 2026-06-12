import { useMemo } from 'react'
import { useStore } from '../store/useStore'

function PlantStats() {
  const { plants, growthTime, lightIntensity, soilType } = useStore()

  const stats = useMemo(() => {
    const totalCount = plants.length

    const lightFactor = 1 + ((lightIntensity - 50) / 10) * 0.15
    let soilFactor = 1
    switch (soilType) {
      case 'sand':
        soilFactor = 0.7
        break
      case 'clay':
        soilFactor = 0.9
        break
      case 'humus':
        soilFactor = 1.2
        break
    }
    const adjustedGrowth = Math.min(100, growthTime * lightFactor * soilFactor) / 100

    let totalHeight = 0
    plants.forEach((plant) => {
      let heightMultiplier = 1
      if (soilType === 'humus') heightMultiplier = 1.2
      if (soilType === 'sand') heightMultiplier = 0.9
      
      totalHeight += plant.baseHeight * heightMultiplier * adjustedGrowth
    })
    const avgHeight = totalCount > 0 ? totalHeight / totalCount : 0

    const lightNorm = lightIntensity / 100
    const greenPercentage = 40 + lightNorm * 50

    return {
      totalCount,
      avgHeight: avgHeight.toFixed(1),
      greenPercentage: Math.round(greenPercentage),
    }
  }, [plants, growthTime, lightIntensity, soilType])

  return (
    <div className="plant-stats">
      <div className="stats-title">📊 植物统计</div>
      
      <div className="stat-item">
        <span className="stat-label">植物总数</span>
        <span className="stat-value">{stats.totalCount} 棵</span>
      </div>

      <div className="stat-item">
        <span className="stat-label">平均高度</span>
        <span className="stat-value">{stats.avgHeight} 单位</span>
      </div>

      <div className="stat-item" style={{ marginTop: '8px' }}>
        <span className="stat-label">绿色系占比</span>
        <span className="stat-value">{stats.greenPercentage}%</span>
      </div>
      
      <div className="color-bar">
        <div
          className="color-bar-fill"
          style={{ width: `${stats.greenPercentage}%` }}
        />
      </div>
    </div>
  )
}

export default PlantStats
