import * as THREE from 'three';

export type ColorTheme = 'default' | 'neon' | 'sunset';

interface ColorStop {
  distance: number;
  color: THREE.Color;
}

interface ThemeConfig {
  stops: ColorStop[];
}

const colorThemes: Record<ColorTheme, ThemeConfig> = {
  default: {
    stops: [
      { distance: 0.0, color: new THREE.Color(0x4fc3f7) },
      { distance: 0.3, color: new THREE.Color(0x29b6f6) },
      { distance: 0.6, color: new THREE.Color(0x7c4dff) },
      { distance: 1.0, color: new THREE.Color(0xe91e63) }
    ]
  },
  neon: {
    stops: [
      { distance: 0.0, color: new THREE.Color(0x00ff88) },
      { distance: 0.3, color: new THREE.Color(0x00e5ff) },
      { distance: 0.6, color: new THREE.Color(0xff00ff) },
      { distance: 1.0, color: new THREE.Color(0xff0066) }
    ]
  },
  sunset: {
    stops: [
      { distance: 0.0, color: new THREE.Color(0xffeb3b) },
      { distance: 0.3, color: new THREE.Color(0xff9800) },
      { distance: 0.6, color: new THREE.Color(0xff5722) },
      { distance: 1.0, color: new THREE.Color(0xb71c1c) }
    ]
  }
};

let currentTheme: ColorTheme = 'default';
let targetTheme: ColorTheme = 'default';
let blendProgress: number = 1.0;
const blendDuration: number = 1.0;
let isBlending: boolean = false;

export function setTheme(theme: ColorTheme): void {
  if (theme === currentTheme && !isBlending) return;
  targetTheme = theme;
  blendProgress = 0.0;
  isBlending = true;
}

export function updateBlend(deltaTime: number): void {
  if (!isBlending) return;
  blendProgress = Math.min(1.0, blendProgress + deltaTime / blendDuration);
  if (blendProgress >= 1.0) {
    currentTheme = targetTheme;
    isBlending = false;
    blendProgress = 1.0;
  }
}

export function getColorAtDistance(normalizedDistance: number, outColor: THREE.Color): void {
  const currentStops = colorThemes[currentTheme].stops;
  const targetStops = colorThemes[targetTheme].stops;

  const t = Math.max(0, Math.min(1, normalizedDistance));

  const currentColor = interpolateColor(currentStops, t);
  const targetColor = interpolateColor(targetStops, t);

  outColor.copy(currentColor).lerp(targetColor, blendProgress);
}

function interpolateColor(stops: ColorStop[], t: number): THREE.Color {
  if (t <= stops[0].distance) {
    return stops[0].color;
  }
  if (t >= stops[stops.length - 1].distance) {
    return stops[stops.length - 1].color;
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const stop1 = stops[i];
    const stop2 = stops[i + 1];
    if (t >= stop1.distance && t <= stop2.distance) {
      const localT = (t - stop1.distance) / (stop2.distance - stop1.distance);
      const result = new THREE.Color();
      result.copy(stop1.color).lerp(stop2.color, localT);
      return result;
    }
  }

  return stops[stops.length - 1].color;
}

export function getCurrentTheme(): ColorTheme {
  return currentTheme;
}
