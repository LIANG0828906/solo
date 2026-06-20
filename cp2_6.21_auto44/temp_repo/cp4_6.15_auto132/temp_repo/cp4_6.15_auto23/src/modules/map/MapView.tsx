import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet.heat';
import { SoundClip, CATEGORY_COLORS } from '../../types';

interface MapViewProps {
  soundClips: SoundClip[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (clip: SoundClip) => void;
  showHeatmap: boolean;
}

const DARK_TILE_URLS = [
  'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
];

function createPulseIcon(category: SoundClip['category']): L.DivIcon {
  const color = CATEGORY_COLORS[category];
  return L.divIcon({
    className: 'sound-marker-wrapper',
    html: `<div class="marker-pulse" style="--mc: ${color}">
             <div class="marker-ring"></div>
             <div class="marker-dot" style="background:${color};box-shadow:0 0 8px ${color}"></div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function HeatmapLayer({ points }: { points: L.LatLngExpression[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      if ('remove' in layerRef.current) {
        (layerRef.current as any).remove();
      } else {
        map.removeLayer(layerRef.current);
      }
      layerRef.current = null;
    }
    if (points.length === 0) return;

    const windowL = (window as any).L;
    const heatAvailable = typeof (L as any).heatLayer === 'function' || (windowL && typeof windowL.heatLayer === 'function');

    if (heatAvailable) {
      try {
        const heatFn = (L as any).heatLayer || windowL.heatLayer;
        layerRef.current = heatFn(points, {
          radius: 30,
          blur: 20,
          maxZoom: 15,
          max: points.length > 50 ? 10 : 5,
          gradient: {
            0.2: '#00d2ff',
            0.4: '#00ff88',
            0.6: '#ffd43b',
            0.8: '#ff922b',
            1.0: '#ff4757',
          },
        }).addTo(map);
        return;
      } catch (e) {
        console.warn('leaflet.heat failed, falling back to canvas heatmap', e);
      }
    }

    const CanvasHeatLayer = (L.Class as any).extend({
      options: {
        pane: 'overlayPane',
      },
      onAdd: function (mapInstance: L.Map) {
        this._map = mapInstance;
        const pane = mapInstance.getPane(this.options.pane);
        this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-canvas', pane);
        const size = mapInstance.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        this._canvas.style.width = size.x + 'px';
        this._canvas.style.height = size.y + 'px';
        this._canvas.style.position = 'absolute';
        this._canvas.style.left = '0';
        this._canvas.style.top = '0';
        this._canvas.style.pointerEvents = 'none';
        this._draw();
        mapInstance.on('moveend zoomend resize', this._draw, this);
      },
      onRemove: function (mapInstance: L.Map) {
        L.DomUtil.remove(this._canvas);
        mapInstance.off('moveend zoomend resize', this._draw, this);
      },
      _draw: function () {
        const mapInstance: L.Map = this._map;
        const canvas: HTMLCanvasElement = this._canvas;
        if (!canvas || !mapInstance) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = mapInstance.getSize();
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.width = size.x + 'px';
        canvas.style.height = size.y + 'px';
        ctx.clearRect(0, 0, size.x, size.y);

        const bounds = mapInstance.getBounds();
        const zoom = mapInstance.getZoom();
        const radiusPx = Math.max(10, Math.min(60, 30 * (zoom / 12)));

        for (let i = 0; i < points.length; i++) {
          const p = points[i] as [number, number];
          const lat = p[0];
          const lng = p[1];
          if (!bounds.contains([lat, lng])) continue;
          const point = mapInstance.latLngToContainerPoint([lat, lng]);
          const gradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, radiusPx
          );
          gradient.addColorStop(0, 'rgba(255, 71, 87, 0.8)');
          gradient.addColorStop(0.3, 'rgba(255, 146, 43, 0.6)');
          gradient.addColorStop(0.5, 'rgba(255, 212, 59, 0.4)');
          gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.25)');
          gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, radiusPx, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    });

    const canvasLayer = new (CanvasHeatLayer as any)();
    canvasLayer.addTo(map);
    layerRef.current = canvasLayer;

    return () => {
      if (layerRef.current) {
        if ('remove' in layerRef.current) {
          (layerRef.current as any).remove();
        } else {
          map.removeLayer(layerRef.current);
        }
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

function MapEventHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);

  useMapEvents({
    click: handleClick,
  });
  return null;
}

const MemoMarker = React.memo(function MemoMarker({
  clip,
  onClick,
}: {
  clip: SoundClip;
  onClick: (c: SoundClip) => void;
}) {
  const icon = useMemo(() => createPulseIcon(clip.category), [clip.category]);
  const handleClick = useCallback(() => onClick(clip), [onClick, clip]);
  return (
    <Marker
      position={[clip.lat, clip.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
});

function ViewportClippedMarkers({
  soundClips,
  onMarkerClick,
}: {
  soundClips: SoundClip[];
  onMarkerClick: (clip: SoundClip) => void;
}) {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const THRESHOLD = 200;

  const updateBounds = useCallback(() => {
    setBounds(map.getBounds());
  }, [map]);

  useEffect(() => {
    updateBounds();
    map.on('moveend zoomend', updateBounds);
    return () => {
      map.off('moveend zoomend', updateBounds);
    };
  }, [map, updateBounds]);

  const visibleClips = useMemo(() => {
    if (soundClips.length <= THRESHOLD || !bounds) {
      return soundClips;
    }
    return soundClips.filter((clip) =>
      bounds.contains([clip.lat, clip.lng])
    );
  }, [soundClips, bounds]);

  const handleMarkerClick = useCallback(
    (clip: SoundClip) => onMarkerClick(clip),
    [onMarkerClick]
  );

  return (
    <>
      {visibleClips.map((clip) => (
        <MemoMarker key={clip.id} clip={clip} onClick={handleMarkerClick} />
      ))}
    </>
  );
}

function FallbackTileLayer({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleError = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  }, [urls.length]);

  const currentUrl = useMemo(() => urls[currentIndex], [urls, currentIndex]);

  return (
    <TileLayer
      attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://carto.com/">CARTO</a>'
      url={currentUrl}
      subdomains={['a', 'b', 'c']}
      eventHandlers={{ tileerror: handleError }}
    />
  );
}

export default function MapView({ soundClips, onMapClick, onMarkerClick, showHeatmap }: MapViewProps) {
  const heatPoints = useMemo<L.LatLngExpression[]>(
    () => soundClips.map((c) => [c.lat, c.lng] as L.LatLngExpression),
    [soundClips]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => onMapClick(lat, lng),
    [onMapClick]
  );

  const handleMarkerClick = useCallback(
    (clip: SoundClip) => onMarkerClick(clip),
    [onMarkerClick]
  );

  return (
    <MapContainer
      center={[30, 10]}
      zoom={3}
      className="map-container"
      zoomControl={false}
      attributionControl={true}
    >
      <FallbackTileLayer urls={DARK_TILE_URLS} />
      <MapEventHandler onMapClick={handleMapClick} />
      {showHeatmap && <HeatmapLayer points={heatPoints} />}
      <ViewportClippedMarkers soundClips={soundClips} onMarkerClick={handleMarkerClick} />
    </MapContainer>
  );
}
