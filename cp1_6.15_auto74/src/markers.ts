import L from 'leaflet';
import { FoodStall, CATEGORY_CONFIG, FilterCriteria, getAllStalls, filterStalls } from './data';

const markers: Map<number, L.Marker> = new Map();
let map: L.Map | null = null;
let activeCardId: number | null = null;
let onMarkerClick: ((stall: FoodStall, latlng: L.LatLng) => void) | null = null;

function createIcon(stall: FoodStall, zoom: number): L.DivIcon {
  const cfg = CATEGORY_CONFIG[stall.category];
  const scale = zoom <= 13 ? 0.8 : zoom >= 17 ? 1.2 : 1.0;
  const size = Math.round(36 * scale);
  const fontSize = Math.round(22 * scale);

  return L.divIcon({
    className: 'stall-marker',
    html: `<div class="marker-inner" data-id="${stall.id}" style="
      width:${size}px;
      height:${size}px;
      font-size:${fontSize}px;
      background: radial-gradient(circle, ${cfg.color}44 0%, ${cfg.color}22 60%, transparent 70%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease, opacity 0.3s ease;
      cursor: pointer;
      filter: drop-shadow(0 2px 6px ${cfg.color}66);
    ">${cfg.emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function initMarkers(leafletMap: L.Map, clickHandler: (stall: FoodStall, latlng: L.LatLng) => void): void {
  map = leafletMap;
  onMarkerClick = clickHandler;

  const stalls = getAllStalls();
  const zoom = map.getZoom();

  stalls.forEach((stall) => {
    const icon = createIcon(stall, zoom);
    const marker = L.marker([stall.lat, stall.lng], { icon })
      .addTo(map!)
      .on('click', () => {
        activeCardId = stall.id;
        if (onMarkerClick) onMarkerClick(stall, marker.getLatLng());
      });

    const el = marker.getElement();
    if (el) {
      el.classList.add('marker-enter');
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '1';
      });
    }

    markers.set(stall.id, marker);
  });

  map.on('zoomend', () => {
    const newZoom = map!.getZoom();
    markers.forEach((marker, id) => {
      const stall = getAllStalls().find((s) => s.id === id);
      if (stall) {
        marker.setIcon(createIcon(stall, newZoom));
      }
    });
  });
}

export function updateMarkers(criteria: FilterCriteria): void {
  if (!map) return;

  const filtered = filterStalls(criteria);
  const filteredIds = new Set(filtered.map((s) => s.id));
  const zoom = map.getZoom();

  markers.forEach((marker, id) => {
    const el = marker.getElement();
    if (!el) return;

    if (filteredIds.has(id)) {
      if (!marker.isAddedToMap()) {
        marker.addTo(map!);
      }
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    } else {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.3)';
      setTimeout(() => {
        if (!filteredIds.has(id)) {
          marker.remove();
        }
      }, 300);
    }
  });

  filtered.forEach((stall) => {
    if (!markers.has(stall.id)) {
      const icon = createIcon(stall, zoom);
      const marker = L.marker([stall.lat, stall.lng], { icon })
        .addTo(map!)
        .on('click', () => {
          activeCardId = stall.id;
          if (onMarkerClick) onMarkerClick(stall, marker.getLatLng());
        });

      const el = marker.getElement();
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.3)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'scale(1)';
        });
      }

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
