import L from 'leaflet';
import { FoodJournal } from '../../types';

export const getRatingColor = (rating: number): string => {
  const r = Math.round(74 + (231 - 74) * (rating / 10));
  const g = Math.round(144 + (76 - 144) * (rating / 10));
  const b = Math.round(217 + (60 - 217) * (rating / 10));
  return `rgb(${r}, ${g}, ${b})`;
};

const createCustomIcon = (rating: number): L.DivIcon => {
  const color = getRatingColor(rating);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        color: white;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        ${rating.toFixed(1)}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export const createJournalMarker = (
  entry: FoodJournal,
  map: L.Map,
  onClick: () => void
): L.Marker => {
  const icon = createCustomIcon(entry.rating);

  const marker = L.marker([entry.latitude, entry.longitude], {
    icon,
  })
    .addTo(map)
    .on('click', onClick);

  marker.on('mouseover', function (this: L.Marker) {
    const el = this.getElement();
    if (el) {
      const inner = el.querySelector('div');
      if (inner) {
        (inner as HTMLElement).style.transform = 'scale(1.2)';
        (inner as HTMLElement).style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
      }
    }
  });

  marker.on('mouseout', function (this: L.Marker) {
    const el = this.getElement();
    if (el) {
      const inner = el.querySelector('div');
      if (inner) {
        (inner as HTMLElement).style.transform = 'scale(1)';
        (inner as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      }
    }
  });

  return marker;
};
