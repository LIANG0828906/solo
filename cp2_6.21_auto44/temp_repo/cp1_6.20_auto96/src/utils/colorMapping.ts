import { scaleLinear } from 'd3-scale';
import * as THREE from 'three';
import {
  POWER_MIN,
  POWER_MAX,
  TEMP_MIN,
  TEMP_MAX,
  HEIGHT_MIN,
  HEIGHT_MAX,
} from './constants';

const powerColorScale = scaleLinear<string>()
  .domain([POWER_MIN, POWER_MAX])
  .range(['#ff4444', '#44ff44'])
  .clamp(true);

const tempColorScale = scaleLinear<string>()
  .domain([TEMP_MIN, TEMP_MAX])
  .range(['#4488ff', '#ff4444'])
  .clamp(true);

const powerHeightScale = scaleLinear<number>()
  .domain([POWER_MIN, POWER_MAX])
  .range([HEIGHT_MIN, HEIGHT_MAX])
  .clamp(true);

const tempHeightScale = scaleLinear<number>()
  .domain([TEMP_MIN, TEMP_MAX])
  .range([HEIGHT_MIN, HEIGHT_MAX])
  .clamp(true);

export function getPowerColor(power: number): string {
  return powerColorScale(power) || '#888888';
}

export function getTempColor(temperature: number): string {
  return tempColorScale(temperature) || '#888888';
}

export function getColorByMode(
  value: number,
  mode: 'power' | 'temperature'
): string {
  return mode === 'power' ? getPowerColor(value) : getTempColor(value);
}

export function getThreeColorByMode(
  value: number,
  mode: 'power' | 'temperature'
): THREE.Color {
  return new THREE.Color(getColorByMode(value, mode));
}

export function getHeightByMode(
  value: number,
  mode: 'power' | 'temperature'
): number {
  return mode === 'power'
    ? powerHeightScale(value) || HEIGHT_MIN
    : tempHeightScale(value) || HEIGHT_MIN;
}

export function lerpColor(
  colorA: THREE.Color,
  colorB: THREE.Color,
  t: number
): THREE.Color {
  return colorA.clone().lerp(colorB, t);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
