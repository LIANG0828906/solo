export interface LightingParams {
  sunDirection: [number, number, number];
  sunIntensity: number;
  sunColorTemp: number;
  moonDirection: [number, number, number];
  moonIntensity: number;
  ambientIntensity: number;
}

export interface SurfaceVertex {
  position: [number, number, number];
  normal: [number, number, number];
}

export interface LightSource {
  position: [number, number, number];
  intensity: number;
  colorTemperature: number;
  enabled: boolean;
  type: string;
}

const LOCATIONS: Record<string, { lat: number; lon: number }> = {
  beijing: { lat: 39.9, lon: 116.4 },
  shanghai: { lat: 31.2, lon: 121.5 },
  london: { lat: 51.5, lon: -0.1 },
  newyork: { lat: 40.7, lon: -74.0 },
};

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len < 1e-10) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function calculateLightingParams(
  location: string,
  date: string,
  time: number,
  weather: string
): LightingParams {
  const loc = LOCATIONS[location];
  if (!loc) {
    throw new Error(`Unknown location: ${location}`);
  }

  const latRad = loc.lat * Math.PI / 180;

  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const declinationDeg = 23.45 * Math.sin((360 / 365) * (284 + dayOfYear) * Math.PI / 180);
  const declinationRad = declinationDeg * Math.PI / 180;

  const hourAngleDeg = (time - 12) * 15;
  const hourAngleRad = hourAngleDeg * Math.PI / 180;

  const sinAlt = Math.sin(latRad) * Math.sin(declinationRad)
    + Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altitude * 180 / Math.PI;
  const cosAlt = Math.cos(altitude);

  let azimuth = 0;
  const cosLat = Math.cos(latRad);
  if (cosAlt > 0.001 && Math.abs(cosLat) > 0.001) {
    const cosAz = (Math.sin(altitude) * Math.sin(latRad) - Math.sin(declinationRad))
      / (cosAlt * cosLat);
    azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (hourAngleRad > 0) {
      azimuth = 2 * Math.PI - azimuth;
    }
  }

  const sunDirection: [number, number, number] = [
    cosAlt * Math.sin(azimuth),
    Math.sin(altitude),
    cosAlt * Math.cos(azimuth),
  ];

  let sunIntensity: number;
  if (altDeg < 0) {
    sunIntensity = 0;
  } else if (altDeg < 5) {
    sunIntensity = (altDeg / 5) * 0.3;
  } else {
    sunIntensity = Math.min(1, altDeg / 60);
  }

  if (weather === 'overcast') {
    sunIntensity *= 0.2;
  } else if (weather === 'cloudy') {
    sunIntensity *= 0.5;
  }

  let sunColorTemp: number;
  if (altDeg < 10) {
    sunColorTemp = 2700;
  } else if (altDeg < 30) {
    sunColorTemp = 3500 + (altDeg - 10) * 50;
  } else {
    sunColorTemp = 5500;
  }

  const moonRaw: [number, number, number] = [
    -sunDirection[0] + 0.1,
    Math.max(0.2, -sunDirection[1]),
    -sunDirection[2] + 0.15,
  ];
  const moonDirection = normalize3(moonRaw);

  const moonIntensity = altDeg < 0 ? 0.05 : 0;

  let ambientBase: number;
  if (weather === 'clear') {
    ambientBase = 0.15;
  } else if (weather === 'cloudy') {
    ambientBase = 0.3;
  } else {
    ambientBase = 0.5;
  }
  const ambientIntensity = ambientBase + (altDeg >= 0 ? 0.1 : 0);

  return {
    sunDirection,
    sunIntensity,
    sunColorTemp,
    moonDirection,
    moonIntensity,
    ambientIntensity,
  };
}

