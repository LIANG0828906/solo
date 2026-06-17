import {
  VehicleState,
  TrafficLightState,
  LaneDirection,
  FOLLOW_DISTANCE,
  ACCELERATION,
  DECELERATION,
  STOP_LINE_DISTANCE,
  TURN_INDICATOR_LEAD_TIME,
  LANE_WIDTH
} from './types';

export class VehicleAI {
  static getDirectionVector(direction: LaneDirection): { x: number; z: number } {
    switch (direction) {
      case 'east': return { x: 1, z: 0 };
      case 'west': return { x: -1, z: 0 };
      case 'north': return { x: 0, z: -1 };
      case 'south': return { x: 0, z: 1 };
    }
  }

  static getLateralOffset(direction: LaneDirection, lane: number): { x: number; z: number } {
    const offset = (lane - 1.5) * LANE_WIDTH;
    switch (direction) {
      case 'east': return { x: 0, z: offset };
      case 'west': return { x: 0, z: -offset };
      case 'north': return { x: -offset, z: 0 };
      case 'south': return { x: offset, z: 0 };
    }
  }

  static calculateDistance(v1: VehicleState, v2: VehicleState): number {
    const dx = v1.position.x - v2.position.x;
    const dz = v1.position.z - v2.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  static findVehicleAhead(
    vehicle: VehicleState,
    allVehicles: VehicleState[]
  ): VehicleState | null {
    const dir = this.getDirectionVector(vehicle.direction);
    let closestVehicle: VehicleState | null = null;
    let closestDistance = Infinity;

    for (const other of allVehicles) {
      if (other.id === vehicle.id) continue;
      if (other.direction !== vehicle.direction) continue;

      const dx = other.position.x - vehicle.position.x;
      const dz = other.position.z - vehicle.position.z;
      const forwardDistance = dx * dir.x + dz * dir.z;

      if (forwardDistance > 0 && forwardDistance < closestDistance) {
        const lateralOffset = Math.abs(dx * -dir.z + dz * dir.x);
        if (lateralOffset < LANE_WIDTH * 1.5) {
          closestDistance = forwardDistance;
          closestVehicle = other;
        }
      }
    }

    return closestVehicle;
  }

  static calculateDistanceToStopLine(
    vehicle: VehicleState,
    intersectionCenter: { x: number; z: number }
  ): number {
    const dir = this.getDirectionVector(vehicle.direction);
    const dx = intersectionCenter.x - vehicle.position.x;
    const dz = intersectionCenter.z - vehicle.position.z;
    const distance = dx * dir.x + dz * dir.z;
    return Math.max(0, distance - STOP_LINE_DISTANCE);
  }

  static shouldStopForLight(
    vehicle: VehicleState,
    trafficLight: TrafficLightState | undefined,
    distanceToStopLine: number
  ): boolean {
    if (!trafficLight) return false;
    if (distanceToStopLine < 0) return false;

    const isEastWest = vehicle.direction === 'east' || vehicle.direction === 'west';
    const lightState = isEastWest ? trafficLight.eastWest : trafficLight.northSouth;

    if (lightState.red) return true;
    if (lightState.yellow && distanceToStopLine > 5) return true;

    return false;
  }

  static calculateAcceleration(
    vehicle: VehicleState,
    allVehicles: VehicleState[],
    trafficLight: TrafficLightState | undefined,
    intersectionCenter: { x: number; z: number } | null
  ): number {
    const vehicleAhead = this.findVehicleAhead(vehicle, allVehicles);
    const distanceToStopLine = intersectionCenter
      ? this.calculateDistanceToStopLine(vehicle, intersectionCenter)
      : Infinity;

    const shouldStop = this.shouldStopForLight(vehicle, trafficLight, distanceToStopLine);

    if (shouldStop && distanceToStopLine < 50) {
      const stopDistance = distanceToStopLine - 2;
      if (stopDistance <= 0) {
        return -DECELERATION * 2;
      }
      const decelerationNeeded = (vehicle.speed * vehicle.speed) / (2 * stopDistance);
      return -Math.min(decelerationNeeded, DECELERATION * 1.5);
    }

    if (vehicleAhead) {
      const distance = this.calculateDistance(vehicle, vehicleAhead);
      if (distance < FOLLOW_DISTANCE) {
        const relativeSpeed = vehicle.speed - vehicleAhead.speed;
        if (relativeSpeed > 0 || distance < FOLLOW_DISTANCE * 0.5) {
          const targetSpeed = vehicleAhead.speed * 0.9;
          if (vehicle.speed > targetSpeed) {
            return -DECELERATION * 0.5;
          }
        }
        if (distance < FOLLOW_DISTANCE * 0.3) {
          return -DECELERATION;
        }
      }
    }

    if (vehicle.speed < vehicle.targetSpeed) {
      return ACCELERATION;
    } else if (vehicle.speed > vehicle.targetSpeed * 1.1) {
      return -DECELERATION * 0.3;
    }

    return 0;
  }

  static checkTurnIndicator(
    vehicle: VehicleState,
    distanceToIntersection: number
  ): boolean {
    if (vehicle.nextTurn === 'straight') return false;
    return distanceToIntersection < TURN_INDICATOR_LEAD_TIME * vehicle.targetSpeed;
  }

  static getRotationForDirection(direction: LaneDirection): number {
    switch (direction) {
      case 'east': return 0;
      case 'south': return Math.PI / 2;
      case 'west': return Math.PI;
      case 'north': return -Math.PI / 2;
    }
  }

  static getTurnDirection(
    currentDirection: LaneDirection,
    turn: 'left' | 'right' | 'straight'
  ): LaneDirection {
    const directions: LaneDirection[] = ['north', 'east', 'south', 'west'];
    const currentIndex = directions.indexOf(currentDirection);

    switch (turn) {
      case 'left':
        return directions[(currentIndex + 3) % 4];
      case 'right':
        return directions[(currentIndex + 1) % 4];
      case 'straight':
        return currentDirection;
    }
  }

  static updateTurnIndicator(vehicle: VehicleState, deltaTime: number): void {
    if (vehicle.turnIndicatorActive) {
      vehicle.turnIndicatorTimer += deltaTime;
    }
  }

  static isTurnIndicatorBlinkOn(vehicle: VehicleState): boolean {
    if (!vehicle.turnIndicatorActive) return false;
    return Math.floor(vehicle.turnIndicatorTimer * 2) % 2 === 0;
  }
}
