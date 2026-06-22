import * as THREE from 'three';
import { EnvParams, SceneInitializer } from './SceneInitializer';

export type CoralType =
  | 'brain'
  | 'staghorn'
  | 'anemone'
  | 'plate'
  | 'tube'
  | 'mushroom'
  | 'fan'
  | 'bubble'
  | 'branch'
  | 'cauliflower'
  | 'vase'
  | 'fire';

export interface CoralData {
  mesh: THREE.Group;
  position: THREE.Vector3;
  boundingRadius: number;
  type: CoralType;
  baseScale: number;
  phase: number;
  baseColor: THREE.Color;
  materials: THREE.Material[];
}

const CORAL_TYPES: CoralType[] = [
  'brain', 'staghorn', 'anemone', 'plate', 'tube', 'mushroom',
  'fan', 'bubble', 'branch', 'cauliflower', 'vase', 'fire',
];

export class CoralGenerator {
  private scene: THREE.Scene;
  private sceneInit: SceneInitializer;
  private count: number;
  public corals: CoralData[] = [];

  constructor(scene: THREE.Scene, sceneInit: SceneInitializer, count = 90) {
    this.scene = scene;
    this.sceneInit = sceneInit;
    this.count = count;
  }

  public generate(): CoralData[] {
    for (let i = 0; i < this.count; i++) {
      const type = CORAL_TYPES[Math.floor(Math.random() * CORAL_TYPES.length)];
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      const y = this.sceneInit.getTerrainHeight(x, z);
      const pos = new THREE.Vector3(x, y, z);
      const scale = 0.6 + Math.random() * 1.8;
      const phase = Math.random() * Math.PI * 2;

      const dist = Math.sqrt(x * x + z * z);
      const depthT = Math.min(1, Math.max(0, (dist - 15) / 70));
      const hueShift = Math.random() * 0.08;
      const shallowHue = type === 'anemone' ? 0.93 + hueShift : type === 'fire' ? 0.03 + hueShift : 0.13 + hueShift;
      const deepHue = 0.68 + (type === 'anemone' ? 0.05 : 0) + hueShift;
      const color = new THREE.Color().setHSL(
        THREE.MathUtils.lerp(shallowHue, deepHue, depthT),
        0.55 + Math.random() * 0.25,
        THREE.MathUtils.lerp(0.7, 0.32, depthT),
      );

      const group = this.buildCoral(type, color, scale, phase);
      group.position.copy(pos);
      group.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(group);

      const mats: THREE.Material[] = [];
      group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const m = (o as THREE.Mesh).material;
          if (Array.isArray(m)) mats.push(...m); else if (m) mats.push(m);
        }
      });

      const radius = this.computeRadius(group) * scale;
      this.corals.push({
        mesh: group,
        position: pos.clone(),
        boundingRadius: radius,
        type,
        baseScale: scale,
        phase,
        baseColor: color.clone(),
        materials: mats,
      });
    }
    return this.corals;
  }

  private computeRadius(group: THREE.Group): number {
    let max = 0;
    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.geometry.computeBoundingSphere();
        const r = m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 1;
        const s = Math.max(m.scale.x, m.scale.y, m.scale.z);
        max = Math.max(max, r * s);
      }
    });
    return max;
  }

  private buildCoral(type: CoralType, color: THREE.Color, _scale: number, _phase: number): THREE.Group {
    switch (type) {
      case 'brain': return this.buildBrain(color);
      case 'staghorn': return this.buildStaghorn(color);
      case 'anemone': return this.buildAnemone(color);
      case 'plate': return this.buildPlate(color);
      case 'tube': return this.buildTube(color);
      case 'mushroom': return this.buildMushroom(color);
      case 'fan': return this.buildFan(color);
      case 'bubble': return this.buildBubble(color);
      case 'branch': return this.buildBranch(color);
      case 'cauliflower': return this.buildCauliflower(color);
      case 'vase': return this.buildVase(color);
      case 'fire': return this.buildFire(color);
    }
  }

  private mat(color: THREE.Color, roughness = 0.65, metal = 0.0): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: color.clone(),
      roughness,
      metalness: metal,
      flatShading: false,
    });
  }

  private perturbVertices(geo: THREE.BufferGeometry, amp: number, freqX: number, freqY: number, freqZ?: number): void {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const fz = freqZ ?? freqX;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const dx = Math.sin(vx * freqX) * Math.sin(vy * freqY) * amp;
      const dy = Math.sin(vy * freqY) * Math.sin(vz * fz) * amp;
      const dz = Math.sin(vz * fz) * Math.sin(vx * freqX) * amp;
      pos.setXYZ(i, vx + dx, vy + dy, vz + dz);
    }
    pos.needsUpdate = true;
  }

  private buildBrain(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const layerCount = 4 + Math.floor(Math.random() * 3);
    const mergedGeos: THREE.BufferGeometry[] = [];

    for (let i = 0; i < layerCount; i++) {
      const t = i / Math.max(1, layerCount - 1);
      const torusRadius = 0.9 + t * 0.4;
      const tubeRadius = 0.22 + (1 - t) * 0.12;
      const geo = new THREE.TorusGeometry(torusRadius, tubeRadius, 12, 32);
      geo.rotateY((i / layerCount) * Math.PI * 1.3 + Math.random() * 0.4);
      geo.rotateX(Math.random() * 0.3 - 0.15);
      this.perturbVertices(geo, 0.1, 6, 6, 6);
      mergedGeos.push(geo);
    }

    const capGeo = new THREE.SphereGeometry(0.95 + (layerCount - 4) * 0.12, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    this.perturbVertices(capGeo, 0.08, 5, 5, 5);
    mergedGeos.push(capGeo);

    const merged = THREE.BufferGeometryUtils
      ? (THREE.BufferGeometryUtils as any).mergeGeometries(mergedGeos, false)
      : this.mergeGeometries(mergedGeos);

    this.perturbVertices(merged, 0.12, 7, 8, 6);
    merged.computeVertexNormals();

    const mesh = new THREE.Mesh(merged, this.mat(color, 0.8));
    mesh.scale.set(1, 0.72, 1);
    mesh.position.y = 0.6;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return g;
  }

  private mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    let vCount = 0;
    let iCount = 0;
    for (const gg of geos) {
      gg.computeVertexNormals();
      vCount += (gg.attributes.position as THREE.BufferAttribute).count;
      if (gg.index) iCount += gg.index.count;
      else iCount += (gg.attributes.position as THREE.BufferAttribute).count;
    }
    const positions = new Float32Array(vCount * 3);
    const normals = new Float32Array(vCount * 3);
    const indices = new Uint32Array(iCount);
    let vOff = 0;
    let iOff = 0;
    for (const gg of geos) {
      const pa = gg.attributes.position as THREE.BufferAttribute;
      const na = gg.attributes.normal as THREE.BufferAttribute;
      const vNum = pa.count;
      for (let k = 0; k < vNum; k++) {
        positions[(vOff + k) * 3] = pa.getX(k);
        positions[(vOff + k) * 3 + 1] = pa.getY(k);
        positions[(vOff + k) * 3 + 2] = pa.getZ(k);
        normals[(vOff + k) * 3] = na.getX(k);
        normals[(vOff + k) * 3 + 1] = na.getY(k);
        normals[(vOff + k) * 3 + 2] = na.getZ(k);
      }
      if (gg.index) {
        const id = gg.index;
        for (let k = 0; k < id.count; k++) indices[iOff + k] = id.getX(k) + vOff;
        iOff += id.count;
      } else {
        for (let k = 0; k < vNum; k++) indices[iOff + k] = k + vOff;
        iOff += vNum;
      }
      vOff += vNum;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    out.setIndex(new THREE.BufferAttribute(indices, 1));
    return out;
  }

  private buildStaghorn(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    this.staghornBranch(g, color, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 4, 1.0);
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });
    return g;
  }

  private staghornBranch(g: THREE.Group, color: THREE.Color, origin: THREE.Vector3, dir: THREE.Vector3, depth: number, thickness: number): void {
    if (depth <= 0) return;
    const len = 1.5 + depth * 0.4;
    const topRadius = thickness * 0.35;
    const bottomRadius = thickness * 0.75;
    const geo = new THREE.ConeGeometry(bottomRadius, len, 10, 1, true);
    geo.translate(0, len / 2, 0);
    this.perturbVertices(geo, 0.04, 4, 3, 4);
    const mesh = new THREE.Mesh(geo, this.mat(color, 0.55));
    mesh.position.copy(origin);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    mesh.quaternion.copy(q);
    g.add(mesh);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(topRadius, 8, 6),
      this.mat(color, 0.55),
    );
    const tip = origin.clone().add(dir.clone().multiplyScalar(len));
    cap.position.copy(tip);
    g.add(cap);

    const branches = depth > 2 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < branches; i++) {
      const newDir = dir.clone().normalize();
      newDir.x += (Math.random() - 0.5) * 1.2;
      newDir.y += Math.random() * 0.5 - 0.1;
      newDir.z += (Math.random() - 0.5) * 1.2;
      newDir.normalize();
      this.staghornBranch(g, color, tip, newDir, depth - 1, thickness * 0.65);
    }
  }

  private buildAnemone(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const baseColor = new THREE.Color().setHSL(color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.75, 0.5);

    const diskGeo = new THREE.SphereGeometry(0.6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    this.perturbVertices(diskGeo, 0.05, 5, 4, 5);
    const disk = new THREE.Mesh(diskGeo, this.mat(baseColor, 0.65));
    disk.position.y = 0.2;
    disk.scale.set(1, 0.55, 1);
    disk.castShadow = true;
    g.add(disk);

    const stemGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.35, 14);
    const stem = new THREE.Mesh(stemGeo, this.mat(baseColor, 0.7));
    stem.position.y = 0.17;
    stem.castShadow = true;
    g.add(stem);

    const tentacleCount = 30;
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const rad = 0.42 + Math.random() * 0.1;
      const height = 1.2 + Math.random() * 0.8;
      const tubeGeo = new THREE.CylinderGeometry(0.035, 0.08, height, 6, 4);
      tubeGeo.translate(0, height / 2, 0);
      const tentacleMat = this.mat(new THREE.Color().setHSL(
        color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.78, 0.62), 0.45);
      const t = new THREE.Mesh(tubeGeo, tentacleMat);
      const px = Math.cos(angle) * rad;
      const pz = Math.sin(angle) * rad;
      t.position.set(px, 0.45, pz);
      t.userData.tentacleIndex = i;
      t.userData.baseAngle = angle;
      t.castShadow = true;
      g.add(t);

      const tipSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        this.mat(new THREE.Color().setHSL(
          color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.85, 0.68), 0.35),
      );
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(0.35);
      tipSphere.position.set(
        px + dir.x * 0.5,
        0.45 + height * 0.9,
        pz + dir.z * 0.5,
      );
      tipSphere.userData.tentacleIndex = i;
      tipSphere.userData.baseAngle = angle;
      tipSphere.userData.isTip = true;
      g.add(tipSphere);
    }

    const mouth = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 9),
      this.mat(new THREE.Color().setHSL(color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.85, 0.35), 0.4),
    );
    mouth.position.y = 0.5;
    g.add(mouth);

    return g;
  }

  private buildPlate(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const profile: THREE.Vector2[] = [];
    const segs = 22;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const r = 0.1 + Math.sin(t * Math.PI) * 1.8 + Math.sin(t * Math.PI * 3) * 0.15;
      profile.push(new THREE.Vector2(Math.max(0.05, r), t * 0.85 - 0.05));
    }
    const lathe = new THREE.LatheGeometry(profile, 36);
    this.perturbVertices(lathe, 0.04, 4, 5, 4);
    lathe.computeVertexNormals();
    const plate = new THREE.Mesh(lathe, this.mat(color, 0.6, 0.05));
    plate.scale.set(1, 1, 1);
    plate.position.y = 0.25;
    plate.castShadow = true;
    plate.receiveShadow = true;
    g.add(plate);

    const ribs = 6;
    for (let j = 0; j < ribs; j++) {
      const a = (j / ribs) * Math.PI * 2;
      const ribGeo = new THREE.BoxGeometry(0.04, 0.7, 1.7);
      ribGeo.translate(0, 0.3, 0.85);
      const rib = new THREE.Mesh(ribGeo, this.mat(new THREE.Color().setHSL(
        color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.7, 0.4), 0.7));
      rib.rotation.y = a;
      rib.position.y = 0.2;
      g.add(rib);
    }
    return g;
  }

  private buildTube(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const tubeBundles = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < tubeBundles; i++) {
      const angle = (i / tubeBundles) * Math.PI * 2 + Math.random() * 0.4;
      const rad = 0.25 + Math.random() * 0.35;
      const height = 1.3 + Math.random() * 1.4;
      const rBot = 0.22 + Math.random() * 0.12;
      const rTop = rBot * 0.45;

      const outerGeo = new THREE.CylinderGeometry(rTop, rBot, height, 10, 1, true);
      this.perturbVertices(outerGeo, 0.05, 3, 4, 3);
      const tubeMesh = new THREE.Mesh(outerGeo, this.mat(color, 0.4));
      tubeMesh.position.set(Math.cos(angle) * rad, height / 2 + 0.05, Math.sin(angle) * rad);
      tubeMesh.rotation.z = Math.cos(angle) * 0.15;
      tubeMesh.rotation.x = Math.sin(angle) * 0.15;
      tubeMesh.castShadow = true;
      g.add(tubeMesh);

      const innerGeo = new THREE.CylinderGeometry(rTop * 0.6, rBot * 0.6, height * 0.95, 8, 1, true);
      const innerMesh = new THREE.Mesh(innerGeo, this.mat(new THREE.Color(0x1a1420), 0.9));
      innerMesh.position.copy(tubeMesh.position);
      innerMesh.rotation.copy(tubeMesh.rotation);
      g.add(innerMesh);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(rTop, 0.03, 6, 14),
        this.mat(new THREE.Color().setHSL(
          color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.82, 0.7), 0.25),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(
        tubeMesh.position.x,
        height + 0.05,
        tubeMesh.position.z,
      );
      g.add(rim);
    }
    return g;
  }

  private buildMushroom(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const stemGeo = new THREE.CylinderGeometry(0.22, 0.35, 1.1, 12);
    this.perturbVertices(stemGeo, 0.03, 3, 4, 3);
    const stem = new THREE.Mesh(stemGeo, this.mat(new THREE.Color().setHSL(hsl.h, hsl.s * 0.7, hsl.l * 1.1), 0.75));
    stem.position.y = 0.55;
    stem.castShadow = true;
    g.add(stem);

    const capPoints: THREE.Vector2[] = [];
    const capSegs = 18;
    for (let i = 0; i <= capSegs; i++) {
      const t = i / capSegs;
      const a = t * Math.PI;
      const r = Math.sin(a) * 1.25 + Math.sin(a * 3) * 0.08;
      const y = Math.cos(a) * 0.55;
      capPoints.push(new THREE.Vector2(Math.max(0.05, r), y));
    }
    const capGeo = new THREE.LatheGeometry(capPoints, 28);
    this.perturbVertices(capGeo, 0.06, 5, 4, 5);
    capGeo.computeVertexNormals();
    const capColor = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.25), Math.min(0.7, hsl.l));
    const cap = new THREE.Mesh(capGeo, this.mat(capColor, 0.5, 0.05));
    cap.position.y = 1.0;
    cap.castShadow = true;
    cap.receiveShadow = true;
    g.add(cap);

    const spots = 8 + Math.floor(Math.random() * 4);
    const spotColor = new THREE.Color().setHSL(hsl.h, 0.2, 0.92);
    for (let i = 0; i < spots; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.75;
      const spot = new THREE.Mesh(
        new THREE.CircleGeometry(0.05 + Math.random() * 0.06, 10),
        this.mat(spotColor, 0.6),
      );
      const yCap = Math.sqrt(Math.max(0, 1.25 * 1.25 - r * r)) * 0.55;
      spot.position.set(Math.cos(a) * r, 1.0 + yCap + 0.002, Math.sin(a) * r);
      const n = new THREE.Vector3(Math.cos(a), 0.55 * (yCap / Math.max(0.001, yCap)), Math.sin(a)).normalize();
      spot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      g.add(spot);
    }
    return g;
  }

  private buildFan(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const fanPoints: THREE.Vector2[] = [];
    const fanSegs = 28;
    for (let i = 0; i <= fanSegs; i++) {
      const t = i / fanSegs;
      const r = Math.sin(t * Math.PI) * 1.7 + Math.sin(t * Math.PI * 5) * 0.08;
      fanPoints.push(new THREE.Vector2(Math.max(0.05, r + 0.08), t * 2.1 - 0.1));
    }
    const latheGeo = new THREE.LatheGeometry(fanPoints, 40);
    this.perturbVertices(latheGeo, 0.04, 5, 6, 5);
    latheGeo.computeVertexNormals();
    const fan = new THREE.Mesh(latheGeo, this.mat(color, 0.5, 0.08));
    fan.scale.set(1, 1, 0.22);
    fan.position.y = 0.2;
    fan.castShadow = true;
    fan.receiveShadow = true;
    g.add(fan);

    const ribs = 5 + Math.floor(Math.random() * 3);
    const ribColor = new THREE.Color(0x3d2b1a);
    for (let j = 0; j < ribs; j++) {
      const t = (j / (ribs - 1)) * 0.7 - 0.35;
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.04, 2.15, 5),
        this.mat(ribColor, 0.85),
      );
      rib.position.z = 0.11;
      rib.rotation.z = t;
      rib.position.y = 1.1;
      g.add(rib);
    }

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, 0.3, 12),
      this.mat(new THREE.Color().setHSL(hsl.h, hsl.s * 0.6, hsl.l * 0.8), 0.75),
    );
    base.position.y = 0.15;
    base.castShadow = true;
    g.add(base);

    return g;
  }

  private buildBubble(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const count = 12 + Math.floor(Math.random() * 10);
    const placed: { pos: THREE.Vector3; r: number }[] = [];
    for (let i = 0; i < count; i++) {
      const r = 0.18 + Math.random() * 0.45;
      let pos: THREE.Vector3;
      let tries = 0;
      do {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 1.0;
        pos = new THREE.Vector3(
          Math.cos(angle) * rad,
          0.2 + Math.random() * 1.1,
          Math.sin(angle) * rad,
        );
        tries++;
      } while (tries < 8 && placed.some((p) => p.pos.distanceTo(pos) < (p.r + r) * 0.75));
      placed.push({ pos, r });

      const geo = new THREE.IcosahedronGeometry(r, 2);
      this.perturbVertices(geo, 0.08 * r, 6, 6, 6);
      geo.computeVertexNormals();
      const lighter = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + 0.15), Math.min(0.85, hsl.l + 0.1));
      const sphere = new THREE.Mesh(geo, this.mat(lighter, 0.25, 0.25));
      sphere.position.copy(pos);
      sphere.castShadow = true;
      g.add(sphere);
    }
    return g;
  }

  private buildBranch(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    this.softBranch(g, color, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 5, 0.7);
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
      }
    });
    return g;
  }

  private softBranch(g: THREE.Group, color: THREE.Color, origin: THREE.Vector3, dir: THREE.Vector3, depth: number, thick: number): void {
    if (depth <= 0) return;
    const len = 0.9 + depth * 0.28;
    const segCount = 3;
    const positions: THREE.Vector3[] = [];
    for (let s = 0; s <= segCount; s++) {
      const t = s / segCount;
      positions.push(origin.clone().add(dir.clone().multiplyScalar(len * t)));
    }
    const curve = new THREE.CatmullRomCurve3(positions);
    const tubeGeo = new THREE.TubeGeometry(curve, 10, thick * 0.42, 8, false);
    const segment = new THREE.Mesh(tubeGeo, this.mat(color, 0.55));
    g.add(segment);

    const tip = origin.clone().add(dir.clone().multiplyScalar(len * 0.85));
    const branches = depth > 3 ? 3 : depth > 1 ? 2 : 1;
    for (let i = 0; i < branches; i++) {
      const nd = dir.clone().normalize();
      nd.x += (Math.random() - 0.5) * 0.95;
      nd.y += Math.random() * 0.45;
      nd.z += (Math.random() - 0.5) * 0.95;
      nd.normalize();
      this.softBranch(g, color, tip, nd, depth - 1, thick * 0.72);
    }
  }

  private buildCauliflower(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    type Node = { pos: THREE.Vector3; r: number; d: number };
    const stack: Node[] = [{ pos: new THREE.Vector3(0, 0.35, 0), r: 0.8, d: 4 }];
    while (stack.length) {
      const cur = stack.pop()!;
      const lighter = new THREE.Color().setHSL(hsl.h, hsl.s * (0.85 + cur.d * 0.04), Math.min(0.78, hsl.l + (4 - cur.d) * 0.03));
      const geo = new THREE.IcosahedronGeometry(cur.r, 1);
      this.perturbVertices(geo, 0.1 * cur.r, 5, 5, 5);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, this.mat(lighter, 0.62));
      m.position.copy(cur.pos);
      m.castShadow = true;
      g.add(m);
      if (cur.d > 0) {
        const kids = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < kids; i++) {
          const ang = Math.random() * Math.PI * 2;
          const el = Math.random() * Math.PI / 2.2;
          const nr = cur.r * 0.55;
          const dist = (cur.r + nr) * 0.85;
          const np = new THREE.Vector3(
            cur.pos.x + Math.cos(ang) * Math.sin(el) * dist,
            cur.pos.y + Math.cos(el) * dist,
            cur.pos.z + Math.sin(ang) * Math.sin(el) * dist,
          );
          stack.push({ pos: np, r: nr, d: cur.d - 1 });
        }
      }
    }
    return g;
  }

  private buildVase(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const pts: THREE.Vector2[] = [];
    const profileSteps = [
      [0.3, 0.0],
      [0.55, 0.1],
      [0.82, 0.35],
      [1.0, 0.75],
      [0.9, 1.1],
      [0.6, 1.4],
      [0.38, 1.65],
      [0.42, 1.72],
      [0.72, 1.55],
      [0.95, 1.2],
      [0.75, 0.85],
      [0.5, 0.5],
      [0.3, 0.0],
    ];
    for (const [x, y] of profileSteps) pts.push(new THREE.Vector2(x, y));
    const outerGeo = new THREE.LatheGeometry(pts, 36);
    this.perturbVertices(outerGeo, 0.03, 4, 6, 4);
    outerGeo.computeVertexNormals();
    const vase = new THREE.Mesh(outerGeo, this.mat(color, 0.5, 0.08));
    vase.castShadow = true;
    vase.receiveShadow = true;
    g.add(vase);

    const rimColor = new THREE.Color().setHSL(hsl.h, 0.8, 0.72);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.04, 8, 24),
      this.mat(rimColor, 0.3),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.68;
    g.add(rim);

    const ridgeCount = 10;
    for (let r = 0; r < ridgeCount; r++) {
      const a = (r / ridgeCount) * Math.PI * 2;
      const ridgeGeo = new THREE.BoxGeometry(0.03, 1.2, 0.04);
      ridgeGeo.translate(0, 0.7, 0.55);
      const ridge = new THREE.Mesh(ridgeGeo, this.mat(new THREE.Color().setHSL(hsl.h, hsl.s * 0.9, hsl.l * 0.8), 0.7));
      ridge.rotation.y = a;
      g.add(ridge);
    }
    return g;
  }

  private buildFire(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const coreGeo = new THREE.IcosahedronGeometry(0.72, 2);
    this.perturbVertices(coreGeo, 0.1, 6, 7, 6);
    coreGeo.computeVertexNormals();
    const core = new THREE.Mesh(coreGeo, this.mat(color, 0.55));
    core.scale.set(1, 0.62, 1);
    core.position.y = 0.18;
    core.castShadow = true;
    g.add(core);

    const spikes = 45 + Math.floor(Math.random() * 35);
    for (let i = 0; i < spikes; i++) {
      const angle = Math.random() * Math.PI * 2;
      const el = Math.random() * Math.PI / 2.4;
      const baseR = Math.random() * 0.82;
      const len = 0.3 + Math.random() * 0.85;
      const baseThick = 0.035 + Math.random() * 0.04;

      const points: THREE.Vector3[] = [];
      const segs = 5;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const wob = (1 - t) * (Math.random() - 0.5) * 0.1;
        points.push(new THREE.Vector3(
          Math.cos(angle) * Math.sin(el) * (baseR + t * len) + wob,
          Math.cos(el) * (baseR + t * len) + 0.1,
          Math.sin(angle) * Math.sin(el) * (baseR + t * len) + wob,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const spikeGeo = new THREE.TubeGeometry(curve, 6, baseThick, 5, false);
      const brighter = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + 0.1), Math.min(0.78, hsl.l + 0.08));
      const spikeMat = this.mat(brighter, 0.35, 0.1);
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.castShadow = true;
      g.add(spike);

      const tipBall = new THREE.Mesh(
        new THREE.SphereGeometry(baseThick * 1.8, 8, 6),
        this.mat(new THREE.Color().setHSL(hsl.h, 0.9, 0.72), 0.3, 0.15),
      );
      tipBall.position.copy(points[points.length - 1]);
      g.add(tipBall);
    }
    return g;
  }

  public update(time: number, params: EnvParams): void {
    const nutri = params.nutrientLevel / 100;
    const light = params.lightIntensity / 100;
    const current = params.currentSpeed;

    for (const c of this.corals) {
      const pulseAmp = 0.02 + nutri * 0.05;
      const pulseAmpY = 0.015 + nutri * 0.03;
      const pulse = 1 + Math.sin(time * 1.6 + c.phase) * pulseAmp;
      const pulseY = 1 + Math.sin(time * 1.3 + c.phase * 1.4) * pulseAmpY;
      c.mesh.scale.set(c.baseScale * pulse, c.baseScale * pulseY, c.baseScale * pulse);

      const satBoost = 0.5 + nutri * 0.5 + light * 0.3;
      const hsl = { h: c.baseColor.getHSL({ h: 0, s: 0, l: 0 }).h, s: 0, l: 0 };
      c.baseColor.getHSL(hsl);

      c.materials.forEach((m) => {
        const sm = m as THREE.MeshStandardMaterial;
        if (!sm.color) return;
        const s = Math.min(1, hsl.s * satBoost);
        const l = THREE.MathUtils.lerp(hsl.l, hsl.l + 0.1, light * 0.5);
        sm.color.setHSL(hsl.h, s, l);
        sm.emissive = sm.emissive || new THREE.Color();
        sm.emissive.setHSL(hsl.h, 0.6, 0.08 * nutri + 0.05 * light);
        sm.emissiveIntensity = 0.25 + nutri * 0.8;
      });

      if (c.type === 'anemone') {
        c.mesh.traverse((child) => {
          const t = child as THREE.Mesh;
          if (!t.isMesh) return;
          if (t.userData && typeof t.userData.baseAngle === 'number') {
            const baseAngle = t.userData.baseAngle as number;
            const sw = Math.sin(time * (1.2 + current * 0.4) + baseAngle) * (0.22 + current * 0.1);
            const sw2 = Math.cos(time * (1.5 + current * 0.3) + baseAngle * 1.3) * (0.17 + current * 0.08);
            if ((t.userData as any).isTip) {
              if (typeof (t.userData as any).basePosX !== 'number') {
                (t.userData as any).basePosX = t.position.x;
                (t.userData as any).basePosZ = t.position.z;
              }
              const tipOffset = 0.35;
              t.position.x = (t.userData as any).basePosX + Math.sin(time * (1.2 + current * 0.4) + baseAngle) * tipOffset;
              t.position.z = (t.userData as any).basePosZ + Math.cos(time * (1.5 + current * 0.3) + baseAngle * 1.3) * tipOffset * 0.8;
            } else {
              t.rotation.z = Math.cos(baseAngle) * 0.25 + sw;
              t.rotation.x = Math.sin(baseAngle) * 0.25 + sw2;
            }
          }
        });
      }
    }
  }
}