export function computeIrradiance(
  vertices: SurfaceVertex[],
  lightingParams: LightingParams,
  lights: LightSource[],
  wallReflectances: number[]
): number[] {
  const avgReflectance = wallReflectances.length > 0
    ? wallReflectances.reduce((a, b) => a + b, 0) / wallReflectances.length
    : 0.5;
  const reflectanceFactor = 0.5 + 0.5 * avgReflectance;

  const negSunDir: [number, number, number] = [
    -lightingParams.sunDirection[0],
    -lightingParams.sunDirection[1],
    -lightingParams.sunDirection[2],
  ];
  const negMoonDir: [number, number, number] = [
    -lightingParams.moonDirection[0],
    -lightingParams.moonDirection[1],
    -lightingParams.moonDirection[2],
  ];

  return vertices.map((vertex) => {
    const n = vertex.normal;

    const sunContrib = Math.max(0, dot3(n, negSunDir)) * lightingParams.sunIntensity * 1000;
    const moonContrib = Math.max(0, dot3(n, negMoonDir)) * lightingParams.moonIntensity * 0.2;
    const ambientContrib = lightingParams.ambientIntensity * 50;

    let lightsContrib = 0;
    for (const light of lights) {
      if (!light.enabled) continue;

      const diff: [number, number, number] = [
        light.position[0] - vertex.position[0],
        light.position[1] - vertex.position[1],
        light.position[2] - vertex.position[2],
      ];
      const distance = Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2]);

      const attenuation = 1 / (1 + 0.09 * distance + 0.032 * distance * distance);

      const lightDir = normalize3(diff);
      const lightDot = Math.max(0, dot3(n, lightDir));

      let contrib = lightDot * light.intensity * attenuation * 80;
      if (light.type === 'area') {
        contrib *= 2.5;
      }
      lightsContrib += contrib;
    }

    return (sunContrib + moonContrib + ambientContrib + lightsContrib) * reflectanceFactor;
  });
}

export function illuminanceToColor(lux: number): [number, number, number] {
  const stops: Array<{ lux: number; r: number; g: number; b: number }> = [
    { lux: 0, r: 0, g: 0, b: 255 },
    { lux: 500, r: 0, g: 255, b: 0 },
    { lux: 1000, r: 255, g: 255, b: 0 },
    { lux: 1500, r: 255, g: 165, b: 0 },
    { lux: 2000, r: 255, g: 0, b: 0 },
  ];

  if (lux <= 0) return [0, 0, 255];
  if (lux >= 2000) return [255, 0, 0];

  for (let i = 0; i < stops.length - 1; i++) {
    if (lux <= stops[i + 1].lux) {
      const t = (lux - stops[i].lux) / (stops[i + 1].lux - stops[i].lux);
      return [
        Math.round(stops[i].r + t * (stops[i + 1].r - stops[i].r)),
        Math.round(stops[i].g + t * (stops[i + 1].g - stops[i].g)),
        Math.round(stops[i].b + t * (stops[i + 1].b - stops[i].b)),
      ];
    }
  }

  return [255, 0, 0];
}

export function generateHeatmapTexture(
  illuminanceValues: number[],
  resolution: number = 512
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context');
  }

  const imageData = ctx.createImageData(resolution, resolution);
  const totalPixels = resolution * resolution;
  const n = illuminanceValues.length;

  for (let i = 0; i < totalPixels; i++) {
    const val = n > 0
      ? illuminanceValues[Math.min(Math.floor(i / totalPixels * n), n - 1)]
      : 0;
    const [r, g, b] = illuminanceToColor(val);
    imageData.data[i * 4] = r;
    imageData.data[i * 4 + 1] = g;
    imageData.data[i * 4 + 2] = b;
    imageData.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function estimateColorTemperature(illuminance: number, hasDirectSunlight: boolean): string {
  if (hasDirectSunlight && illuminance > 300) return "暖色区间 (3500K-5500K)";
  if (illuminance > 100) return "中性区间 (4000K-5000K)";
  if (illuminance > 50) return "冷色区间 (5000K-6500K)";
  return "偏冷区间 (5500K-7000K)";
}
