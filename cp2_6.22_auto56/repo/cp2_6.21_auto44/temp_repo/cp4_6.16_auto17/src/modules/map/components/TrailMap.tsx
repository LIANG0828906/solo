import { useEffect, useCallback, useState, useRef, useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../store';
import { useRecordStore } from '../../record/store';
import { TrailPolyline } from './TrailPolyline';
import { POIMarker } from './POIMarker';
import { POI } from '@/shared/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TrailMapProps {
  height?: string | number;
}

const POI_PIN_WIDTH = 32;
const POI_PIN_HEIGHT = 40;
const POI_HIT_RADIUS = 20;
const VIEWPORT_PADDING = 50;
const BATCH_SIZE = 50;
const CANVAS_THRESHOLD = 200;
const CLUSTER_THRESHOLD = 100;
const VIRTUALIZE_THRESHOLD = 50;

function getPaddedBounds(map: L.Map, paddingPx: number): L.LatLngBounds {
  const bounds = map.getBounds();
  const northWest = bounds.getNorthWest();
  const southEast = bounds.getSouthEast();
  
  const nwPoint = map.latLngToContainerPoint(northWest);
  const sePoint = map.latLngToContainerPoint(southEast);
  
  const paddedNwPoint = L.point(nwPoint.x - paddingPx, nwPoint.y - paddingPx);
  const paddedSePoint = L.point(sePoint.x + paddingPx, sePoint.y + paddingPx);
  
  const paddedNw = map.containerPointToLatLng(paddedNwPoint);
  const paddedSe = map.containerPointToLatLng(paddedSePoint);
  
  return L.latLngBounds(paddedNw, paddedSe);
}

function filterPOIsInBounds(pois: POI[], bounds: L.LatLngBounds): POI[] {
  return pois.filter(poi => {
    const latlng = L.latLng(poi.lat, poi.lng);
    return bounds.contains(latlng);
  });
}

function drawPOIPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isSelected: boolean = false
) {
  const width = POI_PIN_WIDTH;
  const height = POI_PIN_HEIGHT;
  const headRadius = 10;
  const bodyWidth = 16;
  const bodyHeight = 12;
  
  const centerX = x;
  const headY = y - height + headRadius + 2;
  const bodyTopY = headY + headRadius - 2;
  
  ctx.save();
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  
  const fillColor = isSelected ? '#FF5722' : '#E53935';
  
  ctx.beginPath();
  ctx.moveTo(centerX, bodyTopY + bodyHeight);
  ctx.lineTo(centerX - bodyWidth / 2, bodyTopY);
  ctx.lineTo(centerX + bodyWidth / 2, bodyTopY);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  
  ctx.shadowBlur = 0;
  
  ctx.beginPath();
  ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(centerX, headY, headRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(centerX, headY, headRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.restore();
}

interface CanvasPOIMarkersProps {
  pois: POI[];
  selectedPOI: POI | null;
  onPOIClick: (poi: POI) => void;
}

const CanvasPOIMarkers = memo(function CanvasPOIMarkers({
  pois,
  selectedPOI,
  onPOIClick,
}: CanvasPOIMarkersProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const poisRef = useRef<POI[]>(pois);
  const selectedPOIRef = useRef<POI | null>(selectedPOI);

  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  useEffect(() => {
    selectedPOIRef.current = selectedPOI;
  }, [selectedPOI]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !map) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = map.getSize();
    const pixelRatio = window.devicePixelRatio || 1;
    
    if (canvas.width !== size.x * pixelRatio || canvas.height !== size.y * pixelRatio) {
      canvas.width = size.x * pixelRatio;
      canvas.height = size.y * pixelRatio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(pixelRatio, pixelRatio);
    
    const currentPois = poisRef.current;
    const currentSelected = selectedPOIRef.current;
    const bounds = getPaddedBounds(map, VIEWPORT_PADDING);
    
    for (let i = 0; i < currentPois.length; i++) {
      const poi = currentPois[i];
      const latlng = L.latLng(poi.lat, poi.lng);
      
      if (!bounds.contains(latlng)) continue;
      
      const point = map.latLngToContainerPoint(latlng);
      const isSelected = currentSelected?.id === poi.id;
      
      drawPOIPin(ctx, point.x, point.y, isSelected);
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [map]);

  const scheduleDraw = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    if (!map) return;

    const mapContainer = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'pointer';
    canvas.style.zIndex = '450';
    
    mapContainer.appendChild(canvas);
    canvasRef.current = canvas;
    containerRef.current = mapContainer;

    const handleMove = () => {
      scheduleDraw();
    };

    const handleZoom = () => {
      scheduleDraw();
    };

    const handleResize = () => {
      scheduleDraw();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const currentPois = poisRef.current;
      let closestPOI: POI | null = null;
      let closestDist = Infinity;
      
      for (let i = 0; i < currentPois.length; i++) {
        const poi = currentPois[i];
        const point = map.latLngToContainerPoint(L.latLng(poi.lat, poi.lng));
        
        const headCenterY = point.y - POI_PIN_HEIGHT + 12;
        const dx = point.x - clickX;
        const dy = headCenterY - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < POI_HIT_RADIUS && dist < closestDist) {
          closestDist = dist;
          closestPOI = poi;
        }
      }
      
      if (closestPOI) {
        onPOIClick(closestPOI);
      }
    };

    map.on('move', handleMove);
    map.on('zoom', handleZoom);
    map.on('resize', handleResize);
    map.on('moveend', scheduleDraw);
    map.on('zoomend', scheduleDraw);
    canvas.addEventListener('click', handleClick);

    scheduleDraw();

    return () => {
      map.off('move', handleMove);
      map.off('zoom', handleZoom);
      map.off('resize', handleResize);
      map.off('moveend', scheduleDraw);
      map.off('zoomend', scheduleDraw);
      canvas.removeEventListener('click', handleClick);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current);
      }
    };
  }, [map, scheduleDraw, onPOIClick]);

  useEffect(() => {
    scheduleDraw();
  }, [pois, selectedPOI, scheduleDraw]);

  return null;
});

