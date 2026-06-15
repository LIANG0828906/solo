import * as THREE from 'three';
import { ParticleSystem, ParticleData } from './particleSystem';

interface BeaconSlot {
  index: number;
  lit: boolean;
  mesh: THREE.Mesh;
  flameMesh: THREE.Mesh;
  light?: THREE.PointLight;
  animationTime: number;
  particleTimer: number;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export class Beacon {
  public group: THREE.Group;
  public slots: BeaconSlot[] = [];
  private scene: THREE.Scene;
  private fireParticles: ParticleSystem;
  private smokeParticles: ParticleSystem;

  constructor(scene: THREE.Scene, position: THREE.Vector3, fireParticles: ParticleSystem, smokeParticles: ParticleSystem) {
    this.scene = scene;
    this.fireParticles = fireParticles;
    this.smokeParticles = smokeParticles;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.buildStructure();
    this.scene.add(this.group);
  }

  private buildStructure(): void {
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 8);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.y = 0.075;
    this.group.add(base);

    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
    const pole = new THREE.Mesh(poleGeometry, woodMaterial);
    pole.position.y = 0.75;
    this.group.add(pole);

    const crossBeamGeometry = new THREE.BoxGeometry(0.9, 0.06, 0.06);
    const beam1 = new THREE.Mesh(crossBeamGeometry, woodMaterial);
    beam1.position.set(0, 1.0, 0);
    this.group.add(beam1);

    const beam2 = new THREE.Mesh(crossBeamGeometry, woodMaterial);
    beam2.position.set(0, 1.0, 0);
    beam2.rotation.y = Math.PI / 2;
    this.group.add(beam2);

    const slotMaterial = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
    const slotPositions = [
      new THREE.Vector3(-0.3, 1.1, 0),
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(0.3, 1.1, 0)
    ];

    for (let i = 0; i < 3; i++) {
      const slotGeometry = new THREE.SphereGeometry(0.08, 8, 6);
      const slotMesh = new THREE.Mesh(slotGeometry, slotMaterial);
      slotMesh.position.copy(slotPositions[i]);
      slotMesh.userData = { beacon: this, slotIndex: i, isSlot: true };
      this.group.add(slotMesh);

      const flameGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF6600,
        transparent: true,
        opacity: 0
      });
      const flameMesh = new THREE.Mesh(flameGeometry, flameMaterial);
      flameMesh.position.copy(slotPositions[i]);
      flameMesh.position.y += 0.15;
      flameMesh.scale.set(0, 0, 0);
      this.group.add(flameMesh);

      const light = new THREE.PointLight(0xFF4500, 0, 3);
      light.position.copy(slotPositions[i]);
      this.group.add(light);

      this.slots.push({
        index: i,
        lit: false,
        mesh: slotMesh,
        flameMesh,
        light,
        animationTime: 0,
        particleTimer: 0
      });
    }
  }

  toggleSlot(index: number): void {
    if (index < 0 || index >= this.slots.length) return;
    const slot = this.slots[index];
    slot.lit = !slot.lit;
    slot.animationTime = 0;

    const mat = slot.mesh.material as THREE.MeshLambertMaterial;
    mat.color.setHex(slot.lit ? 0xFF4500 : 0x3E2723);
  }

  getSlotWorldPosition(index: number): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.slots[index].mesh.getWorldPosition(pos);
    return pos;
  }

  getLitCount(): number {
    return this.slots.filter(s => s.lit).length;
  }

  extinguishAll(): void {
    for (const slot of this.slots) {
      if (slot.lit) {
        this.toggleSlot(slot.index);
      }
    }
  }

  update(dt: number, wind: THREE.Vector3): void {
    for (const slot of this.slots) {
      if (slot.lit) {
        slot.animationTime = Math.min(0.5, slot.animationTime + dt);
        const t = easeOutCubic(slot.animationTime / 0.5);
        slot.flameMesh.scale.setScalar(t);
        (slot.flameMesh.material as THREE.MeshBasicMaterial).opacity = t * 0.85;

        slot.flameMesh.rotation.y += dt * 2;
        slot.flameMesh.position.y = slot.mesh.position.y + 0.15 + Math.sin(Date.now() * 0.01 + slot.index) * 0.02;

        if (slot.light) {
          slot.light.intensity = t * 0.8 + Math.sin(Date.now() * 0.005) * 0.1;
        }

        slot.particleTimer += dt;
        const emitInterval = 1 / 30;
        while (slot.particleTimer >= emitInterval) {
          slot.particleTimer -= emitInterval;
          this.emitFireParticle(slot);
          this.emitSmokeParticle(slot, wind);
        }
      } else if (slot.animationTime > 0) {
        slot.animationTime = Math.max(0, slot.animationTime - dt);
        const t = easeOutCubic(slot.animationTime / 0.5);
        slot.flameMesh.scale.setScalar(t);
        (slot.flameMesh.material as THREE.MeshBasicMaterial).opacity = t * 0.85;
        if (slot.light) slot.light.intensity = t * 0.8;
      }
    }
  }

  private emitFireParticle(slot: BeaconSlot): void {
    const worldPos = this.getSlotWorldPosition(slot.index);
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      Math.random() * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    const pos = worldPos.add(offset);

    const colorT = Math.random();
    const color = new THREE.Color().lerpColors(
      new THREE.Color(0xFF4500),
      new THREE.Color(0xFFD700),
      colorT
    );

    const data: ParticleData = {
      position: pos,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.8 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.3
      ),
      color,
      size: 0.02 + Math.random() * 0.06,
      life: 0.5 + Math.random() * 1,
      maxLife: 1.5
    };
    this.fireParticles.emit(data);
  }

  private emitSmokeParticle(slot: BeaconSlot, wind: THREE.Vector3): void {
    const worldPos = this.getSlotWorldPosition(slot.index);
    const pos = worldPos.add(new THREE.Vector3(0, 0.4, 0));

    const data: ParticleData = {
      position: pos,
      velocity: new THREE.Vector3(
        wind.x * 0.5 + (Math.random() - 0.5) * 0.2,
        0.2 + Math.random() * 0.3,
        wind.z * 0.5 + (Math.random() - 0.5) * 0.2
      ),
      color: new THREE.Color(0xCCCCCC),
      size: 0.08 + Math.random() * 0.1,
      life: 1.5 + Math.random() * 0.5,
      maxLife: 2,
      opacity: 0.3 + Math.random() * 0.3
    };
    this.smokeParticles.emit(data);
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  getClickableObjects(): THREE.Object3D[] {
    return this.slots.map(s => s.mesh);
  }
}
