import * as THREE from 'three';
import { MazeData } from './maze';
import { SoundManager } from './sound';

export interface Player {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  collectedCrystals: number;
  totalCrystals: number;
  hasUnlockedHiddenArea: boolean;
  light: THREE.PointLight;
  collisionCooldown: number;
  haloRing: THREE.Mesh | null;
}

const PLAYER_RADIUS = 0.25;
const MOVE_SPEED = 3.0;
const BOUNCE_FORCE = 0.5;
const COLLISION_COOLDOWN = 0.2;

export function createPlayer(maze: MazeData): Player {
  const group = new THREE.Group();

  const sphereGeometry = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);

  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nctx = noiseCanvas.getContext('2d')!;
  const imageData = nctx.createImageData(128, 128);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = 180 + Math.random() * 75;
    imageData.data[i] = v;
    imageData.data[i + 1] = v * 0.85;
    imageData.data[i + 2] = v * 0.5;
    imageData.data[i + 3] = 255;
  }
  nctx.putImageData(imageData, 0, 0);
  const noiseTexture = new THREE.CanvasTexture(noiseCanvas);

  const sphereMaterial = new THREE.MeshPhongMaterial({
    map: noiseTexture,
    emissive: 0xffaa44,
    emissiveIntensity: 0.6,
    shininess: 80,
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);

  const glowGeometry = new THREE.SphereGeometry(PLAYER_RADIUS * 1.8, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc66,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  const light = new THREE.PointLight(0xffcc66, 1.5, 6);
  light.position.set(0, 0.5, 0);
  group.add(light);

  group.position.set(maze.entrance.x, PLAYER_RADIUS, maze.entrance.z);

  return {
    mesh: group,
    position: group.position.clone(),
    velocity: new THREE.Vector3(),
    collectedCrystals: 0,
    totalCrystals: 5,
    hasUnlockedHiddenArea: false,
    light,
    collisionCooldown: 0,
    haloRing: null,
  };
}

export function updatePlayer(
  player: Player,
  keys: Set<string>,
  maze: MazeData,
  delta: number,
  sound: SoundManager
): void {
  player.collisionCooldown -= delta;
  if (player.collisionCooldown < 0) player.collisionCooldown = 0;

  const moveDir = new THREE.Vector3();

  if (keys.has('w') || keys.has('arrowup')) moveDir.z -= 1;
  if (keys.has('s') || keys.has('arrowdown')) moveDir.z += 1;
  if (keys.has('a') || keys.has('arrowleft')) moveDir.x -= 1;
  if (keys.has('d') || keys.has('arrowright')) moveDir.x += 1;

  if (moveDir.length() > 0) {
    moveDir.normalize().multiplyScalar(MOVE_SPEED * delta);
  }

  const newPos = player.position.clone().add(moveDir);

  if (!isWallCollision(newPos, maze)) {
    player.position.copy(newPos);
  } else {
    const testX = player.position.clone();
    testX.x = newPos.x;
    if (!isWallCollision(testX, maze)) {
      player.position.x = testX.x;
    } else if (player.collisionCooldown <= 0) {
      player.velocity.x = -moveDir.x * BOUNCE_FORCE;
      player.collisionCooldown = COLLISION_COOLDOWN;
      sound.playCollision();
    }

    const testZ = player.position.clone();
    testZ.z = newPos.z;
    if (!isWallCollision(testZ, maze)) {
      player.position.z = testZ.z;
    } else if (player.collisionCooldown <= 0) {
      player.velocity.z = -moveDir.z * BOUNCE_FORCE;
      player.collisionCooldown = COLLISION_COOLDOWN;
      sound.playCollision();
    }
  }

  player.position.add(player.velocity.clone().multiplyScalar(delta));
  player.velocity.multiplyScalar(0.9);

  if (isWallCollision(player.position, maze)) {
    player.velocity.multiplyScalar(-0.5);
    if (player.collisionCooldown <= 0) {
      sound.playCollision();
      player.collisionCooldown = COLLISION_COOLDOWN;
    }
  }

  player.mesh.position.copy(player.position);
  player.mesh.position.y = PLAYER_RADIUS;

  if (player.haloRing) {
    player.haloRing.rotation.y += delta * 2;
    player.haloRing.position.copy(player.mesh.position);
    player.haloRing.position.y = 0.3;
  }
}

function isWallCollision(pos: THREE.Vector3, maze: MazeData): boolean {
  const margin = PLAYER_RADIUS * 0.9;

  const checkPoints = [
    pos.clone(),
    pos.clone().add(new THREE.Vector3(margin, 0, 0)),
    pos.clone().add(new THREE.Vector3(-margin, 0, 0)),
    pos.clone().add(new THREE.Vector3(0, 0, margin)),
    pos.clone().add(new THREE.Vector3(0, 0, -margin)),
  ];

  for (const p of checkPoints) {
    const gridX = Math.round(p.x);
    const gridZ = Math.round(p.z);

    if (gridX < 0 || gridX >= maze.cols || gridZ < 0 || gridZ >= maze.rows) {
      return true;
    }

    if (maze.grid[gridZ][gridX] === 1) {
      return true;
    }
  }

  return false;
}

export function addHaloToPlayer(player: Player, scene: THREE.Scene): void {
  if (player.haloRing) return;

  const ringGeometry = new THREE.TorusGeometry(0.4, 0.03, 8, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd88,
    transparent: true,
    opacity: 0.7,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(player.mesh.position);
  ring.position.y = 0.3;
  scene.add(ring);
  player.haloRing = ring;
}

export function checkExitReached(player: Player, exitPos: { x: number; z: number }): boolean {
  const dx = player.position.x - exitPos.x;
  const dz = player.position.z - exitPos.z;
  return Math.sqrt(dx * dx + dz * dz) < 0.5;
}