interface VirtualizedPOIMarkersProps {
  pois: POI[];
  selectedPOI: POI | null;
  onPOIClick: (poi: POI) => void;
  onPOIDragEnd: (poiId: string, lat: number, lng: number) => void;
}

const VirtualizedPOIMarkers = memo(function VirtualizedPOIMarkers({
  pois,
  selectedPOI,
  onPOIClick,
  onPOIDragEnd,
}: VirtualizedPOIMarkersProps) {
  const map = useMap();
  const [visiblePOIs, setVisiblePOIs] = useState<POI[]>([]);
  const poisRef = useRef<POI[]>(pois);

  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  const updateVisiblePOIs = useCallback(() => {
    if (!map) return;
    const bounds = getPaddedBounds(map, VIEWPORT_PADDING);
    const filtered = filterPOIsInBounds(poisRef.current, bounds);
    setVisiblePOIs(filtered);
  }, [map]);

  useMapEvents({
    moveend: updateVisiblePOIs,
    zoomend: updateVisiblePOIs,
  });

  useEffect(() => {
    updateVisiblePOIs();
  }, [pois, updateVisiblePOIs]);

  return (
    <>
      {visiblePOIs.map(poi => (
        <POIMarker
          key={poi.id}
          poi={poi}
          isSelected={selectedPOI?.id === poi.id}
          onClick={() => onPOIClick(poi)}
          onDragEnd={(lat, lng) => onPOIDragEnd(poi.id, lat, lng)}
          draggable={true}
        />
      ))}
    </>
  );
});

interface BatchedPOIMarkersProps {
  pois: POI[];
  selectedPOI: POI | null;
  onPOIClick: (poi: POI) => void;
  onPOIDragEnd: (poiId: string, lat: number, lng: number) => void;
  virtualize?: boolean;
}

