import * as THREE from 'three';
import { Ocean } from './ocean';

const BUOY_COLORS = [0xF59E0B, 0xEF4444, 0x10B981];

export interface BuoyData {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  swayOffset: number;
  swayAmpX: number;
  swayAmpZ: number;
  phase: number;
}

export class BuoySystem {
  public buoys: BuoyData[] = [];
  private sharedGeo: THREE.SphereGeometry;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, count: number = 25) {
    this.scene = scene;
    this.sharedGeo = new THREE.SphereGeometry(0.5, 24, 24);
    this.generate(count);
  }

  private generate(count: number): void {
    const spread = 70;
    for (let i = 0; i < count; i++) {
      const colorHex = BUOY_COLORS[Math.floor(Math.random() * BUOY_COLORS.length)];
      const mat = new THREE.MeshPhongMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.5,
        shininess: 80,
        specular: 0xffffff,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(this.sharedGeo, mat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * spread;
      const baseX = Math.cos(angle) * dist;
      const baseZ = Math.sin(angle) * dist;
      const buoy: BuoyData = {
        mesh,
        baseX,
        baseZ,
        swayOffset: Math.random() * Math.PI * 2,
        swayAmpX: Math.random() * 0.4 + 0.2,
        swayAmpZ: Math.random() * 0.4 + 0.2,
        phase: Math.random() * 100
      };
      mesh.position.set(baseX, 0, baseZ);
      mesh.castShadow = true;
      this.buoys.push(buoy);
      this.scene.add(mesh);
    }
  }

  public update(time: number, ocean: Ocean): void {
    for (let i = 0; i < this.buoys.length; i++) {
      const b = this.buoys[i];
      const swayX = Math.sin(time * 1.5 + b.swayOffset) * b.swayAmpX;
      const swayZ = Math.cos(time * 1.2 + b.swayOffset) * b.swayAmpZ;
      const x = b.baseX + swayX;
      const z = b.baseZ + swayZ;
      const waveHeight = ocean.getHeightAt(x, z, time);
      b.mesh.position.set(x, waveHeight + 0.4, z);
      const tiltX = Math.sin(time * 0.8 + b.phase) * 0.15;
      const tiltZ = Math.cos(time * 0.9 + b.phase) * 0.15;
      b.mesh.rotation.x = tiltZ;
      b.mesh.rotation.z = -tiltX;
    }
  }

  public dispose(): void {
    this.sharedGeo.dispose();
    for (const b of this.buoys) {
      (b.mesh.material as THREE.Material).dispose();
    }
  }
}
