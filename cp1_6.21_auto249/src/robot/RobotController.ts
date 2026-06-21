import * as THREE from 'three';
import type { RobotPose, LegPose, JointTransform } from '../types';

const DEG2RAD = Math.PI / 180;

export const LEG_CONFIG = {
  coxaLength: 0.4,
  femurLength: 1.0,
  tibiaLength: 1.2,
  bodyRadius: 1.2,
};

export const LEG_ANGLES = [0, 60, 120, 180, 240, 300];

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolatePose(
  from: RobotPose,
  to: RobotPose,
  t: number
): RobotPose {
  const eased = easeInOutCubic(t);
  return {
    legs: from.legs.map((fromLeg, i) => {
      const toLeg = to.legs[i];
      return {
        coxa: fromLeg.coxa + (toLeg.coxa - fromLeg.coxa) * eased,
        femur: fromLeg.femur + (toLeg.femur - fromLeg.femur) * eased,
        tibia: fromLeg.tibia + (toLeg.tibia - fromLeg.tibia) * eased,
      };
    }),
  };
}

export function getLegBasePosition(legIndex: number): [number, number, number] {
  const angle = LEG_ANGLES[legIndex] * DEG2RAD;
  const r = LEG_CONFIG.bodyRadius;
  return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
}

export function getLegBaseRotation(legIndex: number): THREE.Quaternion {
  const angle = LEG_ANGLES[legIndex] * DEG2RAD;
  const q = new THREE.Quaternion();
  q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
  return q;
}

export function computeLegTransforms(legPose: LegPose): {
  coxaJoint: JointTransform;
  femurJoint: JointTransform;
  tibiaJoint: JointTransform;
  tip: JointTransform;
} {
  const coxaAngle = (legPose.coxa - 90) * DEG2RAD;
  const femurAngle = (legPose.femur - 90) * DEG2RAD;
  const tibiaAngle = (legPose.tibia - 90) * DEG2RAD;

  const coxaQ = new THREE.Quaternion();
  coxaQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), coxaAngle);

  const coxaPos: [number, number, number] = [0, 0, 0];

  const femurOffset = new THREE.Vector3(0, 0, -LEG_CONFIG.coxaLength);
  femurOffset.applyQuaternion(coxaQ);
  const femurQ = new THREE.Quaternion();
  femurQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), femurAngle);
  const femurTotalQ = coxaQ.clone().multiply(femurQ);
  const femurPos: [number, number, number] = [femurOffset.x, femurOffset.y, femurOffset.z];

  const tibiaOffset = new THREE.Vector3(0, 0, -LEG_CONFIG.femurLength);
  tibiaOffset.applyQuaternion(femurQ);
  tibiaOffset.applyQuaternion(coxaQ);
  tibiaOffset.add(femurOffset);
  const tibiaQ = new THREE.Quaternion();
  tibiaQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tibiaAngle);
  const tibiaTotalQ = femurTotalQ.clone().multiply(tibiaQ);
  const tibiaPos: [number, number, number] = [tibiaOffset.x, tibiaOffset.y, tibiaOffset.z];

  const tipOffset = new THREE.Vector3(0, 0, -LEG_CONFIG.tibiaLength);
  tipOffset.applyQuaternion(tibiaQ);
  tipOffset.applyQuaternion(femurQ);
  tipOffset.applyQuaternion(coxaQ);
  tipOffset.add(tibiaOffset);
  const tipPos: [number, number, number] = [tipOffset.x, tipOffset.y, tipOffset.z];

  const qToArr = (q: THREE.Quaternion): [number, number, number, number] => [q.x, q.y, q.z, q.w];

  return {
    coxaJoint: { position: coxaPos, rotation: qToArr(coxaQ) },
    femurJoint: { position: femurPos, rotation: qToArr(femurTotalQ) },
    tibiaJoint: { position: tibiaPos, rotation: qToArr(tibiaTotalQ) },
    tip: { position: tipPos, rotation: qToArr(tibiaTotalQ) },
  };
}

export function getJointTransforms(pose: RobotPose) {
  return pose.legs.map((legPose, legIndex) => {
    const basePos = getLegBasePosition(legIndex);
    const baseRot = getLegBaseRotation(legIndex);
    const local = computeLegTransforms(legPose);

    const applyBase = (jt: JointTransform): JointTransform => {
      const pos = new THREE.Vector3(...jt.position);
      pos.applyQuaternion(baseRot);
      pos.add(new THREE.Vector3(...basePos));
      const rot = new THREE.Quaternion(...jt.rotation);
      const finalRot = baseRot.clone().multiply(rot);
      return {
        position: [pos.x, pos.y, pos.z],
        rotation: [finalRot.x, finalRot.y, finalRot.z, finalRot.w],
      };
    };

    return {
      basePosition: basePos,
      baseRotation: [baseRot.x, baseRot.y, baseRot.z, baseRot.w] as [number, number, number, number],
      coxaJoint: applyBase(local.coxaJoint),
      femurJoint: applyBase(local.femurJoint),
      tibiaJoint: applyBase(local.tibiaJoint),
      tip: applyBase(local.tip),
      local,
    };
  });
}
