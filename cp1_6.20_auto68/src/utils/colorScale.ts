import * as THREE from 'three';

const colorStops: { depth: number; color: THREE.Color }[] = [
  { depth: 0, color: new THREE.Color(0xff6b6b) },
  { depth: 70, color: new THREE.Color(0xc92a2a) },
  { depth: 300, color: new THREE.Color(0x9c36b5) },
  { depth: 700, color: new THREE.Color(0x1c7ed6) },
];

export const depthToColor = (depth: number): THREE.Color => {
  const clampedDepth = Math.max(0, Math.min(700, depth));

  for (let i = 0; i < colorStops.length - 1; i++) {
    const start = colorStops[i];
    const end = colorStops[i + 1];

    if (clampedDepth >= start.depth && clampedDepth <= end.depth) {
      const t = (clampedDepth - start.depth) / (end.depth - start.depth);
      return start.color.clone().lerp(end.color, t);
    }
  }

  return colorStops[colorStops.length - 1].color.clone();
};

export const magToRadius = (mag: number, minMag: number, maxMag: number): number => {
  const minRadius = 1.5;
  const maxRadius = 8;
  const clampedMag = Math.max(minMag, Math.min(maxMag, mag));
  const t = maxMag === minMag ? 0.5 : (clampedMag - minMag) / (maxMag - minMag);
  return minRadius + t * (maxRadius - minRadius);
};
