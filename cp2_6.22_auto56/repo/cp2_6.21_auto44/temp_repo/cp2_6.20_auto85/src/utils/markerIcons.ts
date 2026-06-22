import type { MarkerIconConfig, MarkerIconKey } from '@/types';

export const markerIconMap: Record<MarkerIconKey, MarkerIconConfig> = {
  fruit: {
    icon: '🍎',
    bgColor: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
    label: '水果',
  },
  vegetable: {
    icon: '🥕',
    bgColor: 'linear-gradient(135deg, #ffa502 0%, #ff7f00 100%)',
    label: '蔬菜',
  },
  craft: {
    icon: '🎨',
    bgColor: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    label: '手工艺',
  },
  food: {
    icon: '🍜',
    bgColor: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
    label: '美食',
  },
  sowing: {
    icon: '🌱',
    bgColor: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
    label: '播种',
  },
  harvest: {
    icon: '🌾',
    bgColor: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
    label: '采摘',
  },
  festival: {
    icon: '🎆',
    bgColor: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)',
    label: '节庆',
  },
};

export function getMarkerIcon(type: MarkerIconKey): MarkerIconConfig {
  return markerIconMap[type];
}

export function createCustomDivIcon(type: MarkerIconKey): HTMLDivElement {
  const config = markerIconMap[type];
  const div = document.createElement('div');
  div.className = 'marker-icon-wrapper';
  div.style.cssText = `
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${config.bgColor};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border: 2px solid white;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-size: 20px;
  `;
  div.innerHTML = `<span style="pointer-events: none;">${config.icon}</span>`;
  return div;
}
