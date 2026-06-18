import * as THREE from 'three';

export type ChannelType = 'Y' | 'T' | 'serpentine';

export interface ChannelData {
  inletACurve: THREE.CatmullRomCurve3;
  inletBCurve: THREE.CatmullRomCurve3;
  mainCurve: THREE.CatmullRomCurve3;
  mergePoint: THREE.Vector3;
  inletAPos: THREE.Vector3;
  inletBPos: THREE.Vector3;
  outletPos: THREE.Vector3;
  mainLength: number;
  inletALength: number;
  inletBLength: number;
  type: ChannelType;
}

const CHANNEL_INNER_RADIUS = 0.35;
const CHANNEL_OUTER_RADIUS = 0.45;

const WALL_MAT = {
  color: 0xa8d8ea,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
  depthWrite: false,
  roughness: 0.2,
  metalness: 0.1,
};

const CAVITY_MAT = {
  color: 0xf0f0f0,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
  depthWrite: false,
  roughness: 0.3,
  metalness: 0.0,
};

function buildPaths(type: ChannelType): ChannelData {
  switch (type) {
    case 'Y':
      return buildYPaths();
    case 'T':
      return buildTPaths();
    case 'serpentine':
      return buildSerpentinePaths();
  }
}

function buildYPaths(): ChannelData {
  const inletA = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, 4.5, 0),
    new THREE.Vector3(-2.2, 3.5, 0),
    new THREE.Vector3(-1.2, 2.3, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const inletB = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3, 4.5, 0),
    new THREE.Vector3(2.2, 3.5, 0),
    new THREE.Vector3(1.2, 2.3, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const main = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -1.5, 0),
    new THREE.Vector3(0, -3, 0),
    new THREE.Vector3(0, -4.5, 0),
    new THREE.Vector3(0, -5.5, 0),
  ], false, 'centripetal');

  return {
    inletACurve: inletA,
    inletBCurve: inletB,
    mainCurve: main,
    mergePoint: new THREE.Vector3(0, 1, 0),
    inletAPos: new THREE.Vector3(-3, 4.5, 0),
    inletBPos: new THREE.Vector3(3, 4.5, 0),
    outletPos: new THREE.Vector3(0, -5.5, 0),
    mainLength: main.getLength(),
    inletALength: inletA.getLength(),
    inletBLength: inletB.getLength(),
    type: 'Y',
  };
}

function buildTPaths(): ChannelData {
  const inletA = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 1, 0),
    new THREE.Vector3(-3.5, 1, 0),
    new THREE.Vector3(-2, 1, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const inletB = new THREE.CatmullRomCurve3([
    new THREE.Vector3(5, 1, 0),
    new THREE.Vector3(3.5, 1, 0),
    new THREE.Vector3(2, 1, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const main = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -1.5, 0),
    new THREE.Vector3(0, -3, 0),
    new THREE.Vector3(0, -4.5, 0),
    new THREE.Vector3(0, -5.5, 0),
  ], false, 'centripetal');

  return {
    inletACurve: inletA,
    inletBCurve: inletB,
    mainCurve: main,
    mergePoint: new THREE.Vector3(0, 1, 0),
    inletAPos: new THREE.Vector3(-5, 1, 0),
    inletBPos: new THREE.Vector3(5, 1, 0),
    outletPos: new THREE.Vector3(0, -5.5, 0),
    mainLength: main.getLength(),
    inletALength: inletA.getLength(),
    inletBLength: inletB.getLength(),
    type: 'T',
  };
}

function buildSerpentinePaths(): ChannelData {
  const inletA = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, 4.5, 0),
    new THREE.Vector3(-2.2, 3.5, 0),
    new THREE.Vector3(-1.2, 2.3, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const inletB = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3, 4.5, 0),
    new THREE.Vector3(2.2, 3.5, 0),
    new THREE.Vector3(1.2, 2.3, 0),
    new THREE.Vector3(0, 1, 0),
  ], false, 'centripetal');

  const main = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(2.5, 0.5, 0),
    new THREE.Vector3(2.5, -0.2, 0),
    new THREE.Vector3(-2.5, -0.8, 0),
    new THREE.Vector3(-2.5, -1.5, 0),
    new THREE.Vector3(2.5, -2.1, 0),
    new THREE.Vector3(2.5, -2.8, 0),
    new THREE.Vector3(-2.5, -3.4, 0),
    new THREE.Vector3(-2.5, -4.0, 0),
    new THREE.Vector3(0, -4.5, 0),
    new THREE.Vector3(0, -5.5, 0),
  ], false, 'centripetal');

  return {
    inletACurve: inletA,
    inletBCurve: inletB,
    mainCurve: main,
    mergePoint: new THREE.Vector3(0, 1, 0),
    inletAPos: new THREE.Vector3(-3, 4.5, 0),
    inletBPos: new THREE.Vector3(3, 4.5, 0),
    outletPos: new THREE.Vector3(0, -5.5, 0),
    mainLength: main.getLength(),
    inletALength: inletA.getLength(),
    inletBLength: inletB.getLength(),
    type: 'serpentine',
  };
}

