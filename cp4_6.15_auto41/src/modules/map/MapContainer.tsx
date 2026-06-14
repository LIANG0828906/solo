import { useMemo, useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStallService } from './stallService';
import { CATEGORY_LABELS, Stall } from '@/types';
import LazyImage from '@/components/LazyImage';

function createCustomIcon(color: string, icon: string, isOpen: boolean, isSelected: boolean) {
  const size = isSelected ? 56 : 46;
  const baseColor = isOpen ? color : '#B0B0B0';
  const selectedScale = isSelected ? 'scale(1.2)' : 'scale(1)';
  const fontSize = isSelected ? '26px' : '20px';

  return L.divIcon({
    className: 'custom-stall-marker',
    html: `
      <div
        style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${baseColor}, ${baseColor}dd);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg) ${selectedScale};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px ${isOpen ? `${color}50` : 'rgba(0,0,0,0.2)';
          border: 3px solid white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        "
        class="stall-marker ${isOpen ? '' : 'closed'}"
      >
        <span
          style="
            transform: rotate(45deg);
            font-size: ${fontSize};
            filter: ${isOpen ? 'none' : 'grayscale(40%)'};
            transition: filter 0.3s ease;
          "
        >
          ${icon}
        </span>
        ${isOpen ? `
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #7CB342;
            border: 2px solid white;
            transform: rotate(45deg);
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 6]
  });
}

interface MapControllerProps {
  selectedStall: Stall | null;
  selectedStallId: string | null;
}

function MapController({ selectedStall, selectedStallId }: MapControllerProps) {
  const map = useMap();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (selectedStall && selectedStallId) {
      map.setView(
        [selectedStall.position.lat, selectedStall.position.lng],
        16,
        { animate: true, duration: 0.5 }
      );
    }
  }, [selectedStallId, selectedStall, map]);

  useEffect(() => {
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      setTimeout(() => {
        map.setZoom(15, { animate: true, duration: 1 });
      }, 300);
    }
  }, [map]);

  return null;
}

function PopupContent({ stall }: { stall: Stall }) {
  const hotProduct = stall.products.find(p => p.isHot) || stall.products[0];

  return (
    <div style={{
      width: '200px',
      cursor: 'pointer',
      fontFamily: 'inherit'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${stall.markerColor}, ${stall.markerColor}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          boxShadow: `0 2px 6px ${stall.markerColor}40`,
          border: '2px solid white'
        }}>
          {stall.ownerAvatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '15px',
            color: '#333',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {stall.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '2px'
          }}>
            {CATEGORY_LABELS[stall.category]} · {stall.owner}
          </div>
        </div>
      </div>

      {hotProduct && (
        <div style={{
          width: '100%',
          height: '90px',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '10px',
          background: '#f5f5f5'
        }}>
          <LazyImage
            src={hotProduct.image}
            alt={hotProduct.name}
            style={{ borderRadius: '10px' }}
          />
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <span style={{
          color: stall.isOpen ? '#7CB342' : '#aaa',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stall.isOpen ? '#7CB342' : '#ccc',
            display: 'inline-block'
          }} />
          {stall.isOpen ? '营业中' : '已收摊'}
        </span>
        <span style={{
          color: '#8B7355',
          fontWeight: 600
        }}>
          📍 {stall.distance}m
        </span>
      </div>
    </div>
  );
}

export default function MapContainer() {
  const stallService = useStallService();
  const { filteredStalls, selectedStallId, setSelectedStallId, userPosition } = stallService;

  const markers = useMemo(() => {
    return filteredStalls.map(stall => {
      const icon = createCustomIcon(
        stall.markerColor,
        stall.markerIcon,
        stall.isOpen,
        selectedStallId === stall.id
      );
      return {
        stall,
        icon,
        zIndex: stall.isOpen
          ? (selectedStallId === stall.id ? 1000 : 500)
          : (selectedStallId === stall.id ? 200 : 100)
      };
    });
  }, [filteredStalls, selectedStallId]);

  return (
    <div
      className="map-container"
      style={{
        width: '100%',
        height: '65vh',
        minHeight: '320px',
        position: 'relative',
        borderBottom: '3px solid rgba(139, 115, 85, 0.2)',
        background: '#e8e4dc'
      }}
    >
      <LeafletMapContainer
        center={[userPosition.lat, userPosition.lng]}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          selectedStall={stallService.selectedStall}
          selectedStallId={stallService.selectedStallId}
        />

        {markers.map(({ stall, icon, zIndex }) => (
          <Marker
            key={stall.id}
            position={[stall.position.lat, stall.position.lng]}
            icon={icon}
            zIndexOffset={zIndex}
            opacity={stall.isOpen ? 1 : 0.55}
            eventHandlers={{
              click: () => {
                setSelectedStallId(stall.id);
              }
            }}
          >
            <Popup
              closeButton={false}
              offset={[0, -10]}
              maxWidth={220}
              minWidth={200}
              className="stall-popup"
            >
              <PopupContent stall={stall} />
            </Popup>
          </Marker>
        ))}
      </LeafletMapContainer>

      <style>{`
        .custom-stall-marker {
          background: transparent !important;
          border: none !important;
        }

        .stall-marker.closed {
          filter: grayscale(50%);
        }

        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
          padding: 2px !important;
        }

        .leaflet-popup-content {
          margin: 12px 14px !important;
        }

        .leaflet-popup-tip {
          box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
        }

        @media (max-width: 768px) {
          .map-container {
            height: 50vh !important;
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}
