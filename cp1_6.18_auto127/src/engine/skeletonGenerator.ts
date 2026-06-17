import * as THREE from 'three';
import type { SpeciesData, BoneNode, BoneConnection } from '@/data/speciesData';
import { defaultConfig } from '@/data/skeletonConfig';
import type { PointCloudPoint } from '@/stores/appStore';

export interface SkeletonObjects {
  joints: THREE.Mesh[];
  bones: THREE.Mesh[];
  labels: THREE.Sprite[];
  group: THREE.Group;
  jointDataMap: Map<THREE.Mesh, BoneNode>;
}

export function createSkeleton(
  speciesData: SpeciesData,
  density: number,
  thickness: number,
  showLabels: boolean
): SkeletonObjects {
  const group = new THREE.Group();
  const joints: THREE.Mesh[] = [];
  const bones: THREE.Mesh[] = [];
  const labels: THREE.Sprite[] = [];
  const jointDataMap = new Map<THREE.Mesh, BoneNode>();

  const jointRadius = defaultConfig.jointRadius * thickness;
  const boneRadius = defaultConfig.boneRadius * thickness;
  const widthSegments = Math.max(4, Math.floor(density * 1.2));
  const heightSegments = Math.max(2, Math.floor(density * 0.8));

  const jointGeometry = new THREE.SphereGeometry(jointRadius, widthSegments, heightSegments);
  const jointMaterial = new THREE.MeshStandardMaterial({
    color: defaultConfig.jointColor,
    metalness: 0.3,
    roughness: 0.5,
  });

  const boneMaterial = new THREE.MeshStandardMaterial({
    color: defaultConfig.boneColor,
    metalness: 0.2,
    roughness: 0.6,
  });

  const jointPositionMap = new Map<string, THREE.Vector3>();

  speciesData.nodes.forEach((node) => {
    const joint = new THREE.Mesh(jointGeometry.clone(), jointMaterial.clone());
    joint.position.set(...node.position);
    joint.userData.nodeId = node.id;
    joints.push(joint);
    group.add(joint);
    jointPositionMap.set(node.id, joint.position.clone());
    jointDataMap.set(joint, node);

    if (showLabels) {
      const label = createLabelSprite(node.name);
      label.position.set(node.position[0], node.position[1] + jointRadius + 0.1, node.position[2]);
      labels.push(label);
      group.add(label);
    }
  });

  speciesData.connections.forEach((connection) => {
    const fromPos = jointPositionMap.get(connection.from);
    const toPos = jointPositionMap.get(connection.to);
    if (fromPos && toPos) {
      const bone = createBone(fromPos, toPos, boneRadius, boneMaterial.clone());
      bones.push(bone);
      group.add(bone);
    }
  });

  return { joints, bones, labels, group, jointDataMap };
}

export function createPointCloudSkeleton(
  points: PointCloudPoint[],
  density: number,
  thickness: number
): { group: THREE.Group; points: THREE.Points } {
  const group = new THREE.Group();
  const pointCount = Math.min(points.length, Math.floor(200 + density * 100));
  const step = Math.max(1, Math.floor(points.length / pointCount));

  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color(defaultConfig.jointColor);

  for (let i = 0; i < points.length; i += step) {
    const p = points[i];
    positions.push(p.position[0], p.position[1], p.position[2]);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08 * thickness,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });

  const pointCloud = new THREE.Points(geometry, material);
  group.add(pointCloud);

  return { group, points: pointCloud };
}

function createBone(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from.clone().add(to).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 64;

  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = 'bold 24px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.8, 0.2, 1);
  return sprite;
}

export function updateSkeletonParams(
  skeleton: SkeletonObjects,
  thickness: number,
  showLabels: boolean
): void {
  const jointRadius = defaultConfig.jointRadius * thickness;
  const boneRadius = defaultConfig.boneRadius * thickness;

  skeleton.joints.forEach((joint) => {
    const geometry = joint.geometry as THREE.SphereGeometry;
    const originalRadius = geometry.parameters.radius;
    const scale = jointRadius / originalRadius;
    joint.scale.setScalar(scale);
  });

  skeleton.bones.forEach((bone) => {
    const geometry = bone.geometry as THREE.CylinderGeometry;
    const originalRadius = geometry.parameters.radiusTop;
    const scale = boneRadius / originalRadius;
    bone.scale.x = scale;
    bone.scale.z = scale;
  });

  skeleton.labels.forEach((label) => {
    label.visible = showLabels;
  });
}

export function highlightJoint(joint: THREE.Mesh, highlighted: boolean): void {
  const material = joint.material as THREE.MeshStandardMaterial;
  if (highlighted) {
    material.color.set(defaultConfig.highlightColor);
    joint.scale.setScalar(joint.scale.x * 1.2);
  } else {
    material.color.set(defaultConfig.jointColor);
    joint.scale.setScalar(joint.scale.x / 1.2);
  }
}
