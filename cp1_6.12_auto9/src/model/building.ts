import * as THREE from 'three';
import * as d3 from 'd3';
import type { EnergyType } from './data';

export interface RoomInfo {
  id: string;
  floor: number;
  name: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  center: THREE.Vector3;
}

interface RoomTarget {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

export class BuildingModel {
  group = new THREE.Group();
  rooms = new Map<string, THREE.Mesh>();
  roomInfo = new Map<string, RoomInfo>();
  anomalyMarkers = new Map<string, THREE.Mesh>();
  private targets = new Map<string, RoomTarget>();
  private floorGroups = new Map<number, THREE.Group>();

  private readonly colorScale = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(['#00e5ff', '#7dd3fc', '#ff6b35'])
    .clamp(true);

  readonly FLOOR_HEIGHT = 3.2;
  readonly ROOM_W = 4;
  readonly ROOM_D = 4;
  readonly GAP = 0.3;

  get floorCount(): number {
    return this.floorGroups.size;
  }

  generate(floors: number, roomsPerFloor: number): RoomInfo[] {
    this.group.clear();
    this.rooms.clear();
    this.roomInfo.clear();
    this.targets.clear();
    this.floorGroups.clear();
    this.anomalyMarkers.clear();

    const cols = Math.ceil(Math.sqrt(roomsPerFloor));
    const rows = Math.ceil(roomsPerFloor / cols);
    const totalW = cols * (this.ROOM_W + this.GAP) - this.GAP;
    const totalD = rows * (this.ROOM_D + this.GAP) - this.GAP;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(totalW * 3, totalD * 3),
      new THREE.MeshStandardMaterial({
        color: 0x0a1420,
        roughness: 0.9,
        metalness: 0.1
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grid = new THREE.GridHelper(Math.max(totalW, totalD) * 2.5, 40, 0x1e3a5f, 0x12263d);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.6;
    grid.position.y = 0.001;
    this.group.add(grid);

    const infoList: RoomInfo[] = [];
    for (let f = 0; f < floors; f++) {
      const floorGroup = new THREE.Group();
      floorGroup.position.y = f * this.FLOOR_HEIGHT;
      this.floorGroups.set(f, floorGroup);
      this.group.add(floorGroup);

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(totalW + 1.2, 0.2, totalD + 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x172a42,
          roughness: 0.7,
          metalness: 0.2,
          transparent: true,
          opacity: 0.9
        })
      );
      slab.position.y = -0.1;
      floorGroup.add(slab);

      let roomIndex = 0;
      outer: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (roomIndex >= roomsPerFloor) break outer;
          const id = `F${f + 1}-R${String(roomIndex + 1).padStart(2, '0')}`;
          const x = c * (this.ROOM_W + this.GAP) - totalW / 2 + this.ROOM_W / 2;
          const z = r * (this.ROOM_D + this.GAP) - totalD / 2 + this.ROOM_D / 2;

          const geom = new THREE.BoxGeometry(this.ROOM_W, this.FLOOR_HEIGHT * 0.85, this.ROOM_D);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.15,
            roughness: 0.35,
            metalness: 0.4,
            transparent: true,
            opacity: 0.88
          });
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(x, this.FLOOR_HEIGHT * 0.45, z);
          mesh.userData.roomId = id;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geom),
            new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 })
          );
          mesh.add(edges);

          const info: RoomInfo = {
            id,
            floor: f,
            name: `${f + 1}层-${roomIndex + 1}号房间`,
            position: mesh.position.clone(),
            size: new THREE.Vector3(this.ROOM_W, this.FLOOR_HEIGHT * 0.85, this.ROOM_D),
            center: new THREE.Vector3(x, f * this.FLOOR_HEIGHT + this.FLOOR_HEIGHT * 0.45, z)
          };

          this.rooms.set(id, mesh);
          this.roomInfo.set(id, info);
          this.targets.set(id, {
            color: new THREE.Color('#00e5ff'),
            emissive: new THREE.Color('#00e5ff'),
            emissiveIntensity: 0.15
          });
          floorGroup.add(mesh);
          infoList.push(info);
          roomIndex++;
        }
      }
    }
    return infoList;
  }

  updateRoomEnergy(roomId: string, normalizedValue: number): void {
    const mesh = this.rooms.get(roomId);
    const target = this.targets.get(roomId);
    if (!mesh || !target) return;
    const colorHex = this.colorScale(normalizedValue);
    target.color.set(colorHex);
    target.emissive.set(colorHex);
    target.emissiveIntensity = 0.1 + normalizedValue * 0.55;
  }

  setRoomAnomaly(roomId: string, anomaly: boolean): void {
    const mesh = this.rooms.get(roomId);
    if (!mesh) return;
    let marker = this.anomalyMarkers.get(roomId);
    if (anomaly && !marker) {
      const geom = new THREE.SphereGeometry(0.3, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        transparent: true,
        opacity: 0.95
      });
      marker = new THREE.Mesh(geom, mat);
      marker.position.copy(mesh.position);
      marker.position.y += this.FLOOR_HEIGHT * 0.55;
      mesh.parent?.add(marker);
      this.anomalyMarkers.set(roomId, marker);
    } else if (!anomaly && marker) {
      marker.parent?.remove(marker);
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
      this.anomalyMarkers.delete(roomId);
    }
  }

  highlightRoom(roomId: string | null): void {
    this.rooms.forEach((mesh, id) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (id === roomId) {
        mat.opacity = 1;
        mat.emissiveIntensity = Math.min(1, (this.targets.get(id)?.emissiveIntensity ?? 0.2) + 0.3);
      } else {
        mat.opacity = 0.88;
      }
    });
  }

  getRoomByIntersect(intersect: THREE.Intersection): string | null {
    let obj: THREE.Object3D | null = intersect.object;
    while (obj) {
      if (obj.userData?.roomId) return obj.userData.roomId as string;
      obj = obj.parent;
    }
    return null;
  }

  setFloorVisibility(floor: number | 'all'): void {
    this.floorGroups.forEach((g, f) => {
      g.visible = floor === 'all' || f === floor;
    });
  }

  update(delta: number, time: number): void {
    this.rooms.forEach((mesh, id) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const target = this.targets.get(id);
      if (!target) return;
      mat.color.lerp(target.color, Math.min(1, delta * 4));
      mat.emissive.lerp(target.emissive, Math.min(1, delta * 4));
      const curI = mat.emissiveIntensity;
      mat.emissiveIntensity = curI + (target.emissiveIntensity - curI) * Math.min(1, delta * 4);
    });
    this.anomalyMarkers.forEach(marker => {
      const s = 1 + Math.sin(time * 5) * 0.35;
      marker.scale.setScalar(s);
      const mat = marker.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.abs(Math.sin(time * 5)) * 0.5;
    });
  }

  getBuildingCenter(): THREE.Vector3 {
    let sum = new THREE.Vector3();
    let n = 0;
    this.roomInfo.forEach(info => {
      sum.add(info.center);
      n++;
    });
    return n > 0 ? sum.divideScalar(n) : new THREE.Vector3();
  }

  getBuildingSize(): THREE.Vector3 {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    this.roomInfo.forEach(info => {
      minX = Math.min(minX, info.center.x - info.size.x / 2);
      maxX = Math.max(maxX, info.center.x + info.size.x / 2);
      minY = Math.min(minY, info.center.y - info.size.y / 2);
      maxY = Math.max(maxY, info.center.y + info.size.y / 2);
      minZ = Math.min(minZ, info.center.z - info.size.z / 2);
      maxZ = Math.max(maxZ, info.center.z + info.size.z / 2);
    });
    return new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);
  }
}
