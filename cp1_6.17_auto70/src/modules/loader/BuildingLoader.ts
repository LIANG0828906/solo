import * as THREE from 'three';

export interface BuildingData {
  floors: number;
  floorHeight: number;
  slabThickness: number;
  width: number;
  depth: number;
  windows: WindowData[];
}

export interface WindowData {
  floor: number;
  position: [number, number, number];
  size: [number, number];
}

export interface ControlPoint {
  mesh: THREE.Mesh;
  floorIndex: number;
  cornerIndex: number;
  originalPosition: THREE.Vector3;
}

const DEFAULT_BUILDING: BuildingData = {
  floors: 6,
  floorHeight: 3.5,
  slabThickness: 0.2,
  width: 20,
  depth: 12,
  windows: [],
};

function generateWindows(data: BuildingData): WindowData[] {
  const windows: WindowData[] = [];
  const winWidth = 2;
  const winHeight = 2;
  const winSpacingX = 4;
  const winBottomOffset = 1.2;
  for (let floor = 0; floor < data.floors; floor++) {
    const y = floor * data.floorHeight + winBottomOffset;
    for (let side = 0; side < 4; side++) {
      const count = side < 2 ? Math.floor(data.width / winSpacingX) : Math.floor(data.depth / winSpacingX);
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * winSpacingX;
        let pos: [number, number, number];
        if (side === 0) pos = [offset, y, data.depth / 2 + 0.01];
        else if (side === 1) pos = [offset, y, -data.depth / 2 - 0.01];
        else if (side === 2) pos = [data.width / 2 + 0.01, y, offset];
        else pos = [-data.width / 2 - 0.01, y, offset];
        windows.push({ floor, position: pos, size: [winWidth, winHeight] });
      }
    }
  }
  return windows;
}

export class BuildingLoader {
  private controlPoints: ControlPoint[] = [];
  private buildingGroup: THREE.Group | null = null;
  private floorGroups: THREE.Group[] = [];

