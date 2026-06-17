import * as THREE from 'three';
import type { CodeNode, CodeEdge } from '../../types';

const NODE_COLORS = {
  util: 0x6bcb77,
  business: 0x4ecdc4,
  ui: 0xffd93d,
};

export function createNodeMesh(node: CodeNode): THREE.Group {
  const group = new THREE.Group();

  const size = 0.3 + node.callCount * 0.05;
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const color = NODE_COLORS[node.moduleType] || NODE_COLORS.business;

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
  });

  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  const glowGeometry = new THREE.SphereGeometry(size * 1.3, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  group.position.set(node.position.x, node.position.y, node.position.z);
  group.userData = { nodeId: node.id, node };

  return group;
}

export function createEdgeMesh(
  edge: CodeEdge,
  sourceNode: CodeNode,
  targetNode: CodeNode
): THREE.Group {
  const group = new THREE.Group();

  const start = new THREE.Vector3(
    sourceNode.position.x,
    sourceNode.position.y,
    sourceNode.position.z
  );
  const end = new THREE.Vector3(
    targetNode.position.x,
    targetNode.position.y,
    targetNode.position.z
  );

  const distance = start.distanceTo(end);
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  midPoint.y += distance * 0.1;

  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const colorStart = new THREE.Color(0x4a90d9);
  const colorEnd = new THREE.Color(0x50e3c2);

  const colors = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const color = colorStart.clone().lerp(colorEnd, t);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    linewidth: 2,
  });

  const line = new THREE.Line(geometry, material);
  group.add(line);

  group.userData = { edgeId: edge.id, edge, progress: 0 };

  return group;
}

export function updateNodeAnimation(
  nodeMesh: THREE.Group,
  time: number,
  speed: number
): void {
  const scale = 1 + Math.sin(time * speed * 2) * 0.05;
  nodeMesh.scale.setScalar(scale);

  const floatOffset = Math.sin(time * speed + nodeMesh.position.x) * 0.1;
  const originalY = nodeMesh.userData.node.position.y;
  nodeMesh.position.y = originalY + floatOffset;
}

export function updateEdgeAnimation(
  edgeMesh: THREE.Group,
  time: number,
  speed: number
): void {
  edgeMesh.userData.progress = (edgeMesh.userData.progress + speed * 0.01) % 1;

  const line = edgeMesh.children[0] as THREE.Line;
  if (line && line.material instanceof THREE.LineBasicMaterial) {
    const pulse = 0.5 + Math.sin(time * speed * 3) * 0.2;
    line.material.opacity = pulse;
  }
}

export function createLoadingMesh(): THREE.Group {
  const group = new THREE.Group();

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const radius = 1.5;

    const shape = new THREE.Shape();
    const hexRadius = 0.3;
    for (let j = 0; j < 6; j++) {
      const hexAngle = (j / 6) * Math.PI * 2;
      const x = Math.cos(hexAngle) * hexRadius;
      const y = Math.sin(hexAngle) * hexRadius;
      if (j === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.5 + Math.sin(angle) * 0.3,
      side: THREE.DoubleSide,
    });

    const hexagon = new THREE.Mesh(geometry, material);
    hexagon.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    );
    hexagon.userData = { baseOpacity: 0.3 + Math.random() * 0.4, angle };
    group.add(hexagon);
  }

  return group;
}

export function updateLoadingAnimation(
  loadingGroup: THREE.Group,
  time: number
): void {
  loadingGroup.rotation.z = time * 0.5;

  loadingGroup.children.forEach((child, index) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material as THREE.MeshBasicMaterial;
      const baseOpacity = child.userData.baseOpacity;
      const pulse = (Math.sin(time * 2 + index * 0.5) + 1) / 2;
      material.opacity = baseOpacity + pulse * 0.5;
    }
  });
}
