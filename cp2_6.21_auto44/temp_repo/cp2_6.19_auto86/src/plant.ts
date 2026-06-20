import * as THREE from 'three';

export interface EnvironmentParams {
  light: number;
  water: number;
  nutrients: number;
  rotationSpeed: number;
}

interface BranchData {
  mesh: THREE.Mesh;
  pivot: THREE.Group;
  baseBendAngle: number;
  baseHeightRatio: number;
  baseLength: number;
  baseAngle: number;
  bud?: THREE.Mesh;
  leaves: THREE.Mesh[];
}

export interface PlantObject {
  group: THREE.Group;
  trunk: THREE.Mesh;
  branches: BranchData[];
  params: EnvironmentParams;
  targetParams: EnvironmentParams;
  animating: boolean;
  animationStartTime: number;
  animationDuration: number;
  startParams: EnvironmentParams;
}

function createGradientTexture(topColor: string, bottomColor: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTriangleGeometry(sideLength: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const h = sideLength * Math.sqrt(3) / 2;
  const vertices = new Float32Array([
    0, h * 2 / 3, 0,
    -sideLength / 2, -h / 3, 0,
    sideLength / 2, -h / 3, 0
  ]);
  const normals = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]);
  const uvs = new Float32Array([
    0.5, 1,
    0, 0,
    1, 0
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex([0, 1, 2]);
  return geometry;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function createGradientMaterial(topHex: string, bottomHex: string): THREE.MeshStandardMaterial {
  const texture = createGradientTexture(topHex, bottomHex);
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.1
  });
}

function createBranch(
  baseLength: number,
  baseRadius: number,
  bendAngle: number,
  heightRatio: number,
  yAngle: number,
  topColor: string,
  bottomColor: string
): BranchData {
  const pivot = new THREE.Group();
  pivot.position.y = 3 * heightRatio;
  pivot.rotation.y = yAngle;

  const bendGroup = new THREE.Group();
  bendGroup.rotation.z = bendAngle;
  pivot.add(bendGroup);

  const branchGeometry = new THREE.CylinderGeometry(
    baseRadius * 0.7,
    baseRadius,
    baseLength,
    8
  );
  const branchMaterial = createGradientMaterial(topColor, bottomColor);
  const branch = new THREE.Mesh(branchGeometry, branchMaterial);
  branch.position.y = baseLength / 2;
  branch.castShadow = true;
  branch.receiveShadow = true;
  bendGroup.add(branch);

  const budGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const budCanvas = document.createElement('canvas');
  budCanvas.width = 64;
  budCanvas.height = 64;
  const budCtx = budCanvas.getContext('2d')!;
  const budGradient = budCtx.createRadialGradient(32, 32, 4, 32, 32, 32);
  budGradient.addColorStop(0, '#FFB6C1');
  budGradient.addColorStop(1, '#FF69B4');
  budCtx.fillStyle = budGradient;
  budCtx.beginPath();
  budCtx.arc(32, 32, 30, 0, Math.PI * 2);
  budCtx.fill();
  const budTexture = new THREE.CanvasTexture(budCanvas);
  budTexture.colorSpace = THREE.SRGBColorSpace;
  const budMaterial = new THREE.MeshStandardMaterial({
    map: budTexture,
    roughness: 0.5,
    metalness: 0.1
  });
  const bud = new THREE.Mesh(budGeometry, budMaterial);
  bud.position.y = baseLength;
  bud.visible = false;
  bud.castShadow = true;
  bendGroup.add(bud);

  const leaves: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const leafGeometry = createTriangleGeometry(0.15);
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x32CD32,
      side: THREE.DoubleSide,
      shininess: 30,
      specular: 0x222222,
      flatShading: false
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    const leafAngle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
    const leafHeight = baseLength * (0.55 + (i / 3) * 0.35);
    leaf.position.set(
      Math.cos(leafAngle) * 0.04,
      leafHeight,
      Math.sin(leafAngle) * 0.04
    );
    leaf.rotation.y = leafAngle + Math.random() * 0.5;
    leaf.rotation.x = (Math.random() - 0.5) * 0.5;
    leaf.rotation.z = (Math.random() - 0.5) * 0.4;
    leaf.visible = false;
    bendGroup.add(leaf);
    leaves.push(leaf);
  }

  return {
    mesh: branch,
    pivot,
    baseBendAngle: bendAngle,
    baseHeightRatio: heightRatio,
    baseLength,
    baseAngle: yAngle,
    bud,
    leaves
  };
}