const BatchedPOIMarkers = memo(function BatchedPOIMarkers({
  pois,
  selectedPOI,
  onPOIClick,
  onPOIDragEnd,
  virtualize = false,
}: BatchedPOIMarkersProps) {
  const map = useMap();
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poisRef = useRef<POI[]>(pois);

  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  const getSortedPOIs = useCallback((): POI[] => {
    if (!virtualize || !map) return pois;
    
    const bounds = getPaddedBounds(map, VIEWPORT_PADDING);
    const visible: POI[] = [];
    const hidden: POI[] = [];
    
    for (const poi of poisRef.current) {
      if (bounds.contains(L.latLng(poi.lat, poi.lng))) {
        visible.push(poi);
      } else {
        hidden.push(poi);
      }
    }
    
    return [...visible, ...hidden];
  }, [virtualize, map, pois]);

  useEffect(() => {
    setRenderedCount(BATCH_SIZE);
  }, [pois.length]);

  useEffect(() => {
    const sortedPOIs = getSortedPOIs();
    
    if (renderedCount >= sortedPOIs.length) {
      return;
    }

    const renderNextBatch = () => {
      setRenderedCount(prev => {
        const next = prev + BATCH_SIZE;
        return Math.min(next, sortedPOIs.length);
      });
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(renderNextBatch);
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      timeoutRef.current = setTimeout(renderNextBatch, 0);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [renderedCount, getSortedPOIs]);

  const visiblePOIs = useMemo(() => {
    return getSortedPOIs().slice(0, renderedCount);
  }, [getSortedPOIs, renderedCount]);

  return (
    <>
      {visiblePOIs.map(poi => (
        <POIMarker
          key={poi.id}
          poi={poi}
          isSelected={selectedPOI?.id === poi.id}
          onClick={() => onPOIClick(poi)}
          onDragEnd={(lat, lng) => onPOIDragEnd(poi.id, lat, lng)}
          draggable={true}
        />
      ))}
    </>
  );
});

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  pois: POI[];
}

function gridCluster(pois: POI[], gridSize: number, map: L.Map): Cluster[] {
  const clusters: Map<string, Cluster> = new Map();
  
  for (const poi of pois) {
    const point = map.latLngToContainerPoint(L.latLng(poi.lat, poi.lng));
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!clusters.has(key)) {
      clusters.set(key, {
        id: key,
        lat: poi.lat,
        lng: poi.lng,
        pois: [],
      });
    }
    
    const cluster = clusters.get(key)!;
    cluster.pois.push(poi);
    
    const count = cluster.pois.length;
    cluster.lat = (cluster.lat * (count - 1) + poi.lat) / count;
    cluster.lng = (cluster.lng * (count - 1) + poi.lng) / count;
  }
  
  return Array.from(clusters.values());
}

interface ClusteredPOIMarkersProps {
  pois: POI[];
  selectedPOI: POI | null;
  onPOIClick: (poi: POI) => void;
  onPOIDragEnd: (poiId: string, lat: number, lng: number) => void;
  gridSize?: number;
}

