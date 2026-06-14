import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePlant } from '../context/PlantContext';

const createPulseIcon = () => L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="pulse-marker">
      <div class="marker-pulse"></div>
      <div class="marker-dot"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

interface MapControllerProps {
  onReady: () => void;
}

const MapController: React.FC<MapControllerProps> = ({ onReady }) => {
  const map = useMap();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log('🗺️ Leaflet地图初始化中...');
    
    const checkAndInit = () => {
      try {
        const center = map.getCenter();
        console.log('📍 当前地图中心:', center);
        
        if (!center || isNaN(center.lat) || isNaN(center.lng)) {
          console.log('🔄 地图尚未就绪，重新设置中心...');
          map.setView([39.9200, 116.4074], 12);
        }
        
        map.invalidateSize();
        
        setTimeout(() => {
          const newCenter = map.getCenter();
          console.log('📍 修正后地图中心:', newCenter);
          
          if (!isNaN(newCenter.lat) && !isNaN(newCenter.lng)) {
            map.flyTo([39.9200, 116.4074], 12, { 
              duration: 1.5,
              easeLinearity: 0.25
            });
          } else {
            map.setView([39.9200, 116.4074], 12);
          }
          
          console.log('✅ Leaflet地图加载完成，已定位到北京市');
          onReady();
        }, 200);
      } catch (err) {
        console.error('❌ 地图初始化错误:', err);
        map.setView([39.9200, 116.4074], 12);
        onReady();
      }
    };
    
    const timer = setTimeout(checkAndInit, 300);
    return () => clearTimeout(timer);
  }, [map, onReady]);

  return null;
};

const MapPage: React.FC = () => {
  const { adoptionPoints } = usePlant();
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📍 领养地图页面加载');
    console.log(`📍 共 ${adoptionPoints.length} 个领养点`);
    
    const checkLeaflet = setInterval(() => {
      if (window.L) {
        console.log('✅ Leaflet库已加载');
        clearInterval(checkLeaflet);
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(checkLeaflet);
      if (!window.L) {
        console.warn('⚠️ Leaflet加载超时，可能影响地图显示');
      }
    }, 5000);

    return () => {
      clearInterval(checkLeaflet);
      clearTimeout(timeout);
    };
  }, [adoptionPoints.length]);

  const handleMapReady = () => {
    setMapReady(true);
    setLoading(false);
  };

  return (
    <div>
      <h2 className="page-title">
        📍 领养地图 
        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'normal', marginLeft: '10px' }}>
          {loading ? '加载中...' : `共${adoptionPoints.length}个领养点`}
        </span>
      </h2>
      
      {loading && (
        <div style={{
          width: '100%',
          height: 'calc(100vh - 140px)',
          borderRadius: '16px',
          background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-medium)',
          fontSize: '1rem'
        }}>
          🗺️ 地图加载中...
        </div>
      )}
      
      <div 
        className="map-container" 
        style={{ display: loading ? 'none' : 'block' }}
      >
        <MapContainer
          center={[39.9200, 116.4074]}
          zoom={12}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          zoomAnimation={true}
          fadeAnimation={true}
          markerZoomAnimation={true}
          preferCanvas={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            crossOrigin={true}
          />
          <MapController onReady={handleMapReady} />
          
          {adoptionPoints.map((point, index) => {
            console.log(`📍 添加标注点 ${index + 1}: ${point.name}`);
            return (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={createPulseIcon()}
                keyboard={true}
                title={point.name}
              >
                <Popup maxWidth={280} minWidth={200}>
                  <div className="popup-content">
                    <div className="popup-title">{point.name}</div>
                    <div className="popup-address">📍 {point.address}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-medium)', marginBottom: '8px' }}>可领养绿植：</div>
                    <div className="popup-plants">
                      {point.plants.map((plant, idx) => (
                        <span key={idx} className="popup-plant-tag">
                          🌱 {plant}
                        </span>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {mapReady && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--white)',
          borderRadius: '12px',
          fontSize: '0.85rem',
          color: 'var(--text-medium)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <span>💡</span>
          <span>拖动地图浏览更多区域，点击绿色标注点查看领养点详情</span>
        </div>
      )}
    </div>
  );
};

export default MapPage;
