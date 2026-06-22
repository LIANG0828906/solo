import * as THREE from 'three';
import { MaterialType, ObstacleData } from '../types';

export interface Obstacle {
  id: string;
  mesh: THREE.Object3D;
  data: ObstacleData;
  boundingBox: THREE.Box3;
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private obstacles: Map<string, Obstacle> = new Map();
  private collisionMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createAll(): void {
    this.createSeabed();
    this.createShipwreck();
    this.createRocks();
    this.updateBoundingBoxes();
  }

  private createSeabed(): void {
    const geo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = Math.sin(x * 0.08) * 0.8 + Math.cos(y * 0.06) * 1.2 + (Math.random() - 0.5) * 0.5;
      positions.setZ(i, z);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a3d4a,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -25;
    mesh.receiveShadow = true;
    mesh.name = 'seabed';
    this.scene.add(mesh);

    const data: ObstacleData = {
      id: 'seabed',
      type: 'seabed',
      position: mesh.position.clone(),
      rotation: mesh.rotation.clone(),
      scale: mesh.scale.clone(),
      material: 'rock',
    };
    this.obstacles.set('seabed', { id: 'seabed', mesh, data, boundingBox: new THREE.Box3() });
    this.collisionMeshes.push(mesh);
  }

  private createShipwreck(): void {
    const group = new THREE.Group();

    const hullGeo = new THREE.BoxGeometry(10, 3, 4);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x4a3520,
      roughness: 0.8,
      metalness: 0.3,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 1.5;
    group.add(hull);

    const deckGeo = new THREE.BoxGeometry(6, 1.5, 3);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x5a4025,
      roughness: 0.75,
      metalness: 0.35,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 3.5, 0);
    group.add(deck);

    const cabinGeo = new THREE.BoxGeometry(2.5, 2, 2);
    const cabin = new THREE.Mesh(cabinGeo, deckMat);
    cabin.position.set(0.5, 5.2, 0);
    group.add(cabin);

    const mastGeo = new THREE.CylinderGeometry(0.15, 0.2, 6, 8);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x3a2510,
      roughness: 0.9,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(-1, 7, 0);
    mast.rotation.z = 0.3;
    group.add(mast);

    const bowGeo = new THREE.ConeGeometry(2.2, 3, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(5, 1.8, 0);
    bow.rotation.z = -Math.PI / 2;
    group.add(bow);

    group.position.set(30, -22, -15);
    group.rotation.y = Math.PI / 6;
    group.rotation.z = 0.08;
    group.name = 'shipwreck';
    this.scene.add(group);

    const collisionGeo = new THREE.BoxGeometry(14, 7, 5);
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
    const collisionMesh = new THREE.Mesh(collisionGeo, collisionMat);
    collisionMesh.position.copy(group.position);
    collisionMesh.rotation.copy(group.rotation);
    collisionMesh.position.y += 3;
    this.scene.add(collisionMesh);
    collisionMesh.name = 'shipwreck_collider';
    this.collisionMeshes.push(collisionMesh);

    const data: ObstacleData = {
      id: 'shipwreck',
      type: 'shipwreck',
      position: group.position.clone(),
      rotation: group.rotation.clone(),
      scale: group.scale.clone(),
      material: 'metal',
    };
    this.obstacles.set('shipwreck', { id: 'shipwreck', mesh: group, data, boundingBox: new THREE.Box3() });
  }

  private createRocks(): void {
    const rockConfigs = [
      { pos: new THREE.Vector3(-20, -22, 15), scale: 3.5, mat: 'rock' as MaterialType },
      { pos: new THREE.Vector3(-35, -23, -10), scale: 5, mat: 'rock' as MaterialType },
      { pos: new THREE.Vector3(10, -23, 25), scale: 2.8, mat: 'rock' as MaterialType },
      { pos: new THREE.Vector3(-10, -22, -30), scale: 4, mat: 'rock' as MaterialType },
      { pos: new THREE.Vector3(40, -23, 20), scale: 3.2, mat: 'rock' as MaterialType },
    ];

    rockConfigs.forEach((cfg, idx) => {
      const id = `rock_${idx}`;
      const geo = new THREE.DodecahedronGeometry(1, 0);
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const v = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        v.multiplyScalar(0.7 + Math.random() * 0.6);
        positions.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3d4d55,
        roughness: 0.9,
        metalness: 0.08,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(cfg.scale);
      mesh.position.copy(cfg.pos);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.name = id;
      this.scene.add(mesh);

      const data: ObstacleData = {
        id,
        type: 'rock',
        position: mesh.position.clone(),
        rotation: mesh.rotation.clone(),
        scale: mesh.scale.clone(),
        material: cfg.mat,
      };
      this.obstacles.set(id, { id, mesh, data, boundingBox: new THREE.Box3() });
      this.collisionMeshes.push(mesh);
    });
  }

  updateBoundingBoxes(): void {
    this.obstacles.forEach((obs) => {
      const box = new THREE.Box3().setFromObject(obs.mesh);
      obs.boundingBox.copy(box);
    });
  }

  getObstacles(): Map<string, Obstacle> {
    return this.obstacles;
  }

  getCollisionMeshes(): THREE.Mesh[] {
    return this.collisionMeshes;
  }

  getObstacleMaterial(id: string): MaterialType {
    return this.obstacles.get(id)?.data.material ?? 'rock';
  }

  dispose(): void {
    this.obstacles.forEach((obs) => {
      this.scene.remove(obs.mesh);
      obs.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.collisionMeshes.forEach((m) => {
      this.scene.remove(m);
      m.geometry.dispose();
    });
    this.obstacles.clear();
    this.collisionMeshes = [];
  }
}