  load(data: BuildingData = DEFAULT_BUILDING): THREE.Group {
    const merged = { ...data, windows: data.windows.length > 0 ? data.windows : generateWindows(data) };
    this.buildingGroup = new THREE.Group();
    this.buildingGroup.name = 'building';
    this.floorGroups = [];
    this.controlPoints = [];

    for (let i = 0; i < merged.floors; i++) {
      const t = i / Math.max(merged.floors - 1, 1);
      const floorGroup = new THREE.Group();
      floorGroup.name = `floor_${i}`;
      const topColor = new THREE.Color('#D4A373');
      const bottomColor = new THREE.Color('#8B5E3C');
      const floorColor = bottomColor.clone().lerp(topColor, t);
      const wallMaterial = new THREE.MeshPhongMaterial({
        color: floorColor,
        transparent: true,
        opacity: 1 - t * 0.15,
        side: THREE.DoubleSide,
      });
      const slabGeometry = new THREE.BoxGeometry(merged.width, merged.slabThickness, merged.depth);
      const slabMaterial = new THREE.MeshPhongMaterial({
        color: floorColor.clone().multiplyScalar(0.7),
        side: THREE.DoubleSide,
      });
      const slab = new THREE.Mesh(slabGeometry, slabMaterial);
      slab.position.y = i * merged.floorHeight;
      slab.castShadow = true;
      slab.receiveShadow = true;
      floorGroup.add(slab);

      const wallHeight = merged.floorHeight - merged.slabThickness;
      const wallY = i * merged.floorHeight + merged.slabThickness / 2 + wallHeight / 2;

      const frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(merged.width, wallHeight),
        wallMaterial
      );
      frontWall.position.set(0, wallY, merged.depth / 2);
      frontWall.castShadow = true;
      floorGroup.add(frontWall);

      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(merged.width, wallHeight),
        wallMaterial.clone()
      );
      backWall.position.set(0, wallY, -merged.depth / 2);
      backWall.rotation.y = Math.PI;
      backWall.castShadow = true;
      floorGroup.add(backWall);

      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(merged.depth, wallHeight),
        wallMaterial.clone()
      );
      leftWall.position.set(-merged.width / 2, wallY, 0);
      leftWall.rotation.y = -Math.PI / 2;
      leftWall.castShadow = true;
      floorGroup.add(leftWall);

      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(merged.depth, wallHeight),
        wallMaterial.clone()
      );
      rightWall.position.set(merged.width / 2, wallY, 0);
      rightWall.rotation.y = Math.PI / 2;
      rightWall.castShadow = true;
      floorGroup.add(rightWall);

      for (const win of merged.windows) {
        if (win.floor === i) {
          const winGeo = new THREE.PlaneGeometry(win.size[0], win.size[1]);
          const winMat = new THREE.MeshPhongMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            emissive: 0x112244,
            emissiveIntensity: 0.3,
          });
          const winMesh = new THREE.Mesh(winGeo, winMat);
          winMesh.position.set(win.position[0], win.position[1], win.position[2]);
          if (Math.abs(win.position[2]) > merged.depth / 2 - 0.1) {
            if (win.position[2] < 0) winMesh.rotation.y = Math.PI;
          } else {
            winMesh.rotation.y = win.position[0] > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          floorGroup.add(winMesh);
        }
      }

      this.buildingGroup!.add(floorGroup);
      this.floorGroups.push(floorGroup);
    }

    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(merged.width + 0.4, merged.slabThickness, merged.depth + 0.4),
      new THREE.MeshPhongMaterial({ color: 0x6b4226, side: THREE.DoubleSide })
    );
    roofSlab.position.y = merged.floors * merged.floorHeight;
    roofSlab.castShadow = true;
    this.buildingGroup!.add(roofSlab);

    this.createControlPoints(merged);

    return this.buildingGroup!;
  }

  private createControlPoints(data: BuildingData): void {
    const cpGeo = new THREE.SphereGeometry(0.4, 12, 12);
    const cpMat = new THREE.MeshPhongMaterial({
      color: 0x4a90d9,
      emissive: 0x2a5080,
      transparent: true,
      opacity: 0,
    });

    for (let i = 0; i <= data.floors; i++) {
      const y = i * data.floorHeight;
      const hw = data.width / 2;
      const hd = data.depth / 2;
      const corners: [number, number, number][] = [
        [-hw, y, -hd],
        [hw, y, -hd],
        [hw, y, hd],
        [-hw, y, hd],
      ];
      corners.forEach((pos, ci) => {
        const cp = new THREE.Mesh(cpGeo.clone(), cpMat.clone());
        cp.position.set(pos[0], pos[1], pos[2]);
        cp.name = `cp_${i}_${ci}`;
        cp.userData = { floorIndex: i, cornerIndex: ci, isControlPoint: true };
        this.controlPoints.push({
          mesh: cp,
          floorIndex: i,
          cornerIndex: ci,
          originalPosition: new THREE.Vector3(pos[0], pos[1], pos[2]),
        });
        this.buildingGroup!.add(cp);
      });
    }

    const roofCenterGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const roofCenterMat = new THREE.MeshPhongMaterial({
      color: 0xff9900,
      emissive: 0x664400,
      transparent: true,
      opacity: 0,
    });
    const roofCenter = new THREE.Mesh(roofCenterGeo, roofCenterMat);
    roofCenter.position.set(0, data.floors * data.floorHeight + 1, 0);
    roofCenter.name = 'cp_roof_center';
    roofCenter.userData = { isRoofCenter: true, isControlPoint: true };
    this.controlPoints.push({
      mesh: roofCenter,
      floorIndex: data.floors,
      cornerIndex: -1,
      originalPosition: roofCenter.position.clone(),
    });
    this.buildingGroup!.add(roofCenter);
  }

  setControlPointsVisible(visible: boolean): void {
    this.controlPoints.forEach((cp) => {
      const mat = cp.mesh.material as THREE.MeshPhongMaterial;
      mat.opacity = visible ? 0.8 : 0;
    });
  }

  getControlPoints(): ControlPoint[] {
    return this.controlPoints;
  }

  getBuildingGroup(): THREE.Group | null {
    return this.buildingGroup;
  }

  getFloorGroups(): THREE.Group[] {
    return this.floorGroups;
  }
}
