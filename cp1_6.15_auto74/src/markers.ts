import L from 'leaflet';
import { FoodStall, CATEGORY_CONFIG, FilterCriteria, getAllStalls, filterStalls } from './data';

const markers: Map<number, L.Marker> = new Map();
let map: L.Map | null = null;
let activeCardId: number | null = null;
let onMarkerClick: ((stall: FoodStall, latlng: L.LatLng) => void) | null = null;

function createIcon(stall: FoodStall): L.DivIcon {
  const cfg = CATEGORY_CONFIG[stall.category];

  return L.divIcon({
    className: 'stall-marker',
    html: `<div class="marker-wrapper" data-id="${stall.id}">
      <div class="marker-inner" style="
        background: radial-gradient(circle, ${cfg.color}44 0%, ${cfg.color}22 60%, transparent 70%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        filter: drop-shadow(0 2px 6px ${cfg.color}66);
        transform-origin: center center;
        will-change: transform, opacity;
        transition: transform 0.3s ease, opacity 0.3s ease;
      ">${cfg.emoji}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getScaleForZoom(zoom: number): number {
  if (zoom <= 13) return 0.8;
  if (zoom >= 17) return 1.2;
  return 1.0;
}

function updateMarkerScale(marker: L.Marker, zoom: number): void {
  const scale = getScaleForZoom(zoom);
  const el = marker.getElement();
  if (el) {
    const inner = el.querySelector('.marker-inner') as HTMLElement;
    if (inner) {
      inner.style.transform = `scale(${scale})`;
    }
  }
}

function isMarkerOnMap(marker: L.Marker): boolean {
  const el = marker.getElement();
  if (!el) return false;
  return !!el.parentElement !== null;
}

function forceMarkerStyle(marker: L.Marker): void {
  const el = marker.getElement();
  if (!el) return;
  el.style.background = 'transparent';
  el.style.border = 'none';
  el.style.padding = '0';
  el.style.boxShadow = 'none';
  el.style.filter = 'none';
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.marginLeft = '-20px';
  el.style.marginTop = '-20px';
}

export function initMarkers(leafletMap: L.Map, clickHandler: (stall: FoodStall, latlng: L.LatLng) => void): void {
  map = leafletMap;
  onMarkerClick = clickHandler;

  const stalls = getAllStalls();
  const zoom = map.getZoom();
  const initialScale = getScaleForZoom(zoom);

  stalls.forEach((stall) => {
    const icon = createIcon(stall);
    const marker = L.marker([stall.lat, stall.lng], { icon, riseOnHover: true })
      .addTo(map!)
      .on('click', () => {
        activeCardId = stall.id;
        if (onMarkerClick) onMarkerClick(stall, marker.getLatLng());
      });

    const el = marker.getElement();
    if (el) {
      const inner = el.querySelector('.marker-inner') as HTMLElement;
      if (inner) {
        inner.style.transform = `scale(${initialScale})`;
        inner.style.fontSize = '24px';
        inner.style.width = '40px';
        inner.style.height = '40px';
      }
    }

    forceMarkerStyle(marker);
    markers.set(stall.id, marker);
  });

  map.on('zoomstart', () => {
    const newZoom = map!.getZoom();
    markers.forEach((marker) => updateMarkerScale(marker, newZoom));
  });

  map.on('zoomanim', (e: any) => {
    const newZoom = e.zoom;
    markers.forEach((marker) => updateMarkerScale(marker, newZoom));
  });

  map.on('zoomend', () => {
    const newZoom = map!.getZoom();
    markers.forEach((marker) => updateMarkerScale(marker, newZoom));
  });
}

export function updateMarkers(criteria: FilterCriteria): void {
  if (!map) return;

  const filtered = filterStalls(criteria);
  const filteredIds = new Set(filtered.map((s) => s.id));

  markers.forEach((marker, id) => {
    const el = marker.getElement();
    if (!el) return;
    const inner = el.querySelector('.marker-inner') as HTMLElement;

    if (filteredIds.has(id)) {
      if (!isMarkerOnMap(marker)) {
        marker.addTo(map!);
      }
      if (inner) {
        inner.style.opacity = '1';
        const currentScale = getScaleForZoom(map!.getZoom());
        inner.style.transform = `scale(${currentScale})`;
      }
    } else {
      if (inner) {
        inner.style.opacity = '0';
        const currentScale = getScaleForZoom(map!.getZoom());
        inner.style.transform = `scale(${currentScale * 0.3})`;
      }
      setTimeout(() => {
        if (!filteredIds.has(id) && isMarkerOnMap(marker)) {
          marker.remove();
        }
      }, 300);
    }
  });

  filtered.forEach((stall) => {
    if (!markers.has(stall.id)) {
      const icon = createIcon(stall);
      const marker = L.marker([stall.lat, stall.lng], { icon, riseOnHover: true })
        .addTo(map!)
        .on('click', () => {
          activeCardId = stall.id;
          if (onMarkerClick) onMarkerClick(stall, marker.getLatLng());
        });

      const el = marker.getElement();
      if (el) {
        const inner = el.querySelector('.marker-inner') as HTMLElement;
        if (inner) {
          const currentScale = getScaleForZoom(map!.getZoom());
          inner.style.fontSize = '24px';
          inner.style.width = '40px';
          inner.style.height = '40px';
          inner.style.opacity = '0';
          inner.style.transform = `scale(${currentScale * 0.3})`;
          requestAnimationFrame(() => {
            inner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            inner.style.opacity = '1';
            inner.style.transform = `scale(${currentScale})`;
          });
        }
      }

      forceMarkerStyle(marker);
      markers.set(stall.id, marker);
    }
  });
}

export function setActiveCardId(id: number | null): void {
  activeCardId = id;
}

export function getActiveCardId(): number | null {
  return activeCardId;
}
