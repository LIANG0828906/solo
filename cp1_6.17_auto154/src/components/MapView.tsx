import React, { useEffect, useMemo, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
  LayersControl,
} from 'react-leaflet'
import L from 'leaflet'
import {
  useStandStore,
  getRevenueColor,
  getMarkerSize,
  StandRecord,
  HeatmapPoint,
} from '@/store/standStore'

const CENTER: [number, number] = [39.9042, 116.4074]
const ZOOM = 13

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'zh-CN' } }
    )
    const data = await response.json()
    if (data.display_name) {
      return data.display_name
    }
  } catch (e) {
    console.log('Geocoding error')
  }
  return `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`
}

const createCustomIcon = (color: string, size: number, isBlinking: boolean) => {
  const blinkStyle = isBlinking
    ? `animation: blink 0.5s ease-in-out 4;`
    : ''

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${blinkStyle}
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.2)'"
         onmouseout="this.style.transform='scale(1)'">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

const MapClickHandler: React.FC = () => {
  const setSelectedLocation = useStandStore((s) => s.setSelectedLocation)

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      const address = await reverseGeocode(lat, lng)
      setSelectedLocation({ lat, lng, address })
    },
  })

  return null
}

interface RecordMarkerProps {
  record: StandRecord
  isBlinking: boolean
}

const RecordMarker: React.FC<RecordMarkerProps> = ({ record, isBlinking }) => {
  const color = getRevenueColor(record.revenue)
  const size = getMarkerSize(record.revenue)
  const icon = useMemo(() => createCustomIcon(color, size, isBlinking), [color, size, isBlinking])

  const timeLabels: Record<string, string> = {
    morning: '早 6-10点',
    noon: '中 11-14点',
    evening: '晚 17-21点',
  }

  return (
    <Marker
      position={[record.lat, record.lng]}
      icon={icon}
      key={record.id}
    >
      <Popup>
        <div style={{ width: '200px', padding: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#2C3E50' }}>
            {record.address}
          </div>
          <div style={{ fontSize: '13px', color: '#5D6D7E', marginBottom: '4px' }}>
            日期: {new Date(record.createdAt).toLocaleDateString('zh-CN')}
          </div>
          <div style={{ fontSize: '13px', color: '#5D6D7E', marginBottom: '4px' }}>
            时段: {timeLabels[record.timeSlot]}
          </div>
          <div style={{ fontSize: '13px', color: '#5D6D7E', marginBottom: '4px' }}>
            品类: {record.categories.join(', ')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#E67E22', marginTop: '8px' }}>
            收入: ¥{record.revenue}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

interface HeatmapLayerProps {
  data: HeatmapPoint[]
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data }) => {
  const maxIntensity = useMemo(() => {
    return Math.max(...data.map((d) => d.intensity), 1)
  }, [data])

  const getHeatColor = (intensity: number): string => {
    const ratio = intensity / maxIntensity
    if (ratio < 0.2) return 'rgba(232, 248, 245, 0.6)'
    if (ratio < 0.4) return 'rgba(171, 235, 198, 0.6)'
    if (ratio < 0.6) return 'rgba(244, 208, 63, 0.6)'
    if (ratio < 0.8) return 'rgba(243, 156, 18, 0.6)'
    return 'rgba(231, 76, 60, 0.6)'
  }

  return (
    <>
      {data.map((point, index) => (
        <Circle
          key={`heat-${index}`}
          center={[point.lat, point.lng]}
          radius={150 + point.intensity * 20}
          pathOptions={{
            color: 'transparent',
            fillColor: getHeatColor(point.intensity),
            fillOpacity: 0.7,
          }}
        />
      ))}
    </>
  )
}

const SelectedLocationMarker: React.FC = () => {
  const selectedLocation = useStandStore((s) => s.selectedLocation)

  if (!selectedLocation) return null

  const icon = L.divIcon({
    className: 'selected-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: #E67E22;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 4px rgba(230, 126, 34, 0.3);
        animation: pulse 1.5s ease-in-out infinite;
      ">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  return (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icon}>
      <Popup>
        <div style={{ padding: '8px', width: '200px' }}>
          <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '4px' }}>
            已选择位置
          </div>
          <div style={{ fontSize: '12px', color: '#5D6D7E' }}>
            {selectedLocation.address}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

const MapView: React.FC = () => {
  const filteredRecords = useStandStore((s) => s.filteredRecords)
  const heatmapData = useStandStore((s) => s.heatmapData)
  const viewMode = useStandStore((s) => s.viewMode)
  const blinkingIds = useStandStore((s) => s.blinkingIds)
  const fetchRecords = useStandStore((s) => s.fetchRecords)
  const generateHeatmapData = useStandStore((s) => s.generateHeatmapData)

  useEffect(() => {
    fetchRecords()
    generateHeatmapData('month')
  }, [fetchRecords, generateHeatmapData])

  const tileLayerStyle = useCallback(() => ({
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }), [])

  return (
    <div className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .view-toggle {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 1000;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          display: flex;
          overflow: hidden;
        }
        .view-toggle button {
          padding: 8px 16px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #5D6D7E;
          transition: all 0.2s;
        }
        .view-toggle button.active {
          background: #E67E22;
          color: white;
        }
        .view-toggle button:hover:not(.active) {
          background: #F4F6F7;
        }
        .period-toggle {
          position: absolute;
          top: 16px;
          right: 180px;
          z-index: 1000;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          display: flex;
          overflow: hidden;
        }
        .period-toggle button {
          padding: 8px 16px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #5D6D7E;
          transition: all 0.2s;
        }
        .period-toggle button.active {
          background: #2C3E50;
          color: white;
        }
        .period-toggle button:hover:not(.active) {
          background: #F4F6F7;
        }
      `}</style>

      <div className="view-toggle">
        <button
          className={viewMode === 'markers' ? 'active' : ''}
          onClick={() => useStandStore.getState().setViewMode('markers')}
        >
          点位图
        </button>
        <button
          className={viewMode === 'heatmap' ? 'active' : ''}
          onClick={() => useStandStore.getState().setViewMode('heatmap')}
        >
          热力图
        </button>
      </div>

      <div className="period-toggle">
        <button
          onClick={() => generateHeatmapData('week')}
        >
          按周
        </button>
        <button
          onClick={() => generateHeatmapData('month')}
        >
          按月
        </button>
      </div>

      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          {...tileLayerStyle()}
        />

        <MapClickHandler />
        <SelectedLocationMarker />

        {viewMode === 'markers' &&
          filteredRecords.map((record) => (
            <RecordMarker
              key={record.id}
              record={record}
              isBlinking={blinkingIds.includes(record.id)}
            />
          ))}

        {viewMode === 'heatmap' && <HeatmapLayer data={heatmapData} />}
      </MapContainer>
    </div>
  )
}

export default MapView
