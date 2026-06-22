import * as THREE from 'three';

export const kelvinToRgb = (kelvin: number): THREE.Color => {
  const temp = kelvin / 100;
  let red: number, green: number, blue: number;

  if (temp <= 66) {
    red = 255;
    green = temp;
    green = 99.4708025861 * Math.log(green) - 161.1195681661;
    if (temp <= 19) {
      blue = 0;
    } else {
      blue = temp - 10;
      blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    }
  } else {
    red = temp - 60;
    red = 329.698727446 * Math.pow(red, -0.1332047592);
    green = temp - 60;
    green = 288.1221695283 * Math.pow(green, -0.0755148492);
    blue = 255;
  }

  return new THREE.Color(
    Math.max(0, Math.min(255, red)) / 255,
    Math.max(0, Math.min(255, green)) / 255,
    Math.max(0, Math.min(255, blue)) / 255
  );
};

export const computeShadowRadius = (brightness: number): number => {
  return 2 + (1 - brightness) * 8;
};

export const computeSpotAngle = (brightness: number): number => {
  return Math.PI / 6 + brightness * (Math.PI / 4);
};

export const lerpColor = (from: THREE.Color, to: THREE.Color, t: number): THREE.Color => {
  const result = from.clone();
  result.lerp(to, t);
  return result;
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
