import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin as MapPinIcon, X, Image, Link, Unlink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { searchLocation } from '@/shared/utils/geocoding';
import { useTripStore } from '@/shared/data/TripStore';
import type { MapMarker, Photo } from '@/shared/types';

import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapPinProps {
  markers: MapMarker[];
  photos: Photo[];
  pageId: string;
  tripId: string;
}

interface SearchResultItem {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

function MapView({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} title={marker.name} />
      ))}
    </>
  );
}

export default function MapPin({ markers, photos, pageId, tripId }: MapPinProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [linkingMarkerId, setLinkingMarkerId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMarkerToPage = useTripStore((s) => s.addMarkerToPage);
  const removeMarkerFromPage = useTripStore((s) => s.removeMarkerFromPage);
  const updateMarkerPhoto = useTripStore((s) => s.updateMarkerPhoto);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocation(query);
      setSearchResults(results);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = searchTimeoutRef.current;
    if (timeout) clearTimeout(timeout);

    const newTimeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    searchTimeoutRef.current = newTimeout;

    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [searchQuery, handleSearch]);

  const handleSelectLocation = (result: SearchResultItem) => {
    addMarkerToPage(tripId, pageId, {
      name: result.name,
      lat: result.lat,
      lng: result.lng,
      address: result.displayName,
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleToggleLink = (markerId: string) => {
    if (linkingMarkerId === markerId) {
      setLinkingMarkerId(null);
    } else {
      setLinkingMarkerId(markerId);
    }
  };

  const handleLinkPhoto = (markerId: string, photoId: string) => {
    const marker = markers.find((m) => m.id === markerId);
    if (marker?.photoId === photoId) {
      updateMarkerPhoto(tripId, pageId, markerId, undefined);
    } else {
      updateMarkerPhoto(tripId, pageId, markerId, photoId);
    }
    setLinkingMarkerId(null);
  };

  const center: [number, number] = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : [39.9042, 116.4074];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        地点标记 ({markers.length})
      </h3>

      <div className="relative">
        <div className="relative">
          <Search
            className={cn(
              'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
              isSearching ? 'animate-spin text-indigo-500' : 'text-gray-400'
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="搜索地点名称..."
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4',
              'text-sm placeholder:text-gray-400',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500'
            )}
          />
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {searchResults.map((result, idx) => (
              <button
                key={`${result.lat}-${result.lng}-${idx}`}
                onMouseDown={() => handleSelectLocation(result)}
                className="flex w-full items-start gap-2 border-b border-gray-100 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {result.name}
                  </div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {result.displayName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            未找到相关地点
          </div>
        )}
      </div>

      {markers.length > 0 && (
        <div className="h-48 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={center}
            zoom={markers.length > 0 ? 12 : 10}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapView markers={markers} />
          </MapContainer>
        </div>
      )}

      {markers.length > 0 && (
        <div className="space-y-2">
          {markers.map((marker) => {
            const linkedPhoto = photos.find((p) => p.id === marker.photoId);
            const isLinking = linkingMarkerId === marker.id;

            return (
              <div
                key={marker.id}
                className={cn(
                  'rounded-lg border p-3 transition-all',
                  isLinking
                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        {marker.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleLink(marker.id)}
                      className={cn(
                        'rounded-md p-1.5 transition-colors',
                        linkedPhoto
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                          : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300',
                        isLinking && 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                      )}
                      title={linkedPhoto ? '已关联照片' : '关联照片'}
                    >
                      {linkedPhoto ? <Unlink className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => removeMarkerFromPage(tripId, pageId, marker.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {linkedPhoto && !isLinking && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-white p-2 dark:bg-gray-900/50">
                    <Image className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      关联照片: {linkedPhoto.name}
                    </span>
                    <img
                      src={linkedPhoto.thumbnailUrl || linkedPhoto.url}
                      alt=""
                      className="ml-auto h-8 w-8 rounded object-cover"
                    />
                  </div>
                )}

                {isLinking && (
                  <div className="mt-2 rounded-md bg-white p-2 dark:bg-gray-900/50">
                    <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                      选择要关联的照片（点击取消关联）:
                    </div>
                    {photos.length === 0 ? (
                      <div className="text-xs text-gray-400">当前页暂无照片</div>
                    ) : (
                      <div className="grid grid-cols-6 gap-1">
                        {photos.map((photo) => {
                          const isLinked = marker.photoId === photo.id;
                          return (
                            <button
                              key={photo.id}
                              onClick={() => handleLinkPhoto(marker.id, photo.id)}
                              className={cn(
                                'aspect-square overflow-hidden rounded border-2 transition-all',
                                isLinked
                                  ? 'border-green-500 ring-2 ring-green-300 dark:ring-green-700'
                                  : 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-600'
                              )}
                            >
                              <img
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.name}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {markers.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800/50">
          <MapPinIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            使用上方搜索框添加地点标记
          </p>
        </div>
      )}
    </div>
  );
}
