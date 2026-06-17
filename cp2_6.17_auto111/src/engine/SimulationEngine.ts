import { v4 as uuidv4 } from 'uuid';
import {
  VehicleState,
  IntersectionState,
  GridConfig,
  Statistics,
  LaneDirection,
  VEHICLE_COLORS,
  kmhToMs,
  msToKmh
} from './types';
import { TrafficLightController } from './TrafficLightController';
import { VehicleAI } from './VehicleAI';

export class SimulationEngine {
  vehicles: Map<string, VehicleState> = new Map();
  intersections: Map<string, IntersectionState> = new Map();
  gridConfig: GridConfig;
  trafficLightController: TrafficLightController;

  private spawnTimer: number = 0;
  private spawnInterval: number = 2 + Math.random();
  private statsTimer: number = 0;
  private onVehiclesUpdate?: (vehicles: VehicleState[]) => void;
  private onStatsUpdate?: (stats: Statistics) => void;
  private completedTrips: number = 0;
  private vehicleSpawned: number = 0;
  private vehiclesPassedLastInterval: number = 0;
  private intervalElapsed: number = 0;
  private directionSpawnCount: Map<LaneDirection, number> = new Map();
  private lastVehicleColors: string[] = [];

  constructor(gridConfig: GridConfig, greenDuration: number = 30) {
    this.gridConfig = gridConfig;
    this.trafficLightController = new TrafficLightController(greenDuration);
    this.initializeIntersections();
    this.directionSpawnCount.set('east', 0);
    this.directionSpawnCount.set('west', 0);
    this.directionSpawnCount.set('north', 0);
    this.directionSpawnCount.set('south', 0);
  }

  private initializeIntersections(): void {
    this.intersections.clear();
    this.trafficLightController.reset();

    const { sizeX, sizeZ, roadLength } = this.gridConfig;
    const totalWidth = (sizeX - 1) * roadLength;
    const totalDepth = (sizeZ - 1) * roadLength;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    for (let gx = 0; gx < sizeX; gx++) {
      for (let gz = 0; gz < sizeZ; gz++) {
        const id = `intersection_${gx}_${gz}`;
        const centerX = offsetX + gx * roadLength;
        const centerZ = offsetZ + gz * roadLength;

        this.trafficLightController.registerIntersection(id, (gx + gz) * 2);

        const lightState = this.trafficLightController.getLightState(id)!;

        this.intersections.set(id, {
          id,
          gridX: gx,
          gridZ: gz,
          centerX,
          centerZ,
          trafficLight: lightState,
          totalWaitingTime: 0,
          vehiclesWaited: 0
        });
      }
    }
  }

  setOnVehiclesUpdate(callback: (vehicles: VehicleState[]) => void): void {
    this.onVehiclesUpdate = callback;
  }

  setOnStatsUpdate(callback: (stats: Statistics) => void): void {
    this.onStatsUpdate = callback;
  }

  private getBalancedDirection(): LaneDirection {
    const directions: LaneDirection[] = ['east', 'west', 'north', 'south'];
    const totalSpawned = Array.from(this.directionSpawnCount.values())
      .reduce((a, b) => a + b, 0);

    if (totalSpawned === 0) {
      return directions[Math.floor(Math.random() * 4)];
    }

    const weights = directions.map(dir => {
      const count = this.directionSpawnCount.get(dir) || 0;
      const expectedRatio = 0.25;
      const actualRatio = count / totalSpawned;
      return expectedRatio - actualRatio;
    });

    const maxWeight = Math.max(...weights);
    const candidates = directions.filter((_, i) => weights[i] === maxWeight);

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private getBalancedColor(): string {
    let color: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      color = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
      attempts++;
    } while (
      this.lastVehicleColors.length >= 2 &&
      this.lastVehicleColors.every(c => c === color) &&
      attempts < maxAttempts
    );

    this.lastVehicleColors.push(color);
    if (this.lastVehicleColors.length > 2) {
      this.lastVehicleColors.shift();
    }

    return color;
  }

