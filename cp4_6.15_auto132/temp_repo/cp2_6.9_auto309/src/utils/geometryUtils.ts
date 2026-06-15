import * as THREE from 'three';
import { PoseState } from '@/types';

export const createFigurePoints = (pose: PoseState): THREE.Vector2[] => {
  const { baseHeight, headRatio, shoulderRatio, waistCurve } = pose;
  const headHeight = baseHeight / headRatio;
  const totalHeight = baseHeight;
  
  const points: THREE.Vector2[] = [];
  const segments = 32;
  
  const shoulderWidth = 0.35 * shoulderRatio;
  const waistWidth = 0.22 * (1 - waistCurve * 0.4);
  const hipWidth = 0.3 * shoulderRatio;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * totalHeight;
    
    let radius: number;
    
    if (y < headHeight * 0.8) {
      const headT = y / (headHeight * 0.8);
      radius = 0.12 * (0.8 + 0.2 * Math.sin(headT * Math.PI));
    } else if (y < headHeight) {
      const neckT = (y - headHeight * 0.8) / (headHeight * 0.2);
      radius = 0.12 - 0.04 * neckT;
    } else if (y < headHeight + 0.15) {
      radius = 0.08;
    } else if (y < headHeight + 0.5) {
      const chestT = (y - headHeight - 0.15) / 0.35;
      const chestCurve = Math.sin(chestT * Math.PI);
      radius = 0.08 + (shoulderWidth - 0.08) * chestCurve * 0.5;
    } else if (y < headHeight + 1.0) {
      const waistT = (y - headHeight - 0.5) / 0.5;
      radius = shoulderWidth * 0.5 - (shoulderWidth * 0.5 - waistWidth) * waistT;
    } else if (y < headHeight + 1.5) {
      const hipT = (y - headHeight - 1.0) / 0.5;
      const hipCurve = Math.sin(hipT * Math.PI);
      radius = waistWidth + (hipWidth - waistWidth) * hipCurve;
    } else {
      const legT = (y - headHeight - 1.5) / (totalHeight - headHeight - 1.5);
      radius = hipWidth * (1 - legT * 0.6);
    }
    
    points.push(new THREE.Vector2(radius, y - totalHeight * 0.4));
  }
  
  return points;
};

export const createLatheGeometry = (
  points: THREE.Vector2[],
  segments: number = 16
): THREE.LatheGeometry => {
  return new THREE.LatheGeometry(points, segments);
};

export const createHeadGeometry = (pose: PoseState): THREE.SphereGeometry => {
  const headSize = pose.baseHeight / pose.headRatio * 0.5;
  return new THREE.SphereGeometry(headSize, 16, 12);
};

export const createArmGeometry = (): THREE.CylinderGeometry => {
  return new THREE.CylinderGeometry(0.04, 0.03, 0.6, 8);
};

export const calculateFigureBounds = (pose: PoseState): {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
} => {
  const height = pose.baseHeight;
  const width = 0.4 * pose.shoulderRatio;
  const depth = 0.3 * pose.shoulderRatio;
  
  return {
    minX: -width,
    maxX: width,
    minY: -height * 0.4,
    maxY: height * 0.6,
    minZ: -depth,
    maxZ: depth,
  };
};
