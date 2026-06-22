import * as THREE from 'three';
import { CreatureData } from './DataParser';

interface CreatureInstance {
  data: CreatureData;
  group: THREE.Group;
  halo: THREE.Mesh;
  interactiveMeshes: THREE.Mesh[];
  animTime: number;
}

export class Biosphere {
  private container: THREE.Object3D;
  private instances: CreatureInstance[] = [];
  private highlightedId: string | null = null;

  private readonly baseSphere = new THREE.SphereGeometry(1, 12, 10);
  private readonly baseCylinder = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
  private readonly baseTorus = new THREE.TorusGeometry(1, 0.25, 6, 12);
  private readonly baseCapsule = new THREE.CapsuleGeometry(1, 1, 4, 8);

  constructor(container: THREE.Object3D, private creatures: CreatureData[]) {
    this.container = container;
    this.createModels();
  }

  private createModels(): void {
    const sceneCreatures = this.creatures.filter((c) => c.shownInScene);
    for (let i = 0; i < sceneCreatures.length; i++) {
      const c = sceneCreatures[i];
      const group = this.buildCreatureModel(c);
      group.position.set(
        Math.cos((i / sceneCreatures.length) * Math.PI * 2) * 1400,
        -c.displayDepth,
        Math.sin((i / sceneCreatures.length) * Math.PI * 2) * 1400
      );
      const halo = this.createHalo(c.color);
      halo.visible = false;
      group.add(halo);

      const interactive: THREE.Mesh[] = [];
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh && obj !== halo) {
          interactive.push(obj as THREE.Mesh);
        }
      });

      this.container.add(group);
      this.instances.push({
        data: c,
        group,
        halo,
        interactiveMeshes: interactive,
        animTime: Math.random() * Math.PI * 2
      });
    }
  }

  private buildCreatureModel(data: CreatureData): THREE.Group {
    const group = new THREE.Group();
    group.name = data.id;
    const s = data.scale * 140;
    const color = new THREE.Color(data.color);

    switch (data.animation) {
      case 'glow':
        this.buildGlowCreature(group, color, s, data.id);
        break;
      case 'tentacle':
        this.buildTentacleCreature(group, color, s, data.id);
        break;
      case 'float':
      default:
        this.buildFloatCreature(group, color, s, data.id);
        break;
    }
    return group;
  }

  private buildGlowCreature(group: THREE.Group, color: THREE.Color, s: number, id: string): void {
    const bodyMat = new THREE.MeshPhongMaterial({
      color,
      shininess: 60,
      transparent: true,
      opacity: 0.92
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.85
    });

    const body = new THREE.Mesh(this.baseCapsule, bodyMat);
    body.scale.set(s * 0.45, s * 0.28, s * 0.3);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    const head = new THREE.Mesh(this.baseSphere, bodyMat);
    head.scale.set(s * 0.22, s * 0.22, s * 0.22);
    head.position.x = s * 0.55;
    group.add(head);

    const tail = new THREE.Mesh(this.baseCylinder, bodyMat);
    tail.scale.set(s * 0.04, s * 0.5, s * 0.18);
    tail.position.x = -s * 0.65;
    tail.rotation.z = Math.PI / 2;
    group.add(tail);

    const glow = new THREE.Mesh(this.baseSphere, glowMat);
    glow.scale.set(s * 0.1, s * 0.1, s * 0.1);
    glow.position.set(s * 0.1, -s * 0.1, 0);
    glow.name = `${id}_glow`;
    group.add(glow);
  }

  private buildTentacleCreature(group: THREE.Group, color: THREE.Color, s: number, id: string): void {
    const bodyMat = new THREE.MeshPhongMaterial({
      color,
      shininess: 30,
      transparent: true,
      opacity: 0.8
    });
    const tentacleMat = new THREE.MeshPhongMaterial({
      color: color.clone().multiplyScalar(0.7),
      shininess: 20,
      transparent: true,
      opacity: 0.7
    });

    const head = new THREE.Mesh(this.baseSphere, bodyMat);
    head.scale.set(s * 0.55, s * 0.35, s * 0.55);
    group.add(head);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const t = new THREE.Mesh(this.baseCylinder, tentacleMat);
      t.scale.set(s * 0.04, s * 1.1, s * 0.04);
      t.position.set(
        Math.cos(angle) * s * 0.35,
        -s * 0.65,
        Math.sin(angle) * s * 0.35
      );
      t.name = `${id}_tentacle_${i}`;
      t.userData.baseAngle = angle;
      t.userData.baseY = -s * 0.65;
      group.add(t);
    }
  }

  private buildFloatCreature(group: THREE.Group, color: THREE.Color, s: number, id: string): void {
    const bodyMat = new THREE.MeshPhongMaterial({
      color,
      shininess: 40,
      transparent: true,
      opacity: 0.85
    });
    const accentMat = new THREE.MeshPhongMaterial({
      color: color.clone().multiplyScalar(1.3),
      shininess: 70,
      transparent: true,
      opacity: 0.75
    });

    if (id === 'phytoplankton') {
      for (let i = 0; i < 14; i++) {
        const p = new THREE.Mesh(this.baseSphere, bodyMat);
        const r = s * 0.35;
        p.scale.setScalar(s * (0.12 + Math.random() * 0.1));
        p.position.set(
          (Math.random() - 0.5) * r,
          (Math.random() - 0.5) * r,
          (Math.random() - 0.5) * r
        );
        group.add(p);
      }
      const ring = new THREE.Mesh(this.baseTorus, accentMat);
      ring.scale.set(s * 0.45, s * 0.45, s * 0.15);
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    } else {
      const body = new THREE.Mesh(this.baseCapsule, bodyMat);
      body.scale.set(s * 0.38, s * 0.22, s * 0.28);
      body.rotation.z = Math.PI / 2;
      group.add(body);

      for (let i = 0; i < 4; i++) {
        const limb = new THREE.Mesh(this.baseCylinder, accentMat);
        limb.scale.set(s * 0.04, s * 0.35, s * 0.04);
        const a = (i / 4) * Math.PI * 2;
        limb.position.set(
          Math.cos(a) * s * 0.3,
          Math.sin(a) * s * 0.2 - s * 0.05,
          0
        );
        limb.rotation.z = a + Math.PI / 2;
        group.add(limb);
      }

      const eye = new THREE.Mesh(this.baseSphere, accentMat);
      eye.scale.setScalar(s * 0.07);
      eye.position.set(s * 0.3, s * 0.05, s * 0.15);
      group.add(eye);
    }
  }

  private createHalo(colorHex: string): THREE.Mesh {
    const haloGeo = new THREE.RingGeometry(1.2, 1.5, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00e5ff'),
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.scale.setScalar(180);
    halo.lookAt(new THREE.Vector3(0, 0, 0));
    return halo;
  }

  setHighlight(id: string | null): void {
    this.highlightedId = id;
    for (const inst of this.instances) {
      inst.halo.visible = inst.data.id === id;
    }
  }

  getCreatureFromMesh(mesh: THREE.Object3D): CreatureData | null {
    let cur: THREE.Object3D | null = mesh;
    while (cur) {
      const found = this.instances.find((i) => i.group === cur);
      if (found) return found.data;
      cur = cur.parent;
    }
    return null;
  }

  setVisibleByDepth(depth: number): void {
    for (const inst of this.instances) {
      const [min, max] = inst.data.depthRange;
      const pad = 600;
      const visible = depth >= min - pad && depth <= max + pad;
      inst.group.visible = visible;
    }
  }

  update(delta: number): void {
    for (const inst of this.instances) {
      inst.animTime += delta;

      const t = inst.animTime;
      inst.group.position.y = -inst.data.displayDepth + Math.sin(t * 0.8) * 30;
      inst.group.rotation.y = t * 0.2;

      inst.halo.rotation.z = t * 0.6;
      inst.halo.lookAt(
        inst.group.position.clone().add(new THREE.Vector3(0, 0, 1))
      );

      if (inst.data.animation === 'glow') {
        const glowMesh = inst.group.children.find((c) =>
          c.name?.includes('_glow')
        ) as THREE.Mesh | undefined;
        if (glowMesh) {
          const pulse = 0.6 + Math.sin(t * 3) * 0.4;
          (glowMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
          glowMesh.scale.setScalar(0.1 * inst.data.scale * 140 * (1 + Math.sin(t * 3) * 0.15));
        }
      } else if (inst.data.animation === 'tentacle') {
        inst.group.children.forEach((child) => {
          if (child.name?.includes('_tentacle_')) {
            const mesh = child as THREE.Mesh;
            const baseAngle = mesh.userData.baseAngle as number;
            mesh.rotation.x = Math.sin(t * 2 + baseAngle) * 0.4;
            mesh.rotation.z = Math.cos(t * 1.7 + baseAngle) * 0.35;
          }
        });
      }
    }
  }
}
