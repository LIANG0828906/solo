import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/store/appStore';
import { regions } from '@/data/regionData';
import { getMarkerIcon } from '@/utils/markerIcons';
import type { Specialty, Activity, MarkerIconKey } from '@/types';
import { cn } from '@/lib/utils';

import 'leaflet/dist/leaflet.css';

type MapItem = (Specialty | Activity) & { itemType: 'specialty' | 'activity' };

function MapEventHandler() {
  useMapEvents({
    click: () => {
      useAppStore.getState().setSelectedMarker(null);
    },
  });
  return null;
}

function FlyToController() {
  const map = useMap();
  const currentSolarTerm = useAppStore((s) => s.currentSolarTerm);

  useEffect(() => {
    const termRegions = regions.filter((r) => {
      const termData = useAppStore.getState().getCurrentSolarTermData();
      return termData?.regions.includes(r.name) || termData?.regions.some((reg) => r.name.includes(reg) || reg.includes(r.name));
    });

    if (termRegions.length === 0) {
      map.flyTo([35.0, 104.0], 5, { duration: 1 });
      return;
    }

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    termRegions.forEach((r) => {
      minLat = Math.min(minLat, r.bounds.south);
      maxLat = Math.max(maxLat, r.bounds.north);
      minLng = Math.min(minLng, r.bounds.west);
      maxLng = Math.max(maxLng, r.bounds.east);
    });

    const bounds = L.latLngBounds(
      [minLat - 1, minLng - 1],
      [maxLat + 1, maxLng + 1]
    );

    map.flyToBounds(bounds, { duration: 1, padding: [50, 50] });
  }, [currentSolarTerm, map]);

  return null;
}

