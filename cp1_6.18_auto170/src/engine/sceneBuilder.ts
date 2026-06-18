import * as THREE from 'three';
import { Atom, Bond } from '../types';

const ATOM_MATERIAL_CONFIG = {
  roughness: 0.4,
  metalness: 0.1,
};

const BOND_CONFIG = {
  singleRadius: 0.08,
  doubleOffset: 0.12,
  opacity: 0.7,
  transparent: true,
};

const sphereGeometries = new Map<number, THREE.SphereGeometry>();
const cylinderGeometries = new Map<string, THREE.CylinderGeometry>();

function getSphereGeometry(radius: number): THREE.SphereGeometry {
  if (!sphereGeometries.has(radius)) {
    sphereGeometries.set(radius, new THREE.SphereGeometry(radius, 32, 32));
  }
  return sphereGeometries.get(radius)!;
}

function getCylinderGeometry(radius: number, height: number): THREE.CylinderGeometry {
  const key = `${radius}-${height}`;
  if (!cylinderGeometries.has(key)) {
    cylinderGeometries.set(key, new THREE.CylinderGeometry(radius, radius, height, 16));
  }
  return cylinderGeometries.get(key)!;
}

export interface BuildResult {
  group: THREE.Group;
  atomMeshes: Map<string, THREE.Mesh>;
  bondMeshes: THREE.Mesh[];
  center: THREE.Vector3;
  boundingRadius: number;
}

export function buildMoleculeGroup(atoms: Atom[], bonds: Bond[]): BuildResult {
  const group = new THREE.Group();
  const atomMeshes = new Map<string, THREE.Mesh>();
  const bondMeshes: THREE.Mesh[] = [];
  const positions: THREE.Vector3[] = [];

  const atomMap = new Map(atoms.map(a => [a.id, a]));

  atoms.forEach(atom => {
    const geometry = getSphereGeometry(atom.radius);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(atom.color),
      roughness: ATOM_MATERIAL_CONFIG.roughness,
      metalness: ATOM_MATERIAL_CONFIG.metalness,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { atomId: atom.id, element: atom.element };
    
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(atom.color),
      emissive: new THREE.Color(atom.color),
      emissiveIntensity: 0,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0,
    });
    
    const glowMesh = new THREE.Mesh(
      getSphereGeometry(atom.radius * 1.15),
      glowMaterial
    );
    glowMesh.position.copy(mesh.position);
    mesh.userData.glowMesh = glowMesh;
    mesh.userData.baseEmissive = 0;
    mesh.userData.targetEmissive = 0;
    
    group.add(mesh);
    group.add(glowMesh);
    atomMeshes.set(atom.id, mesh);
    positions.push(mesh.position.clone());
  });

  bonds.forEach(bond => {
    const fromAtom = atomMap.get(bond.from);
    const toAtom = atomMap.get(bond.to);
    if (!fromAtom || !toAtom) return;

    const fromPos = new THREE.Vector3(...fromAtom.position);
    const toPos = new THREE.Vector3(...toAtom.position);
    const direction = toPos.clone().sub(fromPos).normalize();
    const distance = fromPos.distanceTo(toPos);
    const midPoint = fromPos.clone().add(toPos).multiplyScalar(0.5);

    if (bond.type === 'single') {
      const bondMesh = createBondMesh(distance, midPoint, direction, 0x888888);
      group.add(bondMesh);
      bondMeshes.push(bondMesh);
    } else if (bond.type === 'double') {
      const perpDir = new THREE.Vector3(1, 0, 0);
      if (Math.abs(direction.dot(perpDir)) > 0.9) {
        perpDir.set(0, 1, 0);
      }
      perpDir.cross(direction).normalize();
      
      const offset = perpDir.multiplyScalar(BOND_CONFIG.doubleOffset);
      
      const bondMesh1 = createBondMesh(distance, midPoint.clone().add(offset), direction, 0x888888);
      const bondMesh2 = createBondMesh(distance, midPoint.clone().sub(offset), direction, 0x888888);
      
      group.add(bondMesh1);
      group.add(bondMesh2);
      bondMeshes.push(bondMesh1, bondMesh2);
    }
  });

  const center = new THREE.Vector3();
  positions.forEach(pos => center.add(pos));
  center.divideScalar(positions.length);

  let boundingRadius = 0;
  positions.forEach(pos => {
    const dist = pos.distanceTo(center);
    if (dist > boundingRadius) boundingRadius = dist;
  });

  group.position.sub(center);

  return { group, atomMeshes, bondMeshes, center, boundingRadius };
}

function createBondMesh(
  distance: number,
  position: THREE.Vector3,
  direction: THREE.Vector3,
  color: number
): THREE.Mesh {
  const geometry = getCylinderGeometry(BOND_CONFIG.singleRadius, distance);
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: BOND_CONFIG.transparent,
    opacity: BOND_CONFIG.opacity,
    roughness: 0.5,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  mesh.rotation.setFromQuaternion(quaternion);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}

export function disposeGroup(group: THREE.Group): void {
  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