  spawnVehicle(): void {
    const { sizeX, sizeZ, roadLength } = this.gridConfig;
    const totalWidth = (sizeX - 1) * roadLength;
    const totalDepth = (sizeZ - 1) * roadLength;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    const direction = this.getBalancedDirection();
    this.directionSpawnCount.set(direction, (this.directionSpawnCount.get(direction) || 0) + 1);

    let gx: number, gz: number;

    switch (direction) {
      case 'south':
        gx = Math.floor(Math.random() * sizeX);
        gz = 0;
        break;
      case 'west':
        gx = sizeX - 1;
        gz = Math.floor(Math.random() * sizeZ);
        break;
      case 'north':
        gx = Math.floor(Math.random() * sizeX);
        gz = sizeZ - 1;
        break;
      default:
        gx = 0;
        gz = Math.floor(Math.random() * sizeZ);
        break;
    }

    const centerX = offsetX + gx * roadLength;
    const centerZ = offsetZ + gz * roadLength;

    const lane = Math.floor(Math.random() * 2);
    const lateralOffset = VehicleAI.getLateralOffset(direction, lane);

    const dirVec = VehicleAI.getDirectionVector(direction);
    const spawnDistance = roadLength / 2 - 20;

    const path = this.generatePath(gx, gz, direction);

    const vehicle: VehicleState = {
      id: uuidv4(),
      position: {
        x: centerX + lateralOffset.x - dirVec.x * spawnDistance,
        z: centerZ + lateralOffset.z - dirVec.z * spawnDistance
      },
      rotation: VehicleAI.getRotationForDirection(direction),
      speed: 0,
      targetSpeed: kmhToMs(20 + Math.random() * 40),
      color: this.getBalancedColor(),
      direction,
      nextTurn: this.randomTurn(),
      turnIndicatorActive: false,
      turnIndicatorTimer: 0,
      waitingTime: 0,
      isWaiting: false,
      currentIntersectionId: null,
      path,
      pathIndex: 0,
      isTurning: false,
      turnProgress: 0,
      turnCenter: null,
      turnStartAngle: 0,
      turnEndAngle: 0,
      turnDirection: direction,
      lastColors: []
    };

    this.vehicles.set(vehicle.id, vehicle);
    this.vehicleSpawned++;
  }

  private randomTurn(): 'left' | 'right' | 'straight' {
    const r = Math.random();
    if (r < 0.6) return 'straight';
    if (r < 0.8) return 'left';
    return 'right';
  }

  private generatePath(
    startGx: number,
    startGz: number,
    startDirection: LaneDirection
  ): { x: number; z: number }[] {
    const path: { x: number; z: number }[] = [];
    let gx = startGx;
    let gz = startGz;
    let direction = startDirection;
    const { sizeX, sizeZ, roadLength } = this.gridConfig;
    const totalWidth = (sizeX - 1) * roadLength;
    const totalDepth = (sizeZ - 1) * roadLength;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    const pathLength = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < pathLength; i++) {
      const centerX = offsetX + gx * roadLength;
      const centerZ = offsetZ + gz * roadLength;
      path.push({ x: centerX, z: centerZ });

      const turn = this.randomTurn();
      direction = VehicleAI.getTurnDirection(direction, turn);

      const dirVec = VehicleAI.getDirectionVector(direction);
      gx += dirVec.x;
      gz += dirVec.z;

      if (gx < 0 || gx >= sizeX || gz < 0 || gz >= sizeZ) {
        break;
      }
    }

