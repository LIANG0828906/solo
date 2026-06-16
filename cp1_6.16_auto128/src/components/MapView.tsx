import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import { useScentStore } from '../store';
import { EMOTION_COLORS } from '../types';
import type { ScentMarker } from '../types';

const CHINA_CENTER: LatLngTuple = [35.8617, 104.1954];
const MAX_MARKERS = 50;

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  markers: ScentMarker[];
}

const mixColors = (colors: string[]): string => {
  if (colors.length === 0) return '#888888';
  let r = 0, g = 0, b = 0;
  for (const c of colors) {
    const hex = c.replace('#', '');
    r += parseInt(hex.slice(0, 2), 16);
    g += parseInt(hex.slice(2, 4), 16);
    b += parseInt(hex.slice(4, 6), 16);
  }
  r = Math.round(r / colors.length);
  g = Math.round(g / colors.length);
  b = Math.round(b / colors.length);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const MarkerLayer = () => {
  const map = useMap();
  const markers = useScentStore((s) => s.markers);
  const filters = useScentStore((s) => s.filters);
  const visibleMarkers = useScentStore((s) => s.getVisibleMarkers());
  const selectedId = useScentStore((s) => s.selectedId);
  const selectMarker = useScentStore((s) => s.selectMarker);
  const setPendingMarker = useScentStore((s) => s.setPendingMarker);
  const setCardOpen = useScentStore((s) => s.setCardOpen);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      setPendingMarker({ lat: e.latlng.lat, lng: e.latlng.lng });
      selectMarker(null);
      setCardOpen(true);
    },
  });

  const hasFilters = filters.categories.length > 0 || filters.emotions.length > 0;

  const { displayMarkers, clusters } = useMemo(() => {
    const sorted = [...visibleMarkers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (sorted.length <= MAX_MARKERS) {
      return { displayMarkers: sorted, clusters: [] as Cluster[] };
    }
    const recent = sorted.slice(0, MAX_MARKERS);
    const older = sorted.slice(MAX_MARKERS);

    const grid: Record<string, ScentMarker[]> = {};
    const gridSize = 10;
    for (const m of older) {
      const key = `${Math.floor(m.lat / gridSize)}_${Math.floor(m.lng / gridSize)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(m);
    }

    const clustersList: Cluster[] = [];
    let ci = 0;
    for (const key in grid) {
      const items = grid[key];
      const avgLat = items.reduce((s, m) => s + m.lat, 0) / items.length;
      const avgLng = items.reduce((s, m) => s + m.lng, 0) / items.length;
      clustersList.push({
        id: `cluster-${ci++}`,
        lat: avgLat,
        lng: avgLng,
        count: items.length,
        markers: items,
      });
    }
    return { displayMarkers: recent, clusters: clustersList };
  }, [visibleMarkers]);

  const renderMarkers = useCallback(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    layerRef.current.clearLayers();

    for (const marker of displayMarkers) {
      const isSelected = marker.id === selectedId;
      const isFiltered = hasFilters && !visibleMarkers.some((m) => m.id === marker.id);
      const color = isFiltered ? '#666666' : marker.color;
      const opacity = isFiltered ? 0.2 : 1;

      const icon = L.divIcon({
        className: 'scent-marker-icon',
        html: `
          <div style="position:relative;width:32px;height:32px;">
            <div style="
              position:absolute;
              left:50%;top:50%;
              width:8px;height:8px;
              border-radius:50%;
              background:${color};
              transform:translate(-50%,-50%);
              opacity:${opacity};
              animation:pulse-marker 2s ease-in-out infinite;
              ${isSelected ? 'box-shadow:0 0 10px white;' : ''}
            "></div>
            <div style="
              position:absolute;
              left:50%;top:50%;
              width:30px;height:30px;
              border-radius:50%;
              border:2px solid ${color};
              transform:translate(-50%,-50%);
              opacity:${opacity * 0.3};
              animation:ripple 3s ease-out infinite;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const m = L.marker([marker.lat, marker.lng], { icon });
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectMarker(marker.id);
        setPendingMarker(null);
        setCardOpen(true);
        map.flyTo([marker.lat, marker.lng], map.getZoom(), {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      });
      layerRef.current.addLayer(m);
    }

    for (const cluster of clusters) {
      const size = Math.min(24 + cluster.count * 2, 60);
      const colors = cluster.markers.map((m) => m.color);
      const mixedColor = mixColors(colors);

      const icon = L.divIcon({
        className: 'scent-cluster-icon',
        html: `
          <div style="
            width:${size}px;height:${size}px;
            border-radius:50%;
            background:${mixedColor};
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:600;font-size:14px;
            border:3px solid rgba(255,255,255,0.4);
            box-shadow:0 4px 20px rgba(0,0,0,0.4);
          ">${cluster.count}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const cm = L.marker([cluster.lat, cluster.lng], { icon });
      cm.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const targetZoom = Math.min(map.getZoom() + 3, 12);
        map.flyTo([cluster.lat, cluster.lng], targetZoom, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      });
      layerRef.current.addLayer(cm);
    }
  }, [displayMarkers, clusters, selectedId, hasFilters, visibleMarkers, map, selectMarker, setPendingMarker, setCardOpen]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  useEffect(() => {
    if (selectedId) {
      const marker = markers.find((m) => m.id === selectedId);
      if (marker) {
        map.flyTo([marker.lat, marker.lng], map.getZoom(), {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedId, markers, map]);

  return null;
};

const MapView = () => {
  const pendingMarker = useScentStore((s) => s.pendingMarker);
  const setCardOpen = useScentStore((s) => s.setCardOpen);
  const selectMarker = useScentStore((s) => s.selectMarker);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={CHINA_CENTER}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        style={{ width: '100%', height: '100%', background: '#0F3460' }}
        zoomControl={true}
        worldCopyJump={true}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
        />
        <MarkerLayer />
      </MapContainer>

      {pendingMarker && (
        <div
          onClick={() => {
            setCardOpen(true);
            selectMarker(null);
          }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#E0D9CF',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          已选择位置，点击创建记忆 →
        </div>
      )}
    </div>
  );
};

export default MapView;
