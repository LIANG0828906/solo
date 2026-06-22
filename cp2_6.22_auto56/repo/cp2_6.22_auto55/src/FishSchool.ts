import * as THREE from 'three';
import { EnvParams } from './SceneInitializer';
import { CoralData } from './CoralGenerator';

export interface RegionInfo {
  coralDensity: number;
  temperature: number;
  nutrients: number;
  position: THREE.Vector3;
}

export interface Fish {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  scattering: boolean;
  scatterTimer: number;
  baseColor: THREE.Color;
  tailPhase: number;
  species: number;
}

export class FishSchool {
  private scene: THREE.Scene;
  private corals: CoralData[];
  private count: number;
  public fishes: Fish[] = [];
  public activeRegionInfo: RegionInfo | null = null;
  private infoTimer = 0;
  private selectedFishIdx = -1;
  private readonly BOUNDS = 80;
  private readonly GROUND_CLEARANCE = 1.5;
  private readonly CEILING = 22;
  private tmpV1 = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private tmpV3 = new THREE.Vector3();
  private tmpV4 = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();

  constructor(scene: THREE.Scene, count: number, corals: CoralData[]) {
    this.scene = scene;
    this.count = count;
    this.corals = corals;
    this.spawn();
  }

  private spawn(): void {
    for (let i = 0; i < this.count; i++) {
      const species = i % 5;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * this.BOUNDS * 1.2,
        3 + Math.random() * 12,
        (Math.random() - 0.5) * this.BOUNDS * 1.2,
      );
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.3,
        Math.random() - 0.5,
      ).normalize();
      const speed = 2 + Math.random() * 1.5;
      const vel = dir.multiplyScalar(speed);

