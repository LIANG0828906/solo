import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { POI, POICategory, SearchResult } from './types';
import { CATEGORY_CONFIGS } from './types';
import { loadPOIData, filterPOIsByCategory } from './dataLoader';
import { searchInSector, generateSectorPath } from './polygonSearch';

interface MapViewProps {
  selectedLayers: POICategory[];
  searchRadius: number;
  angleRange: number;
  azimuth: number;
  onSearchResults: (results: SearchResult[]) => void;
  onMapCenterChange: (center: [number, number]) => void;
  onCategoryCountsChange: (counts: Record<POICategory, number>) => void;
}

const INITIAL_CENTER: [number, number] = [39.9042, 116.4074];
const INITIAL_ZOOM = 13;

export default function MapView({
  selectedLayers,
  searchRadius,
  angleRange,
  azimuth,
  onSearchResults,
  onMapCenterChange,
  onCategoryCountsChange,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sectorLayerRef = useRef<L.Polygon | null>(null);
  const poiDataRef = useRef<POI[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const getCategoryColor = useCallback((category: POICategory): string => {
    const config = CATEGORY_CONFIGS.find(c => c.key === category);
    return config?.color || '#3388ff';
  }, []);

  const createMarkerIcon = useCallback((color: string, highlighted: boolean = false): L.DivIcon => {
    const borderWidth = highlighted ? '4px' : '2px';
    const borderColor = highlighted ? '#ffffff' : '#ffffff';
    const boxShadow = highlighted
      ? '0 0 0 2px #ffffff, 0 2px 6px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.2)';

    return L.divIcon({
      className: 'poi-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${color};
          border: ${borderWidth} solid ${borderColor};
          box-shadow: ${boxShadow};
          transition: all 0.3s ease;
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  const updateSector = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const center = map.getCenter();
    const centerCoord: [number, number] = [center.lat, center.lng];

    if (sectorLayerRef.current) {
      map.removeLayer(sectorLayerRef.current);
    }

    const sectorPath = generateSectorPath(centerCoord, searchRadius, azimuth, angleRange);

    sectorLayerRef.current = L.polygon(sectorPath, {
      color: '#ffaa00',
      weight: 2,
      fillColor: '#ffdd33',
      fillOpacity: 0.25,
      interactive: false,
    }).addTo(map);

    const allPOIs = poiDataRef.current;

    const categoryCounts: Record<POICategory, number> = {
      toilet: 0,
      convenience: 0,
      cafe: 0,
      charging: 0,
      pharmacy: 0,
    };

    for (const poi of allPOIs) {
      categoryCounts[poi.category]++;
    }
    onCategoryCountsChange(categoryCounts);

    const filteredPOIs = filterPOIsByCategory(allPOIs, selectedLayers);
    const results = searchInSector(filteredPOIs, centerCoord, searchRadius, azimuth, angleRange);

    const highlightedIds = new Set(results.map(r => r.poi.id));

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    markersLayerRef.current = L.layerGroup().addTo(map);

    for (const poi of filteredPOIs) {
      const isHighlighted = highlightedIds.has(poi.id);
      const color = getCategoryColor(poi.category);
      const marker = L.marker([poi.lat, poi.lng], {
        icon: createMarkerIcon(color, isHighlighted),
      });

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <strong style="color: ${color};">${poi.name}</strong><br/>
          <span style="color: #666; font-size: 12px;">${poi.address}</span>
        </div>
      `);

      marker.addTo(markersLayerRef.current);
    }

    onSearchResults(results);
  }, [selectedLayers, searchRadius, angleRange, azimuth, getCategoryColor, createMarkerIcon, onSearchResults, onCategoryCountsChange]);

  const scheduleUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      updateSector();
      animationFrameRef.current = null;
    });
  }, [updateSector]);

  const resetMap = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView(INITIAL_CENTER, INITIAL_ZOOM, {
      animate: true,
      duration: 0.5,
    });

    if (sectorLayerRef.current) {
      map.removeLayer(sectorLayerRef.current);
      sectorLayerRef.current = null;
    }

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    onSearchResults([]);
  }, [onSearchResults]);

  const centerPOI = useCallback((lat: number, lng: number, name: string, address: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([lat, lng], 16, {
      animate: true,
      duration: 0.5,
    });

    const color = '#4a90d9';
    const popup = L.popup()
      .setLatLng([lat, lng])
      .setContent(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <strong style="color: ${color};">${name}</strong><br/>
          <span style="color: #666; font-size: 12px;">${address}</span>
        </div>
      `)
      .openOn(map);
  }, []);

  useEffect(() => {
    const handleReset = () => {
      resetMap();
    };

    const handleCenterPOI = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, name, address } = customEvent.detail;
      centerPOI(lat, lng, name, address);
    };

    window.addEventListener('poi-map:reset', handleReset);
    window.addEventListener('poi-map:center-poi', handleCenterPOI);
    return () => {
      window.removeEventListener('poi-map:reset', handleReset);
      window.removeEventListener('poi-map:center-poi', handleCenterPOI);
    };
  }, [resetMap, centerPOI]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('', {
      attribution: '',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    L.control.zoom({
      position: 'topright',
    }).addTo(mapInstanceRef.current);

    poiDataRef.current = loadPOIData();

    const LegendControl = L.Control.extend({
      onAdd: function () {
        const div = L.DomUtil.create('div', 'legend');
        div.style.cssText = `
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
        `;

        let html = '<div style="font-weight: 600; margin-bottom: 8px;">图例</div>';
        for (const config of CATEGORY_CONFIGS) {
          html += `
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: ${config.color};
                margin-right: 8px;
                border: 2px solid white;
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
              "></span>
              <span>${config.label}</span>
            </div>
          `;
        }
        div.innerHTML = html;
        return div;
      },
    });

    new LegendControl({ position: 'topright' }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.on('moveend', () => {
      const map = mapInstanceRef.current;
      if (map) {
        const center = map.getCenter();
        onMapCenterChange([center.lat, center.lng]);
        scheduleUpdate();
      }
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapCenterChange, scheduleUpdate]);

  useEffect(() => {
    scheduleUpdate();
  }, [scheduleUpdate]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#e8e8e8',
      }}
    />
  );
}
