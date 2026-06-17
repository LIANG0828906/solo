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

  constructor(gridConfig: GridConfig, greenDuration: number = 30) {
    this.gridConfig = gridConfig;
    this.trafficLightController = new TrafficLightController(greenDuration);
    this.initializeIntersections();
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

  spawnVehicle(): void {
    const { sizeX, sizeZ, roadLength } = this.gridConfig;
    const totalWidth = (sizeX - 1) * roadLength;
    const totalDepth = (sizeZ - 1) * roadLength;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    const edge = Math.floor(Math.random() * 4);
    let gx: number, gz: number, direction: LaneDirection;

    switch (edge) {
      case 0:
        gx = Math.floor(Math.random() * sizeX);
        gz = 0;
        direction = 'south';
        break;
      case 1:
        gx = sizeX - 1;
        gz = Math.floor(Math.random() * sizeZ);
        direction = 'west';
        break;
      case 2:
        gx = Math.floor(Math.random() * sizeX);
        gz = sizeZ - 1;
        direction = 'north';
        break;
      default:
        gx = 0;
        gz = Math.floor(Math.random() * sizeZ);
        direction = 'east';
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
      color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
      direction,
      nextTurn: this.randomTurn(),
      turnIndicatorActive: false,
      turnIndicatorTimer: 0,
      waitingTime: 0,
      isWaiting: false,
      currentIntersectionId: null,
      path,
      pathIndex: 0
    };

    this.vehicles.set(vehicle.id, vehicle);
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
      const nextIntersection = this.findNextIntersection(vehicle);
      const trafficLight = nextIntersection
        ? this.trafficLightController.getLightState(nextIntersection.id)
        : undefined;
      const intersectionCenter = nextIntersection
        ? { x: nextIntersection.centerX, z: nextIntersection.centerZ }
        : null;

      const acceleration = VehicleAI.calculateAcceleration(
        vehicle,
        vehiclesArray,
        trafficLight,
        intersectionCenter
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
      }
    }

    this.statsTimer += deltaTime;
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

  calculateStatistics(): Statistics {
    const vehicles = Array.from(this.vehicles.values());
    const totalVehicles = vehicles.length;

    if (totalVehicles === 0) {
      return {
        totalVehicles: 0,
        averageSpeed: 0,
        congestionIndex: 0,
        averageWaitingTime: 0
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

    return {
      totalVehicles,
      averageSpeed,
      congestionIndex,
      averageWaitingTime
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
    this.intersections.forEach((i) => {
      i.totalWaitingTime = 0;
      i.vehiclesWaited = 0;
    });
  }
}
