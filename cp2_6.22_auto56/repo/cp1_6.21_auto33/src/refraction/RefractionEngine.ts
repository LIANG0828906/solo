import * as THREE from 'three';
import { SPECTRUM_COLORS, SpectrumColor } from '../utils/constants';

export interface RaySegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  wavelength: number;
  name: string;
  exitAngle: number;
}

export interface RefractionResult {
  segments: RaySegment[];
  whiteRayStart: THREE.Vector3;
  whiteRayEnd: THREE.Vector3;
}

function snellRefract(
  incidentDir: THREE.Vector3,
  normal: THREE.Vector3,
  n1: number,
  n2: number
): { direction: THREE.Vector3; totalReflection: boolean } {
  const eta = n1 / n2;
  const cosThetaI = -incidentDir.dot(normal);
  const sin2ThetaT = eta * eta * (1 - cosThetaI * cosThetaI);

  if (sin2ThetaT > 1.0) {
    return { direction: new THREE.Vector3(), totalReflection: true };
  }

  const cosThetaT = Math.sqrt(1 - sin2ThetaT);
  const refracted = new THREE.Vector3()
    .copy(incidentDir)
    .multiplyScalar(eta)
    .add(normal.clone().multiplyScalar(eta * cosThetaI - cosThetaT))
    .normalize();

  return { direction: refracted, totalReflection: false };
}

function calculatePrismFaces(
  position: THREE.Vector3,
  size: number,
  rotation: THREE.Euler
): { normal: THREE.Vector3; center: THREE.Vector3 }[] {
  const h = (size * Math.sqrt(3)) / 2;
  const depth = size * 0.8;

  const rawFaces = [
    {
      normal: new THREE.Vector3(0, 1, 0),
      center: new THREE.Vector3(0, h / 2, 0),
    },
    {
      normal: new THREE.Vector3(-Math.sqrt(3) / 2, -0.5, 0),
      center: new THREE.Vector3(-h / 2, -h / 4, 0),
    },
    {
      normal: new THREE.Vector3(Math.sqrt(3) / 2, -0.5, 0),
      center: new THREE.Vector3(h / 2, -h / 4, 0),
    },
    {
      normal: new THREE.Vector3(0, 0, 1),
      center: new THREE.Vector3(0, 0, depth / 2),
    },
    {
      normal: new THREE.Vector3(0, 0, -1),
      center: new THREE.Vector3(0, 0, -depth / 2),
    },
  ];

  const quaternion = new THREE.Quaternion().setFromEuler(rotation);

  return rawFaces.map((face) => ({
    normal: face.normal.clone().applyQuaternion(quaternion).normalize(),
    center: face.center.clone().applyQuaternion(quaternion).add(position),
  }));
}

function intersectRayPlane(
  rayOrigin: THREE.Vector3,
  rayDir: THREE.Vector3,
  planeCenter: THREE.Vector3,
  planeNormal: THREE.Vector3
): { point: THREE.Vector3; distance: number } | null {
  const denom = rayDir.dot(planeNormal);
  if (Math.abs(denom) < 1e-10) return null;

  const t = planeCenter.clone().sub(rayOrigin).dot(planeNormal) / denom;
  if (t <= 1e-4) return null;

  return {
    point: rayOrigin.clone().add(rayDir.clone().multiplyScalar(t)),
    distance: t,
  };
}

function getClosestFaceIntersection(
  rayOrigin: THREE.Vector3,
  rayDir: THREE.Vector3,
  faces: { normal: THREE.Vector3; center: THREE.Vector3 }[],
  excludeNormal?: THREE.Vector3
): { point: THREE.Vector3; normal: THREE.Vector3; distance: number } | null {
  let closest: { point: THREE.Vector3; normal: THREE.Vector3; distance: number } | null = null;

  for (const face of faces) {
    if (excludeNormal && face.normal.dot(excludeNormal) > 0.99) continue;

    const facing = rayDir.dot(face.normal) < 0;
    if (!facing) continue;

    const hit = intersectRayPlane(rayOrigin, rayDir, face.center, face.normal);
    if (hit && (!closest || hit.distance < closest.distance)) {
      closest = { point: hit.point, normal: face.normal, distance: hit.distance };
    }
  }

  return closest;
}

export class RefractionEngine {
  static calculatePrismRefraction(
    incidentOrigin: THREE.Vector3,
    incidentDirection: THREE.Vector3,
    prismPosition: THREE.Vector3,
    prismRotation: THREE.Euler,
    baseRefractiveIndex: number,
    prismSize: number
  ): RefractionResult {
    const faces = calculatePrismFaces(prismPosition, prismSize, prismRotation);
    const nAir = 1.0;

    const firstHit = getClosestFaceIntersection(
      incidentOrigin,
      incidentDirection,
      faces
    );

    if (!firstHit) {
      const farPoint = incidentOrigin
        .clone()
        .add(incidentDirection.clone().multiplyScalar(20));
      return {
        segments: [],
        whiteRayStart: incidentOrigin.clone(),
        whiteRayEnd: farPoint,
      };
    }

    const whiteRayStart = incidentOrigin.clone();
    const whiteRayEnd = firstHit.point.clone();
    const segments: RaySegment[] = [];

    for (const specColor of SPECTRUM_COLORS) {
      const n = baseRefractiveIndex * specColor.dispersionFactor;
      this.traceSpectrumRay(
        incidentDirection,
        firstHit,
        faces,
        nAir,
        n,
        specColor,
        segments
      );
    }

    return { segments, whiteRayStart, whiteRayEnd };
  }

