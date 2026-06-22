import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { buildings, Building, BuildingStyle, styleColors } from './data/buildings'
import TimelineSlider from './components/TimelineSlider'
import BuildingCard from './components/BuildingCard'

const MIN_YEAR = 1800
const MAX_YEAR = 2000

const createCustomIcon = (color: string, highlighted: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="building-marker ${highlighted ? 'highlighted' : ''}" style="background-color: ${color};"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })
}

const MapController: React.FC<{ building: Building | null }> = ({ building }) => {
  const map = useMap()

  useEffect(() => {
    if (building) {
      map.flyTo([building.lat, building.lng], 15, { duration: 0.5 })
    }
  }, [building, map])

  return null
}

interface StyleStat {
  style: BuildingStyle
  count: number
  percentage: number
  color: string
}

const App: React.FC = () => {
  const [startYear, setStartYear] = useState<number>(1840)
  const [endYear, setEndYear] = useState<number>(1960)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)

  const filteredBuildings = useMemo(() => {
    return buildings.filter(
      (b) => b.year >= startYear && b.year <= endYear
    )
  }, [startYear, endYear])

  const styleStats: StyleStat[] = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredBuildings.forEach((b) => {
      stats[b.style] = (stats[b.style] || 0) + 1
    })

    const total = filteredBuildings.length
    const allStyles: BuildingStyle[] = ['巴洛克', '新艺术', '装饰艺术', '现代', '其他']

    return allStyles
      .filter((style) => stats[style] > 0)
      .map((style) => ({
        style,
        count: stats[style],
        percentage: total > 0 ? (stats[style] / total) * 100 : 0,
        color: styleColors[style],
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredBuildings])

  const handleTimelineChange = useCallback((newStart: number, newEnd: number) => {
    setStartYear(newStart)
    setEndYear(newEnd)
  }, [])

  const handleCardClick = useCallback((building: Building) => {
    setHighlightedId(building.id)
    setSelectedBuilding(building)
    setTimeout(() => {
      setHighlightedId(null)
    }, 500)
  }, [])

  return (
    <div className="app-container">
      <TimelineSlider
        minYear={MIN_YEAR}
        maxYear={MAX_YEAR}
        startYear={startYear}
        endYear={endYear}
        onChange={handleTimelineChange}
      />
      <div className="main-content">
        <div className="map-section">
          <MapContainer
            center={[31.22, 121.46]}
            zoom={12}
            scrollWheelZoom={true}
            zoomControl={true}
            dragging={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController building={selectedBuilding} />
            {filteredBuildings.map((building) => {
              const color = styleColors[building.style]
              const isHighlighted = highlightedId === building.id
              return (
                <Marker
                  key={building.id}
                  position={[building.lat, building.lng]}
                  icon={createCustomIcon(color, isHighlighted)}
                  eventHandlers={{
                    click: () => {
                      setHighlightedId(building.id)
                      setTimeout(() => setHighlightedId(null), 500)
                    },
                  }}
                >
                  <Popup>
                    <div>
                      <div className="popup-name">{building.name}</div>
                      <div className="popup-info">
                        <span>{building.year}年</span>
                        <span
                          className="popup-style-dot"
                          style={{ backgroundColor: color }}
                        />
                        <span>{building.style}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          <div className="stats-panel">
            <div className="stats-title">风格统计</div>
            <div className="stats-total">共 {filteredBuildings.length} 处建筑</div>
            {styleStats.length > 0 ? (
              styleStats.map((stat) => (
                <div className="stats-item" key={stat.style}>
                  <div className="stats-item-header">
                    <span className="stats-style-name">
                      <span
                        className="stats-color-dot"
                        style={{ backgroundColor: stat.color }}
                      />
                      {stat.style}
                    </span>
                    <span className="stats-style-count">
                      {stat.count} ({stat.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="stats-bar-container">
                    <div
                      className="stats-bar-fill"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="cards-empty">暂无数据</div>
            )}
          </div>
        </div>

        <div className="cards-section">
          <div className="cards-header">
            <span>建筑列表</span>
            <span className="cards-count">{filteredBuildings.length}</span>
          </div>
          {filteredBuildings.length > 0 ? (
            filteredBuildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onClick={handleCardClick}
              />
            ))
          ) : (
            <div className="cards-empty">没有符合筛选条件的建筑</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
