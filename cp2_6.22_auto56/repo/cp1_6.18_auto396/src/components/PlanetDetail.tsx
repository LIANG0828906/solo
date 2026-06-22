import { useStore } from '@/store/useStore'
import { formatScientific, formatNumber } from '@/utils/format'
import './PlanetDetail.css'

export function PlanetDetail() {
  const { planets, selectedPlanetId, selectPlanet } = useStore()
  const planet = planets.find((p) => p.id === selectedPlanetId)

  if (!planet) return null

  return (
    <div className="planet-detail-overlay">
      <div className="planet-detail-panel">
        <button
          className="close-btn"
          onClick={() => selectPlanet(null)}
          aria-label="关闭"
        >
          ×
        </button>
        <h2 className="planet-name">
          {planet.name}
          <span className="planet-name-en">{planet.nameEn}</span>
        </h2>
        <div className="planet-color-indicator" style={{ backgroundColor: planet.color }} />
        <div className="info-grid">
          <div className="info-label">直径</div>
          <div className="info-value">{formatNumber(planet.diameter)} km</div>

          <div className="info-label">质量</div>
          <div className="info-value">{formatScientific(planet.mass)} kg</div>

          <div className="info-label">公转周期</div>
          <div className="info-value">{formatNumber(planet.orbitalPeriod)} 地球日</div>

          <div className="info-label">卫星数量</div>
          <div className="info-value">{planet.moonCount} 颗</div>
        </div>
      </div>
    </div>
  )
}
