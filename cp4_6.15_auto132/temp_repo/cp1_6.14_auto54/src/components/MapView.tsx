import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { MapPin, Star, MessageSquare } from 'lucide-react'
import { Community } from '@/types'
import { cn } from '@/lib/utils'

interface MapViewProps {
  communities: Community[]
  selectedCommunityId?: string
  onCommunitySelect?: (communityId: string) => void
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

export default function MapView({
  communities,
  selectedCommunityId,
  onCommunitySelect,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const defaultCenter: [number, number] = [39.9042, 116.4074]
  const defaultZoom = 12

  const getMarkerSize = (reviewCount: number) => {
    const baseSize = 8
    const scaleFactor = Math.min(reviewCount / 50, 4)
    return baseSize + scaleFactor * 6
  }

  const handleMarkerClick = (communityId: string) => {
    if (onCommunitySelect) {
      onCommunitySelect(communityId)
    }
  }

  return (
    <div className="w-full h-full relative">
      <style>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 1rem;
        }
        .leaflet-tooltip.marker-tooltip {
          background: none;
          border: none;
          box-shadow: none;
          color: white;
          font-weight: 700;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          padding: 0;
        }
        .leaflet-tooltip.marker-tooltip:before {
          display: none;
        }
        .leaflet-tooltip-bottom.marker-tooltip {
          margin-left: 0;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        ref={mapRef}
      >
        <MapController center={defaultCenter} zoom={defaultZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {communities.map((community) => {
          const isSelected = selectedCommunityId === community.id
          const size = getMarkerSize(community.reviewCount)
          
          return (
            <CircleMarker
              key={community.id}
              center={[community.lat, community.lng]}
              radius={size}
              pathOptions={{
                fillColor: isSelected ? '#1d4ed8' : '#3b82f6',
                color: isSelected ? '#93c5fd' : '#60a5fa',
                weight: isSelected ? 4 : 2,
                fillOpacity: 0.8,
              }}
              eventHandlers={{
                click: () => handleMarkerClick(community.id),
              }}
              className={cn(
                'cursor-pointer transition-all duration-300',
                isSelected && 'z-10'
              )}
            >
              <Popup>
                <div className="p-4 min-w-[220px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate">
                        {community.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {community.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {community.averageScore.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">平均分</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <MessageSquare size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {community.reviewCount}
                        </p>
                        <p className="text-xs text-gray-500">评价数</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>气泡大小 = 评价数量</span>
        </div>
      </div>
    </div>
  )
}