export function createPlant(): PlantObject {
  const group = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.18, 3, 12);
  const trunkMaterial = createGradientMaterial('#90EE90', '#228B22');
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const branches: BranchData[] = [];
  const totalBranchCount = 7;
  const baseBranchLength = 1.5;
  const branchRadius = 0.05;

  const branchConfigs = [
    { heightRatio: 0.45, angle: 0, bendAngle: 0.7, length: 1.6 },
    { heightRatio: 0.6, angle: Math.PI * 2 / 3, bendAngle: 0.9, length: 1.4 },
    { heightRatio: 0.75, angle: Math.PI * 4 / 3, bendAngle: 0.8, length: 1.3 },
    { heightRatio: 0.55, angle: Math.PI / 4, bendAngle: 0.75, length: 1.5 },
    { heightRatio: 0.7, angle: Math.PI * 5 / 4, bendAngle: 0.85, length: 1.2 },
    { heightRatio: 0.5, angle: Math.PI * 3 / 2, bendAngle: 0.65, length: 1.4 },
    { heightRatio: 0.65, angle: Math.PI / 2, bendAngle: 0.95, length: 1.3 }
  ];

  branchConfigs.forEach((config) => {
    const branch = createBranch(
      config.length,
      branchRadius,
      config.bendAngle,
      config.heightRatio,
      config.angle,
      '#98FB98',
      '#2E8B57'
    );
    group.add(branch.pivot);
    branches.push(branch);
  });

  const initialParams: EnvironmentParams = {
    light: 50,
    water: 60,
    nutrients: 40,
    rotationSpeed: 0.005
  };

  const plant: PlantObject = {
    group,
    trunk,
    branches,
    params: { ...initialParams },
    targetParams: { ...initialParams },
    animating: false,
    animationStartTime: 0,
    animationDuration: 3000,
    startParams: { ...initialParams }
  };

  applyParams(plant, initialParams);

  return plant;
}

