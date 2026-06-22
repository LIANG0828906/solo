import * as THREE from 'three';

export const lerp = (from: number, to: number, t: number): number => {
  return from + (to - from) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export const lerpColor = (
  from: THREE.Color,
  to: THREE.Color,
  t: number
): THREE.Color => {
  const result = new THREE.Color();
  result.r = from.r + (to.r - from.r) * t;
  result.g = from.g + (to.g - from.g) * t;
  result.b = from.b + (to.b - from.b) * t;
  return result;
};

export const getFluxColor = (flux: number, t: number): THREE.Color => {
  const cyan = new THREE.Color('#00E5FF');
  const magenta = new THREE.Color('#FF00E5');
  const normalizedFlux = Math.max(0, Math.min(1, flux / 100));
  const mixT = t * 0.7 + normalizedFlux * 0.3;
  return lerpColor(cyan, magenta, mixT);
};

export const generateSpiralPosition = (
  nodeIndex: number,
  totalNodes: number,
  spiralRadius: number,
  branchDensity: number,
  stemHeight: number = 4
): THREE.Vector3 => {
  const progress = nodeIndex / totalNodes;
  const stemY = (progress - 0.5) * stemHeight;

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const turns = branchDensity * 2.5;
  const baseAngle = nodeIndex * goldenAngle + progress * turns * Math.PI * 2;

  const radialFactor = Math.sin(progress * Math.PI);
  const radius = radialFactor * spiralRadius * (0.4 + progress * 0.6);

  const branchIdx = Math.floor(nodeIndex / Math.max(1, Math.floor(totalNodes / branchDensity)));
  const branchOffset = (branchIdx / branchDensity) * Math.PI * 2;

  const randomJitter = 0.15;
  const jitterX = (Math.random() - 0.5) * randomJitter * radialFactor;
  const jitterZ = (Math.random() - 0.5) * randomJitter * radialFactor;
  const jitterY = (Math.random() - 0.5) * randomJitter * 0.8;

  const combinedAngle = baseAngle + branchOffset * 0.5;
  const x = Math.cos(combinedAngle) * radius + jitterX;
  const z = Math.sin(combinedAngle) * radius + jitterZ;
  const y = stemY + jitterY + Math.sin(progress * Math.PI * 6) * 0.1;

  return new THREE.Vector3(x, y, z);
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const fibonacciSphere = (
  samples: number,
  index: number,
  radius: number
): THREE.Vector3 => {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / samples);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
};

export const smoothDamp = (
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): number => {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;
  const temp = (currentVelocity.value + omega * change) * deltaTime;
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp;
  let output = target + (change + temp) * exp;
  if (originalTo - current > 0.0 === output > originalTo) {
    output = originalTo;
    currentVelocity.value = (output - originalTo) / deltaTime;
  }
  return output;
};

export const smoothDampVector = (
  current: THREE.Vector3,
  target: THREE.Vector3,
  currentVelocity: THREE.Vector3,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): THREE.Vector3 => {
  const result = current.clone();
  result.x = smoothDamp(
    current.x,
    target.x,
    { value: currentVelocity.x },
    smoothTime,
    maxSpeed,
    deltaTime
  );
  result.y = smoothDamp(
    current.y,
    target.y,
    { value: currentVelocity.y },
    smoothTime,
    maxSpeed,
    deltaTime
  );
  result.z = smoothDamp(
    current.z,
    target.z,
    { value: currentVelocity.z },
    smoothTime,
    maxSpeed,
    deltaTime
  );
  return result;
};