function createChannelMeshes(curve: THREE.CatmullRomCurve3, group: THREE.Group): void {
  const wallGeom = new THREE.TubeGeometry(curve, 80, CHANNEL_OUTER_RADIUS, 16, false);
  const wallMat = new THREE.MeshPhysicalMaterial(WALL_MAT);
  const wallMesh = new THREE.Mesh(wallGeom, wallMat);
  wallMesh.renderOrder = 1;
  group.add(wallMesh);

  const cavityGeom = new THREE.TubeGeometry(curve, 80, CHANNEL_INNER_RADIUS, 16, false);
  const cavityMat = new THREE.MeshPhysicalMaterial(CAVITY_MAT);
  const cavityMesh = new THREE.Mesh(cavityGeom, cavityMat);
  cavityMesh.renderOrder = 2;
  group.add(cavityMesh);
}

export function createGradientBar(scene: THREE.Scene, data: ChannelData): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const geom = new THREE.PlaneGeometry(CHANNEL_INNER_RADIUS * 2, 0.3);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'gradientBar';
  mesh.renderOrder = 3;

  const outlet = data.outletPos;
  mesh.position.set(outlet.x, outlet.y - 0.3, outlet.z + 0.01);
  scene.add(mesh);

  return mesh;
}

export function updateGradientBar(mesh: THREE.Mesh, efficiency: number, flowRatioA: number, flowRatioB: number): void {
  const mat = mesh.material as THREE.MeshBasicMaterial;
  const texture = mat.map as THREE.CanvasTexture;
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rA = flowRatioA / (flowRatioA + flowRatioB);
  const interfaceX = rA * canvas.width;
  const transitionWidth = Math.max(10, efficiency / 100 * canvas.width);

  const colorA = { r: 255, g: 107, b: 107 };
  const colorB = { r: 78, g: 205, b: 196 };
  const colorMix = {
    r: Math.round((colorA.r + colorB.r) / 2),
    g: Math.round((colorA.g + colorB.g) / 2),
    b: Math.round((colorA.b + colorB.b) / 2),
  };

  for (let x = 0; x < canvas.width; x++) {
    const distFromInterface = Math.abs(x - interfaceX);
    const inTransition = distFromInterface < transitionWidth / 2;
    let r: number, g: number, b: number;

    if (inTransition) {
      const t = 0.5 + 0.5 * (x - interfaceX) / (transitionWidth / 2);
      const mixT = efficiency / 100;
      const effectiveT = t * (1 - mixT) + 0.5 * mixT;
      r = Math.round(colorA.r + (colorB.r - colorA.r) * effectiveT);
      g = Math.round(colorA.g + (colorB.g - colorA.g) * effectiveT);
      b = Math.round(colorA.b + (colorB.b - colorA.b) * effectiveT);
    } else if (x < interfaceX) {
      const mixT = efficiency / 100;
      r = Math.round(colorA.r + (colorMix.r - colorA.r) * mixT * 0.5);
      g = Math.round(colorA.g + (colorMix.g - colorA.g) * mixT * 0.5);
      b = Math.round(colorA.b + (colorMix.b - colorA.b) * mixT * 0.5);
    } else {
      const mixT = efficiency / 100;
      r = Math.round(colorB.r + (colorMix.r - colorB.r) * mixT * 0.5);
      g = Math.round(colorB.g + (colorMix.g - colorB.g) * mixT * 0.5);
      b = Math.round(colorB.b + (colorMix.b - colorB.b) * mixT * 0.5);
    }

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, 0, 1, canvas.height);
  }

  texture.needsUpdate = true;
}

export function setupChannel(scene: THREE.Scene, type: ChannelType): {
  group: THREE.Group;
  data: ChannelData;
} {
  const existing = scene.getObjectByName('channelGroup');
  if (existing) {
    existing.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    scene.remove(existing);
  }

  const group = new THREE.Group();
  group.name = 'channelGroup';

  const data = buildPaths(type);

  createChannelMeshes(data.inletACurve, group);
  createChannelMeshes(data.inletBCurve, group);
  createChannelMeshes(data.mainCurve, group);

  const inletAMat = new THREE.MeshBasicMaterial({
    color: 0xff6b6b,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const inletAGeom = new THREE.CircleGeometry(CHANNEL_INNER_RADIUS * 0.8, 16);
  const inletAMesh = new THREE.Mesh(inletAGeom, inletAMat);
  const aDir = data.inletACurve.getTangentAt(0).negate();
  inletAMesh.position.copy(data.inletAPos);
  inletAMesh.lookAt(data.inletAPos.clone().add(aDir));
  inletAMesh.renderOrder = 4;
  group.add(inletAMesh);

  const inletBMat = new THREE.MeshBasicMaterial({
    color: 0x4ecdc4,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const inletBGeom = new THREE.CircleGeometry(CHANNEL_INNER_RADIUS * 0.8, 16);
  const inletBMesh = new THREE.Mesh(inletBGeom, inletBMat);
  const bDir = data.inletBCurve.getTangentAt(0).negate();
  inletBMesh.position.copy(data.inletBPos);
  inletBMesh.lookAt(data.inletBPos.clone().add(bDir));
  inletBMesh.renderOrder = 4;
  group.add(inletBMesh);

  scene.add(group);
  return { group, data };
}

export function updateChannelMesh(scene: THREE.Scene, type: ChannelType): ChannelData {
  const result = setupChannel(scene, type);
  return result.data;
}

export { CHANNEL_INNER_RADIUS };
