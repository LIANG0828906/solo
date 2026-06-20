import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { useMemoryStore } from '../store/memoryStore';
import type { Memory } from '../types';

interface RouteOverlay {
  polyline: L.Polyline | null;
  glows: L.CircleMarker[];
}

const MapPanel = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeRef = useRef<RouteOverlay>({ polyline: null, glows: [] });
  const playButtonRef = useRef<L.Control | null>(null);
  const rafRef = useRef<number | null>(null);
  const playIntervalRef = useRef<number | null>(null);
  const glowProgressRef = useRef(0);
  const initializedRef = useRef(false);
  const unmountedRef = useRef(false);

  const memories = useMemoryStore((s) => s.memories);
  const isPlaying = useMemoryStore((s) => s.isPlaying);
  const currentPlayIndex = useMemoryStore((s) => s.currentPlayIndex);
  const togglePlaying = useMemoryStore((s) => s.togglePlaying);
  const nextPlayIndex = useMemoryStore((s) => s.nextPlayIndex);
  const setCurrentPlayIndex = useMemoryStore((s) => s.setCurrentPlayIndex);

  const sortedMemories = useMemo(() => memories, [memories]);

  const buildCurvePoints = useCallback((points: [number, number][]): [number, number][] => {
    if (points.length < 2) return points;
    const result: [number, number][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lng1] = points[i];
      const [lat2, lng2] = points[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const dx = lng2 - lng1;
      const dy = lat2 - lat1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = dist * 0.15;
      const perpX = -dy / (dist || 1) * offset;
      const perpY = dx / (dist || 1) * offset;
      const cpLat = midLat + perpY;
      const cpLng = midLng + perpX;
      for (let t = 0; t <= 1; t += 0.05) {
        const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cpLat + t * t * lat2;
        const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cpLng + t * t * lng2;
        result.push([lat, lng]);
      }
    }
    result.push(points[points.length - 1]);
    return result;
  }, []);

  const positionOnCurve = useCallback((points: [number, number][], progress: number): [number, number] => {
    if (points.length === 0) return [0, 0];
    if (points.length === 1) return points[0];
    if (progress <= 0) return points[0];
    if (progress >= 1) return points[points.length - 1];

    let totalDist = 0;
    const segDists: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lng1] = points[i];
      const [lat2, lng2] = points[i + 1];
      const d = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
      segDists.push(d);
      totalDist += d;
    }
    const targetDist = totalDist * progress;
    let acc = 0;
    for (let i = 0; i < segDists.length; i++) {
      if (acc + segDists[i] >= targetDist) {
        const t = (targetDist - acc) / (segDists[i] || 1);
        return [
          points[i][0] + (points[i + 1][0] - points[i][0]) * t,
          points[i][1] + (points[i + 1][1] - points[i][1]) * t,
        ];
      }
      acc += segDists[i];
    }
    return points[points.length - 1];
  }, []);

  const createMarkerIcon = useCallback((isActive: boolean) => {
    const size = isActive ? 18 : 12;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width:${size}px;
        height:${size}px;
        background:#2d6a4f;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [30, 110],
      zoom: 3,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    const PlayButton = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'play-button-container');
        container.innerHTML = `<button id="travel-play-btn" style="
          width:44px;
          height:44px;
          border-radius:50%;
          background:white;
          border:none;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          box-shadow:0 2px 10px rgba(0,0,0,0.2);
          transition:all 0.2s;
          outline:none;
        ">▶️</button>`;
        L.DomEvent.disableClickPropagation(container);
        const btn = container.querySelector('button');
        if (btn) {
          btn.onclick = () => togglePlaying();
        }
        return container;
      },
    });

    const playCtrl = new PlayButton();
    playCtrl.addTo(map);
    playButtonRef.current = playCtrl;

    leafletMapRef.current = map;
    initializedRef.current = true;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      unmountedRef.current = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [togglePlaying]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => map.invalidateSize());
    if (mapRef.current) ro.observe(mapRef.current);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    sortedMemories.forEach((m, idx) => {
      const isActive = idx === currentPlayIndex;
      const marker = L.marker([m.lat, m.lng], {
        icon: createMarkerIcon(isActive),
      })
        .bindPopup(`<div style="color:white;font-weight:600;">${m.title}</div>`, {
          className: 'custom-popup',
          closeButton: false,
        })
        .on('mouseover', function (this: L.Marker) {
          (this as L.Marker).setIcon(createMarkerIcon(true));
          this.openPopup();
        })
        .on('mouseout', function (this: L.Marker) {
          const storeIdx = sortedMemories.findIndex((x) => x.id === m.id);
          (this as L.Marker).setIcon(
            createMarkerIcon(storeIdx === currentPlayIndex)
          );
          if (storeIdx !== currentPlayIndex) this.closePopup();
        })
        .on('click', () => {
          setCurrentPlayIndex(idx);
        })
        .addTo(map);

      markersRef.current.set(m.id, marker);
    });

    if (sortedMemories.length > 0) {
      const bounds = L.latLngBounds(sortedMemories.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [sortedMemories, createMarkerIcon, setCurrentPlayIndex]);

  useEffect(() => {
    sortedMemories.forEach((m, idx) => {
      const marker = markersRef.current.get(m.id);
      if (marker) {
        const isActive = idx === currentPlayIndex;
        marker.setIcon(createMarkerIcon(isActive));
        if (isActive) marker.openPopup();
        else marker.closePopup();
      }
    });

    const map = leafletMapRef.current;
    const current = sortedMemories[currentPlayIndex];
    if (map && current && isPlaying) {
      map.flyTo([current.lat, current.lng], 7, { duration: 1.2 });
    } else if (map && current) {
      map.setView([current.lat, current.lng], Math.max(map.getZoom(), 5));
    }
  }, [currentPlayIndex, sortedMemories, isPlaying, createMarkerIcon]);

  useEffect(() => {
    const btn = document.getElementById('travel-play-btn') as HTMLButtonElement | null;
    if (btn) {
      btn.innerHTML = isPlaying ? '⏸️' : '▶️';
      btn.style.backgroundColor = isPlaying ? '#2d6a4f' : 'white';
      btn.style.color = isPlaying ? 'white' : 'inherit';
    }
  }, [isPlaying]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (routeRef.current.polyline) {
      routeRef.current.polyline.remove();
      routeRef.current.polyline = null;
    }
    routeRef.current.glows.forEach((g) => g.remove());
    routeRef.current.glows = [];

    if (sortedMemories.length < 2) return;

    const rawPts: [number, number][] = sortedMemories.map((m) => [m.lat, m.lng]);
    const curve = buildCurvePoints(rawPts);

    const line = L.polyline(curve as L.LatLngExpression[], {
      color: '#2d6a4f',
      weight: 3,
      opacity: 0.75,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);
    routeRef.current.polyline = line;

    for (let i = 0; i < 5; i++) {
      const glow = L.circleMarker([0, 0], {
        radius: 6,
        color: '#95d5b2',
        fillColor: '#95d5b2',
        fillOpacity: 0.7,
        opacity: 0.7,
        weight: 0,
        interactive: false,
      }).addTo(map);
      routeRef.current.glows.push(glow);
    }

    let localRaf: number | null = null;
    const animate = () => {
      if (unmountedRef.current) return;
      glowProgressRef.current = (glowProgressRef.current + 0.004) % 1;
      routeRef.current.glows.forEach((g, i) => {
        const offset = i * 0.2;
        const p = (glowProgressRef.current + offset) % 1;
        const [lat, lng] = positionOnCurve(curve, p);
        g.setLatLng([lat, lng]);
      });
      localRaf = requestAnimationFrame(animate);
      rafRef.current = localRaf;
    };
    localRaf = requestAnimationFrame(animate);
    rafRef.current = localRaf;

    return () => {
      if (localRaf !== null) {
        cancelAnimationFrame(localRaf);
        localRaf = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [sortedMemories, buildCurvePoints, positionOnCurve]);

  useEffect(() => {
    if (isPlaying && playIntervalRef.current === null) {
      playIntervalRef.current = window.setInterval(() => {
        nextPlayIndex();
      }, 2000);
    }
    if (!isPlaying && playIntervalRef.current !== null) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    return () => {
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, nextPlayIndex]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'white',
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
        }}
      />
      {sortedMemories[currentPlayIndex] && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {sortedMemories[currentPlayIndex].imageUrl ? (
            <img
              src={sortedMemories[currentPlayIndex].imageUrl}
              alt=""
              loading="lazy"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #d8f3dc',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#d8f3dc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
              }}
            >
              📍
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#2d6a4f',
                fontWeight: 700,
                fontSize: '13px',
                marginBottom: '2px',
              }}
            >
              {sortedMemories[currentPlayIndex].date}
            </div>
            <div
              style={{
                color: '#1a1a2e',
                fontWeight: 700,
                fontSize: '16px',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sortedMemories[currentPlayIndex].title}
            </div>
            <div
              style={{
                color: '#4a4a6a',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sortedMemories[currentPlayIndex].description}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {sortedMemories.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentPlayIndex ? '10px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === currentPlayIndex ? '#2d6a4f' : '#d8f3dc',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPanel;
