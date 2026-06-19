import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from './store';
import { formatDate } from './utils';

const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: radial-gradient(circle, #4A90D9 0%, rgba(74, 144, 217, 0.3) 100%);
        box-shadow: 0 0 0 4px rgba(74, 144, 217, 0.2);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const MapView: React.FC = () => {
  const { markers, routes, photos } = useStore((state) => ({
    markers: state.markers,
    routes: state.routes,
    photos: state.photos
  }));
  
  const mapRef = useRef<L.Map | null>(null);
  
  const getPhotoById = (photoId: string) => {
    return photos.find(p => p.id === photoId);
  };
  
  const calculateBounds = (): [number, number][] => {
    if (markers.length === 0) {
      return [[35.8617, 104.1954], [39.9042, 116.4074]];
    }
    
    const lats = markers.map(m => m.latitude);
    const lngs = markers.map(m => m.longitude);
    
    return [
      [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
      [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5]
    ];
  };
  
  const getCenter = (): [number, number] => {
    if (markers.length === 0) {
      return [35.8617, 104.1954];
    }
    
    const bounds = calculateBounds();
    return [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2
    ];
  };
  
  const getZoom = (): number => {
    if (markers.length === 0) return 4;
    
    const bounds = calculateBounds();
    const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
    const lngDiff = Math.abs(bounds[1][1] - bounds[0][1]);
    
    if (latDiff > 20 || lngDiff > 20) return 3;
    if (latDiff > 10 || lngDiff > 10) return 4;
    if (latDiff > 5 || lngDiff > 5) return 6;
    if (latDiff > 2 || lngDiff > 2) return 8;
    if (latDiff > 1 || lngDiff > 1) return 10;
    return 12;
  };
  
  if (typeof window === 'undefined') {
    return <div style={{ height: '600px', background: '#E8E8E8', borderRadius: '12px' }} />;
  }
  
  return (
    <div className="map-container" style={styles.container}>
      <MapContainer
        ref={mapRef}
        center={getCenter()}
        zoom={getZoom()}
        style={styles.map}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapController center={getCenter()} zoom={getZoom()} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.coordinates}
            color={route.color}
            weight={3}
            opacity={0.8}
            dashArray="10, 5"
            className="route-line"
            pathOptions={{
              dashOffset: '0'
            }}
          />
        ))}
        
        {markers.map((marker) => {
          const photo = getPhotoById(marker.photoId);
          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createCustomIcon()}
            >
              <Popup>
                <div className="photo-thumbnail-popup">
                  {photo && (
                    <>
                      <img
                        src={photo.url}
                        alt={marker.locationName}
                        style={{
                          width: '80px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                      <div className="location-name" style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#333',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {marker.locationName}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        textAlign: 'center',
                        marginTop: '2px'
                      }}>
                        {photo && formatDate(photo.takenAt)}
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {markers.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📍</div>
          <div style={styles.emptyText}>上传带地理位置的照片</div>
          <div style={styles.emptySubtext}>地图将自动标记旅行地点</div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '600px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: '12px'
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.9)',
    pointerEvents: 'none'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  emptySubtext: {
    fontSize: '13px',
    color: '#666'
  }
};

export default MapView;