function applyParams(plant: PlantObject, params: EnvironmentParams): void {
  const lightFactor = params.light / 100;
  const waterFactor = params.water / 100;
  const nutrientFactor = params.nutrients / 100;

  const baseRadius = 0.15;
  const maxRadiusIncrease = 0.12;
  const trunkRadius = baseRadius + maxRadiusIncrease * lightFactor;
  (plant.trunk.geometry as THREE.CylinderGeometry).dispose();
  const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, 3, 12);
  plant.trunk.geometry = trunkGeometry;

  const bendAmount = lightFactor * 15 * (Math.PI / 180);
  plant.group.rotation.z = bendAmount;

  const topLight = hexToColor('#90EE90');
  const topDark = hexToColor('#32CD32');
  const bottomLight = hexToColor('#228B22');
  const bottomDark = hexToColor('#006400');

  const currentTop = lerpColor(topLight, topDark, nutrientFactor);
  const currentBottom = lerpColor(bottomLight, bottomDark, nutrientFactor);

  (plant.trunk.material as THREE.MeshStandardMaterial).map?.dispose();
  (plant.trunk.material as THREE.MeshStandardMaterial).dispose();
  plant.trunk.material = createGradientMaterial(
    '#' + currentTop.getHexString(),
    '#' + currentBottom.getHexString()
  );

  const visibleCount = Math.max(2, Math.min(4, Math.round(2 + (waterFactor * 2))));

  plant.branches.forEach((branchData, index) => {
    if (index < visibleCount) {
      branchData.pivot.visible = true;
      const currentScale = branchData.pivot.scale.x;
      const targetScale = 1;
      const newScale = lerp(currentScale, targetScale, 0.1);
      branchData.pivot.scale.setScalar(newScale);
    } else {
      const currentScale = branchData.pivot.scale.x;
      const targetScale = 0;
      const newScale = lerp(currentScale, targetScale, 0.1);
      branchData.pivot.scale.setScalar(newScale);
      if (newScale < 0.01) {
        branchData.pivot.visible = false;
      }
    }

    if (branchData.pivot.visible) {
      const stretchFactor = 1 + waterFactor * 0.5;
      const newLength = branchData.baseLength * stretchFactor;

      (branchData.mesh.geometry as THREE.CylinderGeometry).dispose();
      const branchGeometry = new THREE.CylinderGeometry(
        0.035 * stretchFactor,
        0.05 * stretchFactor,
        newLength,
        8
      );
      branchData.mesh.geometry = branchGeometry;
      branchData.mesh.position.y = newLength / 2;

      const spreadAngle = branchData.baseBendAngle * (1 + waterFactor * 0.3);
      const bendGroup = branchData.pivot.children[0] as THREE.Group;
      bendGroup.rotation.z = spreadAngle;

      if (branchData.bud) {
        branchData.bud.position.y = newLength;
        branchData.bud.visible = waterFactor > 0.3;
        const budScale = 0.4 + waterFactor * 1.6;
        branchData.bud.scale.setScalar(budScale);
      }

      const leavesVisible = nutrientFactor > 0.2;
      const leafColor = lerpColor(
        hexToColor('#90EE90'),
        hexToColor('#228B22'),
        nutrientFactor
      );
      branchData.leaves.forEach((leaf, leafIndex) => {
        leaf.visible = leavesVisible;
        const leafHeight = newLength * (0.55 + (leafIndex / 3) * 0.35);
        leaf.position.y = leafHeight;
        const leafScale = 0.5 + nutrientFactor * 1.5;
        leaf.scale.setScalar(leafScale);
        (leaf.material as THREE.MeshPhongMaterial).color.copy(leafColor);
      });

      const bTop = lerpColor(hexToColor('#98FB98'), hexToColor('#32CD32'), nutrientFactor);
      const bBottom = lerpColor(hexToColor('#2E8B57'), hexToColor('#006400'), nutrientFactor);
      (branchData.mesh.material as THREE.MeshStandardMaterial).map?.dispose();
      (branchData.mesh.material as THREE.MeshStandardMaterial).dispose();
      branchData.mesh.material = createGradientMaterial(
        '#' + bTop.getHexString(),
        '#' + bBottom.getHexString()
      );
    }
  });
}

export function setTargetParams(plant: PlantObject, params: EnvironmentParams): void {
  plant.startParams = { ...plant.params };
  plant.targetParams = { ...params };
  plant.animating = true;
  plant.animationStartTime = performance.now();
  plant.animationDuration = 3000 + Math.random() * 2000;
}

export function updatePlant(plant: PlantObject, deltaTime: number): void {
  plant.group.rotation.y += plant.params.rotationSpeed;

  if (plant.animating) {
    const elapsed = performance.now() - plant.animationStartTime;
    const t = Math.min(elapsed / plant.animationDuration, 1);
    const easedT = easeOut(t);

    plant.params.light = lerp(plant.startParams.light, plant.targetParams.light, easedT);
    plant.params.water = lerp(plant.startParams.water, plant.targetParams.water, easedT);
    plant.params.nutrients = lerp(
      plant.startParams.nutrients,
      plant.targetParams.nutrients,
      easedT
    );
    plant.params.rotationSpeed = lerp(
      plant.startParams.rotationSpeed,
      plant.targetParams.rotationSpeed,
      easedT
    );

    applyParams(plant, plant.params);

    if (t >= 1) {
      plant.animating = false;
    }
  }
}

export function getPlantHeight(plant: PlantObject): number {
  const trunkHeight = 3;
  let totalBranchLength = 0;

  plant.branches.forEach((branch) => {
    if (branch.pivot.visible) {
      const length = (branch.mesh.geometry as THREE.CylinderGeometry).parameters.height;
      totalBranchLength += length;
    }
  });

  return trunkHeight + totalBranchLength;
}
