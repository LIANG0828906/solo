import * as THREE from 'three';
import {
  STAR_POSITION,
  MAX_ORBIT_POINTS,
  lerpColor,
} from './sceneSetup';

export interface AsteroidObject {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  orbitPoints: THREE.Vector3[];
  orbitLine: THREE.Line;
  highlightRing: THREE.Mesh;
  label: string;
  id: string;
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'transparent';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = '400 28px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.2, 1.1, 1);
  sprite.renderOrder = 999;
  return sprite;
}

export function createAsteroid(
  scene: THREE.Scene,
  id: string,
  label: string,
  mass: number,
  position: THREE.Vector3,
  _velocity: THREE.Vector3,
  orbitColor: string
): AsteroidObject {
  const radius = 0.3 + Math.sqrt(mass) * 0.08;

  const geometry = new THREE.SphereGeometry(radius, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.85,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.userData = { id, asteroidId: id };

  const glowGeometry = new THREE.SphereGeometry(radius * 1.25, 24, 24);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  mesh.add(glowMesh);

  const labelSprite = createLabelSprite(label);
  labelSprite.position.set(0, radius + 1.2, 0);
  labelSprite.userData = { isLabel: true, asteroidId: id };
  mesh.add(labelSprite);

  const ringGeometry = new THREE.RingGeometry(
    radius * 1.3,
    radius * 1.5,
    48
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(orbitColor),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const highlightRing = new THREE.Mesh(ringGeometry, ringMaterial);
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.y = 0.01;
  mesh.add(highlightRing);

  scene.add(mesh);

  const orbitGeometry = new THREE.BufferGeometry();
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(orbitColor),
    transparent: true,
    opacity: 0.6,
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbitLine);

  return {
    mesh,
    glowMesh,
    orbitPoints: [position.clone()],
    orbitLine,
    highlightRing,
    label,
    id,
  };
}

export function updateAsteroidPosition(
  obj: AsteroidObject,
  position: THREE.Vector3,
  _velocity: THREE.Vector3,
  starPosition: THREE.Vector3,
  _camera: THREE.Camera,
  isSelected: boolean,
  shouldAddOrbitPoint: boolean
): void {
  obj.mesh.position.copy(position);

  const dist = position.distanceTo(starPosition);
  const maxGlowDist = 10;
  const minDist = 2.5;
  const t =
    dist < maxGlowDist
      ? Math.max(0, Math.min(1, 1 - (dist - minDist) / (maxGlowDist - minDist)))
      : 0;

  const glowColor = lerpColor('#ffaa33', '#ff3300', t);
  (obj.glowMesh.material as THREE.MeshBasicMaterial).color.copy(glowColor);
  (obj.glowMesh.material as THREE.MeshBasicMaterial).opacity = t * 0.7;

  if (isSelected) {
    (obj.highlightRing.material as THREE.MeshBasicMaterial).opacity = 0.3;
  } else {
    (obj.highlightRing.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  if (shouldAddOrbitPoint) {
    obj.orbitPoints.push(position.clone());
    if (obj.orbitPoints.length > MAX_ORBIT_POINTS) {
      obj.orbitPoints.shift();
    }
    updateOrbitLineGeometry(obj);
  }
}

function updateOrbitLineGeometry(obj: AsteroidObject): void {
  const points = obj.orbitPoints;
  if (points.length < 2) return;

  const positions = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    positions[i * 3] = points[i].x;
    positions[i * 3 + 1] = points[i].y;
    positions[i * 3 + 2] = points[i].z;
  }
  obj.orbitLine.geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );
  obj.orbitLine.geometry.computeBoundingSphere();
}

export function removeAsteroid(
  scene: THREE.Scene,
  obj: AsteroidObject
): void {
  scene.remove(obj.mesh);
  obj.mesh.geometry.dispose();
  (obj.mesh.material as THREE.Material).dispose();

  obj.glowMesh.geometry.dispose();
  (obj.glowMesh.material as THREE.Material).dispose();

  obj.highlightRing.geometry.dispose();
  (obj.highlightRing.material as THREE.Material).dispose();

  scene.remove(obj.orbitLine);
  obj.orbitLine.geometry.dispose();
  (obj.orbitLine.material as THREE.Material).dispose();

  obj.mesh.children.forEach((child) => {
    if (child instanceof THREE.Sprite) {
      child.geometry.dispose();
      const mat = child.material as THREE.SpriteMaterial;
      if (mat.map) mat.map.dispose();
      mat.dispose();
    }
  });
}

export { STAR_POSITION };
