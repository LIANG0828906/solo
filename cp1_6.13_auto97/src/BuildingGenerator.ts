import * as THREE from 'three';
import { BuildingData } from './SceneManager';

export class BuildingGenerator {
  private scene: THREE.Scene;
  private buildingGroup: THREE.Group | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  public generateBuildings(buildingData: BuildingData[], hueShift: number = 0): THREE.Group {
    if (this.buildingGroup) {
      this.scene.remove(this.buildingGroup);
      this.disposeGroup(this.buildingGroup);
    }
    
    this.buildingGroup = new THREE.Group();
    
    const mergedGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    buildingData.forEach((data) => {
      const building = this.createBuilding(data, hueShift);
      this.buildingGroup!.add(building);
    });
    
    this.scene.add(this.buildingGroup);
    return this.buildingGroup;
  }
  
  private createBuilding(data: BuildingData, hueShift: number): THREE.Group {
    const group = new THREE.Group();
    
    const baseColor = new THREE.Color(data.color);
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    hsl.h = (hsl.h + hueShift / 360 + 1) % 1;
    const adjustedColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
    
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
    group.add(buildingMesh);
    
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.y = data.height / 2;
    group.add(edges);
    
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
  
  public updateBuildingColors(hueShift: number) {
    if (!this.buildingGroup) return;
    
    this.buildingGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
        const material = child.material as THREE.MeshStandardMaterial;
        const color = material.color;
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
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
      if (child instanceof THREE.LineSegments) {
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
  }
}
