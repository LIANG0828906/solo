import {
  VehicleState,
  TrafficLightState,
  LaneDirection,
  FOLLOW_DISTANCE,
  ACCELERATION,
  DECELERATION,
  STOP_LINE_DISTANCE,
  TURN_INDICATOR_LEAD_TIME,
  LANE_WIDTH,
  TURN_RADIUS,
  TURN_SPEED
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

  static smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static calculateSmoothDeceleration(
    currentSpeed: number,
    targetSpeed: number,
    smoothTime: number,
    deltaTime: number
  ): number {
    const speedDiff = targetSpeed - currentSpeed;
    if (Math.abs(speedDiff) < 0.01) return 0;

    const maxChange = (DECELERATION * 0.8) * deltaTime;
    const smoothedChange = this.lerp(
      -maxChange,
      maxChange,
      this.smoothStep(-1, 1, speedDiff / Math.max(Math.abs(speedDiff), 0.1))
    );

    const desiredAccel = speedDiff / Math.max(smoothTime, deltaTime);
    const clampedAccel = Math.max(-DECELERATION, Math.min(ACCELERATION, desiredAccel));

    const progress = this.smoothStep(0, smoothTime * 2, Math.abs(speedDiff) / Math.max(currentSpeed, 1));
    return this.lerp(smoothedChange, clampedAccel, 0.3 + progress * 0.7);
  }

  static calculateAcceleration(
    vehicle: VehicleState,
    allVehicles: VehicleState[],
    trafficLight: TrafficLightState | undefined,
    intersectionCenter: { x: number; z: number } | null,
    deltaTime: number
  ): number {
    const vehicleAhead = this.findVehicleAhead(vehicle, allVehicles);
    const distanceToStopLine = intersectionCenter
      ? this.calculateDistanceToStopLine(vehicle, intersectionCenter)
      : Infinity;

    const shouldStop = this.shouldStopForLight(vehicle, trafficLight, distanceToStopLine);

    if (vehicle.isTurning) {
      const targetSpeed = TURN_SPEED;
      if (vehicle.speed > targetSpeed) {
        return this.calculateSmoothDeceleration(vehicle.speed, targetSpeed, 0.8, deltaTime);
      }
      return 0;
    }

    if (shouldStop && distanceToStopLine < 50) {
      const stopDistance = distanceToStopLine - 2;
      if (stopDistance <= 0) {
        return this.calculateSmoothDeceleration(vehicle.speed, 0, 0.5, deltaTime);
      }
      const idealStopSpeed = Math.sqrt(Math.max(0, 2 * DECELERATION * 0.6 * stopDistance));
      const targetSpeed = Math.min(vehicle.targetSpeed, idealStopSpeed);
      const smoothTime = this.smoothStep(2, 20, stopDistance) * 1.5 + 0.3;
      return this.calculateSmoothDeceleration(vehicle.speed, targetSpeed, smoothTime, deltaTime);
    }

    if (vehicle.nextTurn !== 'straight' && intersectionCenter && distanceToStopLine < 30) {
      const targetSpeed = TURN_SPEED * 1.5;
      if (vehicle.speed > targetSpeed) {
        const smoothTime = this.smoothStep(5, 30, distanceToStopLine) * 1.5 + 0.5;
        return this.calculateSmoothDeceleration(vehicle.speed, targetSpeed, smoothTime, deltaTime);
      }
    }

    if (vehicleAhead) {
      const distance = this.calculateDistance(vehicle, vehicleAhead);

      if (distance < FOLLOW_DISTANCE * 2) {
        const distanceProgress = this.smoothStep(FOLLOW_DISTANCE * 2, FOLLOW_DISTANCE * 0.3, distance);
        const targetSpeed = vehicleAhead.speed * (0.85 + distanceProgress * 0.1);

        if (distance < FOLLOW_DISTANCE * 0.3) {
          return this.calculateSmoothDeceleration(vehicle.speed, Math.min(vehicleAhead.speed * 0.5, 2), 0.4, deltaTime);
        }

        if (vehicle.speed > targetSpeed) {
          const speedDiff = vehicle.speed - vehicleAhead.speed;
          const urgency = this.smoothStep(FOLLOW_DISTANCE, FOLLOW_DISTANCE * 0.4, distance) *
                          this.smoothStep(0, 10, speedDiff * 3.6);
          const smoothTime = this.lerp(2.0, 0.5, urgency);
          return this.calculateSmoothDeceleration(vehicle.speed, targetSpeed, smoothTime, deltaTime);
        }

        if (distance > FOLLOW_DISTANCE && vehicle.speed < vehicle.targetSpeed) {
          const accelProgress = this.smoothStep(FOLLOW_DISTANCE, FOLLOW_DISTANCE * 1.8, distance);
          const targetAccel = ACCELERATION * this.lerp(0.3, 1.0, accelProgress);
          return targetAccel;
        }
      } else if (distance > FOLLOW_DISTANCE * 3 && vehicle.speed < vehicle.targetSpeed) {
        const accelProgress = this.smoothStep(0, vehicle.targetSpeed, vehicle.speed);
        return ACCELERATION * this.lerp(1.0, 0.6, accelProgress);
      }
    }

    if (vehicle.speed < vehicle.targetSpeed * 0.95) {
      const accelProgress = this.smoothStep(0, vehicle.targetSpeed, vehicle.speed);
      return ACCELERATION * this.lerp(1.0, 0.6, accelProgress);
    } else if (vehicle.speed > vehicle.targetSpeed * 1.1) {
      return this.calculateSmoothDeceleration(vehicle.speed, vehicle.targetSpeed, 1.5, deltaTime);
    }

    const speedError = vehicle.targetSpeed - vehicle.speed;
    return speedError * 0.5;
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

  static getTurnCenter(
    vehicle: VehicleState,
    intersectionCenter: { x: number; z: number },
    turn: 'left' | 'right'
  ): { x: number; z: number } {
    const dirVec = this.getDirectionVector(vehicle.direction);
    const perpX = -dirVec.z;
    const perpZ = dirVec.x;

    const lateralOffset = TURN_RADIUS + LANE_WIDTH * 0.5;
    const sign = turn === 'left' ? -1 : 1;

    return {
      x: intersectionCenter.x + perpX * lateralOffset * sign,
      z: intersectionCenter.z + perpZ * lateralOffset * sign
    };
  }

  static getTurnAngles(
    currentDirection: LaneDirection,
    turn: 'left' | 'right'
  ): { startAngle: number; endAngle: number } {
    const startAngle = this.getRotationForDirection(currentDirection);
    const newDirection = this.getTurnDirection(currentDirection, turn);
    const endAngle = this.getRotationForDirection(newDirection);

    return { startAngle, endAngle };
  }

  static updateTurnPosition(
    vehicle: VehicleState,
    deltaTime: number
  ): void {
    if (!vehicle.isTurning || !vehicle.turnCenter) return;

    const angularSpeed = TURN_SPEED / TURN_RADIUS;
    const angleDelta = angularSpeed * deltaTime;

    const { turnStartAngle, turnEndAngle } = vehicle;
    const angleDiff = turnEndAngle - turnStartAngle;
    const turnDirection = angleDiff > 0 ? 1 : -1;

    vehicle.turnProgress += angleDelta * turnDirection;

    const currentAngle = turnStartAngle + vehicle.turnProgress;
    const normalizedAngleDiff = Math.abs(angleDiff);
    const progress = Math.abs(vehicle.turnProgress) / normalizedAngleDiff;

    vehicle.rotation = currentAngle;

    const radius = TURN_RADIUS + LANE_WIDTH * 0.5;
    const angleFromCenter = currentAngle - Math.PI / 2 * turnDirection;
    vehicle.position.x = vehicle.turnCenter.x + Math.cos(angleFromCenter) * radius;
    vehicle.position.z = vehicle.turnCenter.z + Math.sin(angleFromCenter) * radius;

    if (progress >= 1.0) {
      vehicle.isTurning = false;
      vehicle.turnProgress = 0;
      vehicle.turnCenter = null;
      vehicle.rotation = turnEndAngle;
      vehicle.direction = vehicle.turnDirection;
      vehicle.turnIndicatorActive = false;
      vehicle.turnIndicatorTimer = 0;
    }
  }
}
