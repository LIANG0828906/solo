import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { LatLng, LeafletMouseEvent } from 'leaflet';
import { useSiteStore } from '../store/siteStore';
import { FACILITY_CONFIGS } from '../types';
import type { Facility } from '../types';
import { renderHeatmapToCanvas } from '../utils/heatmapEngine';

const MAP_CENTER: [number, number] = [31.2304, 121.4737];
const MAP_ZOOM = 15;

function createFacilityIcon(facility: Facility): L.DivIcon {
  return L.divIcon({
    className: 'facility-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${facility.color};
          opacity: 0.3;
          transform: scale(1.3);
        "></div>
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${facility.color};
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 1;
          cursor: grab;
        ">${facility.icon}</div>
        <div style="
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(22, 33, 62, 0.95);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          border: 1px solid ${facility.color};
          z-index: 2;
        ">${facility.name}</div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 30],
    popupAnchor: [0, -30],
  });
}

function HeatmapLayer() {
  const map = useMap();
  const heatGrid = useSiteStore((s) => s.heatGrid);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  useEffect(() => {
    if (!heatGrid || !canvasRef.current || !map) return;

    renderHeatmapToCanvas(heatGrid, canvasRef.current);

    const dataUrl = canvasRef.current.toDataURL();
    const [south, west, north, east] = heatGrid.bounds;
    const bounds = L.latLngBounds(
      L.latLng(south, west),
      L.latLng(north, east)
    );

    if (overlayRef.current) {
      overlayRef.current.setBounds(bounds);
      overlayRef.current.setUrl(dataUrl);
    } else {
      overlayRef.current = L.imageOverlay(dataUrl, bounds, {
        opacity: 0.7,
        interactive: false,
        className: 'heatmap-overlay',
      }).addTo(map);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setOpacity(0);
      }
    };
  }, [heatGrid, map]);

  return null;
}

function MapClickHandler() {
  const isPlacingMode = useSiteStore((s) => s.isPlacingMode);
  const selectedFacilityType = useSiteStore((s) => s.selectedFacilityType);
  const addFacility = useSiteStore((s) => s.addFacility);
  const setPlacingMode = useSiteStore((s) => s.setPlacingMode);
  const map = useMap();

  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (isPlacingMode) {
        addFacility(selectedFacilityType, e.latlng.lat, e.latlng.lng);
        setPlacingMode(false);
        map.getContainer().style.cursor = '';
      }
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = isPlacingMode ? 'crosshair' : '';
  }, [isPlacingMode, map]);

  return null;
}

function SimulationController() {
  const map = useMap();
  const isSimulating = useSiteStore((s) => s.isSimulating);
  const updateSimulation = useSiteStore((s) => s.updateSimulation);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getBounds = useCallback(() => {
    const b = map.getBounds();
    return {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    };
  }, [map]);

  useEffect(() => {
    if (isSimulating) {
      updateSimulation(getBounds());
      intervalRef.current = setInterval(() => {
        updateSimulation(getBounds());
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating, getBounds, updateSimulation]);

  useEffect(() => {
    const handleMove = () => {
      if (isSimulating) {
        updateSimulation(getBounds());
      }
    };
    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);
    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, [isSimulating, getBounds, updateSimulation, map]);

  return null;
}

function DraggableMarker({ facility }: { facility: Facility }) {
  const markerRef = useRef<L.Marker | null>(null);
  const moveFacility = useSiteStore((s) => s.moveFacility);
  const getFacilityDensity = useSiteStore((s) => s.getFacilityDensity);
  const isSimulating = useSiteStore((s) => s.isSimulating);
  const [density, setDensity] = useState(0);

  useEffect(() => {
    if (isSimulating) {
      setDensity(getFacilityDensity(facility.id));
    } else {
      setDensity(0);
    }
  }, [facility.id, getFacilityDensity, isSimulating]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos: LatLng = marker.getLatLng();
          moveFacility(facility.id, pos.lat, pos.lng);
        }
      },
    }),
    [facility.id, moveFacility]
  );

  return (
    <Marker
      ref={markerRef}
      position={[facility.lat, facility.lng]}
      icon={createFacilityIcon(facility)}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ minWidth: '160px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontWeight: 'bold',
          }}>
            <span style={{ fontSize: '20px' }}>{facility.icon}</span>
            <span>{facility.name}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            类型: {FACILITY_CONFIGS[facility.type].name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            坐标: {facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}
          </div>
          {isSimulating && (
            <div style={{
              marginTop: '8px',
              padding: '6px 8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              <strong>附近人流密度:</strong>{' '}
              <span style={{
                color: density > 0.7 ? '#F44336' : density > 0.3 ? '#FF9800' : '#4CAF50',
                fontWeight: 'bold',
              }}>
                {(density * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function MapView() {
  const facilities = useSiteStore((s) => s.facilities);

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      style={{
        width: '100%',
        height: '100vh',
        background: '#1A1A2E',
      }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      <HeatmapLayer />
      <SimulationController />
      {facilities.map((facility) => (
        <DraggableMarker key={facility.id} facility={facility} />
      ))}
    </MapContainer>
  );
}
