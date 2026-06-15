import { useParams, useNavigate, useMemo } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Edit3,
  MapPin,
} from 'lucide-react';
import { useTripStore } from '@/shared/data/TripStore';
import { useThemeContext } from '@/App';
import MapDisplay, { MapMarker as MapDisplayMarker } from '@/modules/map-view/components/MapDisplay';

export default function MapViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip } = useTripStore();
  const { isDark, toggleTheme } = useThemeContext();

  const trip = id ? getTrip(id) : undefined;

  const markers = useMemo<MapDisplayMarker[]>(() => {
    if (!trip) return [];

    const result: MapDisplayMarker[] = [];
    trip.pages.forEach((page) => {
      page.markers.forEach((marker) => {
        const markerPhotos = marker.photoId
          ? page.photos
              .filter((p) => p.id === marker.photoId)
              .map((p) => ({ id: p.id, url: p.url, caption: p.name }))
          : page.photos.slice(0, 4).map((p) => ({ id: p.id, url: p.url, caption: p.name }));

        result.push({
          id: marker.id,
          pageId: marker.pageId,
          name: marker.name,
          address: marker.address,
          lat: marker.lat,
          lng: marker.lng,
          date: page.date,
          photos: markerPhotos,
        });
      });
    });
    return result;
  }, [trip]);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-playfair mb-4" style={{ color: 'var(--color-text)' }}>
            旅程不存在
          </h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-40 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(var(--color-bg), 0.85)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-card-secondary)' }}
              title="返回首页"
            >
              <ArrowLeft size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <div>
              <h1 className="text-lg font-playfair font-bold truncate max-w-[200px] sm:max-w-md"
                style={{ color: 'var(--color-text)' }}
              >
                <MapPin size={16} className="inline mr-2 -mt-1" style={{ color: 'var(--color-accent)' }} />
                {trip.name}
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {markers.length > 0
                  ? `${markers.length} 个地点 · ${trip.pages.length} 天`
                  : `${trip.pages.length} 天`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-card-secondary)' }}
              title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? (
                <Sun size={20} style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Moon size={20} style={{ color: 'var(--color-text-secondary)' }} />
              )}
            </button>
            <button
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Edit3 size={16} />
              <span className="hidden sm:inline">编辑旅程</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-10rem)] min-h-[600px]">
          {id ? <MapDisplay markers={markers} tripId={id} /> : null}
        </div>
      </main>
    </div>
  );
}