function createDivIcon(type: MarkerIconKey) {
  const config = getMarkerIcon(type);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${config.bgColor};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 2px solid white;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      font-size: 20px;
    " onmouseover="this.style.transform='scale(1.15)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)'"><span style="pointer-events:none;">${config.icon}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function getDensityColor(density: number): string {
  const clamped = Math.min(Math.max(density, 0), 1);
  if (clamped < 0.33) {
    const t = clamped / 0.33;
    const r = Math.round(255);
    const g = Math.round(235 + (200 - 235) * t);
    const b = Math.round(59 + (100 - 59) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (clamped < 0.66) {
    const t = (clamped - 0.33) / 0.33;
    const r = Math.round(255);
    const g = Math.round(200 + (140 - 200) * t);
    const b = Math.round(100 + (50 - 100) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (clamped - 0.66) / 0.34;
    const r = Math.round(255 + (200 - 255) * t);
    const g = Math.round(140 + (50 - 140) * t);
    const b = Math.round(50 + (50 - 50) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function boundsToPolygon(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): [number, number][] {
  const latStep = (bounds.north - bounds.south) / 4;
  const lngStep = (bounds.east - bounds.west) / 4;
  return [
    [bounds.north, bounds.west + lngStep * 0.5],
    [bounds.north - latStep * 0.3, bounds.east],
    [bounds.south + latStep * 0.5, bounds.east - lngStep * 0.3],
    [bounds.south, bounds.west + lngStep],
    [bounds.south + latStep * 0.3, bounds.west],
    [bounds.north - latStep * 0.5, bounds.west + lngStep * 0.2],
  ];
}

function InfoWindowContent({
  item,
  itemType,
}: {
  item: Specialty | Activity;
  itemType: 'specialty' | 'activity';
}) {
  const setSelectedMarker = useAppStore((s) => s.setSelectedMarker);
  const toggleDetailPanel = useAppStore((s) => s.toggleDetailPanel);

  const shortDesc =
    item.description.length > 60
      ? item.description.slice(0, 60) + '...'
      : item.description;

  const handleClick = () => {
    setSelectedMarker({ id: item.id, type: itemType });
    toggleDetailPanel(true);
  };

  return (
    <div
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.85)',
        border: '2px solid #ff6b35',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '220px',
        maxWidth: '260px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#2d3436',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#636e72',
              lineHeight: 1.5,
              marginBottom: '10px',
            }}
          >
            {shortDesc}
          </div>
          <button
            onClick={handleClick}
            style={{
              background: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#e85a25';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#ff6b35';
            }}
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapView() {
  const filterType = useAppStore((s) => s.filterType);
  const getFilteredItems = useAppStore((s) => s.getFilteredItems);
  const getCurrentSolarTermData = useAppStore((s) => s.getCurrentSolarTermData);

  const [visible, setVisible] = useState(true);
  const prevFilterRef = useRef(filterType);

  useEffect(() => {
    if (prevFilterRef.current !== filterType) {
      setVisible(false);
      const timer = setTimeout(() => {
        setVisible(true);
      }, 50);
      prevFilterRef.current = filterType;
      return () => clearTimeout(timer);
    }
  }, [filterType]);

  const { specialties, activities } = getFilteredItems();

  const allItems: MapItem[] = useMemo(() => {
    const s: MapItem[] = specialties.map((item) => ({
      ...item,
      itemType: 'specialty' as const,
    }));
    const a: MapItem[] = activities.map((item) => ({
      ...item,
      itemType: 'activity' as const,
    }));
    return [...s, ...a];
  }, [specialties, activities]);

  const activeRegions = useMemo(() => {
    const termData = getCurrentSolarTermData();
    if (!termData) return [];
    return regions.filter(
      (r) =>
        termData.regions.includes(r.name) ||
        termData.regions.some(
          (reg) => r.name.includes(reg) || reg.includes(r.name)
        )
    );
  }, [getCurrentSolarTermData]);

  const densityGrid = useMemo(() => {
    if (allItems.length === 0) return [];
    const gridSize = 3;
    const grid: { lat: number; lng: number; count: number }[] = [];

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    allItems.forEach((item) => {
      minLat = Math.min(minLat, item.lat);
      maxLat = Math.max(maxLat, item.lat);
      minLng = Math.min(minLng, item.lng);
      maxLng = Math.max(maxLng, item.lng);
    });

    const latStep = Math.max((maxLat - minLat) / gridSize, 0.5);
    const lngStep = Math.max((maxLng - minLng) / gridSize, 0.5);

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const centerLat = minLat + latStep * (i + 0.5);
        const centerLng = minLng + lngStep * (j + 0.5);
        const count = allItems.filter((item) => {
          return (
            Math.abs(item.lat - centerLat) <= latStep &&
            Math.abs(item.lng - centerLng) <= lngStep
          );
        }).length;
        if (count > 0) {
          grid.push({ lat: centerLat, lng: centerLng, count });
        }
      }
    }

    const maxCount = Math.max(...grid.map((g) => g.count));
    return grid.map((g) => ({
      ...g,
      density: maxCount > 0 ? g.count / maxCount : 0,
    }));
  }, [allItems]);

  const shouldSimplify = allItems.length > 50;

  return (
    <div className={cn('w-full h-full relative', visible ? 'animate-fade-in' : 'opacity-0')}>
      <MapContainer
        center={[35.0, 104.0]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToController />
        <MapEventHandler />

        {activeRegions.map((region) => (
          <Polygon
            key={`polygon-${region.id}`}
            positions={boundsToPolygon(region.bounds)}
            pathOptions={{
              color: '#ff6b35',
              weight: 2,
              fillColor: '#ff6b35',
              fillOpacity: 0.15,
              dashArray: '8, 4',
            }}
          />
        ))}

        {densityGrid.map((cell, idx) => (
          <CircleMarker
            key={`density-${idx}`}
            center={[cell.lat, cell.lng]}
            radius={10 + cell.density * 25}
            pathOptions={{
              color: getDensityColor(cell.density),
              fillColor: getDensityColor(cell.density),
              fillOpacity: 0.25 + cell.density * 0.25,
              weight: 0,
            }}
          />
        ))}

        {!shouldSimplify &&
          allItems.map((item) => (
            <Marker
              key={`${item.itemType}-${item.id}`}
              position={[item.lat, item.lng]}
              icon={createDivIcon(item.type as MarkerIconKey)}
            >
              <Popup
                closeButton={true}
                autoPan={true}
                className="custom-popup"
              >
                <InfoWindowContent item={item} itemType={item.itemType} />
              </Popup>
            </Marker>
          ))}

        {shouldSimplify &&
          allItems.slice(0, 50).map((item) => (
            <Marker
              key={`${item.itemType}-${item.id}`}
              position={[item.lat, item.lng]}
              icon={createDivIcon(item.type as MarkerIconKey)}
            >
              <Popup
                closeButton={true}
                autoPan={true}
                className="custom-popup"
              >
                <InfoWindowContent item={item} itemType={item.itemType} />
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {shouldSimplify && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#636e72',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          标记数量较多，仅显示前50个
        </div>
      )}
    </div>
  );
}
