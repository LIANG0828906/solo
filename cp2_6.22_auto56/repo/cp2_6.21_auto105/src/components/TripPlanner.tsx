import { MapPin, Plus, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  day?: number;
}

interface TripPlannerProps {
  waypoints?: Waypoint[];
  onChange?: (waypoints: Waypoint[]) => void;
  readOnly?: boolean;
}

const defaultWaypoints: Waypoint[] = [
  { id: '1', name: '起点站', lat: 39.9042, lng: 116.4074, description: '北京', day: 1 },
  { id: '2', name: '第二站', lat: 34.3416, lng: 108.9398, description: '西安', day: 2 },
  { id: '3', name: '终点站', lat: 30.5728, lng: 104.0668, description: '成都', day: 3 },
];

export default function TripPlanner({
  waypoints = defaultWaypoints,
  onChange,
  readOnly = false,
}: TripPlannerProps) {
  const positions = waypoints.map((w) => [w.lat, w.lng] as [number, number]);

  const center = waypoints.length > 0
    ? [waypoints[0].lat, waypoints[0].lng] as [number, number]
    : [39.9042, 116.4074] as [number, number];

  const addWaypoint = () => {
    if (readOnly || !onChange) return;
    const newWaypoint: Waypoint = {
      id: Math.random().toString(36).substr(2, 9),
      name: `第${waypoints.length + 1}站`,
      lat: center[0] + (Math.random() - 0.5) * 5,
      lng: center[1] + (Math.random() - 0.5) * 5,
      day: waypoints.length + 1,
    };
    onChange([...waypoints, newWaypoint]);
  };

  const removeWaypoint = (id: string) => {
    if (readOnly || !onChange) return;
    onChange(waypoints.filter((w) => w.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', minHeight: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {waypoints.map((waypoint) => (
            <Marker key={waypoint.id} position={[waypoint.lat, waypoint.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{waypoint.name}</p>
                  {waypoint.description && <p className="text-gray-600">{waypoint.description}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              color="#1a73e8"
              weight={3}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      <div className="lg:w-72 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">路线站点</h3>
          {!readOnly && (
            <button
              onClick={addWaypoint}
              className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
            >
              <Plus size={16} />
              添加站点
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {waypoints.map((waypoint) => (
            <div
              key={waypoint.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-[#1a73e8] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#34a853] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-semibold">{waypoint.day || ''}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{waypoint.name}</p>
                    {waypoint.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{waypoint.description}</p>
                    )}
                    {waypoint.day && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-400">第{waypoint.day}天</span>
                      </div>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => removeWaypoint(waypoint.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            共 <span className="font-semibold text-gray-900">{waypoints.length}</span> 个站点
          </p>
        </div>
      </div>
    </div>
  );
}
