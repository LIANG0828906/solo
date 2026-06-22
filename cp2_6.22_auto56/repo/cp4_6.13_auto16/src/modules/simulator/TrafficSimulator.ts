export interface Vehicle {
  id: number;
  x: number;
  z: number;
  prevX: number;
  prevZ: number;
  speed: number;
  roadId: number;
  color: string;
  direction: number;
  progress: number;
  trail: Array<{ x: number; z: number }>;
}

export interface Road {
  id: number;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  width: number;
  vehicleCount: number;
}

const ROAD_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dfe6e9', '#a29bfe', '#fd79a8', '#00b894', '#e17055'
];

export class TrafficSimulator {
  private vehicles: Vehicle[] = [];
  private roads: Road[] = [];
  private currentHour: number = 12;
  private updateInterval: number = 200;
  private lastUpdate: number = 0;
  private listeners: Set<(vehicles: Vehicle[], roads: Road[]) => void> = new Set();

  constructor() {
    this.initRoads();
    this.initVehicles();
  }

  private initRoads(): void {
    const centerX = 0;
    const centerZ = 0;
    const size = 40;

    for (let i = 0; i < 5; i++) {
      const offset = (i - 2) * 12;
      this.roads.push({
        id: i * 2,
        startX: centerX - size,
        startZ: centerZ + offset,
        endX: centerX + size,
        endZ: centerZ + offset,
        width: 3,
        vehicleCount: 0
      });
      this.roads.push({
        id: i * 2 + 1,
        startX: centerX + offset,
        startZ: centerZ - size,
        endX: centerX + offset,
        endZ: centerZ + size,
        width: 3,
        vehicleCount: 0
      });
    }
  }

  private initVehicles(): void {
    for (let i = 0; i < 30; i++) {
      const roadId = Math.floor(Math.random() * this.roads.length);
      const road = this.roads[roadId];
      const progress = Math.random();
      const direction = Math.random() > 0.5 ? 1 : -1;

      const x = road.startX + (road.endX - road.startX) * progress;
      const z = road.startZ + (road.endZ - road.startZ) * progress;

      this.vehicles.push({
        id: i,
        x,
        z,
        prevX: x,
        prevZ: z,
        speed: this.getSpeedForHour(),
        roadId,
        color: ROAD_COLORS[roadId % ROAD_COLORS.length],
        direction,
        progress,
        trail: []
      });
    }
  }

  private getSpeedForHour(): number {
    const hour = this.currentHour;
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 0.03 + Math.random() * 0.02;
    } else if (hour >= 23 || hour <= 5) {
      return 0.12 + Math.random() * 0.05;
    } else {
      return 0.07 + Math.random() * 0.04;
    }
  }

  public setHour(hour: number): void {
    this.currentHour = hour;
    this.vehicles.forEach(v => {
      v.speed = this.getSpeedForHour();
    });

    const targetCount = this.getVehicleCountForHour();
    while (this.vehicles.length < targetCount && this.vehicles.length < 50) {
      this.addVehicle();
    }
    while (this.vehicles.length > targetCount && this.vehicles.length > 20) {
      this.vehicles.pop();
    }
  }

  private getVehicleCountForHour(): number {
    const hour = this.currentHour;
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 45;
    } else if (hour >= 23 || hour <= 5) {
      return 20;
    } else {
      return 35;
    }
  }

  private addVehicle(): void {
    const roadId = Math.floor(Math.random() * this.roads.length);
    const road = this.roads[roadId];
    const progress = Math.random();
    const direction = Math.random() > 0.5 ? 1 : -1;

    const x = road.startX + (road.endX - road.startX) * progress;
    const z = road.startZ + (road.endZ - road.startZ) * progress;

    this.vehicles.push({
      id: Date.now() + Math.random(),
      x,
      z,
      prevX: x,
      prevZ: z,
      speed: this.getSpeedForHour(),
      roadId,
      color: ROAD_COLORS[roadId % ROAD_COLORS.length],
      direction,
      progress,
      trail: []
    });
  }

  public update(timestamp: number): void {
    if (timestamp - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = timestamp;

    this.roads.forEach(r => r.vehicleCount = 0);

    this.vehicles.forEach(vehicle => {
      vehicle.prevX = vehicle.x;
      vehicle.prevZ = vehicle.z;

      const road = this.roads[vehicle.roadId];
      road.vehicleCount++;

      const dx = road.endX - road.startX;
      const dz = road.endZ - road.startZ;
      const length = Math.sqrt(dx * dx + dz * dz);

      vehicle.progress += (vehicle.speed * vehicle.direction) / length;

      if (vehicle.progress >= 1 || vehicle.progress <= 0) {
        if (Math.random() > 0.7) {
          const newRoadId = Math.floor(Math.random() * this.roads.length);
          vehicle.roadId = newRoadId;
          vehicle.color = ROAD_COLORS[newRoadId % ROAD_COLORS.length];
          vehicle.progress = Math.random() > 0.5 ? 0 : 1;
          vehicle.direction = vehicle.progress === 0 ? 1 : -1;
        } else {
          vehicle.direction *= -1;
          vehicle.progress = Math.max(0, Math.min(1, vehicle.progress));
        }
      }

      const newRoad = this.roads[vehicle.roadId];
      vehicle.x = newRoad.startX + (newRoad.endX - newRoad.startX) * vehicle.progress;
      vehicle.z = newRoad.startZ + (newRoad.endZ - newRoad.startZ) * vehicle.progress;

      vehicle.trail.unshift({ x: vehicle.x, z: vehicle.z });
      if (vehicle.trail.length > 30) {
        vehicle.trail.pop();
      }
    });

    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      callback([...this.vehicles], [...this.roads]);
    });
  }

  public subscribe(callback: (vehicles: Vehicle[], roads: Road[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.vehicles], [...this.roads]);
    return () => this.listeners.delete(callback);
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getRoads(): Road[] {
    return this.roads;
  }
}
