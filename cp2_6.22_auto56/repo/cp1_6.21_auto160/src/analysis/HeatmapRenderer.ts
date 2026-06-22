import { Color, BufferAttribute } from 'three';

interface HeatmapColor {
  r: number;
  g: number;
  b: number;
}

const COLOR_LOW: HeatmapColor = { r: 0.118, g: 0.227, b: 0.541 };
const COLOR_MID: HeatmapColor = { r: 0.063, g: 0.725, b: 0.506 };
const COLOR_HIGH: HeatmapColor = { r: 0.937, g: 0.267, b: 0.267 };

const BASE_COLOR: HeatmapColor = { r: 0.353, g: 0.290, b: 0.227 };

export class HeatmapRenderer {
  private previousPressures: Float32Array = new Float32Array(0);
  private opacity = 0.5;
  private changeThreshold = 0.05;

  pressureToColor(pressure: number): HeatmapColor {
    const normalized = Math.min(1, Math.max(0, (pressure + 1) * 0.5));
    if (normalized < 0.5) {
      const t = normalized * 2;
      return {
        r: COLOR_LOW.r + (COLOR_MID.r - COLOR_LOW.r) * t,
        g: COLOR_LOW.g + (COLOR_MID.g - COLOR_LOW.g) * t,
        b: COLOR_LOW.b + (COLOR_MID.b - COLOR_LOW.b) * t,
      };
    } else {
      const t = (normalized - 0.5) * 2;
      return {
        r: COLOR_MID.r + (COLOR_HIGH.r - COLOR_MID.r) * t,
        g: COLOR_MID.g + (COLOR_HIGH.g - COLOR_MID.g) * t,
        b: COLOR_MID.b + (COLOR_HIGH.b - COLOR_MID.b) * t,
      };
    }
  }

  update(geometry: BufferAttribute, pressureField: Float32Array): void {
    const colorAttr = geometry as BufferAttribute;
    const colors = colorAttr.array as Float32Array;
    const vertexCount = colorAttr.count;

    if (this.previousPressures.length !== pressureField.length) {
      this.previousPressures = new Float32Array(pressureField.length);
    }

    for (let i = 0; i < vertexCount; i++) {
      const pIdx = i;
      if (pIdx >= pressureField.length) break;

      const currentP = pressureField[pIdx];
      const prevP = this.previousPressures[pIdx];
      const maxP = Math.max(Math.abs(currentP), Math.abs(prevP), 0.01);
      const changeRatio = Math.abs(currentP - prevP) / maxP;

      if (changeRatio > this.changeThreshold || prevP === 0) {
        const hasPressure = Math.abs(currentP) > 0.001;
        if (hasPressure) {
          const heatColor = this.pressureToColor(currentP);
          colors[i * 3] = BASE_COLOR.r + (heatColor.r - BASE_COLOR.r) * this.opacity;
          colors[i * 3 + 1] = BASE_COLOR.g + (heatColor.g - BASE_COLOR.g) * this.opacity;
          colors[i * 3 + 2] = BASE_COLOR.b + (heatColor.b - BASE_COLOR.b) * this.opacity;
        } else {
          colors[i * 3] = BASE_COLOR.r;
          colors[i * 3 + 1] = BASE_COLOR.g;
          colors[i * 3 + 2] = BASE_COLOR.b;
        }
      }
    }

    this.previousPressures.set(pressureField);
    colorAttr.needsUpdate = true;
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.min(1, Math.max(0, opacity));
  }

  reset(geometry: BufferAttribute): void {
    const colors = geometry.array as Float32Array;
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = BASE_COLOR.r;
      colors[i + 1] = BASE_COLOR.g;
      colors[i + 2] = BASE_COLOR.b;
    }
    geometry.needsUpdate = true;
    this.previousPressures.fill(0);
  }
}