      const color = this.speciesColor(species);
      const mesh = this.buildFish(species, color);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      this.fishes.push({
        mesh,
        position: pos,
        velocity: vel,
        acceleration: new THREE.Vector3(),
        scattering: false,
        scatterTimer: 0,
        baseColor: color.clone(),
        tailPhase: Math.random() * Math.PI * 2,
        species,
      });
    }
  }

  private speciesColor(s: number): THREE.Color {
    switch (s) {
      case 0: return new THREE.Color(0xffd34d);
      case 1: return new THREE.Color(0xff6b8e);
      case 2: return new THREE.Color(0x6ee7ff);
      case 3: return new THREE.Color(0xc084fc);
      case 4: return new THREE.Color(0xff9f43);
      default: return new THREE.Color(0xffffff);
    }
  }

  private buildFish(species: number, color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const bodyGeo = species === 3
      ? new THREE.SphereGeometry(0.32, 12, 8)
      : species === 1
        ? new THREE.SphereGeometry(0.28, 10, 7)
        : new THREE.ConeGeometry(0.22, 0.7, 8);
    if (species !== 3 && species !== 1) bodyGeo.rotateY(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    if (species === 3) body.scale.set(1.6, 0.9, 1);
    else if (species === 1) body.scale.set(1.3, 0.85, 1);
    body.castShadow = true;
    g.add(body);

    const tailGeo = new THREE.ConeGeometry(0.22, 0.35, 4);
    tailGeo.rotateZ(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.x = -0.35 - (species === 3 ? 0.15 : 0);
    tail.name = 'tail';
    tail.castShadow = true;
    g.add(tail);

    if (species === 1 || species === 3) {
      const stripeColor = new THREE.Color(0xffffff);
      for (let i = 0; i < (species === 1 ? 4 : 5); i++) {
        const stripe = new THREE.Mesh(
          new THREE.TorusGeometry(species === 3 ? 0.28 - i * 0.04 : 0.24 - i * 0.03, 0.025, 5, 10),
          new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 }),
        );
        stripe.rotation.y = Math.PI / 2;
        stripe.position.x = -0.15 + i * (species === 3 ? 0.1 : 0.08);
        g.add(stripe);
      }
    }

    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 5);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(0.2, 0.08, 0.12);
    eye2.position.set(0.2, 0.08, -0.12);
    g.add(eye1);
    g.add(eye2);

    const finGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
    const topFin = new THREE.Mesh(finGeo, bodyMat);
    topFin.rotation.z = -Math.PI / 6;
    topFin.position.set(-0.02, 0.22, 0);
    topFin.castShadow = true;
    g.add(topFin);

    return g;
  }

  public handleClick(intersect: THREE.Intersection): number {
    let fishIdx = -1;
    for (let i = 0; i < this.fishes.length; i++) {
      let hit = false;
      this.fishes[i].mesh.traverse((child) => {
        if (child === intersect.object || child.parent === intersect.object) {
          hit = true;
        }
      });
      if (hit) {
        fishIdx = i;
        break;
      }
    }
    if (fishIdx < 0) {
      for (let i = 0; i < this.fishes.length; i++) {
        if (this.fishes[i].mesh === intersect.object) { fishIdx = i; break; }
      }
    }
    if (fishIdx < 0) return -1;
    this.selectedFishIdx = fishIdx;
    const f = this.fishes[fishIdx];
    f.scattering = true;
    f.scatterTimer = 1.5;
    const scatterRadius = 10;
    const center = f.position.clone();
    for (let i = 0; i < this.fishes.length; i++) {
      const of = this.fishes[i];
      if (of.position.distanceTo(center) < scatterRadius) {
        of.scattering = true;
        of.scatterTimer = Math.max(of.scatterTimer, 0.8 + Math.random() * 1.0);
        const away = of.position.clone().sub(center).normalize();
        if (away.lengthSq() < 0.001) away.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        of.acceleration.add(away.multiplyScalar(18 + Math.random() * 10));
      }
    }
    const regionInfo = this.computeRegionInfo(center);
    this.activeRegionInfo = regionInfo;
    this.infoTimer = 4.0;
    return fishIdx;
  }

  private computeRegionInfo(pos: THREE.Vector3): RegionInfo {
    let nearCorals = 0;
    const sampleRadius = 15;
    for (const c of this.corals) {
      if (c.position.distanceTo(pos) < sampleRadius) nearCorals++;
    }
    const area = Math.PI * sampleRadius * sampleRadius;
    const density = (nearCorals / area) * 1000;
    const baseTemp = 22.5;
    const temp = baseTemp + (pos.y - 10) * 0.15 + Math.sin(pos.x * 0.05) * 0.6 + Math.cos(pos.z * 0.07) * 0.4;
    const nutri = 40 + (1 - Math.min(1, pos.y / 20)) * 40 + Math.sin(pos.x * 0.03 + pos.z * 0.02) * 15;
    return {
      coralDensity: Math.max(0, density),
      temperature: Math.round(temp * 10) / 10,
      nutrients: Math.round(Math.max(5, Math.min(100, nutri))),
      position: pos.clone(),
    };
  }

  public update(time: number, dt: number, params: EnvParams): void {
    if (this.infoTimer > 0) {
      this.infoTimer -= dt;
      if (this.infoTimer <= 0) this.activeRegionInfo = null;
    }
    const speedMul = 0.5 + (params.currentSpeed / 5) * 1.6;
    const sepR = 3.0;
    const alignR = 5.5;
    const cohR = 6.5;
    const maxSpeed = (4.5 + params.currentSpeed * 0.7) * speedMul * 0.55;
    const maxForce = 2.8;

    for (let i = 0; i < this.fishes.length; i++) {
      const f = this.fishes[i];
      let sepCount = 0, alignCount = 0, cohCount = 0;
      this.tmpV1.set(0, 0, 0);
      this.tmpV2.set(0, 0, 0);
      this.tmpV3.set(0, 0, 0);

      for (let j = 0; j < this.fishes.length; j++) {
        if (i === j) continue;
        const o = this.fishes[j];
        const d = f.position.distanceTo(o.position);
        if (d < sepR && d > 0.0001) {
          const diff = f.position.clone().sub(o.position).normalize().divideScalar(d);
          this.tmpV1.add(diff);
          sepCount++;
        }
        if (d < alignR) {
          this.tmpV2.add(o.velocity);
          alignCount++;
        }
        if (d < cohR) {
          this.tmpV3.add(o.position);
          cohCount++;
        }
      }

      const finalSep = sepCount > 0 ? this.tmpV1.divideScalar(sepCount) : new THREE.Vector3();
      const finalAlign = alignCount > 0 ? this.tmpV2.divideScalar(alignCount).sub(f.velocity) : new THREE.Vector3();
      const finalCoh = cohCount > 0 ? this.tmpV3.divideScalar(cohCount).sub(f.position) : new THREE.Vector3();

      if (finalSep.lengthSq() > 0) finalSep.normalize().multiplyScalar(maxSpeed).sub(f.velocity).clampLength(0, maxForce * 1.4);
      if (finalAlign.lengthSq() > 0) finalAlign.normalize().multiplyScalar(maxSpeed).sub(f.velocity).clampLength(0, maxForce * 0.9);
      if (finalCoh.lengthSq() > 0) finalCoh.normalize().multiplyScalar(maxSpeed).sub(f.velocity).clampLength(0, maxForce * 0.85);

      const sepW = f.scattering ? 2.8 : 1.6;
      const alignW = f.scattering ? 0.2 : 1.0;
      const cohW = f.scattering ? 0.1 : 1.0;
      f.acceleration.addScaledVector(finalSep, sepW);
      f.acceleration.addScaledVector(finalAlign, alignW);
      f.acceleration.addScaledVector(finalCoh, cohW);

      const avoid = this.coralAvoidance(f);
      f.acceleration.add(avoid);
      const boundary = this.boundaryForce(f);
      f.acceleration.add(boundary);
      const drift = new THREE.Vector3(params.currentSpeed * 0.15, 0, params.currentSpeed * 0.08);
      f.acceleration.add(drift);

      f.velocity.addScaledVector(f.acceleration, dt);
      f.velocity.clampLength(0.5, maxSpeed * 1.1);
      f.position.addScaledVector(f.velocity, dt);

      if (f.scattering) {
        f.scatterTimer -= dt;
        if (f.scatterTimer <= 0) f.scattering = false;
      }

      if (f.position.y < this.GROUND_CLEARANCE) f.position.y = this.GROUND_CLEARANCE;
      if (f.position.y > this.CEILING) f.position.y = this.CEILING;
      f.mesh.position.copy(f.position);

      if (f.velocity.lengthSq() > 0.001) {
        const lookAt = f.position.clone().add(f.velocity);
        f.mesh.lookAt(lookAt);
      }

      const tail = f.mesh.getObjectByName('tail');
      if (tail) {
        const flapSpeed = 8 + f.velocity.length() * 2.5 + params.currentSpeed * 1.2;
        const amp = 0.35 + (f.scattering ? 0.35 : 0);
        (tail as THREE.Mesh).rotation.y = Math.sin(time * flapSpeed + f.tailPhase) * amp;
      }
      f.acceleration.set(0, 0, 0);
    }
  }

  private coralAvoidance(f: Fish): THREE.Vector3 {
    const avoid = new THREE.Vector3();
    const senseDist = 4.0;
    for (const c of this.corals) {
      const dx = f.position.x - c.position.x;
      const dz = f.position.z - c.position.z;
      const dy = f.position.y - c.position.y;
      const dSq = dx * dx + dz * dz + dy * dy;
      const minD = c.boundingRadius + senseDist;
      if (dSq < minD * minD && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        const strength = (minD - d) / minD;
        avoid.x += (dx / d) * strength * 8;
        avoid.y += (dy / d) * strength * 4;
        avoid.z += (dz / d) * strength * 8;
      }
    }
    return avoid;
  }

  private boundaryForce(f: Fish): THREE.Vector3 {
    const force = new THREE.Vector3();
    const margin = 5;
    const inner = this.BOUNDS - margin;
    if (f.position.x > inner) force.x = -(f.position.x - inner) * 1.5;
    if (f.position.x < -inner) force.x = -(f.position.x + inner) * 1.5;
    if (f.position.z > inner) force.z = -(f.position.z - inner) * 1.5;
    if (f.position.z < -inner) force.z = -(f.position.z + inner) * 1.5;
    if (f.position.y > this.CEILING - margin) force.y = -(f.position.y - (this.CEILING - margin)) * 1.5;
    if (f.position.y < this.GROUND_CLEARANCE + margin) force.y = (this.GROUND_CLEARANCE + margin - f.position.y) * 2.0;
    return force;
  }

  public getFishMeshes(): THREE.Object3D[] {
    return this.fishes.map((f) => f.mesh);
  }
}
