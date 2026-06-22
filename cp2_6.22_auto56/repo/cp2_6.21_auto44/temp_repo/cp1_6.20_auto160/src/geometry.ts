import * as THREE from 'three';

export interface GeometryParams {
  thickness: number;
  bend: number;
  tilt: number;
  texture: number;
  twist: number;
  colorPhase: number;
}

export const DEFAULT_PARAMS: GeometryParams = {
  thickness: 1.0,
  bend: 90,
  tilt: 0,
  texture: 5,
  twist: 1.0,
  colorPhase: 210
};

export function hslToColor(h: number, s: number, l: number): THREE.Color {
  const color = new THREE.Color();
  color.setHSL(h / 360, s, l);
  return color;
}

export function createSculptureGeometry(params: GeometryParams): THREE.BufferGeometry {
  const { thickness, bend, tilt, texture, twist } = params;

  const curvePoints: THREE.Vector3[] = [];
  const segments = 200;
  const bendRad = (bend * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const radius = 2.5;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * (1 + twist * 0.5);
    const heightFactor = Math.sin(t * Math.PI * 2) * 0.8;
    const bendFactor = Math.sin(t * bendRad) * radius;

    let x = Math.cos(angle) * (radius + bendFactor * 0.3);
    let y = heightFactor * radius + Math.sin(t * bendRad) * radius * 0.5;
    let z = Math.sin(angle) * (radius + bendFactor * 0.3);

    const spiralOffset = t * Math.PI * 4 * twist;
    x += Math.cos(spiralOffset) * 0.3 * twist;
    z += Math.sin(spiralOffset) * 0.3 * twist;

    const cosTilt = Math.cos(tiltRad);
    const sinTilt = Math.sin(tiltRad);
    const newY = y * cosTilt - z * sinTilt;
    const newZ = y * sinTilt + z * cosTilt;
    y = newY;
    z = newZ;

    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);

  const tubeRadius = 0.12 + thickness * 0.18;
  const radialSegments = Math.max(8, Math.floor(texture * 2.5));
  const tubularSegments = Math.floor(segments * 1.5);

  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    tubularSegments,
    tubeRadius,
    radialSegments,
    true
  );

  const positions = tubeGeometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const baseHue = params.colorPhase;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    const dist = Math.sqrt(x * x + y * y + z * z);
    const angle = Math.atan2(z, x);
    const hue = (baseHue + angle * 30 + dist * 15) % 360;
    const saturation = 0.55 + 0.15 * Math.sin(dist * texture * 0.5);
    const lightness = 0.45 + 0.15 * Math.sin(angle * texture + dist * 0.3);

    const color = hslToColor(hue, saturation, lightness);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  tubeGeometry.computeVertexNormals();

  return tubeGeometry;
}

export function createMaterial(params: GeometryParams): THREE.MeshPhysicalMaterial {
  const baseColor = hslToColor(params.colorPhase, 0.6, 0.55);

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    transparent: true,
    opacity: 0.72,
    roughness: 0.25,
    metalness: 0.15,
    transmission: 0.35,
    thickness: 0.8,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    vertexColors: true,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2
  });
}
