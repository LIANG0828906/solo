import type { LightSource } from './types.js';
import { CANVAS_SIZE, DEFAULT_LIGHT_RADIUS, DEFAULT_BRIGHTNESS } from './types.js';
import { LightSculptureUI } from './ui.js';

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    h = (b - r) / (max - min) + 2;
  } else {
    h = (r - g) / (max - min) + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

function hexToHue(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  return rgbToHue(
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement | null;
  const leftPanel = document.getElementById('leftPanel');
  const rightPanel = document.getElementById('rightPanel');
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement | null;

  if (!canvas || !leftPanel || !rightPanel || !saveBtn) {
    console.error('无法找到必要的DOM元素');
    return;
  }

  const initialLights: LightSource[] = [
    {
      id: 0,
      x: CANVAS_SIZE / 2,
      y: CANVAS_SIZE / 2,
      hue: hexToHue('#ff4444'),
      brightness: DEFAULT_BRIGHTNESS,
      radius: DEFAULT_LIGHT_RADIUS
    },
    {
      id: 0,
      x: 100,
      y: 100,
      hue: hexToHue('#44ff44'),
      brightness: DEFAULT_BRIGHTNESS,
      radius: DEFAULT_LIGHT_RADIUS
    },
    {
      id: 0,
      x: 500,
      y: 500,
      hue: hexToHue('#4444ff'),
      brightness: DEFAULT_BRIGHTNESS,
      radius: DEFAULT_LIGHT_RADIUS
    }
  ];

  const ui = new LightSculptureUI(canvas);
  ui.init(initialLights, { leftPanel, rightPanel, saveBtn });
});
