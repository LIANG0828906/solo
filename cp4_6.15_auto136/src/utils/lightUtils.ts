export interface LightSource {
  enabled: boolean;
  position: [number, number, number];
  intensity: number;
  colorTemperature: number;
}

export interface LightConfig {
  main: LightSource;
  back: LightSource;
  fill: LightSource;
}

export interface PresetConfig {
  name: string;
  config: LightConfig;
}

export function colorTemperatureToRGB(kelvin: number): [number, number, number] {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    }
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }

  return [
    Math.max(0, Math.min(1, Math.round(r) / 255)),
    Math.max(0, Math.min(1, Math.round(g) / 255)),
    Math.max(0, Math.min(1, Math.round(b) / 255)),
  ];
}

export function colorTemperatureToHex(kelvin: number): string {
  const [r, g, b] = colorTemperatureToRGB(kelvin);
  const toHex = (v: number) => {
    const hex = Math.round(v * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function colorTemperatureToCSSColor(kelvin: number): string {
  const [r, g, b] = colorTemperatureToRGB(kelvin);
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function getDefaultDayConfig(): LightConfig {
  return {
    main: {
      enabled: true,
      position: [2, 3.5, 1],
      intensity: 1.0,
      colorTemperature: 6500,
    },
    back: {
      enabled: true,
      position: [-2, 2.5, -2],
      intensity: 0.5,
      colorTemperature: 6500,
    },
    fill: {
      enabled: true,
      position: [0, 1.5, 3],
      intensity: 0.3,
      colorTemperature: 5500,
    },
  };
}

export function getDefaultNightConfig(): LightConfig {
  return {
    main: {
      enabled: true,
      position: [1, 2.5, 0],
      intensity: 0.8,
      colorTemperature: 2700,
    },
    back: {
      enabled: true,
      position: [-1, 1.8, -1],
      intensity: 0.3,
      colorTemperature: 2500,
    },
    fill: {
      enabled: true,
      position: [0, 0.8, 2],
      intensity: 0.2,
      colorTemperature: 3000,
    },
  };
}

export function getPresetConfig(preset: string): LightConfig {
  switch (preset) {
    case 'warm':
      return {
        main: {
          enabled: true,
          position: [1.5, 2.2, 0.5],
          intensity: 0.8,
          colorTemperature: 2700,
        },
        back: {
          enabled: true,
          position: [-1, 1.8, -1.5],
          intensity: 0.4,
          colorTemperature: 2500,
        },
        fill: {
          enabled: true,
          position: [0.5, 1.2, 2],
          intensity: 0.35,
          colorTemperature: 3000,
        },
      };
    case 'office':
      return {
        main: {
          enabled: true,
          position: [0, 3.5, 0],
          intensity: 1.2,
          colorTemperature: 6500,
        },
        back: {
          enabled: true,
          position: [-2, 2, -2],
          intensity: 0.6,
          colorTemperature: 6000,
        },
        fill: {
          enabled: true,
          position: [2, 1, 2],
          intensity: 0.5,
          colorTemperature: 5500,
        },
      };
    case 'party':
      return {
        main: {
          enabled: true,
          position: [0, 2, 0],
          intensity: 0.6,
          colorTemperature: 3500,
        },
        back: {
          enabled: true,
          position: [-1.5, 2.5, -1],
          intensity: 0.8,
          colorTemperature: 2800,
        },
        fill: {
          enabled: true,
          position: [1.5, 1, 1.5],
          intensity: 0.4,
          colorTemperature: 4000,
        },
      };
    default:
      return getDefaultDayConfig();
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpLightSource(from: LightSource, to: LightSource, t: number): LightSource {
  return {
    enabled: t < 0.5 ? from.enabled : to.enabled,
    position: [
      lerp(from.position[0], to.position[0], t),
      lerp(from.position[1], to.position[1], t),
      lerp(from.position[2], to.position[2], t),
    ],
    intensity: lerp(from.intensity, to.intensity, t),
    colorTemperature: lerp(from.colorTemperature, to.colorTemperature, t),
  };
}

export function interpolateLightConfig(from: LightConfig, to: LightConfig, t: number): LightConfig {
  const easedT = easeInOutCubic(t);
  return {
    main: lerpLightSource(from.main, to.main, easedT),
    back: lerpLightSource(from.back, to.back, easedT),
    fill: lerpLightSource(from.fill, to.fill, easedT),
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getAmbientParams(mode: 'day' | 'night', progress: number) {
  const dayColor: [number, number, number] = [0.6, 0.7, 0.85];
  const nightColor: [number, number, number] = [0.15, 0.1, 0.2];
  const dayIntensity = 0.4;
  const nightIntensity = 0.08;

  return {
    color: [
      lerp(dayColor[0], nightColor[0], progress),
      lerp(dayColor[1], nightColor[1], progress),
      lerp(dayColor[2], nightColor[2], progress),
    ] as [number, number, number],
    intensity: lerp(dayIntensity, nightIntensity, progress),
  };
}

export function getWindowBgColor(progress: number): [number, number, number] {
  const day: [number, number, number] = [0.53, 0.72, 0.92];
  const night: [number, number, number] = [0.05, 0.03, 0.12];
  return [
    lerp(day[0], night[0], progress),
    lerp(day[1], night[1], progress),
    lerp(day[2], night[2], progress),
  ];
}

export function exportConfigToJSON(config: LightConfig, mode: 'day' | 'night'): void {
  const jsonStr = JSON.stringify(
    {
      mode,
      lights: config,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `light-design-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