  private static traceSpectrumRay(
    incidentDirection: THREE.Vector3,
    entryHit: { point: THREE.Vector3; normal: THREE.Vector3; distance: number },
    faces: { normal: THREE.Vector3; center: THREE.Vector3 }[],
    nAir: number,
    nPrism: number,
    specColor: SpectrumColor,
    segments: RaySegment[]
  ): void {
    const refract1 = snellRefract(
      incidentDirection.clone().normalize(),
      entryHit.normal,
      nAir,
      nPrism
    );

    if (refract1.totalReflection) return;

    const internalStart = entryHit.point.clone();
    const exitHit = getClosestFaceIntersection(
      internalStart,
      refract1.direction,
      faces,
      entryHit.normal
    );

    if (!exitHit) {
      const internalEnd = internalStart
        .clone()
        .add(refract1.direction.clone().multiplyScalar(10));
      segments.push({
        start: internalStart,
        end: internalEnd,
        color: specColor.color,
        wavelength: specColor.wavelength,
        name: specColor.name,
        exitAngle: 0,
      });
      return;
    }

    const internalEnd = exitHit.point.clone();

    const refract2 = snellRefract(
      refract1.direction,
      exitHit.normal,
      nPrism,
      nAir
    );

    let exitDir: THREE.Vector3;
    let exitAngle = 0;

    if (refract2.totalReflection) {
      exitDir = refract1.direction.clone();
    } else {
      exitDir = refract2.direction;
      const horizontalDir = new THREE.Vector3(exitDir.x, 0, exitDir.z).normalize();
      exitAngle = (Math.atan2(
        Math.abs(exitDir.x),
        Math.abs(horizontalDir.z || exitDir.z || 1)
      ) * 180) / Math.PI;
    }

    const externalEnd = internalEnd
      .clone()
      .add(exitDir.clone().multiplyScalar(8));

    segments.push({
      start: internalStart,
      end: internalEnd,
      color: specColor.color,
      wavelength: specColor.wavelength,
      name: specColor.name,
      exitAngle: 0,
    });

    segments.push({
      start: internalEnd,
      end: externalEnd,
      color: specColor.color,
      wavelength: specColor.wavelength,
      name: specColor.name,
      exitAngle,
    });
  }

  static calculateSphereRefraction(
    incidentOrigin: THREE.Vector3,
    incidentDirection: THREE.Vector3,
    spherePosition: THREE.Vector3,
    baseRefractiveIndex: number,
    radius: number
  ): RefractionResult {
    const nAir = 1.0;
    const dir = incidentDirection.clone().normalize();

    const oc = incidentOrigin.clone().sub(spherePosition);
    const b = 2 * oc.dot(dir);
    const c = oc.dot(oc) - radius * radius;
    const discriminant = b * b - 4 * c;

    if (discriminant < 0) {
      const farPoint = incidentOrigin
        .clone()
        .add(dir.clone().multiplyScalar(20));
      return {
        segments: [],
        whiteRayStart: incidentOrigin.clone(),
        whiteRayEnd: farPoint,
      };
    }

    const t1 = (-b - Math.sqrt(discriminant)) / 2;
    const t2 = (-b + Math.sqrt(discriminant)) / 2;

    if (t1 <= 0) {
      const farPoint = incidentOrigin
        .clone()
        .add(dir.clone().multiplyScalar(20));
      return {
        segments: [],
        whiteRayStart: incidentOrigin.clone(),
        whiteRayEnd: farPoint,
      };
    }

    const entryPoint = incidentOrigin.clone().add(dir.clone().multiplyScalar(t1));
    const whiteRayStart = incidentOrigin.clone();
    const whiteRayEnd = entryPoint.clone();
    const segments: RaySegment[] = [];

    for (const specColor of SPECTRUM_COLORS) {
      const n = baseRefractiveIndex * specColor.dispersionFactor;

      const entryNormal = entryPoint
        .clone()
        .sub(spherePosition)
        .normalize();

      const refract1 = snellRefract(dir, entryNormal, nAir, n);
      if (refract1.totalReflection) continue;

      const secondEntryPoint = entryPoint.clone();
      const oc2 = secondEntryPoint.clone().sub(spherePosition);
      const b2 = 2 * oc2.dot(refract1.direction);
      const c2 = oc2.dot(oc2) - radius * radius;
      const disc2 = b2 * b2 - 4 * c2;

      if (disc2 < 0) continue;

      const tExit = (-b2 + Math.sqrt(disc2)) / 2;
      if (tExit <= 0.001) continue;

      const exitPoint = secondEntryPoint
        .clone()
        .add(refract1.direction.clone().multiplyScalar(tExit));

      const exitNormal = exitPoint
        .clone()
        .sub(spherePosition)
        .normalize()
        .negate();

      const refract2 = snellRefract(
        refract1.direction,
        exitNormal,
        n,
        nAir
      );

      let exitDir: THREE.Vector3;
      let exitAngle = 0;

      if (refract2.totalReflection) {
        exitDir = refract1.direction.clone();
      } else {
        exitDir = refract2.direction;
        const horizontalDir = new THREE.Vector3(exitDir.x, 0, exitDir.z).normalize();
        exitAngle = (Math.atan2(
          Math.abs(exitDir.x),
          Math.abs(horizontalDir.z || exitDir.z || 1)
        ) * 180) / Math.PI;
      }

      const externalEnd = exitPoint
        .clone()
        .add(exitDir.clone().multiplyScalar(8));

      segments.push({
        start: entryPoint,
        end: exitPoint,
        color: specColor.color,
        wavelength: specColor.wavelength,
        name: specColor.name,
        exitAngle: 0,
      });

      segments.push({
        start: exitPoint,
        end: externalEnd,
        color: specColor.color,
        wavelength: specColor.wavelength,
        name: specColor.name,
        exitAngle,
      });
    }

    return { segments, whiteRayStart, whiteRayEnd };
  }
}
