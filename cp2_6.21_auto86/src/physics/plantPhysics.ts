import * as THREE from 'three';
import type { Plant, PlantNode, SupportConnection, EnvironmentParams } from '../stores/plantStore';

const MAX_BEND_ANGLE = (25 * Math.PI) / 180;
const MAX_TRUNK_BEND_FOR_SUPPORT = (20 * Math.PI) / 180;
const SUPPORT_DETECTION_DISTANCE = 1.5;
const SPRING_CONSTANT = 2.0;
const LEAF_SWING_BASE_FREQ = 0.5;
const LEAF_SWING_MAX_FREQ = 2.0;



export function initPlant(position: THREE.Vector3): Plant {
  const nodes = new Map<string, PlantNode>();
  const plantId = `plant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const trunkId = `trunk-${plantId}`;
  const trunkNode: PlantNode = {
    id: trunkId,
    type: 'trunk',
    parentId: null,
    depth: 0,
    position: position.clone(),
    baseRotation: new THREE.Euler(0, 0, 0),
    currentRotation: new THREE.Euler(0, 0, 0),
    length: 5,
    radius: 0.3,
    elasticity: 0.8,
    damping: 0.3,
    windFactor: 1.0,
    windResistance: 0.1,
    angularVelocity: 0,
    currentBend: 0,
    children: [],
    growthProgress: 0,
    leafSwingPhase: 0,
  };
  nodes.set(trunkId, trunkNode);

  const branchAngles = [-0.5, 0, 0.5];
  const branchLengths = [2, 2.2, 1.8];

  for (let i = 0; i < 3; i++) {
    const branchId = `branch-${plantId}-${i}`;
    const branchNode: PlantNode = {
      id: branchId,
      type: 'branch',
      parentId: trunkId,
      depth: 1,
      position: new THREE.Vector3(),
      baseRotation: new THREE.Euler(0.3, branchAngles[i], 0),
      currentRotation: new THREE.Euler(0.3, branchAngles[i], 0),
      length: branchLengths[i],
      radius: 0.15,
      elasticity: 1.0,
      damping: 0.4,
      windFactor: 0.8,
      windResistance: 0.2,
      angularVelocity: 0,
      currentBend: 0,
      children: [],
      growthProgress: 0,
      leafSwingPhase: 0,
    };
    nodes.set(branchId, branchNode);
    trunkNode.children.push(branchId);

    for (let j = 0; j < 3; j++) {
      const leafId = `leaf-${plantId}-${i}-${j}`;
      const leafAngle = (j - 1) * 0.8 + branchAngles[i];
      const leafNode: PlantNode = {
        id: leafId,
        type: 'leaf',
        parentId: branchId,
        depth: 2,
        position: new THREE.Vector3(),
        baseRotation: new THREE.Euler(0.2, leafAngle, 0),
        currentRotation: new THREE.Euler(0.2, leafAngle, 0),
        length: 1.2,
        radius: 0,
        elasticity: 1.5,
        damping: 0.5,
        windFactor: 1.2,
        windResistance: 0.3,
        angularVelocity: 0,
        currentBend: 0,
        children: [],
        growthProgress: 0,
        leafSwingPhase: Math.random() * Math.PI * 2,
      };
      nodes.set(leafId, leafNode);
      branchNode.children.push(leafId);
    }
  }

  const plant: Plant = {
    id: plantId,
    position: position.clone(),
    nodes,
    rootNodeId: trunkId,
    maxDepth: 2,
  };

  updateNodePositions(plant);
  return plant;
}

export function updateNodePositions(plant: Plant): void {
  const { nodes, rootNodeId } = plant;
  const root = nodes.get(rootNodeId);
  if (!root) return;

  root.position.copy(plant.position);

  const stack: string[] = [rootNodeId];
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    const node = nodes.get(nodeId);
    if (!node) continue;

    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        const parentDir = new THREE.Vector3(0, 1, 0);
        parentDir.applyEuler(parent.currentRotation);
        parentDir.normalize();

        const nodeDir = new THREE.Vector3(0, 1, 0);
        nodeDir.applyEuler(node.baseRotation);
        nodeDir.applyEuler(new THREE.Euler(parent.currentBend, 0, 0, 'ZXY'));
        nodeDir.normalize();

        const endPos = parent.position.clone().add(
          parentDir.multiplyScalar(parent.length * parent.growthProgress)
        );

        node.position.copy(endPos);
      }
    }

    for (const childId of node.children) {
      stack.push(childId);
    }
  }
}

export function applyWind(
  plants: Plant[],
  environment: EnvironmentParams,
  dt: number,
  time: number,
  leafUpdateInterval: number,
  leafSwingIterations: number,
  frameCount: number
): Plant[] {
  const { windStrength, windDirection } = environment;
  
  const windRad = (windDirection * Math.PI) / 180;
  const windVector = new THREE.Vector3(
    Math.sin(windRad),
    0,
    Math.cos(windRad)
  ).normalize();

  return plants.map((plant) => {
    const newNodes = new Map(plant.nodes);
    const shouldUpdateLeaf = frameCount % leafUpdateInterval === 0;

    newNodes.forEach((node, nodeId) => {
      if (node.growthProgress < 0.1) return;

      const newNode = { ...node };

      if (node.type === 'leaf') {
        if (shouldUpdateLeaf) {
          const swingAngle = calculateLeafSwing(
            windStrength,
            time,
            node.leafSwingPhase,
            node.windFactor,
            leafSwingIterations
          );
          
          newNode.currentBend = swingAngle;
          
          const rot = node.baseRotation.clone();
          rot.x += swingAngle * 0.5;
          rot.z += swingAngle * 0.3;
          newNode.currentRotation = rot;
        }
      } else {
        const bendDirection = windVector.clone();
        const nodeNormal = new THREE.Vector3(0, 1, 0).applyEuler(node.currentRotation);
        const crossProduct = new THREE.Vector3().crossVectors(nodeNormal, bendDirection);
        const bendAxis = crossProduct.normalize();
        
        const leverArm = node.length * 0.5 * node.growthProgress;
        const angleFactor = Math.sin(windVector.angleTo(nodeNormal));
        const torque = windStrength * node.windFactor * leverArm * angleFactor;
        
        const effectiveTorque = torque * (1 / Math.max(0.1, node.elasticity)) * (1 - node.windResistance);
        
        const angularAcceleration = 
          -node.elasticity * node.currentBend 
          - node.damping * node.angularVelocity 
          + effectiveTorque;
        
        newNode.angularVelocity = node.angularVelocity + angularAcceleration * dt;
        newNode.currentBend = node.currentBend + newNode.angularVelocity * dt;
        
        newNode.currentBend = Math.max(-MAX_BEND_ANGLE, Math.min(MAX_BEND_ANGLE, newNode.currentBend));
        
        const newRot = node.baseRotation.clone();
        if (Math.abs(bendAxis.y) < 0.9) {
          newRot.x += newNode.currentBend * bendAxis.z;
          newRot.z += newNode.currentBend * -bendAxis.x;
        } else {
          newRot.x += newNode.currentBend;
        }
        newNode.currentRotation = newRot;
      }

      newNodes.set(nodeId, newNode);
    });

    const updatedPlant = { ...plant, nodes: newNodes };
    updateNodePositions(updatedPlant);
    return updatedPlant;
  });
}

function calculateLeafSwing(
  windStrength: number,
  time: number,
  phase: number,
  windFactor: number,
  iterations: number
): number {
  const normalizedWind = windStrength / 20;
  const amplitude = normalizedWind * 0.6 * windFactor;
  
  const baseFreq = LEAF_SWING_BASE_FREQ + (LEAF_SWING_MAX_FREQ - LEAF_SWING_BASE_FREQ) * normalizedWind;
  
  let totalSwing = 0;
  for (let i = 0; i < iterations; i++) {
    const freq = baseFreq * (1 + i * 0.3);
    const amp = amplitude * Math.pow(0.5, i);
    totalSwing += amp * Math.sin(time * freq * Math.PI * 2 + phase + i * 0.5);
  }
  
  return totalSwing;
}

export function applyGravity(
  plants: Plant[],
  environment: EnvironmentParams,
  dt: number
): { plants: Plant[]; environment: EnvironmentParams } {
  const { gravityDirection, growthDirection, targetGrowthDirection } = environment;
  
  const gravityMag = gravityDirection.length();
  if (gravityMag < 0.001) {
    return { plants, environment };
  }

  const gravityHorizontal = new THREE.Vector3(gravityDirection.x, 0, gravityDirection.z);
  const gravityHorizontalMag = gravityHorizontal.length();
  
  const newGrowthDir = growthDirection.clone();
  const baseSpeed = 0.5;
  const growthSpeed = baseSpeed * gravityHorizontalMag;
  
  if (gravityHorizontalMag > 0.01) {
    const tiltAmount = growthSpeed * dt;
    const tiltDir = gravityHorizontal.clone().normalize();
    
    newGrowthDir.x += tiltDir.x * tiltAmount;
    newGrowthDir.z += tiltDir.z * tiltAmount;
    newGrowthDir.normalize();
  }

  const targetDir = targetGrowthDirection.clone().normalize();
  const transitionSpeed = 1.0;
  newGrowthDir.lerp(targetDir, transitionSpeed * dt);
  newGrowthDir.normalize();

  const updatedPlants = plants.map((plant) => {
    const newNodes = new Map(plant.nodes);
    const rootNode = newNodes.get(plant.rootNodeId);
    
    if (rootNode && rootNode.type === 'trunk') {
      const newRoot = { ...rootNode };
      
      const targetEuler = dirToEuler(newGrowthDir);
      
      const currentBase = rootNode.baseRotation.clone();
      const lerpFactor = 2 * dt;
      
      const newBase = new THREE.Euler(
        THREE.MathUtils.lerp(currentBase.x, targetEuler.x, lerpFactor),
        THREE.MathUtils.lerp(currentBase.y, targetEuler.y, lerpFactor),
        THREE.MathUtils.lerp(currentBase.z, targetEuler.z, lerpFactor)
      );
      
      newRoot.baseRotation = newBase;
      newNodes.set(rootNode.id, newRoot);
    }

    return { ...plant, nodes: newNodes };
  });

  const newEnvironment = {
    ...environment,
    growthDirection: newGrowthDir,
  };

  return { plants: updatedPlants, environment: newEnvironment };
}

function dirToEuler(dir: THREE.Vector3): THREE.Euler {
  const normalized = dir.clone().normalize();
  const euler = new THREE.Euler();
  
  euler.x = Math.asin(-normalized.y);
  euler.y = Math.atan2(normalized.x, normalized.z);
  euler.z = 0;
  
  return euler;
}

export function detectCollision(
  plants: Plant[],
  existingConnections: SupportConnection[]
): SupportConnection[] {
  const newConnections: SupportConnection[] = [];
  const existingIds = new Set(existingConnections.map((c) => c.id));
  const branchNodes: { plant: Plant; node: PlantNode }[] = [];

  for (const plant of plants) {
    const root = plant.nodes.get(plant.rootNodeId);
    if (!root) continue;
    
    const trunkBend = Math.abs(root.currentBend);
    if (trunkBend < MAX_TRUNK_BEND_FOR_SUPPORT) continue;

    plant.nodes.forEach((node) => {
      if (node.type === 'branch' && node.growthProgress > 0.8) {
        branchNodes.push({ plant, node });
      }
    });
  }

  for (let i = 0; i < branchNodes.length; i++) {
    for (let j = i + 1; j < branchNodes.length; j++) {
      const a = branchNodes[i];
      const b = branchNodes[j];
      
      if (a.plant.id === b.plant.id) continue;

      const distance = a.node.position.distanceTo(b.node.position);
      
      if (distance < SUPPORT_DETECTION_DISTANCE && distance > 0.1) {
        const connId = `${a.plant.id}-${a.node.id}-${b.plant.id}-${b.node.id}`;
        const reverseId = `${b.plant.id}-${b.node.id}-${a.plant.id}-${a.node.id}`;
        
        if (!existingIds.has(connId) && !existingIds.has(reverseId)) {
          const tension = Math.max(0.5, Math.min(2.0, 2.0 - (distance - 1.0) * 1.5));
          
          newConnections.push({
            id: connId,
            plantAId: a.plant.id,
            nodeAId: a.node.id,
            plantBId: b.plant.id,
            nodeBId: b.node.id,
            tension,
            springRestLength: distance,
            springConstant: SPRING_CONSTANT,
            damping: 0.8,
          });
        }
      }
    }
  }

  return newConnections;
}

export function applySupportForces(
  plants: Plant[],
  connections: SupportConnection[],
  dt: number
): Plant[] {
  if (connections.length === 0) return plants;

  const plantMap = new Map(plants.map((p) => [p.id, { ...p, nodes: new Map(p.nodes) }]));

  for (const conn of connections) {
    const plantA = plantMap.get(conn.plantAId);
    const plantB = plantMap.get(conn.plantBId);
    
    if (!plantA || !plantB) continue;

    const nodeA = plantA.nodes.get(conn.nodeAId);
    const nodeB = plantB.nodes.get(conn.nodeBId);
    
    if (!nodeA || !nodeB) continue;

    const posA = nodeA.position.clone();
    const posB = nodeB.position.clone();
    const currentDistance = posA.distanceTo(posB);
    
    if (currentDistance < 1.2) continue;
    if (currentDistance < 0.01) continue;

    const midPoint = posA.clone().lerp(posB, 0.5);

    let totalForceA = new THREE.Vector3();
    let totalForceB = new THREE.Vector3();

    if (currentDistance > 1.5) {
      const tensionForceMag = conn.springConstant * (currentDistance - 1.5);
      
      const tensionDirA = midPoint.clone().sub(posA).normalize();
      const tensionDirB = midPoint.clone().sub(posB).normalize();
      
      totalForceA.add(tensionDirA.multiplyScalar(tensionForceMag));
      totalForceB.add(tensionDirB.multiplyScalar(tensionForceMag));
    }

    const dampingForce = conn.damping * (nodeA.angularVelocity - nodeB.angularVelocity) * 0.1;
    const dampingDir = posB.clone().sub(posA).normalize();
    
    totalForceA.add(dampingDir.clone().multiplyScalar(dampingForce * 0.5));
    totalForceB.add(dampingDir.clone().multiplyScalar(-dampingForce * 0.5));

    applyForceToNode(plantA, nodeA, totalForceA, dt);
    applyForceToNode(plantB, nodeB, totalForceB, dt);
  }

  return Array.from(plantMap.values());
}

function applyForceToNode(
  plant: Plant,
  node: PlantNode,
  force: THREE.Vector3,
  dt: number
): void {
  let current = node;
  
  while (current.parentId) {
    const parent = plant.nodes.get(current.parentId);
    if (!parent) break;

    const lever = node.position.clone().sub(parent.position);
    const torque = lever.cross(force);
    
    const torqueMag = torque.length();
    if (torqueMag > 0.001) {
      const parentNode = plant.nodes.get(current.parentId);
      if (parentNode) {
        const updatedParent = { ...parentNode };
        
        const bendAxis = torque.clone().normalize();
        const effectiveTorque = torqueMag / Math.max(0.1, parentNode.elasticity);
        
        const angularAcc = effectiveTorque - parentNode.damping * parentNode.angularVelocity;
        updatedParent.angularVelocity = parentNode.angularVelocity + angularAcc * dt;
        updatedParent.currentBend = parentNode.currentBend + updatedParent.angularVelocity * dt;
        
        const maxBend = parentNode.type === 'trunk' ? MAX_BEND_ANGLE : MAX_BEND_ANGLE * 1.2;
        updatedParent.currentBend = Math.max(-maxBend, Math.min(maxBend, updatedParent.currentBend));
        
        const newRot = parentNode.baseRotation.clone();
        if (Math.abs(bendAxis.y) < 0.9) {
          newRot.x += updatedParent.currentBend * bendAxis.z;
          newRot.z += updatedParent.currentBend * -bendAxis.x;
        } else {
          newRot.x += updatedParent.currentBend;
        }
        updatedParent.currentRotation = newRot;
        
        plant.nodes.set(current.parentId, updatedParent);
      }
    }

    current = parent;
  }
}

function getLevelProgress(
  elapsed: number,
  level: number,
  totalLevels: number,
  totalDuration: number
): number {
  const levelDuration = totalDuration / totalLevels;
  const levelStartTime = level * levelDuration;

  if (elapsed < levelStartTime) {
    return 0;
  }

  const levelElapsed = elapsed - levelStartTime;
  const rawProgress = Math.min(1, levelElapsed / levelDuration);
  return easeOutCubic(rawProgress);
}

export function updateGrowthAnimation(
  plants: Plant[],
  elapsed: number,
  totalDuration: number = 3
): { plants: Plant[]; isComplete: boolean } {
  const totalLevels = 3;

  const newPlants = plants.map((plant) => {
    const newNodes = new Map(plant.nodes);

    newNodes.forEach((node, nodeId) => {
      const progress = getLevelProgress(elapsed, node.depth, totalLevels, totalDuration);
      newNodes.set(nodeId, { ...node, growthProgress: progress });
    });

    const updatedPlant = { ...plant, nodes: newNodes };
    updateNodePositions(updatedPlant);
    return updatedPlant;
  });

  const isComplete = elapsed >= totalDuration;

  return { plants: newPlants, isComplete };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function updateSupportConnectionLengths(
  plants: Plant[],
  connections: SupportConnection[]
): SupportConnection[] {
  const plantMap = new Map(plants.map((p) => [p.id, p]));

  return connections.map((conn) => {
    const plantA = plantMap.get(conn.plantAId);
    const plantB = plantMap.get(conn.plantBId);
    
    if (!plantA || !plantB) return conn;

    const nodeA = plantA.nodes.get(conn.nodeAId);
    const nodeB = plantB.nodes.get(conn.nodeBId);
    
    if (!nodeA || !nodeB) return conn;

    const distance = nodeA.position.distanceTo(nodeB.position);
    return { ...conn, tension: Math.max(0.5, Math.min(2.0, 2.0 - Math.max(0, distance - 1.0) * 1.5)) };
  });
}
