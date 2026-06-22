import L from 'leaflet';
import { FoodStall, CATEGORY_CONFIG, getQueueCategory } from './data';
import { initMarkers, updateMarkers, setActiveCardId, getActiveCardId } from './markers';
import { initPanel } from './panel';

let map: L.Map;
let userMarker: L.Marker | null = null;

function initMap(): void {
  map = L.map('map', {
    center: [31.2304, 121.4737],
    zoom: 15,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  initMarkers(map, handleMarkerClick);
  initPanel(handleFilterChange);
  initLocateButton();
  initCardClose();
}

function handleMarkerClick(stall: FoodStall, latlng: L.LatLng): void {
  const point = map.latLngToContainerPoint(latlng);
  showStallCard(stall, point);
}

function showStallCard(stall: FoodStall, clickPoint: L.Point): void {
  const card = document.getElementById('stall-card');
  if (!card) return;

  setActiveCardId(stall.id);

  const cfg = CATEGORY_CONFIG[stall.category];

  const imageEl = document.getElementById('card-image') as HTMLDivElement;
  imageEl.style.backgroundImage = `url(${stall.thumbnail})`;
  imageEl.style.backgroundSize = 'cover';
  imageEl.style.backgroundPosition = 'center';

  document.getElementById('card-title')!.textContent = stall.name;

  renderRating(stall.rating);

  renderQueue(stall.queueMinutes);

  document.getElementById('card-desc')!.textContent = stall.description;

  const priceEl = document.getElementById('card-price')!;
  priceEl.innerHTML = `<span style="color:${cfg.color}">¥${stall.priceMin} - ¥${stall.priceMax}</span>`;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const isMobile = windowWidth <= 768;
  const cardWidth = isMobile ? Math.min(windowWidth - 20, 340) : 340;
  const cardHeight = 340;
  const margin = 16;
  const topBarHeight = 80;

  let preferredTop = clickPoint.y - cardHeight - 20;
  let cardTop: number;

  if (preferredTop >= topBarHeight + margin) {
    cardTop = preferredTop;
  } else {
    const bottomTop = clickPoint.y + 30;
    if (bottomTop + cardHeight + margin <= windowHeight) {
      cardTop = bottomTop;
    } else {
      cardTop = Math.max(topBarHeight + margin, windowHeight - cardHeight - margin);
    }
  }

  let cardLeft = clickPoint.x - cardWidth / 2;
  cardLeft = Math.max(margin, Math.min(windowWidth - cardWidth - margin, cardLeft));

  cardTop = Math.max(topBarHeight + margin, Math.min(windowHeight - cardHeight - margin, cardTop));

  const offsetX = clickPoint.x - (cardLeft + cardWidth / 2);
  const offsetY = clickPoint.y - (cardTop + cardHeight / 2);

  card.style.left = cardLeft + 'px';
  card.style.top = cardTop + 'px';
  card.style.width = cardWidth + 'px';
  card.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.3)`;
  card.style.transformOrigin = 'center center';
  card.style.opacity = '0';
  card.style.pointerEvents = 'auto';

  requestAnimationFrame(() => {
    card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
    card.style.transform = 'translate(0, 0) scale(1)';
    card.style.opacity = '1';
  });
}

function renderRating(rating: number): void {
  const container = document.getElementById('card-rating');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span class="star full">★</span>';
    } else if (rating >= i - 0.5) {
      html += '<span class="star half">★</span>';
    } else {
      html += '<span class="star empty">★</span>';
    }
  }
  html += `<span class="rating-num">${rating.toFixed(1)}</span>`;
  container.innerHTML = html;
}

function renderQueue(minutes: number): void {
  const container = document.getElementById('card-queue');
  if (!container) return;

  const cat = getQueueCategory(minutes);
  const colors: Record<string, string> = { short: '#27AE60', medium: '#F4D03F', long: '#E74C3C' };
  const labels: Record<string, string> = { short: '短', medium: '中', long: '长' };

  const color = colors[cat];
  const width = Math.min((minutes / 35) * 100, 100);

  container.innerHTML = `
    <div class="queue-bar-bg">
      <div class="queue-bar-fill" style="width:${width}%;background:${color}"></div>
    </div>
    <span class="queue-label" style="color:${color}">${labels[cat]} · 约${minutes}分钟</span>
  `;
}

function handleFilterChange(criteria: import('./data').FilterCriteria): void {
  updateMarkers(criteria);
}

function initLocateButton(): void {
  const btn = document.getElementById('locate-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('您的浏览器不支持定位功能');
      return;
    }

    btn.classList.add('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.classList.remove('locating');
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        map.flyTo([lat, lng], 16, { duration: 1.5 });

        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: `<div class="user-pulse"></div><div class="user-dot"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(map);
        }
      },
      (err) => {
        btn.classList.remove('locating');
        let msg = '定位失败，请检查定位权限';
        if (err.code === 1) msg = '您拒绝了定位权限，请在浏览器设置中开启';
        if (err.code === 2) msg = '无法获取位置信息';
        if (err.code === 3) msg = '定位超时，请重试';
        showToast(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function showToast(msg: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3300);
}

function hideStallCard(): void {
  const card = document.getElementById('stall-card');
  if (!card) return;

  card.style.transition = 'transform 0.3s ease, opacity 0.25s ease';
  card.style.transform = 'translate(0, 20px) scale(0.85)';
  card.style.opacity = '0';
  card.style.pointerEvents = 'none';

  setTimeout(() => {
    setActiveCardId(null);
  }, 300);
}

function initCardClose(): void {
  const closeBtn = document.getElementById('card-close');
  const card = document.getElementById('stall-card');

  if (!closeBtn || !card) return;

  closeBtn.addEventListener('click', hideStallCard);

  map.on('click', () => {
    if (getActiveCardId() !== null) {
      hideStallCard();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});
