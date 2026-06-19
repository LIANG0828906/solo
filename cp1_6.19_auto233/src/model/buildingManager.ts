import type { Building } from '@/types';

const generateId = (): string => `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const buildingManager = {
  createBuilding(data: Omit<Building, 'id'>): Building {
    return {
      ...data,
      id: generateId(),
    };
  },

  addBuilding(buildings: Building[], data: Omit<Building, 'id'>): Building[] {
    const newBuilding = this.createBuilding(data);
    return [...buildings, newBuilding];
  },

  removeBuilding(buildings: Building[], id: string): Building[] {
    return buildings.filter((b) => b.id !== id);
  },

  updateBuildingHeight(buildings: Building[], id: string, height: number): Building[] {
    return buildings.map((b) =>
      b.id === id
        ? {
            ...b,
            size: {
              ...b.size,
              height: Math.max(1, Math.min(10, height)),
            },
          }
        : b
    );
  },

  getBuildingById(buildings: Building[], id: string): Building | undefined {
    return buildings.find((b) => b.id === id);
  },

  getBuildingCorners(building: Building): { x: number; z: number }[] {
    const { position, size, rotation } = building;
    const hw = size.width / 2;
    const hd = size.depth / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const corners = [
      { x: -hw, z: -hd },
      { x: hw, z: -hd },
      { x: hw, z: hd },
      { x: -hw, z: hd },
    ].map((c) => ({
      x: position.x + c.x * cos - c.z * sin,
      z: position.z + c.x * sin + c.z * cos,
    }));

    return corners;
  },

  getFacadeNormal(facadeIndex: number, rotation: number): { x: number; z: number } {
    const baseNormals = [
      { x: 1, z: 0 },
      { x: 0, z: -1 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
    ];
    const base = baseNormals[facadeIndex];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
      x: base.x * cos - base.z * sin,
      z: base.x * sin + base.z * cos,
    };
  },

  getFacadeCenter(
    building: Building,
    facadeIndex: number
  ): { x: number; y: number; z: number } {
    const { position, size, rotation } = building;
    const hw = size.width / 2;
    const hd = size.depth / 2;
    const hh = size.height / 2;

    const offsets = [
      { x: hw, y: hh, z: 0 },
      { x: 0, y: hh, z: -hd },
      { x: -hw, y: hh, z: 0 },
      { x: 0, y: hh, z: hd },
    ];

    const offset = offsets[facadeIndex];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return {
      x: position.x + offset.x * cos - offset.z * sin,
      y: position.y + offset.y,
      z: position.z + offset.x * sin + offset.z * cos,
    };
  },

  getBuildingsByBlock(buildings: Building[], blockId: string): Building[] {
    return buildings.filter((b) => b.blockId === blockId);
  },
};
