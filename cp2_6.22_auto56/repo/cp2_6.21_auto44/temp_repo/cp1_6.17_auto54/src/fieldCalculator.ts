import type { Charge } from './chargeSystem';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

const K = 8.988e9;

function subtractVectors(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalizeVector(v: Vector3): Vector3 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / mag,
    y: v.y / mag,
    z: v.z / mag,
  };
}

function scaleVector(v: Vector3, scalar: number): Vector3 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
    z: v.z * scalar,
  };
}

export function computeElectricField(
  charges: Charge[],
  position: Vector3
): Vector3 {
  const field: Vector3 = { x: 0, y: 0, z: 0 };

  for (const charge of charges) {
    const chargePos: Vector3 = {
      x: charge.position.x,
      y: charge.position.y,
      z: charge.position.z,
    };

    const direction = subtractVectors(position, chargePos);
    const distance = vectorMagnitude(direction);

    if (distance < 0.1) continue;

    const unitDir = normalizeVector(direction);
    const magnitude = (K * Math.abs(charge.charge)) / (distance * distance);
    const sign = charge.charge >= 0 ? 1 : -1;

    field.x += unitDir.x * magnitude * sign;
    field.y += unitDir.y * magnitude * sign;
    field.z += unitDir.z * magnitude * sign;
  }

  return field;
}

export function computePotential(
  charges: Charge[],
  position: Vector3
): number {
  let potential = 0;

  for (const charge of charges) {
    const chargePos: Vector3 = {
      x: charge.position.x,
      y: charge.position.y,
      z: charge.position.z,
    };

    const direction = subtractVectors(position, chargePos);
    const distance = vectorMagnitude(direction);

    if (distance < 0.1) {
      return charge.charge >= 0 ? Infinity : -Infinity;
    }

    potential += (K * charge.charge) / distance;
  }

  return potential;
}

export function traceFieldLine(
  charges: Charge[],
  startPosition: Vector3,
  direction: 1 | -1,
  maxSteps: number = 500,
  stepSize: number = 2,
  maxDistance: number = 500
): Vector3[] {
  const points: Vector3[] = [];
  let currentPos: Vector3 = { ...startPosition };

  for (let i = 0; i < maxSteps; i++) {
    points.push({ ...currentPos });

    const field = computeElectricField(charges, currentPos);
    const fieldMag = vectorMagnitude(field);

    if (fieldMag < 1e-10) break;

    const dir = normalizeVector(field);
    const step = scaleVector(dir, stepSize * direction);

    currentPos = {
      x: currentPos.x + step.x,
      y: currentPos.y + step.y,
      z: currentPos.z + step.z,
    };

    const distFromOrigin = vectorMagnitude(currentPos);
    if (distFromOrigin > maxDistance) break;

    let nearCharge = false;
    for (const charge of charges) {
      const chargePos: Vector3 = {
        x: charge.position.x,
        y: charge.position.y,
        z: charge.position.z,
      };
      const dist = vectorMagnitude(subtractVectors(currentPos, chargePos));
      if (dist < 1.5) {
        nearCharge = true;
        if ((direction === 1 && charge.charge < 0) ||
            (direction === -1 && charge.charge > 0)) {
          points.push(chargePos);
        }
        break;
      }
    }
    if (nearCharge) break;
  }

  return points;
}
