import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { StarField, ColorTheme } from './starGenerator';

export interface ControlCallbacks {
  onDensityChange: (count: number) => void;
  onSpeedChange: (speed: number) => void;
  onThemeChange: (theme: ColorTheme) => void;
  onMeteorToggle: (enabled: boolean) => void;
  onStarClick: (position: THREE.Vector3) => void;
}

