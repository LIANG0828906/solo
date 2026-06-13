import * as THREE from 'three';
import { BuildingData } from './SceneManager';

export class BuildingGenerator {
  private scene: THREE.Scene;
  private buildingGroup: THREE.Group | null = null;
  private originalBuildingData: Map<string, { color: THREE.Color }> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public generateBuildings(buildingData: BuildingData[], hueShift: number = 0): THREE.Group {
    if (this.buildingGroup) {
      this.scene.remove(this.buildingGroup);
      this.disposeGroup(this.buildingGroup);
    }

    this.originalBuildingData.clear();
    this.buildingGroup = new THREE.Group();

    buildingData.forEach((data) => {
      const building = this.createBuilding(data, hueShift);
      this.buildingGroup!.add(building);
    });

    this.scene.add(this.buildingGroup);
    return this.buildingGroup;
  }

  private applyHueShift(baseColor: THREE.Color, hueShift: number): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    hsl.h = (hsl.h + hueShift / 360 + 1) % 1;
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  private createBuilding(data: BuildingData, hueShift: number): THREE.Group {
    const group = new THREE.Group();

    const baseColor = new THREE.Color(data.color);
    const originalColor = baseColor.clone();
    this.originalBuildingData.set(data.id, { color: originalColor });

    const adjustedColor = this.applyHueShift(baseColor, hueShift);

    const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    const material = new THREE.MeshStandardMaterial({
      color: adjustedColor,
      metalness: 0.3,
      roughness: 0.7,
      emissive: new THREE.Color(data.emissive),
      emissiveIntensity: data.emissiveIntensity
    });

    const buildingMesh = new THREE.Mesh(geometry, material);
    buildingMesh.position.y = data.height / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    buildingMesh.userData.buildingId = data.id;
    group.add(buildingMesh);

    const topGlowGroup = this.createTopGlowEdge(data.width, data.height, data.depth);
    group.add(topGlowGroup);

    const allEdgeGeometry = new THREE.EdgesGeometry(geometry);
    const allEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.3
    });
    const allEdges = new THREE.LineSegments(allEdgeGeometry, allEdgeMaterial);
    allEdges.position.y = data.height / 2;
    group.add(allEdges);

    const windowRows = Math.floor(data.height / 8);
    const windowCols = Math.max(2, Math.floor(data.width / 3));

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.3) {
          const windowLight = this.createWindowLight(
            data.width,
            data.height,
            data.depth,
            col,
            row,
            windowCols,
            windowRows
          );
          group.add(windowLight);
        }
      }
    }

    group.position.set(data.x, 0, data.z);

    return group;
  }

  private createTopGlowEdge(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    const y = height;

    const halfW = width / 2;
    const halfD = depth / 2;

    const cornerPoints = [
      new THREE.Vector3(-halfW, y, -halfD),
      new THREE.Vector3(halfW, y, -halfD),
      new THREE.Vector3(halfW, y, halfD),
      new THREE.Vector3(-halfW, y, halfD),
      new THREE.Vector3(-halfW, y, -halfD)
    ];

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(cornerPoints);
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const glowLine = new THREE.Line(lineGeometry, glowMaterial);
    group.add(glowLine);

    const glowTubePoints = cornerPoints.slice(0, 4);
    const tubeCurve = new THREE.CatmullRomCurve3(
      [...glowTubePoints, glowTubePoints[0]],
      true,
      'catmullrom',
      0
    );
    const tubeGeometry = new THREE.TubeGeometry(tubeCurve, 32, 0.08, 8, true);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.6
    });
    const glowTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    group.add(glowTube);

    const pillarHeight = 0.5;
    const pillarPositions = [
      new THREE.Vector3(-halfW, y - pillarHeight / 2, -halfD),
      new THREE.Vector3(halfW, y - pillarHeight / 2, -halfD),
      new THREE.Vector3(halfW, y - pillarHeight / 2, halfD),
      new THREE.Vector3(-halfW, y - pillarHeight / 2, halfD)
    ];

    pillarPositions.forEach((pos) => {
      const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.15, pillarHeight, 8);
      const pillarMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.copy(pos);
      group.add(pillar);
    });

    return group;
  }

  private createWindowLight(
    buildingWidth: number,
    buildingHeight: number,
    buildingDepth: number,
    col: number,
    row: number,
    totalCols: number,
    totalRows: number
  ): THREE.Mesh {
    const windowWidth = buildingWidth / (totalCols + 1) * 0.6;
    const windowHeight = buildingHeight / (totalRows + 1) * 0.4;

    const geometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const material = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xffeedd : 0xaaddff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const window = new THREE.Mesh(geometry, material);

    const x = -buildingWidth / 2 + (col + 1) * (buildingWidth / (totalCols + 1));
    const y = (row + 1) * (buildingHeight / (totalRows + 1));

    window.position.set(x, y, buildingDepth / 2 + 0.01);

    return window;
  }

  public updateBuildingColors(hueShift: number, transitionProgress: number = 1): void {
    if (!this.buildingGroup) return;

    this.buildingGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
        const material = child.material as THREE.MeshStandardMaterial;
        const buildingId = child.userData.buildingId;
        
        if (buildingId && this.originalBuildingData.has(buildingId)) {
          const originalColor = this.originalBuildingData.get(buildingId)!.color;
          const targetColor = this.applyHueShift(originalColor.clone(), hueShift);
          material.color.lerpColors(originalColor, targetColor, transitionProgress);
        }
      }
    });
  }

  public updateEmissiveIntensity(intensity: number): void {
    if (!this.buildingGroup) return;

    this.buildingGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissiveIntensity = intensity;
        }
      }
    });
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  public dispose() {
    if (this.buildingGroup) {
      this.scene.remove(this.buildingGroup);
      this.disposeGroup(this.buildingGroup);
      this.buildingGroup = null;
    }
    this.originalBuildingData.clear();
  }
}
