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
    mesh.userData.materialType = 'rock';
    this.tagMaterial(mesh, 'rock');
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

  private tagMaterial(obj: THREE.Object3D, materialType: MaterialType): void {
    obj.userData.materialType = materialType;
    obj.traverse((child) => {
      child.userData.materialType = materialType;
    });
  }

  private createShipwreck(): void {
    const group = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x4a3520,
      roughness: 0.8,
      metalness: 0.3,
    });
    const metalMat2 = new THREE.MeshStandardMaterial({
      color: 0x5a4025,
      roughness: 0.75,
      metalness: 0.35,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3a2510,
      roughness: 0.9,
    });

    const hullGeo = new THREE.BoxGeometry(10, 3, 4);
    const hull = new THREE.Mesh(hullGeo, metalMat);
    hull.position.y = 1.5;
    group.add(hull);

    const sternGeo = new THREE.SphereGeometry(2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const stern = new THREE.Mesh(sternGeo, metalMat);
    stern.position.set(-5, 1.5, 0);
    stern.scale.set(1, 0.9, 1);
    group.add(stern);

    const deckGeo = new THREE.BoxGeometry(6, 1.5, 3);
    const deck = new THREE.Mesh(deckGeo, metalMat2);
    deck.position.set(0, 3.5, 0);
    group.add(deck);

    const cabinGeo = new THREE.BoxGeometry(2.5, 2, 2);
    const cabin = new THREE.Mesh(cabinGeo, metalMat2);
    cabin.position.set(0.5, 5.2, 0);
    group.add(cabin);

    const cabinRoofGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const cabinRoof = new THREE.Mesh(cabinRoofGeo, metalMat2);
    cabinRoof.position.set(0.5, 6.3, 0);
    cabinRoof.scale.set(8, 1, 6);
    group.add(cabinRoof);

    const mast1Geo = new THREE.CylinderGeometry(0.18, 0.28, 8, 10);
    const mast1 = new THREE.Mesh(mast1Geo, woodMat);
    mast1.position.set(-1.5, 7.5, 0);
    mast1.rotation.z = 0.25;
    group.add(mast1);

    const mast2Geo = new THREE.CylinderGeometry(0.14, 0.22, 6, 10);
    const mast2 = new THREE.Mesh(mast2Geo, woodMat);
    mast2.position.set(2, 6.8, 0);
    mast2.rotation.z = -0.15;
    group.add(mast2);

    const yard1Geo = new THREE.CylinderGeometry(0.07, 0.07, 3.5, 6);
    const yard1 = new THREE.Mesh(yard1Geo, woodMat);
    yard1.position.set(-1.5, 9, 0);
    yard1.rotation.z = Math.PI / 2;
    yard1.rotation.y = 0.3;
    group.add(yard1);

    const yard2Geo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6);
    const yard2 = new THREE.Mesh(yard2Geo, woodMat);
    yard2.position.set(2, 8.2, 0);
    yard2.rotation.z = Math.PI / 2;
    yard2.rotation.y = 0.3;
    group.add(yard2);

    const funnelGeo = new THREE.CylinderGeometry(0.5, 0.7, 2, 12);
    const funnelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.6,
    });
    const funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(-0.5, 6, 1.1);
    funnel.rotation.z = -0.1;
    group.add(funnel);

    const funnelTopGeo = new THREE.CylinderGeometry(0.6, 0.5, 0.15, 12);
    const funnelTop = new THREE.Mesh(funnelTopGeo, funnelMat);
    funnelTop.position.set(-0.5, 7.05, 1.1);
    group.add(funnelTop);

    const railingPosts: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
      const post = new THREE.Mesh(postGeo, metalMat2);
      post.position.set(-2.5 + i * 1.0, 4.4, 1.45);
      group.add(post);
      railingPosts.push(post);
      const post2 = post.clone();
      post2.position.z = -1.45;
      group.add(post2);
      railingPosts.push(post2);
    }
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 5.2, 6);
    const rail1 = new THREE.Mesh(railGeo, metalMat2);
    rail1.position.set(0, 4.7, 1.45);
    rail1.rotation.z = Math.PI / 2;
    group.add(rail1);
    const rail2 = rail1.clone();
    rail2.position.z = -1.45;
    group.add(rail2);

    const bowGeo = new THREE.ConeGeometry(2.2, 3, 4);
    const bow = new THREE.Mesh(bowGeo, metalMat);
    bow.position.set(5, 1.8, 0);
    bow.rotation.z = -Math.PI / 2;
    group.add(bow);

    const bowspritGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.5, 8);
    const bowsprit = new THREE.Mesh(bowspritGeo, woodMat);
    bowsprit.position.set(7, 3.2, 0);
    bowsprit.rotation.z = Math.PI / 2 - 0.2;
    group.add(bowsprit);

    this.tagMaterial(group, 'metal');
    group.position.set(30, -22, -15);
    group.rotation.y = Math.PI / 6;
    group.rotation.z = 0.08;
    group.name = 'shipwreck';
    this.scene.add(group);

    const collisionGeo = new THREE.BoxGeometry(14, 9, 5);
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
    const collisionMesh = new THREE.Mesh(collisionGeo, collisionMat);
    collisionMesh.position.copy(group.position);
    collisionMesh.rotation.copy(group.rotation);
    collisionMesh.position.y += 3.5;
    collisionMesh.userData.materialType = 'metal';
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

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4d55,
      roughness: 0.9,
      metalness: 0.08,
      flatShading: true,
    });
    const darkRockMat = new THREE.MeshStandardMaterial({
      color: 0x2d3d45,
      roughness: 0.92,
      metalness: 0.06,
      flatShading: true,
    });
    const lightRockMat = new THREE.MeshStandardMaterial({
      color: 0x4d5d65,
      roughness: 0.88,
      metalness: 0.1,
      flatShading: true,
    });
    const mats = [rockMat, darkRockMat, lightRockMat];

    rockConfigs.forEach((cfg, idx) => {
      const id = `rock_${idx}`;
      const group = new THREE.Group();

      const mainRadius = 1;
      const mainGeo = new THREE.SphereGeometry(mainRadius, 10, 8);
      const mainPositions = mainGeo.attributes.position;
      for (let i = 0; i < mainPositions.count; i++) {
        const v = new THREE.Vector3(
          mainPositions.getX(i),
          mainPositions.getY(i),
          mainPositions.getZ(i)
        );
        const noise = 0.75 + (Math.sin(i * 3.21) * 0.5 + 0.5) * 0.5;
        v.multiplyScalar(noise);
        mainPositions.setXYZ(i, v.x, v.y, v.z);
      }
      mainGeo.computeVertexNormals();
      const mainRock = new THREE.Mesh(mainGeo, mats[idx % mats.length]);
      mainRock.position.y = 0.2;
      group.add(mainRock);

      const bumpCount = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < bumpCount; b++) {
        const bumpRadius = 0.25 + Math.random() * 0.35;
        const bumpGeo = new THREE.SphereGeometry(bumpRadius, 8, 6);
        const bumpPositions = bumpGeo.attributes.position;
        for (let i = 0; i < bumpPositions.count; i++) {
          const v = new THREE.Vector3(
            bumpPositions.getX(i),
            bumpPositions.getY(i),
            bumpPositions.getZ(i)
          );
          v.multiplyScalar(0.8 + Math.random() * 0.4);
          bumpPositions.setXYZ(i, v.x, v.y, v.z);
        }
        bumpGeo.computeVertexNormals();
        const bump = new THREE.Mesh(bumpGeo, mats[(idx + b) % mats.length]);
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.5 + Math.random() * 0.6;
        bump.position.set(
          Math.cos(angle) * dist,
          -0.1 + Math.random() * 0.6,
          Math.sin(angle) * dist
        );
        group.add(bump);
      }

      if (idx % 2 === 0) {
        const pillarCount = 1 + Math.floor(Math.random() * 2);
        for (let p = 0; p < pillarCount; p++) {
          const pillarH = 0.6 + Math.random() * 0.8;
          const pillarRTop = 0.1 + Math.random() * 0.15;
          const pillarRBot = pillarRTop * (1.2 + Math.random() * 0.5);
          const pillarGeo = new THREE.CylinderGeometry(pillarRTop, pillarRBot, pillarH, 7);
          const pillar = new THREE.Mesh(pillarGeo, darkRockMat);
          const angle = Math.random() * Math.PI * 2;
          pillar.position.set(
            Math.cos(angle) * 0.4,
            -0.1 + pillarH / 2,
            Math.sin(angle) * 0.4
          );
          pillar.rotation.z = (Math.random() - 0.5) * 0.3;
          pillar.rotation.x = (Math.random() - 0.5) * 0.3;
          group.add(pillar);
        }
      }

      if (idx % 3 === 0) {
        const archGeo = new THREE.TorusGeometry(0.55, 0.12, 6, 10, Math.PI);
        const arch = new THREE.Mesh(archGeo, lightRockMat);
        arch.position.set(0.2, 0.1, 0.3);
        arch.rotation.x = Math.PI / 2;
        arch.rotation.y = 0.4;
        group.add(arch);
      }

      group.scale.setScalar(cfg.scale);
      group.position.copy(cfg.pos);
      group.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      group.name = id;
      this.tagMaterial(group, cfg.mat);
      this.scene.add(group);

      const data: ObstacleData = {
        id,
        type: 'rock',
        position: group.position.clone(),
        rotation: group.rotation.clone(),
        scale: group.scale.clone(),
        material: cfg.mat,
      };
      this.obstacles.set(id, { id, mesh: group, data, boundingBox: new THREE.Box3() });
      this.collisionMeshes.push(group as unknown as THREE.Mesh);
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
