import * as THREE from 'three';
import { Obstacle } from '../store/sceneStore';

export function generateObstacles(terrainSize: number = 20, count: number = 35): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const half = terrainSize / 2;

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let type: 'rock' | 'grass' | 'leaf';
    if (rand < 0.3) type = 'rock';
    else if (rand < 0.75) type = 'grass';
    else type = 'leaf';

    let radius: number, height: number;
    if (type === 'rock') {
      radius = 0.4 + Math.random() * 0.8;
      height = 0.3 + Math.random() * 0.6;
    } else if (type === 'grass') {
      radius = 0.08 + Math.random() * 0.1;
      height = 0.6 + Math.random() * 1.2;
    } else {
      radius = 0.4 + Math.random() * 0.6;
      height = 0.02;
    }

    obstacles.push({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * (terrainSize - radius * 2),
        0,
        (Math.random() - 0.5) * (terrainSize - radius * 2)
      ),
      radius,
      height,
      type,
    });
  }

  return obstacles;
}

export function createGroundTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4A7C59';
  ctx.fillRect(0, 0, size, size);

  const noiseDensity = size * size * 0.35;
  for (let i = 0; i < noiseDensity; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const pixelSize = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
    const brightness = 0.85 + Math.random() * 0.3;
    const r = Math.floor(61 * brightness);
    const g = Math.floor(107 * brightness);
    const b = Math.floor(78 * brightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, pixelSize, pixelSize);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export interface TerrainGroup extends THREE.Group {
  obstacles: Obstacle[];
}

export function createTerrain(terrainSize: number = 20): TerrainGroup {
  const group = new THREE.Group() as TerrainGroup;

  const groundGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 32, 32);
  const groundTexture = createGroundTexture();
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const obstacles = generateObstacles(terrainSize);
  group.obstacles = obstacles;

  for (const obstacle of obstacles) {
    let mesh: THREE.Mesh;

    if (obstacle.type === 'rock') {
      const geo = new THREE.DodecahedronGeometry(obstacle.radius, 0);
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const scale = 0.85 + Math.random() * 0.3;
        positions.setXYZ(i, x * scale, y * scale * (0.6 + Math.random() * 0.5), z * scale);
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.15, 0.35 + Math.random() * 0.15),
        roughness: 0.9,
        metalness: 0.05,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(obstacle.position);
      mesh.position.y = obstacle.height * 0.5;
      mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    } else if (obstacle.type === 'grass') {
      const geo = new THREE.CylinderGeometry(obstacle.radius * 0.6, obstacle.radius, obstacle.height, 5, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.55, 0.3 + Math.random() * 0.15),
        roughness: 0.8,
        metalness: 0,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(obstacle.position);
      mesh.position.y = obstacle.height * 0.5;
      mesh.rotation.z = (Math.random() - 0.5) * 0.2;
      mesh.rotation.x = (Math.random() - 0.5) * 0.2;
    } else {
      const leafShape = new THREE.Shape();
      const r = obstacle.radius;
      leafShape.moveTo(0, -r);
      leafShape.quadraticCurveTo(r * 1.1, -r * 0.3, 0, r);
      leafShape.quadraticCurveTo(-r * 1.1, -r * 0.3, 0, -r);
      const geo = new THREE.ExtrudeGeometry(leafShape, {
        depth: obstacle.height,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelSegments: 1,
      });
      const hue = Math.random() < 0.5 ? 0.25 + Math.random() * 0.1 : 0.08 + Math.random() * 0.05;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.45, 0.3 + Math.random() * 0.1),
        roughness: 0.85,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(obstacle.position);
      mesh.position.y = 0.01;
      mesh.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.15;
      mesh.rotation.z = Math.random() * Math.PI;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}
