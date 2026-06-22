import { Building, BuildingTemplate, CityLayout } from '../../types';

class CityManager {
  private static instance: CityManager | null = null;
  private buildings: Map<string, Building> = new Map();
  private selectedBuildingId: string | null = null;
  private changeCallbacks: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public addBuilding(
    template: BuildingTemplate,
    position?: { x: number; z: number }
  ): Building {
    const gridRange = 100;
    const gridStep = 12;

    let x: number;
    let z: number;

    if (position) {
      x = position.x;
      z = position.z;
    } else {
      let attempts = 0;
      const maxAttempts = 100;
      do {
        x = Math.floor(Math.random() * (gridRange * 2 / gridStep + 1)) * gridStep - gridRange;
        z = Math.floor(Math.random() * (gridRange * 2 / gridStep + 1)) * gridStep - gridRange;
        attempts++;
      } while (this.isPositionOccupied(x, z) && attempts < maxAttempts);
    }

    const building: Building = {
      id: this.generateId(),
      templateId: template.id,
      position: { x, y: 0, z },
      height: template.defaultHeight,
      rotation: Math.random() * Math.PI * 2,
      color: template.color,
    };

    this.buildings.set(building.id, building);
    this.notifyChange();

    return building;
  }

  private isPositionOccupied(x: number, z: number): boolean {
    const threshold = 10;
    for (const building of this.buildings.values()) {
      const dx = Math.abs(building.position.x - x);
      const dz = Math.abs(building.position.z - z);
      if (dx < threshold && dz < threshold) {
        return true;
      }
    }
    return false;
  }

  public removeBuilding(buildingId: string): boolean {
    const deleted = this.buildings.delete(buildingId);
    if (deleted) {
      if (this.selectedBuildingId === buildingId) {
        this.selectedBuildingId = null;
      }
      this.notifyChange();
    }
    return deleted;
  }

  public updateBuildingHeight(buildingId: string, height: number): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const clampedHeight = Math.max(5, Math.min(200, height));
    building.height = clampedHeight;
    this.notifyChange();

    return true;
  }

  public selectBuilding(buildingId: string | null): void {
    this.selectedBuildingId = buildingId;
    this.notifyChange();
  }

  public getSelectedBuilding(): Building | null {
    if (!this.selectedBuildingId) return null;
    return this.buildings.get(this.selectedBuildingId) ?? null;
  }

  public getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  public exportLayout(): CityLayout {
    return {
      buildings: this.getBuildings(),
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }

  public onChange(callback: () => void): () => void {
    this.changeCallbacks.push(callback);
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChange(): void {
    for (const callback of this.changeCallbacks) {
      callback();
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CityManager;
