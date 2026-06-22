import * as THREE from 'three';
import type { IslandData, ElementType } from './types';

const ELEMENT_COLORS: Record<ElementType, number> = {
  fire: 0xe53935,
  water: 0x1e88e5,
  wind: 0x43a047,
  earth: 0xfb8c00
};

export class IslandGenerator {
  private scene: THREE.Scene;
  private islands: IslandData[] = [];
  private nextId: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  generateIslands(count: number): IslandData[] {
    const elements: ElementType[] = ['fire', 'water', 'wind', 'earth'];

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * (i / count) - 1);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const baseRadius = 80;
      const radiusVariation = (Math.random() - 0.5) * 20;
      const radius = baseRadius + radiusVariation;

      const heightOffset = (Math.random() - 0.5) * 20;

      const position = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        heightOffset,
        radius * Math.sin(phi) * Math.sin(theta)
      );

      const element = elements[Math.floor(Math.random() * elements.length)];
      const color = new THREE.Color(ELEMENT_COLORS[element]);

      const island = this.createIsland(position, color, element);
      this.islands.push(island);
      this.scene.add(island.mesh);
    }

    return this.islands;
  }

  private createIsland(position: THREE.Vector3, color: THREE.Color, element: ElementType): IslandData {
    const group = new THREE.Group();
    group.position.copy(position);

    const rockGroup = this.createRockBase();
    group.add(rockGroup);

    const glowMesh = this.createGlowSphere(color);
    glowMesh.position.y = 2;
    group.add(glowMesh);

    let treasureMesh: THREE.Mesh | undefined;
    const hasTreasure = Math.random() < 0.6;
    if (hasTreasure) {
      treasureMesh = this.createTreasureChest();
      treasureMesh.position.y = 5;
      group.add(treasureMesh);
    }

    const id = this.nextId++;

    return {
      id,
      position: position.clone(),
      color,
      element,
      colliderRadius: 8,
      mesh: group,
      glowMesh,
      rotationSpeed: 0.02,
      cooldown: 0,
      hasTreasure,
      treasureMesh,
      treasureCollected: false,
      treasureRespawnTimer: 0,
      glowPulsePhase: Math.random() * Math.PI * 2
    };
  }

  private createRockBase(): THREE.Group {
    const group = new THREE.Group();

    const ringGeo = new THREE.TorusGeometry(3, 0.8, 6, 12);
    const positions = ringGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = (Math.random() - 0.5) * 0.5;
      positions.setX(i, x + noise);
      positions.setY(i, y + noise * 0.5);
      positions.setZ(i, z + noise);
    }
    ringGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5d4e37,
      roughness: 0.9,
      metalness: 0.1
    });

    const ring = new THREE.Mesh(ringGeo, rockMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    for (let i = 0; i < 5; i++) {
      const size = 0.8 + Math.random() * 1.2;
      const rockGeo = new THREE.DodecahedronGeometry(size, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 5) * Math.PI * 2;
      rock.position.set(
        Math.cos(angle) * (2 + Math.random()),
        -0.5 + Math.random() * 0.5,
        Math.sin(angle) * (2 + Math.random())
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      group.add(rock);
    }

    return group;
  }

  private createGlowSphere(color: THREE.Color): THREE.Mesh {
    const geo = new THREE.SphereGeometry(4, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  private createTreasureChest(): THREE.Mesh {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      metalness: 0.3,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -0.1;
    group.add(body);

    const lidGeo = new THREE.BoxGeometry(1.3, 0.3, 0.9);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0xffd54f,
      emissiveIntensity: 0.3
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.45;
    group.add(lid);

    const lockGeo = new THREE.BoxGeometry(0.2, 0.3, 0.15);
    const lock = new THREE.Mesh(lockGeo, lidMat);
    lock.position.set(0, 0.3, 0.45);
    group.add(lock);

    const mergedGeo = new THREE.BoxGeometry(1.3, 1.1, 0.95);
    const mergedMesh = new THREE.Mesh(mergedGeo, lidMat);
    mergedMesh.visible = false;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });

    const container = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    container.add(group);
    (container as any).visualGroup = group;

    return container;
  }

  update(dt: number): void {
    const time = performance.now() * 0.001;

    for (const island of this.islands) {
      island.mesh.rotation.y += island.rotationSpeed * dt;

      if (island.cooldown > 0) {
        island.cooldown -= dt;
      }

      const pulse = 0.8 + 0.4 * Math.sin(time * 2 + island.glowPulsePhase);
      const mat = island.glowMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + pulse * 0.15;

      if (island.hasTreasure && island.treasureMesh) {
        if (island.treasureCollected) {
          island.treasureRespawnTimer -= dt;
          if (island.treasureRespawnTimer <= 0) {
            island.treasureCollected = false;
            island.treasureMesh.visible = true;
            const visualGroup = (island.treasureMesh as any).visualGroup;
            if (visualGroup) visualGroup.visible = true;
          }
        } else {
          island.treasureMesh.rotation.y += 0.05 * dt * 60;
          const floatY = Math.sin(time * 2 + island.id) * 0.3;
          island.treasureMesh.position.y = 5 + floatY;
        }
      }
    }
  }

  collectTreasure(island: IslandData): void {
    if (!island.hasTreasure || island.treasureCollected || !island.treasureMesh) return;
    island.treasureCollected = true;
    island.treasureRespawnTimer = 60;
    island.treasureMesh.visible = false;
    const visualGroup = (island.treasureMesh as any).visualGroup;
    if (visualGroup) visualGroup.visible = false;
  }

  triggerGlowFlash(island: IslandData): void {
    const mat = island.glowMesh.material as THREE.MeshBasicMaterial;
    const originalOpacity = 0.3;
    let flashTime = 0;
    const flashDuration = 0.5;

    const animateFlash = () => {
      flashTime += 1 / 60;
      const t = flashTime / flashDuration;
      if (t >= 1) {
        mat.opacity = originalOpacity;
        return;
      }
      const intensity = t < 0.5 ? t * 2 : (1 - t) * 2;
      mat.opacity = originalOpacity + intensity * 0.7;
      requestAnimationFrame(animateFlash);
    };
    animateFlash();
  }

  getIslands(): IslandData[] {
    return this.islands;
  }

  dispose(): void {
    for (const island of this.islands) {
      this.scene.remove(island.mesh);
      island.mesh.traverse((child) => {
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
    this.islands = [];
  }
}
