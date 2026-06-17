import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSoundMapStore } from '../store';
import { SOUND_TYPE_COLORS, SOUND_TYPE_EMOJI, SOUND_TYPE_LABELS, SoundSample } from '../types';

const CENTER: [number, number] = [39.9042, 116.4074];

function MapClickHandler() {
  const { isAddingMode, addSample, setAddingMode } = useSoundMapStore();
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        addSample(e.latlng.lat, e.latlng.lng);
        setAddingMode(false);
      }
    },
  });
  return null;
}

function MapFlyTo({ sample }: { sample: SoundSample | null }) {
  const map = useMap();
  useEffect(() => {
    if (sample) {
      map.flyTo([sample.lat, sample.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [sample, map]);
  return null;
}

function TourAutoAdvance() {
  const { route, activeTourIndex, isTourPlaying, nextTourPoint, samples } = useSoundMapStore();
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isTourPlaying || !route || activeTourIndex < 0) return;
    const point = route.points[activeTourIndex];
    if (!point) return;
    const sample = samples.find((s) => s.id === point.sampleId);
    if (sample) {
      map.flyTo([sample.lat, sample.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
    }
    timerRef.current = setTimeout(() => {
      nextTourPoint();
    }, 3500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeTourIndex, isTourPlaying, route, samples, nextTourPoint, map]);

  return null;
}

function AnimatedMarker({ sample, order, isRoutePoint }: { sample: SoundSample; order?: number; isRoutePoint: boolean }) {
  const color = SOUND_TYPE_COLORS[sample.soundType];
  const markerRef = useRef<L.CircleMarker>(null);

  useEffect(() => {
    if (!markerRef.current) return;
    const el = markerRef.current.getElement();
    if (!el) return;
    el.style.animation = 'breathe 2s ease-in-out infinite';
  }, []);

  return (
    <CircleMarker
      ref={markerRef}
      center={[sample.lat, sample.lng]}
      radius={6}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
        opacity: 1,
      }}
    >
      <Tooltip permanent={isRoutePoint && order !== undefined} direction="top" offset={[0, -8]}>
        {isRoutePoint && order !== undefined ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#2D3436',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {order + 1}
          </span>
        ) : (
          <span style={{ fontSize: 12 }}>
            {SOUND_TYPE_EMOJI[sample.soundType]} {sample.name}
          </span>
        )}
      </Tooltip>
    </CircleMarker>
  );
}

function RouteLine({ route, samples }: { route: NonNullable<ReturnType<typeof useSoundMapStore.getState>['route']>; samples: SoundSample[] }) {
  const sortedPoints = route.points
    .map((p) => samples.find((s) => s.id === p.sampleId))
    .filter(Boolean) as SoundSample[];

  if (sortedPoints.length < 2) return null;

  const positions: [number, number][] = sortedPoints.map((s) => [s.lat, s.lng]);

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#FF6B6B',
          weight: 3,
          opacity: 0.6,
          dashArray: '10 8',
          className: 'route-line-animated',
        }}
      />
    </>
  );
}

function AddingCursor() {
  const { isAddingMode } = useSoundMapStore();
  if (!isAddingMode) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: 'calc(50% + 160px)',
        transform: 'translate(-50%, -50%)',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#00B89430',
        border: '2px dashed #00B894',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}

const MapView: React.FC = () => {
  const { samples, route, isAddingMode, isTourPlaying, activeTourIndex } = useSoundMapStore();
  const [flyTarget, setFlyTarget] = React.useState<SoundSample | null>(null);

  const handleCardClick = useCallback((sample: SoundSample) => {
    setFlyTarget(sample);
    setTimeout(() => setFlyTarget(null), 1600);
  }, []);

  useEffect(() => {
    const unsub = useSoundMapStore.subscribe((state, prev) => {
      if (state.isTourPlaying && state.activeTourIndex >= 0 && state.route) {
        const point = state.route.points[state.activeTourIndex];
        if (point) {
          const s = state.samples.find((sm) => sm.id === point.sampleId);
          if (s) setFlyTarget(s);
        }
      }
    });
    return unsub;
  }, []);

  const routeSampleSet = new Set(route?.points.map((p) => p.sampleId) ?? []);
  const routeOrderMap = new Map(route?.points.map((p) => [p.sampleId, p.order]) ?? []);

  return (
    <div style={{ position: 'relative', flex: 1, height: '100%' }}>
      {isAddingMode && <AddingCursor />}
      <MapContainer
        center={CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#F0F4F3' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler />
        <MapFlyTo sample={flyTarget} />
        <TourAutoAdvance />

        {samples.map((sample) => (
          <AnimatedMarker
            key={sample.id}
            sample={sample}
            order={routeOrderMap.get(sample.id)}
            isRoutePoint={routeSampleSet.has(sample.id)}
          />
        ))}

        {route && <RouteLine route={route} samples={samples} />}

        <div className="leaflet-control-zoom leaflet-bar leaflet-control" style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: '#FFFFFF90',
          borderRadius: 8,
          border: 'none',
          overflow: 'hidden',
        }}>
          <button
            className="leaflet-control-zoom-in"
            style={{ background: 'transparent', border: 'none' }}
          >+</button>
          <button
            className="leaflet-control-zoom-out"
            style={{ background: 'transparent', border: 'none' }}
          >−</button>
        </div>
      </MapContainer>
    </div>
  );
};

export default MapView;
