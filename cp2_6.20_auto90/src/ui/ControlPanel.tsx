import { useState, useMemo, useRef, useEffect } from 'react'
import { useStarStore, getSpectralColor } from '../scene/StarDataStore'
import './ControlPanel.css'

const SPECTRAL_TYPES = ['O', 'B', 'A', 'F', 'G', 'K', 'M']
const TIME_SPEEDS = [1, 10, 100]

function useDebounce<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

const ControlPanel = () => {
  const {
    stars,
    constellations,
    planets,
    selectedStarId,
    selectedConstellationId,
    selectedPlanetId,
    timeSpeed,
    showOrbits,
    filters,
    searchQuery,
    setSelectedStar,
    setSelectedConstellation,
    setSelectedPlanet,
    setTimeSpeed,
    setShowOrbits,
    setFilters,
    setSearchQuery,
    searchStar,
    searchConstellation,
  } = useStarStore()

  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 200)

  const selectedStar = useMemo(
    () => stars.find((s) => s.id === selectedStarId) || null,
    [stars, selectedStarId]
  )

  const selectedConstellation = useMemo(
    () => constellations.find((c) => c.id === selectedConstellationId) || null,
    [constellations, selectedConstellationId]
  )

  const selectedPlanet = useMemo(
    () => planets.find((p) => p.id === selectedPlanetId) || null,
    [planets, selectedPlanetId]
  )

  useEffect(() => {
    const query = debouncedSearch
    setSearchQuery(query)

    const starResult = searchStar(query)
    if (starResult) {
      setSelectedStar(starResult.id)
      setSelectedConstellation(starResult.constellationId)
      setSelectedPlanet(null)
      return
    }

    const constellationResult = searchConstellation(query)
    if (constellationResult) {
      setSelectedConstellation(constellationResult.id)
      setSelectedStar(null)
      setSelectedPlanet(null)
      return
    }
  }, [debouncedSearch])

  const toggleSpectralType = (type: string) => {
    const current = filters.spectralTypes
    if (current.includes(type)) {
      setFilters({ spectralTypes: current.filter((t) => t !== type) })
    } else {
      setFilters({ spectralTypes: [...current, type] })
    }
  }

  const constellationStars = useMemo(() => {
    if (!selectedConstellation) return []
    return stars.filter((s) => s.constellationId === selectedConstellation.id)
  }, [stars, selectedConstellation])

  return (
    <div className="control-panel-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索恒星或星座..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '收起筛选' : '筛选'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel panel-slide-in">
          <h3>筛选条件</h3>
          
          <div className="filter-section">
            <label>光谱类型</label>
            <div className="spectral-types">
              {SPECTRAL_TYPES.map((type) => (
                <button
                  key={type}
                  className={`spectral-btn ${filters.spectralTypes.includes(type) ? 'active' : ''}`}
                  style={{
                    background: filters.spectralTypes.includes(type)
                      ? getSpectralColor(type)
                      : 'transparent',
                    borderColor: getSpectralColor(type),
                    color: filters.spectralTypes.includes(type) ? '#000' : getSpectralColor(type)
                  }}
                  onClick={() => toggleSpectralType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>视星等: {filters.minMagnitude} ~ {filters.maxMagnitude}</label>
            <div className="range-inputs">
              <input
                type="range"
                min="-2"
                max="6"
                step="0.5"
                value={filters.minMagnitude}
                onChange={(e) => setFilters({ minMagnitude: parseFloat(e.target.value) })}
              />
              <input
                type="range"
                min="-2"
                max="6"
                step="0.5"
                value={filters.maxMagnitude}
                onChange={(e) => setFilters({ maxMagnitude: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="filter-section">
            <label>距离范围: {filters.minDistance} ~ {filters.maxDistance} 光年</label>
            <div className="range-inputs">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filters.minDistance}
                onChange={(e) => setFilters({ minDistance: parseFloat(e.target.value) })}
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={filters.maxDistance}
                onChange={(e) => setFilters({ maxDistance: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="planet-controls panel-slide-in">
        <div className="control-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => setShowOrbits(e.target.checked)}
            />
            显示行星轨道
          </label>
        </div>
        
        <div className="control-row">
          <label>时间流速</label>
          <div className="speed-buttons">
            {TIME_SPEEDS.map((speed) => (
              <button
                key={speed}
                className={`speed-btn ${timeSpeed === speed ? 'active' : ''}`}
                onClick={() => setTimeSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="planet-list">
          {planets.map((planet) => (
            <button
              key={planet.id}
              className={`planet-btn ${selectedPlanetId === planet.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedPlanet(planet.id)
                setSelectedStar(null)
                setSelectedConstellation(null)
              }}
            >
              <span
                className="planet-dot"
                style={{ background: planet.color }}
              />
              {planet.name}
            </button>
          ))}
        </div>
      </div>

      {(selectedStar || selectedConstellation || selectedPlanet) && (
        <div className="metadata-panel panel-slide-in">
          <h3>天体信息</h3>
          
          {selectedPlanet && (
            <div className="metadata-section">
              <div className="metadata-title">
                <span
                  className="title-dot"
                  style={{ background: selectedPlanet.color }}
                />
                {selectedPlanet.name} ({selectedPlanet.nameEn})
              </div>
              <div className="metadata-item">
                <span className="label">公转周期</span>
                <span className="value">{selectedPlanet.orbitalPeriod} 天</span>
              </div>
              <div className="metadata-item">
                <span className="label">距日距离</span>
                <span className="value">{selectedPlanet.distanceFromSun}</span>
              </div>
              <div className="metadata-item">
                <span className="label">卫星数量</span>
                <span className="value">{selectedPlanet.moons} 颗</span>
              </div>
              <div className="metadata-item">
                <span className="label">轨道离心率</span>
                <span className="value">{selectedPlanet.eccentricity}</span>
              </div>
              <div className="metadata-item">
                <span className="label">类型</span>
                <span className="value">
                  {selectedPlanet.isInnerPlanet ? '类地行星' : '类木行星'}
                </span>
              </div>
            </div>
          )}

          {selectedStar && (
            <div className="metadata-section">
              <div className="metadata-title">
                <span
                  className="title-dot"
                  style={{ background: getSpectralColor(selectedStar.spectralType) }}
                />
                {selectedStar.name} ({selectedStar.nameEn})
              </div>
              <div className="metadata-item">
                <span className="label">视星等</span>
                <span className="value">{selectedStar.magnitude}</span>
              </div>
              <div className="metadata-item">
                <span className="label">光谱类型</span>
                <span className="value">{selectedStar.spectralType}型</span>
              </div>
              <div className="metadata-item">
                <span className="label">距离</span>
                <span className="value">{selectedStar.distance} 光年</span>
              </div>
              <div className="metadata-item">
                <span className="label">赤经</span>
                <span className="value">{selectedStar.ra.toFixed(2)}h</span>
              </div>
              <div className="metadata-item">
                <span className="label">赤纬</span>
                <span className="value">{selectedStar.dec.toFixed(2)}°</span>
              </div>
              <div className="metadata-item">
                <span className="label">所属星座</span>
                <span className="value">{selectedConstellation?.name || '-'}</span>
              </div>
            </div>
          )}

          {selectedConstellation && (
            <div className="metadata-section">
              <div className="metadata-title constellation-title">
                ✦ {selectedConstellation.name} ({selectedConstellation.nameEn})
              </div>
              <div className="metadata-item">
                <span className="label">最佳观测季节</span>
                <span className="value">{selectedConstellation.bestSeason || selectedConstellation.season}</span>
              </div>
              <div className="metadata-item">
                <span className="label">面积排名</span>
                <span className="value">第 {selectedConstellation.areaRank} 名</span>
              </div>
              <div className="metadata-item">
                <span className="label">缩写</span>
                <span className="value">{selectedConstellation.id}</span>
              </div>
              
              {(selectedConstellation.mainStars.length > 0 || constellationStars.length > 0) && (
                <div className="metadata-item main-stars">
                  <span className="label">主星列表</span>
                  <div className="star-list">
                    {constellationStars.length > 0 ? (
                      constellationStars.slice(0, 8).map((star) => (
                        <div
                          key={star.id}
                          className={`star-item ${selectedStarId === star.id ? 'selected' : ''}`}
                          onClick={() => setSelectedStar(star.id)}
                        >
                          <span
                            className="star-dot"
                            style={{ background: getSpectralColor(star.spectralType) }}
                          />
                          <span className="star-name">{star.name}</span>
                          <span className="star-mag">{star.magnitude.toFixed(2)}m</span>
                        </div>
                      ))
                    ) : (
                      selectedConstellation.mainStars.slice(0, 8).map((mainStar, idx) => {
                        const star = stars.find(s =>
                          s.name === mainStar.name || s.nameEn === mainStar.nameEn
                        )
                        return (
                          <div
                            key={idx}
                            className={`star-item ${star && selectedStarId === star.id ? 'selected' : ''}`}
                            onClick={() => star && setSelectedStar(star.id)}
                            style={{ cursor: star ? 'pointer' : 'default' }}
                          >
                            <span
                              className="star-dot"
                              style={{ background: star ? getSpectralColor(star.spectralType) : '#888' }}
                            />
                            <span className="star-name">
                              {mainStar.name}
                              {mainStar.nameEn && mainStar.name !== mainStar.nameEn && (
                                <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '4px', fontSize: '11px' }}>
                                  {mainStar.nameEn}
                                </span>
                              )}
                            </span>
                            {star && (
                              <span className="star-mag">{star.magnitude.toFixed(2)}m</span>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="close-btn"
            onClick={() => {
              setSelectedStar(null)
              setSelectedConstellation(null)
              setSelectedPlanet(null)
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
