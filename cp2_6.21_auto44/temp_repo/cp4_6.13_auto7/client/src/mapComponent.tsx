import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Meal } from './types';

interface MapComponentProps {
  meals: Meal[];
  onMealClick?: (meal: Meal) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

function createMealIcon() {
  return L.divIcon({
    className: 'meal-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #FFB347, #FF8A80);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(255, 140, 66, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 16px;
        ">🍜</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapComponent({ meals, onMealClick, onMapClick }: MapComponentProps) {
  const center: [number, number] = [39.9042, 116.4074];
  const mealIcon = createMealIcon();

  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <MapClickHandler onMapClick={onMapClick} />
        {meals.map((meal) => (
          <Marker
            key={meal.id}
            position={[meal.location.lat, meal.location.lng]}
            icon={mealIcon}
          >
            <Popup>
              <div
                className="min-w-[180px] cursor-pointer"
                onClick={() => onMealClick && onMealClick(meal)}
              >
                {meal.images && meal.images.length > 0 && (
                  <img
                    src={meal.images[0].startsWith('http') ? meal.images[0] : `http://localhost:3000${meal.images[0]}`}
                    alt={meal.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="font-semibold text-gray-800 text-sm">{meal.name}</div>
                {meal.publisher && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {meal.publisher.avatar ? (
                      <img
                        src={meal.publisher.avatar.startsWith('http') ? meal.publisher.avatar : `http://localhost:3000${meal.publisher.avatar}`}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    ) : null}
                    <span>{meal.publisher.username}</span>
                  </div>
                )}
                {meal.matchScore !== undefined && (
                  <div className="text-xs text-primary mt-1 font-medium">
                    匹配度 {Math.round(meal.matchScore * 100)}%
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
