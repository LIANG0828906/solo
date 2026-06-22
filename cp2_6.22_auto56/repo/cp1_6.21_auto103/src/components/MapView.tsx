import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity } from '@/utils/api';
import { cityCoordinates, getCityColor } from '@/utils/cities';
import { Search } from 'lucide-react';

interface CityInfo {
  lat: number;
  lng: number;
}

const allCities = Object.keys(cityCoordinates);

function MoveTo({ center }: { center: [number, number] }) {
  const map = useMap();
  map.flyTo(center, map.getZoom() < 6 ? 6 : map.getZoom(), { duration: 0.8 });
  return null;
}

function createPinIcon(color: string) {
  return L.divIcon({
    className: 'pin-div-icon',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface MapViewProps {
  activities: Activity[];
}

export default function MapView({ activities }: MapViewProps) {
  const [search, setSearch] = useState('');
  const [flyCenter, setFlyCenter] = useState<[number, number] | null>([34.0, 108.0]);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return allCities.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  const pinnedCities = useMemo(() => {
    const seen = new Map<string, { count: number; lastImage: string; days: number }>();
    activities.forEach((a, idx) => {
      const existing = seen.get(a.city);
      if (existing) {
        existing.count += 1;
        existing.days += 1;
        existing.lastImage = a.imageUrl;
      } else {
        seen.set(a.city, { count: idx, lastImage: a.imageUrl, days: 1 });
      }
    });
    return Array.from(seen.entries()).map(([city, info]) => ({
      city,
      coord: cityCoordinates[city] || { lat: 30, lng: 114 },
      color: getCityColor(city, activities),
      ...info,
    }));
  }, [activities]);

  const pickCity = (city: string) => {
    const c = cityCoordinates[city];
    if (c) {
      setFlyCenter([c.lat, c.lng]);
      setSearch('');
    }
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div
          className="relative flex items-center bg-white overflow-hidden"
          style={{
            height: 40,
            borderRadius: 8,
            boxShadow: '0 2px 12px #0000001A',
            border: '1px solid #E0E0E0',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#4CAF50')}
          onBlur={e => (e.currentTarget.style.borderColor = '#E0E0E0')}
        >
          <Search size={18} style={{ color: '#9E9E9E', marginLeft: 12 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索城市..."
            className="flex-1 outline-none bg-transparent text-sm px-3"
            style={{ color: '#333' }}
          />
        </div>
        {filteredCities.length > 0 && (
          <div
            className="mt-2 bg-white rounded-xl overflow-hidden animate-fade-in"
            style={{ boxShadow: '0 6px 24px #0000001A' }}
          >
            {filteredCities.map(c => (
              <button
                key={c}
                onClick={() => pickCity(c)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#333' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8F5E9')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <MapContainer
        center={[34.0, 108.0]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />
        {flyCenter && <MoveTo center={flyCenter} />}

        {pinnedCities.map(({ city, coord, color, days, lastImage }) => (
          <Marker
            key={city}
            position={[coord.lat, coord.lng]}
            icon={createPinIcon(color)}
            class="animate-pop-in"
          >
            <Popup closeButton={false}>
              <div className="w-[220px]">
                <img
                  src={lastImage}
                  alt={city}
                  className="w-full h-28 object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://source.unsplash.com/featured/440x240/?${encodeURIComponent(city)}`;
                  }}
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold" style={{ color: '#333' }}>
                      {city}
                    </div>
                    <div
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: color + '22', color }}
                    >
                      {days} 天
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs" style={{ color: '#9E9E9E' }}>
                    点击图钉查看详情
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Suppress unused variable warning for type
export type _CityInfoExport = CityInfo;
