import * as THREE from 'three';

export interface ArtifactData {
  id: string;
  type: string;
  pieceIndex: number;
  totalPieces: number;
  collected: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  name: string;
}

export interface ArtifactMesh extends THREE.Group {
  userData: {
    artifact: ArtifactData;
    isArtifact: boolean;
    glowMesh?: THREE.Mesh;
    baseScale: number;
    floatPhase: number;
  };
}

const ARTIFACT_COLORS: Record<string, number> = {
  pottery: 0xb56b3a,
  statue: 0xe8e4d4,
  coin: 0xd4af37,
  tablet: 0x7a6e5a,
  weapon: 0x8a7a5a,
  jewelry: 0xf0c850,
};

export class ShipwreckManager {
  public wreckGroup: THREE.Group;
  public artifactGroup: THREE.Group;
  public artifacts: ArtifactMesh[] = [];
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private bubblePool: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }[] = [];
  private bubbleGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
    this.wreckGroup = new THREE.Group();
    this.artifactGroup = new THREE.Group();
    this.bubbleGroup = new THREE.Group();

    this.scene.add(this.wreckGroup);
    this.scene.add(this.artifactGroup);
    this.scene.add(this.bubbleGroup);

    this.createShipwreck();
    this.createBubblePool();
  }

  private createBubblePool(): void {
    const geo = new THREE.SphereGeometry(0.1, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8ac4ff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    for (let i = 0; i < 120; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this.bubbleGroup.add(mesh);
      this.bubblePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
      });
    }
  }

  private createShipwreck(): void {
    const hullGroup = new THREE.Group();

    const hullBodyGeo = new THREE.BoxGeometry(14, 3.5, 5.5);
    this.deformGeometry(hullBodyGeo, 0.25);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const hullBody = new THREE.Mesh(hullBodyGeo, hullMat);
    hullBody.position.y = 0.2;
    hullGroup.add(hullBody);

    const bottomGeo = new THREE.BoxGeometry(13, 1.5, 4.8);
    this.deformGeometry(bottomGeo, 0.2);
    const bottom = new THREE.Mesh(bottomGeo, hullMat.clone());
    bottom.position.y = -1.3;
    const bottomMat = bottom.material as THREE.MeshStandardMaterial;
    bottomMat.color = new THREE.Color(0x2a1a0e);
    hullGroup.add(bottom);

    const deckGeo = new THREE.BoxGeometry(12.5, 0.35, 5.2);
    this.deformGeometry(deckGeo, 0.15);
    const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({
      color: 0x5a4530,
      roughness: 0.9,
      flatShading: true,
    }));
    deck.position.y = 2.1;
    hullGroup.add(deck);

    const bowGeo = new THREE.ConeGeometry(2.8, 4, 4);
    this.deformGeometry(bowGeo, 0.18);
    const bow = new THREE.Mesh(bowGeo, hullMat.clone());
    bow.rotation.y = Math.PI / 4;
    bow.rotation.z = Math.PI / 2;
    bow.position.set(8.5, 0.5, 0);
    hullGroup.add(bow);

    const sternGeo = new THREE.ConeGeometry(2.2, 3.5, 4);
    this.deformGeometry(sternGeo, 0.18);
    const stern = new THREE.Mesh(sternGeo, hullMat.clone());
    stern.rotation.y = -Math.PI / 4;
    stern.rotation.z = -Math.PI / 2;
    stern.position.set(-7.8, 0.8, 0);
    hullGroup.add(stern);

    const mastGeo = new THREE.CylinderGeometry(0.18, 0.25, 10, 6);
    this.deformGeometry(mastGeo, 0.1);
    const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.92,
      flatShading: true,
    }));
    mast.position.set(1, 6.5, 0);
    mast.rotation.z = -0.25;
    hullGroup.add(mast);

    const crossbarGeo = new THREE.BoxGeometry(6, 0.15, 0.15);
    const crossbar = new THREE.Mesh(crossbarGeo, new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.9,
    }));
    crossbar.position.set(1, 9, 0);
    crossbar.rotation.z = -0.25;
    hullGroup.add(crossbar);

    const cabinGeo = new THREE.BoxGeometry(4, 2, 3.5);
    this.deformGeometry(cabinGeo, 0.12);
    const cabin = new THREE.Mesh(cabinGeo, new THREE.MeshStandardMaterial({
      color: 0x4a3020,
      roughness: 0.93,
      flatShading: true,
    }));
    cabin.position.set(-5, 3.3, 0);
    hullGroup.add(cabin);

    const cabinRoofGeo = new THREE.BoxGeometry(4.4, 0.25, 3.8);
    this.deformGeometry(cabinRoofGeo, 0.1);
    const cabinRoof = new THREE.Mesh(cabinRoofGeo, new THREE.MeshStandardMaterial({
      color: 0x3a2515,
      roughness: 0.9,
    }));
    cabinRoof.position.set(-5, 4.4, 0);
    hullGroup.add(cabinRoof);

    this.createDebris(hullGroup);

    hullGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        this.addAlgaeTexture(mesh, mat);
      }
    });

    hullGroup.rotation.z = 0.08;
    hullGroup.rotation.y = 0.25;
    hullGroup.position.set(0, -3, 0);
    hullGroup.name = 'shipwreck';
    this.wreckGroup.add(hullGroup);
  }

  private deformGeometry(geo: THREE.BufferGeometry, amount: number): void {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
      pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
    }
    geo.computeVertexNormals();
  }

  private createDebris(_parent: THREE.Group): void {
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x3a2515,
      roughness: 0.95,
      flatShading: true,
    });

    for (let i = 0; i < 14; i++) {
      const w = 0.4 + Math.random() * 1.2;
      const h = 0.15 + Math.random() * 0.4;
      const d = 0.4 + Math.random() * 1;
      const geo = new THREE.BoxGeometry(w, h, d);
      this.deformGeometry(geo, 0.15);
      const debris = new THREE.Mesh(geo, debrisMat.clone());
      (debris.material as THREE.MeshStandardMaterial).color.setHSL(
        0.05 + Math.random() * 0.08,
        0.3 + Math.random() * 0.2,
        0.12 + Math.random() * 0.1
      );
      debris.position.set(
        (Math.random() - 0.5) * 20,
        -3 - Math.random() * 4,
        (Math.random() - 0.5) * 10
      );
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.addAlgaeTexture(debris, debris.material as THREE.MeshStandardMaterial);
      this.wreckGroup.add(debris);
    }
  }

  private addAlgaeTexture(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial): void {
    if (!mesh.geometry.attributes.uv) {
      mesh.geometry.computeVertexNormals();
    }
    void material;
  }

  public createArtifacts(data: ArtifactData[]): void {
    data.forEach((d) => {
      if (!d.collected) {
        const artifact = this.createArtifactMesh(d);
        this.artifacts.push(artifact);
        this.artifactGroup.add(artifact);
      }
    });
  }

  private createArtifactMesh(data: ArtifactData): ArtifactMesh {
    const group = new THREE.Group() as ArtifactMesh;
    const color = ARTIFACT_COLORS[data.type] || 0xcccccc;

    let baseMesh: THREE.Mesh;
    let baseScale = 1;

    switch (data.type) {
      case 'pottery':
        baseMesh = this.createPotteryPiece(data.pieceIndex, color);
        baseScale = 0.9;
        break;
      case 'statue':
        baseMesh = this.createStatuePiece(data.pieceIndex, color);
        baseScale = 1.0;
        break;
      case 'coin':
        baseMesh = this.createCoinPiece(data.pieceIndex, color);
        baseScale = 0.6;
        break;
      case 'tablet':
        baseMesh = this.createTabletPiece(data.pieceIndex, color);
        baseScale = 0.85;
        break;
      case 'weapon':
        baseMesh = this.createWeaponPiece(data.pieceIndex, color);
        baseScale = 0.95;
        break;
      case 'jewelry':
        baseMesh = this.createJewelryPiece(data.pieceIndex, color);
        baseScale = 0.7;
        break;
      default:
        baseMesh = this.createGenericPiece(color);
    }

    baseMesh.castShadow = true;
    group.add(baseMesh);

    const glowGeo = baseMesh.geometry.clone();
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8ac4ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.scale.multiplyScalar(1.25);
    group.add(glowMesh);

    group.position.set(data.position.x, data.position.y, data.position.z);
    group.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    group.scale.setScalar(baseScale);

    group.userData = {
      artifact: data,
      isArtifact: true,
      glowMesh,
      baseScale,
      floatPhase: Math.random() * Math.PI * 2,
    };

    group.name = `artifact_${data.id}`;
    return group;
  }

  private createPotteryPiece(index: number, color: number): THREE.Mesh {
    const geo = new THREE.LatheGeometry([
      new THREE.Vector2(0.3 + index * 0.05, 0),
      new THREE.Vector2(0.7, 0.3),
      new THREE.Vector2(0.6, 0.8),
      new THREE.Vector2(0.4, 1.1),
      new THREE.Vector2(0.5 + index * 0.03, 1.4),
    ], 8 + index * 2);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createStatuePiece(index: number, color: number): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    switch (index % 5) {
      case 0:
        geo = new THREE.SphereGeometry(0.55, 10, 8);
        break;
      case 1:
        geo = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 8);
        break;
      case 2:
        geo = new THREE.BoxGeometry(0.3, 1.1, 0.35);
        break;
      case 3:
        geo = new THREE.ConeGeometry(0.3, 0.9, 6);
        break;
      default:
        geo = new THREE.IcosahedronGeometry(0.45, 1);
    }
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0.08,
      flatShading: true,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createCoinPiece(index: number, color: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.08 + index * 0.02, 16);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    const grp = new THREE.Group();
    grp.add(mesh);
    for (let i = 0; i < Math.min(index + 1, 3); i++) {
      const extra = new THREE.Mesh(geo.clone(), mat.clone());
      extra.rotation.x = Math.PI / 2;
      extra.position.set(
        (Math.random() - 0.5) * 0.3,
        -0.1 * (i + 1),
        (Math.random() - 0.5) * 0.3
      );
      extra.rotation.z = Math.random() * 0.3;
      grp.add(extra);
    }
    const merged = this.mergeGroupToMesh(grp, color);
    return merged;
  }

  private createTabletPiece(index: number, color: number): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.6, 0.9, 0.1 + index * 0.02);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.05);
      pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.05);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createWeaponPiece(index: number, color: number): THREE.Mesh {
    const grp = new THREE.Group();
    switch (index % 4) {
      case 0: {
        const blade = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 1.6, 4),
          new THREE.MeshStandardMaterial({ color: 0xa5a090, roughness: 0.45, metalness: 0.7 })
        );
        blade.rotation.z = Math.PI;
        blade.position.y = 0.3;
        grp.add(blade);
        break;
      }
      case 1: {
        const hilt = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.12, 0.15),
          new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 })
        );
        grp.add(hilt);
        break;
      }
      case 2: {
        const grip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8),
          new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.85 })
        );
        grp.add(grip);
        break;
      }
      default: {
        const pommel = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.5, metalness: 0.7 })
        );
        grp.add(pommel);
      }
    }
    return this.mergeGroupToMesh(grp, color);
  }

  private createJewelryPiece(index: number, color: number): THREE.Mesh {
    const grp = new THREE.Group();
    const mainMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.9,
    });
    switch (index % 3) {
      case 0: {
        const band = new THREE.TorusGeometry(0.35, 0.07, 8, 20);
        grp.add(new THREE.Mesh(band, mainMat));
        break;
      }
      case 1: {
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.22, 0),
          new THREE.MeshStandardMaterial({
            color: 0x4080ff,
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0x204080,
            emissiveIntensity: 0.3,
          })
        );
        grp.add(gem);
        grp.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), mainMat));
        break;
      }
      default: {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.07, 0.25, 5),
            mainMat
          );
          spike.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
          spike.rotation.z = angle - Math.PI / 2;
          grp.add(spike);
        }
        grp.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 18), mainMat));
      }
    }
    return this.mergeGroupToMesh(grp, color);
  }

  private createGenericPiece(color: number): THREE.Mesh {
    const geo = new THREE.IcosahedronGeometry(0.4, 1);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      flatShading: true,
    });
    return new THREE.Mesh(geo, mat);
  }

  private mergeGroupToMesh(group: THREE.Group, fallbackColor: number): THREE.Mesh {
    const mat = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true,
    });
    const mergedGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const tmp = new THREE.Matrix4();
    group.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        mesh.updateMatrixWorld(true);
        tmp.copy(mesh.matrixWorld);
        const pos = mesh.geometry.attributes.position;
        const norm = mesh.geometry.attributes.normal;
        const idx = mesh.geometry.index;
        if (idx) {
          for (let i = 0; i < idx.count; i++) {
            const vi = idx.getX(i);
            const v = new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
            v.applyMatrix4(tmp);
            positions.push(v.x, v.y, v.z);
            if (norm) {
              const n = new THREE.Vector3(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
              n.transformDirection(tmp);
              normals.push(n.x, n.y, n.z);
            }
          }
        } else {
          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(tmp);
            positions.push(v.x, v.y, v.z);
            if (norm) {
              const n = new THREE.Vector3(norm.getX(i), norm.getY(i), norm.getZ(i));
              n.transformDirection(tmp);
              normals.push(n.x, n.y, n.z);
            }
          }
        }
      }
    });
    mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length) {
      mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    } else {
      mergedGeo.computeVertexNormals();
    }
    return new THREE.Mesh(mergedGeo, mat);
  }

  public spawnBubbles(origin: THREE.Vector3, count: number = 20): void {
    let spawned = 0;
    for (const bubble of this.bubblePool) {
      if (spawned >= count) break;
      if (bubble.life > 0) continue;
      bubble.life = 1;
      bubble.maxLife = 2 + Math.random() * 1.5;
      bubble.mesh.visible = true;
      bubble.mesh.position.copy(origin);
      bubble.mesh.position.x += (Math.random() - 0.5) * 1.5;
      bubble.mesh.position.y += Math.random() * 0.5;
      bubble.mesh.position.z += (Math.random() - 0.5) * 1.5;
      const s = 0.4 + Math.random() * 1.2;
      bubble.mesh.scale.setScalar(s);
      const mat = bubble.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.random() * 0.3;
      bubble.velocity.set(
        (Math.random() - 0.5) * 0.8,
        1.5 + Math.random() * 2,
        (Math.random() - 0.5) * 0.8
      );
      spawned++;
    }
  }

  public removeArtifact(id: string): void {
    const index = this.artifacts.findIndex((a) => a.userData.artifact.id === id);
    if (index >= 0) {
      const artifact = this.artifacts[index];
      this.artifactGroup.remove(artifact);
      artifact.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      this.artifacts.splice(index, 1);
    }
  }

  public update(): void {
    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    this.artifacts.forEach((a) => {
      const ud = a.userData;
      a.position.y += Math.sin(time * 1.2 + ud.floatPhase) * 0.003;
      a.rotation.y += 0.004;
      a.rotation.x += 0.002;

      if (ud.glowMesh) {
        const glowMat = ud.glowMesh.material as THREE.MeshBasicMaterial;
        const pulse = 0.9 + Math.sin(time * 3 + ud.floatPhase) * 0.35;
        glowMat.opacity = 0.2 * pulse;
        const s = 1.2 + Math.sin(time * 2.5 + ud.floatPhase) * 0.1;
        ud.glowMesh.scale.setScalar(s);
      }
    });

    for (const b of this.bubblePool) {
      if (b.life <= 0) continue;
      b.life -= delta / b.maxLife;
      if (b.life <= 0) {
        b.mesh.visible = false;
        continue;
      }
      b.mesh.position.x += b.velocity.x * delta;
      b.mesh.position.y += b.velocity.y * delta;
      b.mesh.position.z += b.velocity.z * delta;
      b.velocity.x += (Math.random() - 0.5) * 0.5 * delta;
      b.velocity.z += (Math.random() - 0.5) * 0.5 * delta;
      b.velocity.y += delta * 0.8;
      const mat = b.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * b.life;
      b.mesh.scale.multiplyScalar(1 + delta * 0.3);
    }

    this.wreckGroup.position.y = -3 + Math.sin(time * 0.4) * 0.08;
    this.wreckGroup.rotation.z = 0.08 + Math.sin(time * 0.3) * 0.01;
  }

  public getAllArtifacts(): THREE.Object3D[] {
    return this.artifacts;
  }
}