const ClusteredPOIMarkers = memo(function ClusteredPOIMarkers({
  pois,
  selectedPOI,
  onPOIClick,
  onPOIDragEnd,
  gridSize = 80,
}: ClusteredPOIMarkersProps) {
  const map = useMap();
  const [clusters, setClusters] = useState<Cluster[]>([]);

  const updateClusters = useCallback(() => {
    if (!map) return;
    
    const bounds = getPaddedBounds(map, VIEWPORT_PADDING);
    const visiblePOIs = filterPOIsInBounds(pois, bounds);
    
    const newClusters = gridCluster(visiblePOIs, gridSize, map);
    setClusters(newClusters);
  }, [map, pois, gridSize]);

  useMapEvents({
    moveend: updateClusters,
    zoomend: updateClusters,
  });

  useEffect(() => {
    updateClusters();
  }, [pois, updateClusters]);

  const clusterIcon = (count: number) => {
    const size = Math.min(40 + Math.log2(count) * 5, 60);
    return L.divIcon({
      className: 'poi-cluster-icon',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: rgba(229, 57, 53, 0.85);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: ${Math.max(12, size / 3)}px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const handleClusterClick = useCallback((cluster: Cluster) => {
    if (cluster.pois.length === 1) {
      onPOIClick(cluster.pois[0]);
    } else {
      const bounds = L.latLngBounds(
        cluster.pois.map(p => L.latLng(p.lat, p.lng))
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, onPOIClick]);

  return (
    <>
      {clusters.map(cluster => {
        if (cluster.pois.length === 1) {
          const poi = cluster.pois[0];
          return (
            <POIMarker
              key={poi.id}
              poi={poi}
              isSelected={selectedPOI?.id === poi.id}
              onClick={() => onPOIClick(poi)}
              onDragEnd={(lat, lng) => onPOIDragEnd(poi.id, lat, lng)}
              draggable={true}
            />
          );
        }
        
        return (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            icon={clusterIcon(cluster.pois.length)}
            eventHandlers={{
              click: () => handleClusterClick(cluster),
            }}
          />
        );
      })}
    </>
  );
});

interface PerformancePOILayerProps {
  pois: POI[];
  selectedPOI: POI | null;
  onPOIClick: (poi: POI) => void;
  onPOIDragEnd: (poiId: string, lat: number, lng: number) => void;
}

function PerformancePOILayer({
  pois,
  selectedPOI,
  onPOIClick,
  onPOIDragEnd,
}: PerformancePOILayerProps) {
  const poiCount = pois.length;

  if (poiCount === 0) {
    return null;
  }

  if (poiCount < VIRTUALIZE_THRESHOLD) {
    return (
      <>
        {pois.map(poi => (
          <POIMarker
            key={poi.id}
            poi={poi}
            isSelected={selectedPOI?.id === poi.id}
            onClick={() => onPOIClick(poi)}
            onDragEnd={(lat, lng) => onPOIDragEnd(poi.id, lat, lng)}
            draggable={true}
          />
        ))}
      </>
    );
  }

  if (poiCount < CLUSTER_THRESHOLD) {
    return (
      <BatchedPOIMarkers
        pois={pois}
        selectedPOI={selectedPOI}
        onPOIClick={onPOIClick}
        onPOIDragEnd={onPOIDragEnd}
        virtualize={true}
      />
    );
  }

  if (poiCount < CANVAS_THRESHOLD) {
    return (
      <ClusteredPOIMarkers
        pois={pois}
        selectedPOI={selectedPOI}
        onPOIClick={onPOIClick}
        onPOIDragEnd={onPOIDragEnd}
      />
    );
  }

  return (
    <>
      <CanvasPOIMarkers
        pois={pois}
        selectedPOI={selectedPOI}
        onPOIClick={onPOIClick}
      />
      {selectedPOI && (
        <POIMarker
          poi={selectedPOI}
          isSelected={true}
          onClick={() => onPOIClick(selectedPOI)}
          onDragEnd={(lat, lng) => onPOIDragEnd(selectedPOI.id, lat, lng)}
          draggable={true}
        />
      )}
    </>
  );
}

function MapController() {
  const { mapCenter, mapZoom, trails, compareMode, compareTrailIds, activeTrailId, isAddingPOI, loadPOIs, addPOI, selectedPOI, setSelectedPOI, updatePOIPosition, pois, fitBoundsTrigger } = useMapStore();
  const { points: recordPoints, isRecording, currentTrailId } = useRecordStore();
  const map = useMap();
  const [pendingPOIPos, setPendingPOIPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (mapCenter && map) {
      map.setView(mapCenter, mapZoom, { animate: true, duration: 0.5 });
    }
  }, [mapCenter, mapZoom, map, fitBoundsTrigger]);

  useMapEvents({
    click: (e) => {
      if (isAddingPOI) {
        setPendingPOIPos({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  useEffect(() => {
    if (activeTrailId) {
      loadPOIs(activeTrailId);
    } else {
      loadPOIs(null);
    }
  }, [activeTrailId, loadPOIs]);

  const handlePOIClick = useCallback((poi: POI) => {
    setSelectedPOI(poi);
  }, [setSelectedPOI]);

  const handlePOIDragEnd = useCallback((poiId: string, lat: number, lng: number) => {
    updatePOIPosition(poiId, lat, lng);
  }, [updatePOIPosition]);

  const activeTrail = activeTrailId ? trails.get(activeTrailId) : null;

  const trailList = compareMode && compareTrailIds
    ? compareTrailIds.map(id => ({ id, trail: trails.get(id) }))
    : (activeTrailId 
        ? [{ id: activeTrailId, trail: trails.get(activeTrailId) }]
        : []);

  const getTrailColor = (index: number, isActive: boolean, trailId: string) => {
    if (compareMode && compareTrailIds) {
      const idx = compareTrailIds.indexOf(trailId);
      return idx === 0 ? '#1976D2' : idx === 1 ? '#FF9800' : '#90CAF9';
    }
    return isActive ? '#1976D2' : '#90CAF9';
  };

  const getTrailWeight = (index: number, isActive: boolean, trailId: string) => {
    if (compareMode && compareTrailIds && compareTrailIds.includes(trailId)) {
      return 6;
    }
    return isActive ? 5 : 3;
  };

  const getTrailOpacity = (index: number, isActive: boolean, trailId: string) => {
    if (compareMode && compareTrailIds && compareTrailIds.includes(trailId)) {
      return 1;
    }
    return isActive ? 1 : 0.8;
  };

  const positionIcon = L.divIcon({
    className: 'current-position-icon',
    html: '<div class="position-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trailList.map(({ id, trail }, index) => (
        trail && (
          <TrailPolyline
            key={id}
            points={trail.points}
            color={getTrailColor(index, id === activeTrailId, id)}
            isActive={compareMode ? compareTrailIds?.includes(id) || false : id === activeTrailId}
            isCompare={compareMode}
            compareIndex={compareMode && compareTrailIds ? compareTrailIds.indexOf(id) : -1}
            trailName={trail.name}
            distance={trail.distance}
            weight={getTrailWeight(index, id === activeTrailId, id)}
            opacity={getTrailOpacity(index, id === activeTrailId, id)}
          />
        )
      ))}

      {isRecording && recordPoints.length > 1 && (
        <TrailPolyline
          points={recordPoints}
          color="#1976D2"
          isActive={true}
          trailName="正在记录..."
        />
      )}

      <PerformancePOILayer
        pois={pois}
        selectedPOI={selectedPOI}
        onPOIClick={handlePOIClick}
        onPOIDragEnd={handlePOIDragEnd}
      />

      {isAddingPOI && pendingPOIPos && (
        <AddPOIModal
          position={pendingPOIPos}
          onClose={() => setPendingPOIPos(null)}
          onSave={(name, description) => {
            if (pendingPOIPos) {
              addPOI({
                name,
                description,
                lat: pendingPOIPos.lat,
                lng: pendingPOIPos.lng,
                trailId: activeTrailId,
              });
              setPendingPOIPos(null);
            }
          }}
        />
      )}

      {recordPoints.length > 0 && isRecording && (
        <Marker
          position={[recordPoints[recordPoints.length - 1].lat, recordPoints[recordPoints.length - 1].lng]}
          icon={positionIcon}
        />
      )}
    </>
  );
}

function AddPOIModal({
  position,
  onClose,
  onSave,
}: {
  position: { lat: number; lng: number };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
    }
  };

  return (
    <div className="poi-add-modal">
      <div className="poi-add-content">
        <h3>添加兴趣点</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入兴趣点名称"
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>描述 (最多30字)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 30))}
              placeholder="请输入简短描述"
              rows={3}
              maxLength={30}
            />
            <span className="char-count">{description.length}/30</span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TrailMap({ height = '100%' }: TrailMapProps) {
  const { mapCenter, mapZoom } = useMapStore();

  return (
    <div className="trail-map-container" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController />
      </MapContainer>
    </div>
  );
}
