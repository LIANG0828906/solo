import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useReportStore } from '../store'
import { FACILITY_COLORS } from '../types'
import type { Report } from '../types'

const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074]
const DEFAULT_ZOOM = 17

function MapStateManager() {
  const map = useMap()

  useEffect(() => {
    const savedCenter = localStorage.getItem('map_center')
    const savedZoom = localStorage.getItem('map_zoom')

    if (savedCenter && savedZoom) {
      try {
        const center: [number, number] = JSON.parse(savedCenter)
        const zoom = parseInt(savedZoom)
        map.setView(center, zoom)
      } catch (e) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      }
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    }
  }, [map])

  useMapEvents({
    moveend: () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      localStorage.setItem('map_center', JSON.stringify([center.lat, center.lng]))
      localStorage.setItem('map_zoom', String(zoom))
    },
    zoomend: () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      localStorage.setItem('map_center', JSON.stringify([center.lat, center.lng]))
      localStorage.setItem('map_zoom', String(zoom))
    }
  })

  return null
}

function createCustomIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div class="custom-marker" style="background-color: ${color};"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `<div class="marker-cluster-custom"><span>${count}</span></div>`,
    className: 'marker-cluster',
    iconSize: L.point(30, 30, true)
  })
}

interface ReportMarkerProps {
  report: Report
  onViewDetail: (id: string) => void
}

function ReportMarker({ report, onViewDetail }: ReportMarkerProps) {
  const color = FACILITY_COLORS[report.facilityType]
  const icon = createCustomIcon(color)
  const truncatedDesc = report.description.length > 30
    ? report.description.substring(0, 30) + '...'
    : report.description

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  return (
    <Marker
      position={[report.lat, report.lng]}
      icon={icon}
    >
      <Popup>
        <div className="popup-content">
          <div className="popup-type" style={{ color }}>
            {report.facilityType}
          </div>
          <div className="popup-desc">{truncatedDesc}</div>
          <div className="popup-time">{formatTime(report.createdAt)}</div>
          <button
            className="popup-btn"
            onClick={() => onViewDetail(report.id)}
          >
            查看详情
          </button>
        </div>
      </Popup>
    </Marker>
  )
}

function ReportMap() {
  const navigate = useNavigate()
  const { reports, loading, error, fetchReports } = useReportStore()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchReports({ limit: 1000 })
  }, [fetchReports])

  const handleViewDetail = useCallback((id: string) => {
    navigate(`/report/${id}`)
  }, [navigate])

  const filteredReports = searchQuery
    ? reports.filter(r =>
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.facilityType.includes(searchQuery)
      )
    : reports

  return (
    <div>
      <h1 className="page-title">设施问题地图</h1>
      <div className="map-container">
        <div className="map-search">
          <input
            type="text"
            placeholder="搜索设施类型或描述..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={19}
          />
          <MapStateManager />
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            iconCreateFunction={createClusterCustomIcon}
          >
            {filteredReports.map(report => (
              <ReportMarker
                key={report.id}
                report={report}
                onViewDetail={handleViewDetail}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}

export default ReportMap
