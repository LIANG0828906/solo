import { v4 as uuidv4 } from 'uuid';
import { Building, ZoneType, ZONE_INFO, LightSources } from './types';

export class CityStateManager {
  private buildings: Building[] = [];
  private selectedBuildingId: string | null = null;
  private currentHour: number = 20;
  private gridSize: number = 2000;
  private cellSize: number = 100;
  private buildingSize: number = 40;

  constructor() {
    this.generateCity();
  }

  private generateCity(): void {
    const zones: ZoneType[] = ['commercial', 'residential', 'industrial', 'park'];
    const halfGrid = this.gridSize / 2;
    
    const zoneCenters: Record<ZoneType, { x: number; z: number; radius: number }> = {
      commercial: { x: -300, z: -300, radius: 500 },
      residential: { x: 400, z: -200, radius: 600 },
      industrial: { x: -200, z: 400, radius: 500 },
      park: { x: 300, z: 300, radius: 400 }
    };

    for (let x = -halfGrid + this.cellSize / 2; x < halfGrid; x += this.cellSize) {
      for (let z = -halfGrid + this.cellSize / 2; z < halfGrid; z += this.cellSize) {
        if (Math.random() < 0.45) {
          const zoneType = this.getZoneForPosition(x, z, zoneCenters);
          const building = this.createBuilding(x, z, zoneType);
          this.buildings.push(building);
        }
      }
    }
  }

  private getZoneForPosition(
    x: number,
    z: number,
    zoneCenters: Record<ZoneType, { x: number; z: number; radius: number }>
  ): ZoneType {
    let nearestZone: ZoneType = 'residential';
    let minDist = Infinity;

    for (const [zone, center] of Object.entries(zoneCenters)) {
      const dist = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(z - center.z, 2));
      const normalizedDist = dist / center.radius;
      if (normalizedDist < minDist) {
        minDist = normalizedDist;
        nearestZone = zone as ZoneType;
      }
    }

    if (Math.random() < 0.15) {
      const zones: ZoneType[] = ['commercial', 'residential', 'industrial', 'park'];
      return zones[Math.floor(Math.random() * zones.length)];
    }