    return path;
  }

  private findNextIntersection(vehicle: VehicleState): IntersectionState | null {
    if (vehicle.pathIndex >= vehicle.path.length) return null;

    const target = vehicle.path[vehicle.pathIndex];
    for (const intersection of this.intersections.values()) {
      const dx = Math.abs(intersection.centerX - target.x);
      const dz = Math.abs(intersection.centerZ - target.z);
      if (dx < 1 && dz < 1) {
        return intersection;
      }
    }
    return null;
  }

  update(deltaTime: number): void {
    if (deltaTime > 0.1) deltaTime = 0.1;

    this.trafficLightController.update(deltaTime);

    this.intersections.forEach((intersection) => {
      const lightState = this.trafficLightController.getLightState(intersection.id);
      if (lightState) {
        intersection.trafficLight = lightState;
      }
    });

    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnInterval = 2 + Math.random();
      this.spawnVehicle();
    }

    const vehiclesArray = Array.from(this.vehicles.values());

    for (const vehicle of this.vehicles.values()) {
      const wasTurning = vehicle.isTurning;
      const nextIntersection = this.findNextIntersection(vehicle);
      const trafficLight = nextIntersection
        ? this.trafficLightController.getLightState(nextIntersection.id)
        : undefined;
      const intersectionCenter = nextIntersection
        ? { x: nextIntersection.centerX, z: nextIntersection.centerZ }
        : null;

      if (vehicle.isTurning) {
        VehicleAI.updateTurnPosition(vehicle, deltaTime);
        if (wasTurning && !vehicle.isTurning) {
          vehicle.pathIndex++;
          if (vehicle.pathIndex < vehicle.path.length) {
            vehicle.nextTurn = this.randomTurn();
          }
        }
        continue;
      }

      const acceleration = VehicleAI.calculateAcceleration(
        vehicle,
        vehiclesArray,
        trafficLight,
        intersectionCenter,
        deltaTime
      );

      vehicle.speed += acceleration * deltaTime;
      vehicle.speed = Math.max(0, Math.min(vehicle.speed, vehicle.targetSpeed * 1.2));

      if (intersectionCenter) {
        const distanceToIntersection = VehicleAI.calculateDistanceToStopLine(
          vehicle,
          intersectionCenter
        );
        vehicle.turnIndicatorActive = VehicleAI.checkTurnIndicator(
          vehicle,
          distanceToIntersection
        );
      }

      VehicleAI.updateTurnIndicator(vehicle, deltaTime);

      const dirVec = VehicleAI.getDirectionVector(vehicle.direction);
      vehicle.position.x += dirVec.x * vehicle.speed * deltaTime;
      vehicle.position.z += dirVec.z * vehicle.speed * deltaTime;

      if (vehicle.speed < 0.1) {
        vehicle.waitingTime += deltaTime;
        vehicle.isWaiting = true;
        if (nextIntersection && vehicle.waitingTime > 0.5 && !vehicle.isWaiting) {
          nextIntersection.totalWaitingTime += deltaTime;
          if (vehicle.waitingTime < deltaTime) {
            nextIntersection.vehiclesWaited++;
          }
        }
      } else {
        if (vehicle.isWaiting && vehicle.waitingTime > 1) {
          if (nextIntersection) {
            nextIntersection.totalWaitingTime += vehicle.waitingTime;
            nextIntersection.vehiclesWaited++;
          }
        }
        vehicle.isWaiting = false;
        vehicle.waitingTime = 0;
      }

      if (nextIntersection && intersectionCenter) {
        const dx = intersectionCenter.x - vehicle.position.x;
        const dz = intersectionCenter.z - vehicle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 3) {
          if (vehicle.nextTurn !== 'straight' && vehicle.pathIndex < vehicle.path.length - 1) {
            const turnAngles = VehicleAI.getTurnAngles(vehicle.direction, vehicle.nextTurn);
            vehicle.isTurning = true;
            vehicle.turnProgress = 0;
            vehicle.turnCenter = VehicleAI.getTurnCenter(vehicle, intersectionCenter, vehicle.nextTurn);
            vehicle.turnStartAngle = turnAngles.startAngle;
            vehicle.turnEndAngle = turnAngles.endAngle;
            vehicle.turnDirection = VehicleAI.getTurnDirection(vehicle.direction, vehicle.nextTurn);
            continue;
          }

          vehicle.pathIndex++;
          if (vehicle.pathIndex < vehicle.path.length) {
            vehicle.direction = VehicleAI.getTurnDirection(
              vehicle.direction,
              vehicle.nextTurn
            );
            vehicle.rotation = VehicleAI.getRotationForDirection(vehicle.direction);
            vehicle.nextTurn = this.randomTurn();
            vehicle.turnIndicatorActive = false;
            vehicle.turnIndicatorTimer = 0;
          }
        }
      }

      if (this.isOutOfBounds(vehicle)) {
        this.vehicles.delete(vehicle.id);
        this.completedTrips++;
        this.vehiclesPassedLastInterval++;
      }
    }

    this.statsTimer += deltaTime;
    this.intervalElapsed += deltaTime;
    if (this.statsTimer >= 2) {
      this.statsTimer = 0;
      const stats = this.calculateStatistics();
      if (this.onStatsUpdate) {
        this.onStatsUpdate(stats);
      }
    }

    if (this.onVehiclesUpdate) {
      this.onVehiclesUpdate(Array.from(this.vehicles.values()));
    }
  }

  private isOutOfBounds(vehicle: VehicleState): boolean {
    const { sizeX, sizeZ, roadLength } = this.gridConfig;
    const totalWidth = (sizeX - 1) * roadLength;
    const totalDepth = (sizeZ - 1) * roadLength;
    const margin = 50;

    return (
      vehicle.position.x < -totalWidth / 2 - margin ||
      vehicle.position.x > totalWidth / 2 + margin ||
      vehicle.position.z < -totalDepth / 2 - margin ||
      vehicle.position.z > totalDepth / 2 + margin
    );
  }

  private calculateQueueLengths(): { average: number; max: number } {
    let totalQueue = 0;
    let maxQueue = 0;
    let count = 0;

    for (const intersection of this.intersections.values()) {
      const { centerX, centerZ } = intersection;
      const queueThreshold = 40;

      type EWDirection = { dir: LaneDirection; startX: number; endX: number; z: number; startZ?: undefined; endZ?: undefined; x?: undefined };
      type NSDirection = { dir: LaneDirection; x: number; startZ: number; endZ: number; startX?: undefined; endX?: undefined; z?: undefined };
      const directions: (EWDirection | NSDirection)[] = [
        { dir: 'east', startX: centerX - queueThreshold, endX: centerX - 10, z: centerZ },
        { dir: 'west', startX: centerX + 10, endX: centerX + queueThreshold, z: centerZ },
        { dir: 'north', x: centerX, startZ: centerZ + 10, endZ: centerZ + queueThreshold },
        { dir: 'south', x: centerX, startZ: centerZ - queueThreshold, endZ: centerZ - 10 }
      ];

      let intersectionQueue = 0;

      for (const d of directions) {
        for (const vehicle of this.vehicles.values()) {
          if (vehicle.direction !== d.dir) continue;
          if (vehicle.speed > 1.0) continue;

          if (d.dir === 'east' || d.dir === 'west') {
            const dirData = d as EWDirection;
            const minX = Math.min(dirData.startX, dirData.endX);
            const maxX = Math.max(dirData.startX, dirData.endX);
            if (vehicle.position.x >= minX && vehicle.position.x <= maxX &&
                Math.abs(vehicle.position.z - dirData.z) < 8) {
              intersectionQueue++;
            }
          } else {
            const dirData = d as NSDirection;
            const minZ = Math.min(dirData.startZ, dirData.endZ);
            const maxZ = Math.max(dirData.startZ, dirData.endZ);
            if (vehicle.position.z >= minZ && vehicle.position.z <= maxZ &&
                Math.abs(vehicle.position.x - dirData.x) < 8) {
              intersectionQueue++;
            }
          }
        }
      }

      if (intersectionQueue > 0) {
        totalQueue += intersectionQueue;
        maxQueue = Math.max(maxQueue, intersectionQueue);
        count++;
      }
    }

    const average = count > 0 ? totalQueue / count : 0;
    return { average, max: maxQueue };
  }

  calculateStatistics(): Statistics {
    const vehicles = Array.from(this.vehicles.values());
    const totalVehicles = vehicles.length;

    if (totalVehicles === 0) {
      const queueData = this.calculateQueueLengths();
      return {
        totalVehicles: 0,
        averageSpeed: 0,
        congestionIndex: 0,
        averageWaitingTime: 0,
        averageQueueLength: queueData.average,
        maxQueueLength: queueData.max,
        trafficFlow: 0,
        completedTrips: this.completedTrips
      };
    }

    const totalSpeed = vehicles.reduce((sum, v) => sum + msToKmh(v.speed), 0);
    const averageSpeed = totalSpeed / totalVehicles;

    const congestedVehicles = vehicles.filter((v) => msToKmh(v.speed) < 10).length;
    const congestionIndex = congestedVehicles / totalVehicles;

    let totalWaitingTime = 0;
    let intersectionsWithWaits = 0;

    for (const intersection of this.intersections.values()) {
      if (intersection.vehiclesWaited > 0) {
        totalWaitingTime += intersection.totalWaitingTime / intersection.vehiclesWaited;
        intersectionsWithWaits++;
      }
    }

    const averageWaitingTime =
      intersectionsWithWaits > 0 ? totalWaitingTime / intersectionsWithWaits : 0;

    const queueData = this.calculateQueueLengths();

    const trafficFlow = this.intervalElapsed > 0
      ? (this.vehiclesPassedLastInterval / this.intervalElapsed) * 3600
      : 0;

    if (this.intervalElapsed >= 300) {
      this.vehiclesPassedLastInterval = 0;
      this.intervalElapsed = 0;
    }

    return {
      totalVehicles,
      averageSpeed,
      congestionIndex,
      averageWaitingTime,
      averageQueueLength: queueData.average,
      maxQueueLength: queueData.max,
      trafficFlow,
      completedTrips: this.completedTrips
    };
  }

  setGreenDuration(seconds: number): void {
    this.trafficLightController.setGreenDuration(seconds);
  }

  regenerateGrid(newConfig: GridConfig): void {
    this.gridConfig = newConfig;
    this.vehicles.clear();
    this.initializeIntersections();
    this.spawnTimer = 0;
  }

  reset(): void {
    this.vehicles.clear();
    this.spawnTimer = 0;
    this.statsTimer = 0;
    this.completedTrips = 0;
    this.vehicleSpawned = 0;
    this.vehiclesPassedLastInterval = 0;
    this.intervalElapsed = 0;
    this.intersections.forEach((i) => {
      i.totalWaitingTime = 0;
      i.vehiclesWaited = 0;
    });
  }
}
