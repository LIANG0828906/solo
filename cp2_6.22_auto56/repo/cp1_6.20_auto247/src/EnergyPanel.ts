import * as THREE from 'three';

export interface EnergyPanelStats {
  totalArea: number;
  panelCount: number;
  dailyEnergy: number;
  roofArea: number;
  usableRoofArea: number;
}

export interface EnergyPanelResult {
  panels: THREE.Mesh[];
  stats: EnergyPanelStats;
  container: THREE.Group;
}

export const PANEL_WIDTH = 1.6;
export const PANEL_DEPTH = 1.0;
export const PANEL_THICKNESS = 0.02;
export const PANEL_EFFICIENCY = 0.18;

export function createEnergyPanels(
  roofWidth: number,
  roofDepth: number,
  roofHeight: number,
  density: number,
  averageSunHours: number
): EnergyPanelResult {
  const panels: THREE.Mesh[] = [];
  const container = new THREE.Group();
  container.name = 'SolarPanels';

  const roofArea = roofWidth * roofDepth;
  const margin = 0.5;
  const usableWidth = roofWidth - margin * 2;
  const usableDepth = roofDepth - margin * 2;
  const usableRoofArea = usableWidth * usableDepth;

  const panelGap = 0.15;
  const spacingX = PANEL_WIDTH + panelGap;
  const spacingZ = PANEL_DEPTH + panelGap;

  const maxPanelsX = Math.floor(usableWidth / spacingX);
  const maxPanelsZ = Math.floor(usableDepth / spacingZ);

  const densityFactor = density / 100;
  const effectivePanelsX = Math.max(1, Math.ceil(maxPanelsX * Math.sqrt(densityFactor)));
  const effectivePanelsZ = Math.max(1, Math.ceil(maxPanelsZ * Math.sqrt(densityFactor)));

  const panelMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1e88e5,
    roughness: 0.3,
    metalness: 0.7,
    transparent: true,
    opacity: 0.9,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    reflectivity: 0.8,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x37474f,
    roughness: 0.5,
    metalness: 0.8,
  });

  const totalWidthUsed = effectivePanelsX * spacingX - panelGap;
  const totalDepthUsed = effectivePanelsZ * spacingZ - panelGap;
  const startX = -totalWidthUsed / 2 + PANEL_WIDTH / 2;
  const startZ = -totalDepthUsed / 2 + PANEL_DEPTH / 2;

  for (let i = 0; i < effectivePanelsX; i++) {
    for (let j = 0; j < effectivePanelsZ; j++) {
      const panelGroup = new THREE.Group();

      const panelGeometry = new THREE.BoxGeometry(PANEL_WIDTH, PANEL_THICKNESS, PANEL_DEPTH);
      const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
      panelMesh.castShadow = true;
      panelMesh.receiveShadow = true;
      panelGroup.add(panelMesh);

      const frameThickness = 0.03;
      const frameHeight = 0.04;
      const frameY = PANEL_THICKNESS / 2 + frameHeight / 2;

      const frameTop = new THREE.Mesh(
        new THREE.BoxGeometry(PANEL_WIDTH + frameThickness * 2, frameHeight, frameThickness),
        frameMaterial
      );
      frameTop.position.set(0, frameY, PANEL_DEPTH / 2 + frameThickness / 2);
      panelGroup.add(frameTop);

      const frameBottom = frameTop.clone();
      frameBottom.position.set(0, frameY, -PANEL_DEPTH / 2 - frameThickness / 2);
      panelGroup.add(frameBottom);

      const frameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, frameHeight, PANEL_DEPTH),
        frameMaterial
      );
      frameLeft.position.set(-PANEL_WIDTH / 2 - frameThickness / 2, frameY, 0);
      panelGroup.add(frameLeft);

      const frameRight = frameLeft.clone();
      frameRight.position.set(PANEL_WIDTH / 2 + frameThickness / 2, frameY, 0);
      panelGroup.add(frameRight);

      const cellLinesMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      });

      for (let c = 1; c < 6; c++) {
        const cellLine = new THREE.Mesh(
          new THREE.BoxGeometry(PANEL_WIDTH - 0.05, 0.001, 0.005),
          cellLinesMaterial
        );
        cellLine.position.set(0, PANEL_THICKNESS / 2 + 0.001, -PANEL_DEPTH / 2 + (PANEL_DEPTH / 6) * c);
        panelGroup.add(cellLine);
      }

      for (let c = 1; c < 10; c++) {
        const cellLine = new THREE.Mesh(
          new THREE.BoxGeometry(0.005, 0.001, PANEL_DEPTH - 0.05),
          cellLinesMaterial
        );
        cellLine.position.set(-PANEL_WIDTH / 2 + (PANEL_WIDTH / 10) * c, PANEL_THICKNESS / 2 + 0.001, 0);
        panelGroup.add(cellLine);
      }

      const tiltAngle = 15;
      panelGroup.rotation.x = -deg2rad(tiltAngle);

      const xPos = startX + i * spacingX;
      const zPos = startZ + j * spacingZ;
      panelGroup.position.set(xPos, roofHeight + PANEL_THICKNESS, zPos);

      container.add(panelGroup);
      panels.push(panelMesh);
    }
  }

  const panelCount = effectivePanelsX * effectivePanelsZ;
  const totalArea = panelCount * PANEL_WIDTH * PANEL_DEPTH;
  const dailyEnergy = totalArea * averageSunHours * PANEL_EFFICIENCY;

  return {
    panels,
    container,
    stats: {
      totalArea: round2(totalArea),
      panelCount,
      dailyEnergy: round2(dailyEnergy),
      roofArea: round2(roofArea),
      usableRoofArea: round2(usableRoofArea),
    },
  };
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
