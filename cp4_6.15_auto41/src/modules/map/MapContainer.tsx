import { useMemo, useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStallService } from './stallService';
import { CATEGORY_LABELS, Stall } from '@/types';

function createCustomIcon(color: string, icon: string, isOpen: boolean, isSelected: boolean) {
  const size = isSelected ? 52 : 44;
  const baseColor = isOpen ? color : '#999999';
  const selectedTransform = isSelected ? 'transform: rotate(-45deg) scale(1.15);' : '';
  const fontSize = isSelected ? '24px' : '20px';
  return L.divIcon({
    className: 'custom-stall-marker',
    html: `
      <div
        style="
          width: ${size}px;
          height: ${size}px;
          background: ${baseColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 3px solid white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          ${selectedTransform}
        "
        class="stall-marker ${isOpen ? '' : 'closed'}"
      >
        <span style="transform: rotate(45deg); font-size: ${fontSize};">${icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
}

interface MapControllerProps {
  selectedStall: Stall | null;
  selectedStallId: string | null;
}

function MapController({ selectedStall, selectedStallId }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedStall) {
      map.setView(
        [selectedStall.position.lat, selectedStall.position.lng],
        16,
        { animate: true }
      );
    }
  }, [selectedStallId, selectedStall, map]);

  return null;
}

export default function MapContainer() {
  const stallService = useStallService();
  const { filteredStalls, selectedStallId, setSelectedStallId, userPosition } = stallService;

  const markers = useMemo(() => {
    return filteredStalls.map(stall => {
      const hotProduct = stall.products.find(p => p.isHot) || stall.products[0];
      const icon = createCustomIcon(
        stall.markerColor,
        stall.markerIcon,
        stall.isOpen,
        selectedStallId === stall.id
      );
      return {
        stall,
        icon,
        hotProduct,
        zIndex: stall.isOpen ? (selectedStallId === stall.id ? 1000 : 500) : 100
      };
    });
  }, [filteredStalls, selectedStallId]);

  return (
    <div
      className="map-container"
      style={{
        width: '100%',
        height: '65vh',
        position: 'relative',
        borderBottom: '4px solid rgba(139, 115, 85, 0.3)'
      }}
    >
      <LeafletMapContainer
        center={[userPosition.lat, userPosition.lng]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedStall={stallService.selectedStall}
          selectedStallId={stallService.selectedStallId}
        />

        {markers.map(({ stall, icon, zIndex, hotProduct }) => (
          <Marker
            key={stall.id}
            position={[stall.position.lat, stall.position.lng]}
            icon={icon}
            zIndexOffset={zIndex}
            eventHandlers={{
              click: () => {
                setSelectedStallId(stall.id);
              }
            }}
          >
            <Popup
              closeButton={false}
              offset={[0, -20]}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStallId(stall.id);
                }}
                style={{
                  width: '180px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: stall.markerColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {stall.ownerAvatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {stall.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#888'
                    }}>
                      {CATEGORY_LABELS[stall.category]}
                    </div>
                  </div>
                </div>

                {hotProduct && (
                  <div style={{
                    width: '100%',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    background: '#f5f5f5'
                  }}>
                    <img
                      src={hotProduct.image}
                      alt={hotProduct.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}>
                  <span style={{
                    color: stall.isOpen ? '#7CB342' : '#999',
                    fontWeight: 500
                  }}>
                    {stall.isOpen ? '🟢 营业中' : '⚪ 已收摊'}
                  </span>
                  <span style={{ color: '#666' }}>
                    📍 {stall.distance}m
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}
