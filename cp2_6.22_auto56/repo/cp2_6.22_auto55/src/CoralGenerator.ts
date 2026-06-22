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

  private buildBrain(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, 4);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const n = v.clone().normalize();
      const wrinkle = Math.sin(v.x * 8) * Math.sin(v.y * 9) * Math.sin(v.z * 7) * 0.15;
      const r = 1 + wrinkle + Math.random() * 0.03;
      v.multiplyScalar(r).add(n.multiplyScalar(Math.random() * 0.05));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, this.mat(color, 0.75));
    mesh.scale.set(1, 0.75, 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return g;
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
    const geo = new THREE.CylinderGeometry(thickness * 0.6, thickness, len, 8, 1);
    geo.translate(0, len / 2, 0);
    const mesh = new THREE.Mesh(geo, this.mat(color, 0.6));
    mesh.position.copy(origin);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    mesh.quaternion.copy(q);
    g.add(mesh);

    const tip = origin.clone().add(dir.clone().multiplyScalar(len));
    const branches = depth > 2 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < branches; i++) {
      const newDir = dir.clone().normalize();
      newDir.x += (Math.random() - 0.5) * 1.2;
      newDir.y += Math.random() * 0.5 - 0.1;
      newDir.z += (Math.random() - 0.5) * 1.2;
      newDir.normalize();
      this.staghornBranch(g, color, tip, newDir, depth - 1, thickness * 0.7);
    }
  }

  private buildAnemone(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(0.4, 0.8, 0.6, 12);
    const base = new THREE.Mesh(baseGeo, this.mat(color, 0.7));
    base.position.y = 0.3;
    base.castShadow = true;
    g.add(base);

    const tentacleCount = 28;
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const rad = 0.55;
      const height = 1.6 + Math.random() * 1.2;
      const geo = new THREE.CylinderGeometry(0.04, 0.1, height, 5, 3);
      geo.translate(0, height / 2 + 0.5, 0);
      const t = new THREE.Mesh(geo, this.mat(new THREE.Color().setHSL(
        (color.getHSL({ h: 0, s: 0, l: 0 }).h), 0.7, 0.65), 0.5));
      t.position.set(Math.cos(angle) * rad, 0.6, Math.sin(angle) * rad);
      t.rotation.z = Math.cos(angle) * 0.25;
      t.rotation.x = Math.sin(angle) * 0.25;
      t.userData.tentacleIndex = i;
      t.userData.baseAngle = angle;
      t.castShadow = true;
      g.add(t);
    }

    const mouth = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 8),
      this.mat(new THREE.Color().setHSL(color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.8, 0.45), 0.4),
    );
    mouth.position.y = 0.7;
    g.add(mouth);
    return g;
  }

  private buildPlate(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const radius = 0.4 + t * 1.3;
      const geo = new THREE.CylinderGeometry(radius * 0.92, radius, 0.18, 24, 1);
      const plate = new THREE.Mesh(geo, this.mat(color, 0.65));
      plate.position.y = i * 0.22 + 0.09;
      plate.castShadow = true;
      plate.receiveShadow = true;
      g.add(plate);
    }
    return g;
  }

  private buildTube(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const tubes = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < tubes; i++) {
      const angle = (i / tubes) * Math.PI * 2 + Math.random() * 0.3;
      const rad = 0.2 + Math.random() * 0.3;
      const height = 1.4 + Math.random() * 1.5;
      const geo = new THREE.CylinderGeometry(0.12, 0.28, height, 8, 1, true);
      const tube = new THREE.Mesh(geo, this.mat(color, 0.45));
      tube.position.set(Math.cos(angle) * rad, height / 2 + 0.05, Math.sin(angle) * rad);
      tube.rotation.z = Math.cos(angle) * 0.12;
      tube.rotation.x = Math.sin(angle) * 0.12;
      tube.castShadow = true;
      g.add(tube);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.025, 6, 10),
        this.mat(new THREE.Color().setHSL(color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.8, 0.7), 0.3),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(tube.position.x, height + 0.05, tube.position.z);
      g.add(rim);
    }
    return g;
  }

  private buildMushroom(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.0, 10), this.mat(color, 0.7));
    stem.position.y = 0.5;
    stem.castShadow = true;
    g.add(stem);
    const capGeo = new THREE.SphereGeometry(1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1);
    const capColor = new THREE.Color().setHSL(color.getHSL({ h: 0, s: 0, l: 0 }).h, 0.8, 0.55);
    const cap = new THREE.Mesh(capGeo, this.mat(capColor, 0.5));
    cap.position.y = 0.9;
    cap.scale.set(1, 0.45, 1);
    cap.castShadow = true;
    cap.receiveShadow = true;
    g.add(cap);
    return g;
  }

  private buildFan(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const r = Math.sin(t * Math.PI) * 1.6;
      pts.push(new THREE.Vector2(r + 0.1, t * 2.0 - 0.1));
    }
    const geo = new THREE.LatheGeometry(pts, 40);
    const fan = new THREE.Mesh(geo, this.mat(color, 0.5, 0.05));
    fan.scale.set(1, 1, 0.25);
    fan.castShadow = true;
    fan.receiveShadow = true;
    g.add(fan);
    for (let j = 0; j < 5; j++) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.1, 4),
        this.mat(new THREE.Color(0x332211), 0.8),
      );
      rib.position.z = 0.12;
      rib.rotation.z = -0.35 + (j / 4) * 0.7;
      rib.position.y = 0.95;
      g.add(rib);
    }
    return g;
  }

  private buildBubble(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const count = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const r = 0.18 + Math.random() * 0.4;
      const sphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        this.mat(color, 0.3, 0.1),
      );
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.9;
      sphere.position.set(
        Math.cos(angle) * rad,
        0.2 + Math.random() * 1.0,
        Math.sin(angle) * rad,
      );
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
    const len = 0.8 + depth * 0.25;
    const geo = new THREE.SphereGeometry(thick * 0.6, 9, 7);
    const m = new THREE.Mesh(geo, this.mat(color, 0.6));
    m.position.copy(origin);
    m.scale.set(0.6, len / thick, 0.6);
    const up = new THREE.Vector3(0, 1, 0);
    m.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()));
    g.add(m);

    const tip = origin.clone().add(dir.clone().multiplyScalar(len * 0.8));
    const branches = depth > 3 ? 3 : depth > 1 ? 2 : 1;
    for (let i = 0; i < branches; i++) {
      const nd = dir.clone().normalize();
      nd.x += (Math.random() - 0.5) * 0.9;
      nd.y += Math.random() * 0.4;
      nd.z += (Math.random() - 0.5) * 0.9;
      nd.normalize();
      this.softBranch(g, color, tip, nd, depth - 1, thick * 0.72);
    }
  }

  private buildCauliflower(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const stack = [{ pos: new THREE.Vector3(0, 0.4, 0), r: 0.75, d: 4 }];
    while (stack.length) {
      const cur = stack.pop()!;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(cur.r, 1), this.mat(color, 0.65));
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
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0.35, 0));
    pts.push(new THREE.Vector2(0.7, 0.3));
    pts.push(new THREE.Vector2(0.95, 0.8));
    pts.push(new THREE.Vector2(0.7, 1.3));
    pts.push(new THREE.Vector2(0.4, 1.6));
    pts.push(new THREE.Vector2(0.45, 1.65));
    pts.push(new THREE.Vector2(0.85, 1.35));
    pts.reverse();
    const geo = new THREE.LatheGeometry(pts, 32);
    const vase = new THREE.Mesh(geo, this.mat(color, 0.55, 0.05));
    vase.castShadow = true;
    vase.receiveShadow = true;
    g.add(vase);
    return g;
  }

  private buildFire(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const spikes = 40 + Math.floor(Math.random() * 30);
    for (let i = 0; i < spikes; i++) {
      const angle = Math.random() * Math.PI * 2;
      const el = Math.random() * Math.PI / 2.3;
      const baseR = Math.random() * 0.8;
      const len = 0.25 + Math.random() * 0.8;
      const geo = new THREE.ConeGeometry(0.03 + Math.random() * 0.03, len, 5);
      geo.translate(0, len / 2, 0);
      const spike = new THREE.Mesh(geo, this.mat(color, 0.4, 0.1));
      spike.position.set(
        Math.cos(angle) * Math.sin(el) * baseR,
        Math.cos(el) * baseR + 0.1,
        Math.sin(angle) * Math.sin(el) * baseR,
      );
      const up = new THREE.Vector3(0, 1, 0);
      const dir = new THREE.Vector3(Math.cos(angle) * Math.sin(el), Math.cos(el), Math.sin(angle) * Math.sin(el)).normalize();
      spike.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(up, dir));
      spike.castShadow = true;
      g.add(spike);
    }
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), this.mat(color, 0.6));
    core.scale.set(1, 0.6, 1);
    core.position.y = 0.2;
    g.add(core);
    return g;
  }

  public update(time: number, params: EnvParams): void {
    const nutri = params.nutrientLevel / 100;
    const light = params.lightIntensity / 100;
    const current = params.currentSpeed;

    for (const c of this.corals) {
      const pulse = 1 + Math.sin(time * 1.6 + c.phase) * (0.02 + nutri * 0.04);
      const pulseY = 1 + Math.sin(time * 1.3 + c.phase * 1.4) * (0.015 + nutri * 0.025);
      c.mesh.scale.set(c.baseScale * pulse, c.baseScale * pulseY, c.baseScale * pulse);

      const satBoost = 0.5 + nutri * 0.5 + light * 0.3;
      c.materials.forEach((m) => {
        const sm = m as THREE.MeshStandardMaterial;
        if (!sm.color) return;
        const hsl = { h: c.baseColor.getHSL({ h: 0, s: 0, l: 0 }).h, s: 0, l: 0 };
        c.baseColor.getHSL(hsl);
        const s = Math.min(1, hsl.s * satBoost);
        const l = THREE.MathUtils.lerp(hsl.l, hsl.l + 0.1, light * 0.5);
        sm.color.setHSL(hsl.h, s, l);
        sm.emissive = sm.emissive || new THREE.Color();
        sm.emissive.setHSL(hsl.h, 0.6, 0.08 * nutri + 0.05 * light);
        sm.emissiveIntensity = 0.25 + nutri * 0.8;
      });

      if (c.type === 'anemone') {
        c.mesh.children.forEach((child, idx) => {
          if (idx > 0 && idx < c.mesh.children.length - 1) {
            const t = child as THREE.Mesh;
            if (t.userData && typeof t.userData.baseAngle === 'number') {
              const sw = Math.sin(time * (1.2 + current * 0.4) + t.userData.baseAngle) * (0.2 + current * 0.08);
              const sw2 = Math.cos(time * (1.5 + current * 0.3) + t.userData.baseAngle * 1.3) * (0.15 + current * 0.06);
              t.rotation.z = (t.userData.baseAngle ? Math.cos(t.userData.baseAngle) * 0.25 : 0) + sw;
              t.rotation.x = (t.userData.baseAngle ? Math.sin(t.userData.baseAngle) * 0.25 : 0) + sw2;
            }
          }
        });
      }
    }
  }
}
