import * as THREE from 'three';
import { BuildingType, BuildingParams, MORANDI_COLORS } from '@/types';

export class BuildingFactory {
  private materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();

  private getMaterial(color: string): THREE.MeshStandardMaterial {
    if (!this.materialCache.has(color)) {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.7,
        metalness: 0.1
      });
      this.materialCache.set(color, material);
    }
    return this.materialCache.get(color)!;
  }

  getRandomColor(): string {
    return MORANDI_COLORS[Math.floor(Math.random() * MORANDI_COLORS.length)];
  }

  getDefaultSize(type: BuildingType): { w: number; h: number; d: number } {
    switch (type) {
      case BuildingType.RESIDENTIAL:
        return { w: 12, h: 25 + Math.random() * 20, d: 12 };
      case BuildingType.OFFICE:
        return { w: 15, h: 40 + Math.random() * 40, d: 15 };
      case BuildingType.HOTEL:
        return { w: 18, h: 30 + Math.random() * 25, d: 14 };
      case BuildingType.TV_TOWER:
        return { w: 6, h: 70 + Math.random() * 30, d: 6 };
      case BuildingType.CHURCH:
        return { w: 14, h: 35 + Math.random() * 10, d: 20 };
      case BuildingType.MONUMENT:
        return { w: 8, h: 20 + Math.random() * 15, d: 8 };
      default:
        return { w: 10, h: 20, d: 10 };
    }
  }

  createMesh(params: BuildingParams): THREE.Group {
    const group = new THREE.Group();
    const { w, h, d } = params.size;
    const material = this.getMaterial(params.color);

    switch (params.type) {
      case BuildingType.RESIDENTIAL:
        this.createResidential(group, material, w, h, d);
        break;
      case BuildingType.OFFICE:
        this.createOffice(group, material, w, h, d);
        break;
      case BuildingType.HOTEL:
        this.createHotel(group, material, w, h, d);
        break;
      case BuildingType.TV_TOWER:
        this.createTVTower(group, material, w, h, d);
        break;
      case BuildingType.CHURCH:
        this.createChurch(group, material, w, h, d);
        break;
      case BuildingType.MONUMENT:
        this.createMonument(group, material, w, h, d);
        break;
      default:
        this.createResidential(group, material, w, h, d);
    }

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    group.position.set(params.position.x, params.position.y, params.position.z);
    group.rotation.y = params.rotationY;
    group.userData = { buildingId: params.id, params: { ...params } };

    return group;
  }

  private createResidential(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const floors = Math.floor(h / 3.5);
    const floorHeight = h / floors;

    for (let i = 0; i < floors; i++) {
      const geo = new THREE.BoxGeometry(w * (0.9 + Math.random() * 0.1), floorHeight * 0.95, d * (0.9 + Math.random() * 0.1));
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.y = i * floorHeight + floorHeight / 2;
      group.add(mesh);
    }

    const roofGeo = new THREE.CylinderGeometry(w * 0.1, w * 0.15, 3, 4);
    const roof = new THREE.Mesh(roofGeo, material);
    roof.position.y = h + 1.5;
    group.add(roof);
  }

  private createOffice(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const main = new THREE.Mesh(mainGeo, material);
    main.position.y = h / 2;
    group.add(main);

    const topGeo = new THREE.BoxGeometry(w * 0.6, h * 0.08, d * 0.6);
    const top = new THREE.Mesh(topGeo, material);
    top.position.y = h + h * 0.04;
    group.add(top);

    const antennaGeo = new THREE.CylinderGeometry(0.3, 0.3, h * 0.1, 8);
    const antenna = new THREE.Mesh(antennaGeo, material);
    antenna.position.y = h + h * 0.08 + h * 0.05;
    group.add(antenna);
  }

  private createHotel(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const mainGeo = new THREE.BoxGeometry(w, h * 0.85, d);
    const main = new THREE.Mesh(mainGeo, material);
    main.position.y = h * 0.85 / 2;
    group.add(main);

    const baseGeo = new THREE.BoxGeometry(w * 1.2, h * 0.15, d * 1.1);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = h * 0.075;
    group.add(base);

    const topGeo = new THREE.BoxGeometry(w * 0.5, h * 0.08, d * 0.5);
    const top = new THREE.Mesh(topGeo, material);
    top.position.y = h * 0.85 + h * 0.04;
    group.add(top);
  }

  private createTVTower(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const baseGeo = new THREE.CylinderGeometry(w * 0.8, w * 1.2, h * 0.1, 8);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = h * 0.05;
    group.add(base);

    const shaftGeo = new THREE.CylinderGeometry(w * 0.25, w * 0.5, h * 0.5, 8);
    const shaft = new THREE.Mesh(shaftGeo, material);
    shaft.position.y = h * 0.1 + h * 0.25;
    group.add(shaft);

    const dishGeo = new THREE.SphereGeometry(w * 0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dish = new THREE.Mesh(dishGeo, material);
    dish.position.y = h * 0.6;
    dish.rotation.x = Math.PI;
    group.add(dish);

    const upperGeo = new THREE.CylinderGeometry(w * 0.15, w * 0.25, h * 0.25, 8);
    const upper = new THREE.Mesh(upperGeo, material);
    upper.position.y = h * 0.6 + h * 0.125;
    group.add(upper);

    const antennaGeo = new THREE.CylinderGeometry(0.2, 0.3, h * 0.15, 6);
    const antenna = new THREE.Mesh(antennaGeo, material);
    antenna.position.y = h * 0.85 + h * 0.075;
    group.add(antenna);
  }

  private createChurch(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const mainGeo = new THREE.BoxGeometry(w, h * 0.5, d);
    const main = new THREE.Mesh(mainGeo, material);
    main.position.y = h * 0.25;
    group.add(main);

    const roofGeo = new THREE.ConeGeometry(w * 0.8, h * 0.2, 4);
    const roof = new THREE.Mesh(roofGeo, material);
    roof.position.y = h * 0.5 + h * 0.1;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    const towerGeo = new THREE.CylinderGeometry(w * 0.2, w * 0.25, h * 0.5, 8);
    const tower = new THREE.Mesh(towerGeo, material);
    tower.position.set(w * 0.35, h * 0.25, -d * 0.3);
    group.add(tower);

    const spireGeo = new THREE.ConeGeometry(w * 0.2, h * 0.3, 8);
    const spire = new THREE.Mesh(spireGeo, material);
    spire.position.set(w * 0.35, h * 0.5 + h * 0.15, -d * 0.3);
    group.add(spire);

    const crossGeo1 = new THREE.BoxGeometry(0.8, 3, 0.8);
    const cross1 = new THREE.Mesh(crossGeo1, material);
    cross1.position.set(w * 0.35, h * 0.8 + 1.5, -d * 0.3);
    group.add(cross1);

    const crossGeo2 = new THREE.BoxGeometry(2, 0.8, 0.8);
    const cross2 = new THREE.Mesh(crossGeo2, material);
    cross2.position.set(w * 0.35, h * 0.8 + 2, -d * 0.3);
    group.add(cross2);
  }

  private createMonument(group: THREE.Group, material: THREE.MeshStandardMaterial, w: number, h: number, d: number): void {
    const baseGeo = new THREE.BoxGeometry(w * 1.5, h * 0.1, d * 1.5);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = h * 0.05;
    group.add(base);

    const base2Geo = new THREE.BoxGeometry(w * 1.2, h * 0.08, d * 1.2);
    const base2 = new THREE.Mesh(base2Geo, material);
    base2.position.y = h * 0.1 + h * 0.04;
    group.add(base2);

    const pillarGeo = new THREE.BoxGeometry(w * 0.8, h * 0.65, d * 0.8);
    const pillar = new THREE.Mesh(pillarGeo, material);
    pillar.position.y = h * 0.18 + h * 0.325;
    group.add(pillar);

    const topGeo = new THREE.ConeGeometry(w * 0.6, h * 0.15, 4);
    const top = new THREE.Mesh(topGeo, material);
    top.position.y = h * 0.18 + h * 0.65 + h * 0.075;
    top.rotation.y = Math.PI / 4;
    group.add(top);

    const statueGeo = new THREE.BoxGeometry(w * 0.4, h * 0.12, d * 0.4);
    const statue = new THREE.Mesh(statueGeo, material);
    statue.position.y = h * 0.18 + h * 0.65 + h * 0.15 + h * 0.06;
    group.add(statue);
  }
}
