export interface Intersection {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  trafficLightMode: 'four-phase' | 'two-phase';
  currentPhase: number;
  phaseTimer: number;
  waitingVehicles: number;
  congestionLevel: number;
}

export interface Vehicle {
  id: string;
  x: number;
  y: number;
  color: string;
  path: { gridX: number; gridY: number }[];
  pathIndex: number;
  speed: number;
  isWaiting: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface BusRoute {
  id: string;
  startId: string;
  endId: string;
}

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial';
  gridX: number;
  gridY: number;
}

export interface Tree {
  x: number;
  y: number;
}

export interface CongestionDataPoint {
  time: number;
  avgCongestionIndex: number;
}

const GRID_SIZE = 5;
const ROAD_WIDTH = 40;
const INTERSECTION_SIZE = 30;
const BLOCK_SIZE = 120;
const VEHICLE_COLORS = ['#FFD93D', '#FFA502', '#6BCB77', '#4ECDC4', '#A29BFE', '#FD79A8'];
const CYCLE_DURATION = 60;
const CONGESTION_THRESHOLD = 15;
const MAX_VEHICLES = 500;
const VEHICLE_SPEED = 1.5;

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class TrafficSimulation {
  intersections: Intersection[] = [];
  vehicles: Vehicle[] = [];
  busRoutes: BusRoute[] = [];
  residentialZones: Zone[] = [];
  commercialZones: Zone[] = [];
  trees: Tree[] = [];
  congestionHistory: CongestionDataPoint[] = [];
  isRunning = false;
  simulationTime = 0;
  speedMultiplier = 1;
  lastHeatmapUpdate = 0;
  lastCongestionSample = 0;
  selectedIntersection: string | null = null;
  private vehicleIdCounter = 0;
  private lastVehicleSpawn = 0;
  private onUpdate: (() => void) | null = null;
  heatmapData: number[][] = [];
  mapWidth: number;
  mapHeight: number;

  constructor() {
    this.mapWidth = GRID_SIZE * BLOCK_SIZE + (GRID_SIZE + 1) * ROAD_WIDTH;
    this.mapHeight = GRID_SIZE * BLOCK_SIZE + (GRID_SIZE + 1) * ROAD_WIDTH;
    this.initIntersections();
    this.initZones();
    this.initTrees();
    this.initHeatmap();
  }

  setOnUpdate(callback: () => void) {
    this.onUpdate = callback;
  }

  private initIntersections() {
    this.intersections = [];
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const x = ROAD_WIDTH + gx * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
        const y = ROAD_WIDTH + gy * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
        this.intersections.push({
          id: `${gx}-${gy}`,
          x, y,
          gridX: gx,
          gridY: gy,
          trafficLightMode: 'four-phase',
          currentPhase: 0,
          phaseTimer: 0,
          waitingVehicles: 0,
          congestionLevel: 0,
        });
      }
    }
  }

  private initZones() {
    this.residentialZones = [];
    this.commercialZones = [];
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const blockX = ROAD_WIDTH + gx * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH;
        const blockY = ROAD_WIDTH + gy * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH;
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < count; i++) {
          const isResidential = (gx + gy + i) % 2 === 0;
          const w = 60 + Math.random() * 60;
          const h = 60 + Math.random() * 60;
          const offsetX = Math.random() * (BLOCK_SIZE - w - 10);
          const offsetY = Math.random() * (BLOCK_SIZE - h - 10);
          const zone: Zone = {
            x: blockX + offsetX,
            y: blockY + offsetY,
            width: w,
            height: h,
            type: isResidential ? 'residential' : 'commercial',
            gridX: gx,
            gridY: gy,
          };
          if (isResidential) {
            this.residentialZones.push(zone);
          } else {
            this.commercialZones.push(zone);
          }
        }
      }
    }
  }

  private initTrees() {
    this.trees = [];
    for (let gy = 0; gy <= GRID_SIZE; gy++) {
      for (let gx = 0; gx <= GRID_SIZE; gx++) {
        const roadX = gx * (BLOCK_SIZE + ROAD_WIDTH);
        const roadY = gy * (BLOCK_SIZE + ROAD_WIDTH);
        if (gx < GRID_SIZE) {
          for (let t = 0; t < 3; t++) {
            const tx = roadX + ROAD_WIDTH + t * (BLOCK_SIZE / 3) + 20 + Math.random() * 10;
            this.trees.push({ x: tx, y: roadY + 5 });
            this.trees.push({ x: tx, y: roadY + ROAD_WIDTH - 11 });
          }
        }
        if (gy < GRID_SIZE) {
          for (let t = 0; t < 3; t++) {
            const ty = roadY + ROAD_WIDTH + t * (BLOCK_SIZE / 3) + 20 + Math.random() * 10;
            this.trees.push({ x: roadX + 5, y: ty });
            this.trees.push({ x: roadX + ROAD_WIDTH - 11, y: ty });
          }
        }
      }
    }
  }

  private initHeatmap() {
    const gridW = 20;
    const gridH = 20;
    this.heatmapData = [];
    for (let y = 0; y < gridH; y++) {
      this.heatmapData[y] = [];
      for (let x = 0; x < gridW; x++) {
        this.heatmapData[y][x] = 0;
      }
    }
  }

  getIntersection(gx: number, gy: number): Intersection | undefined {
    return this.intersections.find(i => i.gridX === gx && i.gridY === gy);
  }

  toggleTrafficLightMode(id: string) {
    const inter = this.intersections.find(i => i.id === id);
    if (inter) {
      inter.trafficLightMode = inter.trafficLightMode === 'four-phase' ? 'two-phase' : 'four-phase';
      inter.currentPhase = 0;
      inter.phaseTimer = 0;
    }
  }

  addBusRoute(startId: string, endId: string) {
    if (startId === endId) return;
    const exists = this.busRoutes.some(
      r => (r.startId === startId && r.endId === endId) ||
           (r.startId === endId && r.endId === startId)
    );
    if (!exists) {
      this.busRoutes.push({
        id: `bus-${Date.now()}-${Math.random()}`,
        startId,
        endId,
      });
    }
  }

  handleIntersectionClick(id: string) {
    if (this.selectedIntersection === null) {
      this.selectedIntersection = id;
    } else if (this.selectedIntersection === id) {
      this.toggleTrafficLightMode(id);
      this.selectedIntersection = null;
    } else {
      this.addBusRoute(this.selectedIntersection, id);
      this.selectedIntersection = null;
    }
  }

  private findPath(sx: number, sy: number, dx: number, dy: number): { gridX: number; gridY: number }[] {
    const path: { gridX: number; gridY: number }[] = [];
    let cx = sx, cy = sy;
    while (cx !== dx || cy !== dy) {
      if (cx < dx) cx++;
      else if (cx > dx) cx--;
      else if (cy < dy) cy++;
      else if (cy > dy) cy--;
      path.push({ gridX: cx, gridY: cy });
    }
    return path;
  }

  private spawnVehicle() {
    if (this.vehicles.length >= MAX_VEHICLES) return;
    if (this.residentialZones.length === 0 || this.commercialZones.length === 0) return;

    const resZone = this.residentialZones[Math.floor(Math.random() * this.residentialZones.length)];
    const comZone = this.commercialZones[Math.floor(Math.random() * this.commercialZones.length)];

    const path = this.findPath(resZone.gridX, resZone.gridY, comZone.gridX, comZone.gridY);
    if (path.length === 0) return;

    const startInter = this.getIntersection(resZone.gridX, resZone.gridY);
    if (!startInter) return;

    const color = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
    const firstStep = path[0];
    let direction: 'up' | 'down' | 'left' | 'right' = 'right';
    if (firstStep.gridX > resZone.gridX) direction = 'right';
    else if (firstStep.gridX < resZone.gridX) direction = 'left';
    else if (firstStep.gridY > resZone.gridY) direction = 'down';
    else if (firstStep.gridY < resZone.gridY) direction = 'up';

    this.vehicles.push({
      id: `v-${this.vehicleIdCounter++}`,
      x: startInter.x,
      y: startInter.y,
      color,
      path,
      pathIndex: 0,
      speed: VEHICLE_SPEED,
      isWaiting: false,
      direction,
    });
  }

  private isGreenLight(inter: Intersection, direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const phaseProgress = inter.phaseTimer / CYCLE_DURATION;
    const phaseCount = inter.trafficLightMode === 'four-phase' ? 4 : 2;
    const phaseDuration = 1 / phaseCount;
    let activePhase = Math.floor(phaseProgress / phaseDuration);
    if (activePhase >= phaseCount) activePhase = phaseCount - 1;

    if (inter.trafficLightMode === 'four-phase') {
      switch (activePhase) {
        case 0: return direction === 'left' || direction === 'right';
        case 1: return direction === 'left';
        case 2: return direction === 'up' || direction === 'down';
        case 3: return direction === 'up';
        default: return false;
      }
    } else {
      return activePhase === 0 ? (direction === 'left' || direction === 'right') : (direction === 'up' || direction === 'down');
    }
  }

  update(deltaTime: number) {
    if (!this.isRunning) return;

    const dt = deltaTime * this.speedMultiplier;
    this.simulationTime += dt;

    this.intersections.forEach(inter => {
      inter.phaseTimer = (inter.phaseTimer + dt) % CYCLE_DURATION;
      inter.waitingVehicles = 0;
    });

    this.lastVehicleSpawn += dt;
    if (this.lastVehicleSpawn > 0.5 / this.speedMultiplier) {
      this.lastVehicleSpawn = 0;
      this.spawnVehicle();
    }

    this.vehicles = this.vehicles.filter(vehicle => {
      if (vehicle.pathIndex >= vehicle.path.length) return false;

      const targetNode = vehicle.path[vehicle.pathIndex];
      const targetInter = this.getIntersection(targetNode.gridX, targetNode.gridY);
      if (!targetInter) return false;

      const dx = targetInter.x - vehicle.x;
      const dy = targetInter.y - vehicle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        vehicle.pathIndex++;
        if (vehicle.pathIndex >= vehicle.path.length) return false;

        const nextNode = vehicle.path[vehicle.pathIndex];
        if (nextNode.gridX > targetNode.gridX) vehicle.direction = 'right';
        else if (nextNode.gridX < targetNode.gridX) vehicle.direction = 'left';
        else if (nextNode.gridY > targetNode.gridY) vehicle.direction = 'down';
        else if (nextNode.gridY < targetNode.gridY) vehicle.direction = 'up';
        return true;
      }

      const currentInter = this.findNearbyIntersection(vehicle.x, vehicle.y);
      vehicle.isWaiting = false;
      if (currentInter && dist < 35 && dist > 5) {
        if (!this.isGreenLight(currentInter, vehicle.direction)) {
          vehicle.isWaiting = true;
          currentInter.waitingVehicles++;
          return true;
        }
      }

      const moveDist = vehicle.speed * dt * 60;
      vehicle.x += (dx / dist) * moveDist;
      vehicle.y += (dy / dist) * moveDist;
      return true;
    });

    this.intersections.forEach(inter => {
      const targetLevel = Math.min(1, inter.waitingVehicles / CONGESTION_THRESHOLD);
      inter.congestionLevel = lerp(inter.congestionLevel, targetLevel, easeInOutQuad(Math.min(1, dt * 2)));
    });

    if (this.simulationTime - this.lastHeatmapUpdate >= 5) {
      this.lastHeatmapUpdate = this.simulationTime;
      this.updateHeatmap();
    }

    if (this.simulationTime - this.lastCongestionSample >= 5) {
      this.lastCongestionSample = this.simulationTime;
      const avgCongestion = this.intersections.reduce((sum, i) => sum + i.congestionLevel * 100, 0) / this.intersections.length;
      this.congestionHistory.push({ time: this.simulationTime, avgCongestionIndex: avgCongestion });
      if (this.congestionHistory.length > 100) this.congestionHistory.shift();
    }

    if (this.onUpdate) this.onUpdate();
  }

  private findNearbyIntersection(x: number, y: number): Intersection | undefined {
    return this.intersections.find(i => {
      const dx = i.x - x;
      const dy = i.y - y;
      return Math.sqrt(dx * dx + dy * dy) < INTERSECTION_SIZE;
    });
  }

  private updateHeatmap() {
    const gridW = this.heatmapData[0]?.length || 20;
    const gridH = this.heatmapData.length || 20;
    const cellW = this.mapWidth / gridW;
    const cellH = this.mapHeight / gridH;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        this.heatmapData[y][x] *= 0.8;
      }
    }

    this.vehicles.forEach(v => {
      const gx = Math.floor(v.x / cellW);
      const gy = Math.floor(v.y / cellH);
      if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
        this.heatmapData[gy][gx] = Math.min(1, this.heatmapData[gy][gx] + 0.02);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && (dx !== 0 || dy !== 0)) {
              this.heatmapData[ny][nx] = Math.min(1, this.heatmapData[ny][nx] + 0.01);
            }
          }
        }
      }
    });

    this.intersections.forEach(inter => {
      const gx = Math.floor(inter.x / cellW);
      const gy = Math.floor(inter.y / cellH);
      if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
        this.heatmapData[gy][gx] = Math.max(this.heatmapData[gy][gx], inter.congestionLevel);
      }
    });
  }

  reset() {
    this.vehicles = [];
    this.congestionHistory = [];
    this.simulationTime = 0;
    this.lastHeatmapUpdate = 0;
    this.lastCongestionSample = 0;
    this.lastVehicleSpawn = 0;
    this.vehicleIdCounter = 0;
    this.selectedIntersection = null;
    this.intersections.forEach(inter => {
      inter.congestionLevel = 0;
      inter.waitingVehicles = 0;
      inter.phaseTimer = 0;
      inter.currentPhase = 0;
    });
    this.initHeatmap();
    if (this.onUpdate) this.onUpdate();
  }

  start() {
    this.isRunning = true;
  }

  pause() {
    this.isRunning = false;
  }

  setSpeed(multiplier: number) {
    this.speedMultiplier = Math.max(0.5, Math.min(4, multiplier));
  }

  getCongestionColor(level: number): string {
    const r = Math.floor(lerp(200, 220, level));
    const g = Math.floor(lerp(200, 20, level));
    const b = Math.floor(lerp(200, 20, level));
    return `rgb(${r},${g},${b})`;
  }
}
