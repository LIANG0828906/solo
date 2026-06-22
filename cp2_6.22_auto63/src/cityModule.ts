import * as THREE from 'three';
import type { CityConfig } from './types';

export class CityModule {
  private scene: THREE.Scene | null = null;
  private buildings: THREE.Mesh[] = [];
  private config: CityConfig = { buildingCount: 12, areaSize: 120 };

  initCity(scene: THREE.Scene, windDirection: number): void {
    this.scene = scene;

    const groundGeo = new THREE.PlaneGeometry(this.config.areaSize * 1.5, this.config.areaSize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1a2a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(this.config.areaSize * 1.5, 30, 0x1e3a5f, 0x0d1f35);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.01;
    scene.add(grid);

    this.generateBuildings(windDirection);
  }

  private generateBuildings(windDirection: number): void {
    if (!this.scene) return;

    const positions: { x: number; z: number }[] = [];
    const minDist = 16;

    for (let i = 0; i < this.config.buildingCount; i++) {
      let x = 0, z = 0, valid = false;
      let attempts = 0;

      while (!valid && attempts < 100) {
        x = (Math.random() - 0.5) * this.config.areaSize * 0.85;
        z = (Math.random() - 0.5) * this.config.areaSize * 0.85;
        valid = positions.every(p => Math.hypot(p.x - x, p.z - z) > minDist);
        attempts++;
      }
      if (!valid) continue;
      positions.push({ x, z });

      const isCombo = Math.random() > 0.55;
      const group = new THREE.Group();

      if (isCombo) {
        const segments = 2 + Math.floor(Math.random() * 2);
        for (let s = 0; s < segments; s++) {
          const w = 4 + Math.random() * 5;
          const d = 4 + Math.random() * 5;
          const h = 10 + Math.random() * 35;
          const geo = new THREE.BoxGeometry(w, h, d);
          const mat = this.createBuildingMaterial(h, windDirection);
          const m = new THREE.Mesh(geo, mat);
          m.position.set(
            (s - segments / 2) * (w + 1) + (Math.random() - 0.5) * 2,
            h / 2,
            (Math.random() - 0.5) * 2
          );
          m.castShadow = true;
          m.receiveShadow = true;
          group.add(m);
          this.buildings.push(m);
        }
      } else {
        const w = 6 + Math.random() * 8;
        const d = 6 + Math.random() * 8;
        const h = 15 + Math.random() * 50;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = this.createBuildingMaterial(h, windDirection);
        const m = new THREE.Mesh(geo, mat);
        m.position.y = h / 2;
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
        this.buildings.push(m);
      }

      group.position.set(x, 0, z);
      this.scene.add(group);
    }
  }

  private createBuildingMaterial(height: number, windDir: number): THREE.MeshPhysicalMaterial {
    const t = Math.min(1, height / 60);
    const hue = THREE.MathUtils.lerp(0.52, 0.62, t);
    const windShift = (Math.sin(windDir * Math.PI / 180) * 0.02);
    const color = new THREE.Color().setHSL(
      THREE.MathUtils.clamp(hue + windShift, 0.48, 0.68),
      0.55,
      THREE.MathUtils.lerp(0.18, 0.32, t)
    );

    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.35,
      metalness: 0.45,
      transmission: 0.15,
      thickness: 0.8,
      transparent: true,
      opacity: 0.88,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.8,
    });
  }

  updateWindHighlight(windDirection: number): void {
    if (this.buildings.length === 0) return;

    this.buildings.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const currentColor = mat.color;
      const hsl = { h: 0, s: 0, l: 0 };
      currentColor.getHSL(hsl);
      const windShift = (Math.sin(windDirection * Math.PI / 180) * 0.02);
      mat.color.setHSL(
        THREE.MathUtils.clamp(hsl.h + windShift, 0.48, 0.68),
        hsl.s,
        hsl.l
      );
    });
  }

  getBuildings(): THREE.Mesh[] {
    return this.buildings;
  }

  getAreaSize(): number {
    return this.config.areaSize;
  }
}

export const cityModule = new CityModule();