    return nearestZone;
  }

  private createBuilding(x: number, z: number, zoneType: ZoneType): Building {
    const info = ZONE_INFO[zoneType];
    const [minPollution, maxPollution] = info.basePollutionRange;
    
    let minHeight = 10;
    let maxHeight = 40;
    if (zoneType === 'commercial') {
      minHeight = 30;
      maxHeight = 80;
    } else if (zoneType === 'industrial') {
      minHeight = 20;
      maxHeight = 60;
    } else if (zoneType === 'park') {
      minHeight = 5;
      maxHeight = 15;
    }

    const height = minHeight + Math.random() * (maxHeight - minHeight);
    const basePollution = minPollution + Math.random() * (maxPollution - minPollution);
    
    const hourlyData = this.generateHourlyData(basePollution, zoneType);
    const lightSources = this.generateLightSources(zoneType);

    return {
      id: uuidv4(),
      x,
      z,
      width: this.buildingSize,
      depth: this.buildingSize,
      height,
      zoneType,
      basePollution,
      currentPollution: hourlyData[Math.floor(this.currentHour)],
      lightSources,
      hourlyData
    };
  }

  private generateHourlyData(basePollution: number, zoneType: ZoneType): number[] {
    const data: number[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let multiplier = 1;
      
      if (zoneType === 'commercial') {
        if (hour >= 8 && hour <= 18) {
          multiplier = 0.6 + (hour - 8) / 20;
        } else if (hour >= 19 && hour <= 23) {
          multiplier = 1.0 - (hour - 19) * 0.05;
        } else {
          multiplier = 0.3 + Math.sin(hour / 24 * Math.PI * 2) * 0.1;
        }
      } else if (zoneType === 'residential') {
        if (hour >= 6 && hour <= 8) {
          multiplier = 0.5 + (hour - 6) * 0.2;
        } else if (hour >= 9 && hour <= 17) {
          multiplier = 0.4 + Math.sin((hour - 9) / 8 * Math.PI) * 0.2;
        } else if (hour >= 18 && hour <= 22) {
          multiplier = 0.8 + (hour - 18) * 0.05;
        } else if (hour >= 23 || hour <= 5) {
          const lateNight = hour >= 23 ? hour - 23 : hour + 1;
          multiplier = 0.7 - lateNight * 0.1;
        }
      } else if (zoneType === 'industrial') {
        if (hour >= 6 && hour <= 22) {
          multiplier = 0.85 + Math.sin((hour - 6) / 16 * Math.PI) * 0.15;
        } else {
          multiplier = 0.6 + Math.random() * 0.1;
        }
      } else if (zoneType === 'park') {
        if (hour >= 6 && hour <= 18) {
          multiplier = 0.3 + Math.sin((hour - 6) / 12 * Math.PI) * 0.2;
        } else {
          multiplier = 0.8 + Math.sin((hour - 18) / 12 * Math.PI) * 0.2;
        }
      }

      const value = Math.max(0, Math.min(100, basePollution * multiplier + (Math.random() - 0.5) * 5));
      data.push(Math.round(value * 10) / 10);
    }

    return data;
  }

  private generateLightSources(zoneType: ZoneType): LightSources {
    const sources: LightSources = {
      streetLights: 0,
      billboards: 0,
      buildingLights: 0,
      trafficLights: 0
    };

    if (zoneType === 'commercial') {
      sources.streetLights = 25;
      sources.billboards = 35;
      sources.buildingLights = 30;
      sources.trafficLights = 10;
    } else if (zoneType === 'residential') {
      sources.streetLights = 40;
      sources.billboards = 5;
      sources.buildingLights = 45;
      sources.trafficLights = 10;
    } else if (zoneType === 'industrial') {
      sources.streetLights = 20;
      sources.billboards = 5;
      sources.buildingLights = 55;
      sources.trafficLights = 20;
    } else if (zoneType === 'park') {
      sources.streetLights = 60;
      sources.billboards = 5;
      sources.buildingLights = 15;
      sources.trafficLights = 20;
    }

    return sources;
  }

  getBuildings(): Building[] {
    return this.buildings;
  }

  getBuildingById(id: string): Building | undefined {
    return this.buildings.find(b => b.id === id);
  }

  setCurrentHour(hour: number): void {
    this.currentHour = Math.max(0, Math.min(23.99, hour));
    this.updateCurrentPollution();
  }

  getCurrentHour(): number {
    return this.currentHour;
  }

  private updateCurrentPollution(): void {
    const hour = Math.floor(this.currentHour);
    const nextHour = (hour + 1) % 24;
    const fraction = this.currentHour - hour;

    this.buildings.forEach(building => {
      const current = building.hourlyData[hour];
      const next = building.hourlyData[nextHour];
      building.currentPollution = Math.round((current + (next - current) * fraction) * 10) / 10;
    });
  }

  selectBuilding(id: string | null): void {
    this.selectedBuildingId = id;
  }

  getSelectedBuilding(): Building | undefined {
    if (!this.selectedBuildingId) return undefined;
    return this.getBuildingById(this.selectedBuildingId);
  }

  getSelectedBuildingId(): string | null {
    return this.selectedBuildingId;
  }

  getGridSize(): number {
    return this.gridSize;
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getAveragePollutionForZone(zoneType: ZoneType): number {
    const zoneBuildings = this.buildings.filter(b => b.zoneType === zoneType);
    if (zoneBuildings.length === 0) return 0;
    const sum = zoneBuildings.reduce((acc, b) => acc + b.currentPollution, 0);
    return Math.round((sum / zoneBuildings.length) * 10) / 10;
  }
}
