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
  private readonly BOUNDS_XZ = 75;
  private readonly GROUND_CLEARANCE = 1.5;
  private readonly CEILING = 22;
  private tmpV1 = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private tmpV3 = new THREE.Vector3();
  private tmpV4 = new THREE.Vector3();
  private tmpV5 = new THREE.Vector3();
  private tmpV6 = new THREE.Vector3();
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
        (Math.random() - 0.5) * this.BOUNDS_XZ * 1.1,
        3 + Math.random() * 12,
        (Math.random() - 0.5) * this.BOUNDS_XZ * 1.1,
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
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });

    switch (species) {
      case 0: {
        const bodyGeo = new THREE.ConeGeometry(0.22, 0.75, 8);
        bodyGeo.rotateY(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        g.add(body);
        break;
      }
      case 1: {
        const bodyGeo = new THREE.SphereGeometry(0.3, 12, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.35, 0.82, 1);
        body.castShadow = true;
        g.add(body);
        const stripeColor = new THREE.Color(0xffffff);
        const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 });
        for (let i = 0; i < 4; i++) {
          const r = 0.24 - i * 0.035;
          const stripe = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.028, 6, 12),
            stripeMat,
          );
          stripe.rotation.y = Math.PI / 2;
          stripe.position.x = -0.18 + i * 0.085;
          g.add(stripe);
        }
        break;
      }
      case 2: {
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateY(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1, 0.85, 0.75);
        body.castShadow = true;
        g.add(body);
        const stripeColor = new THREE.Color(0x1a5570);
        const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 });
        for (let i = 0; i < 3; i++) {
          const sg = new THREE.BoxGeometry(0.02, 0.42, 0.02);
          const stripe = new THREE.Mesh(sg, stripeMat);
          stripe.position.set(-0.05 + i * 0.08, 0, 0.2);
          g.add(stripe);
          const stripe2 = stripe.clone();
          stripe2.position.z = -0.2;
          g.add(stripe2);
        }
        break;
      }
      case 3: {
        const bodyGeo = new THREE.SphereGeometry(0.33, 14, 10);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.55, 0.9, 1.05);
        body.castShadow = true;
        g.add(body);
        const stripeColor = new THREE.Color(0xffffff);
        const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 });
        for (let i = 0; i < 5; i++) {
          const r = 0.29 - i * 0.042;
          const stripe = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.026, 6, 12),
            stripeMat,
          );
          stripe.rotation.y = Math.PI / 2;
          stripe.position.x = -0.2 + i * 0.105;
          g.add(stripe);
        }
        break;
      }
      case 4: {
        const bodyGeo = new THREE.ConeGeometry(0.24, 0.68, 6);
        bodyGeo.rotateY(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1, 1.1, 0.8);
        body.castShadow = true;
        g.add(body);
        break;
      }
    }

    const tailGeo = new THREE.ConeGeometry(0.24, 0.38, 4);
    tailGeo.rotateZ(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.x = -0.38 - (species === 3 ? 0.18 : species === 1 ? 0.1 : 0);
    tail.name = 'tail';
    tail.castShadow = true;
    g.add(tail);

    const eyeGeo = new THREE.SphereGeometry(0.032, 7, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(0.22, 0.09, 0.13);
    eye2.position.set(0.22, 0.09, -0.13);
    g.add(eye1);
    g.add(eye2);

    const finGeo = new THREE.ConeGeometry(0.13, 0.28, 4);
    const topFin = new THREE.Mesh(finGeo, bodyMat);
    topFin.rotation.z = -Math.PI / 6;
    topFin.position.set(-0.03, 0.24, 0);
    topFin.castShadow = true;
    g.add(topFin);

    const sideFinGeo = new THREE.ConeGeometry(0.09, 0.2, 3);
    const sideFin1 = new THREE.Mesh(sideFinGeo, bodyMat);
    sideFin1.rotation.set(Math.PI / 3, 0, -Math.PI / 2.5);
    sideFin1.position.set(-0.05, 0.02, 0.18);
    sideFin1.castShadow = true;
    g.add(sideFin1);
    const sideFin2 = sideFin1.clone();
    sideFin2.rotation.set(-Math.PI / 3, 0, Math.PI / 2.5);
    sideFin2.position.z = -0.18;
    g.add(sideFin2);

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
        const away = of.position.clone().sub(center);
        if (away.lengthSq() < 0.001) away.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        away.normalize();
        of.acceleration.add(away.multiplyScalar(20 + Math.random() * 8));
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
    const depth = this.CEILING - pos.y;
    const depthFactor = depth / this.CEILING;
    const baseTemp = 22.5;
    const temp = baseTemp + depthFactor * 2.8 + Math.sin(pos.x * 0.05) * 0.6 + Math.cos(pos.z * 0.07) * 0.4;
    const nutri = 40 + depthFactor * 35 + Math.sin(pos.x * 0.03 + pos.z * 0.02) * 15;
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

    const sepR = 3.0;
    const alignR = 5.5;
    const cohR = 6.5;
    const maxSpeed = 4.5 + params.currentSpeed * 0.7;
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
          this.tmpV4.copy(f.position).sub(o.position);
          this.tmpV1.add(this.tmpV4);
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

      const finalSep = new THREE.Vector3();
      if (sepCount > 0) {
        this.tmpV1.divideScalar(sepCount);
        if (this.tmpV1.lengthSq() > 0) {
          this.tmpV1.normalize().multiplyScalar(maxSpeed).sub(f.velocity);
          this.tmpV1.clampLength(0, maxForce * 1.4);
          finalSep.copy(this.tmpV1);
        }
      }

      const finalAlign = new THREE.Vector3();
      if (alignCount > 0) {
        this.tmpV2.divideScalar(alignCount).sub(f.velocity);
        if (this.tmpV2.lengthSq() > 0) {
          this.tmpV2.normalize().multiplyScalar(maxSpeed).sub(f.velocity);
          this.tmpV2.clampLength(0, maxForce);
          finalAlign.copy(this.tmpV2);
        }
      }

      const finalCoh = new THREE.Vector3();
      if (cohCount > 0) {
        this.tmpV3.divideScalar(cohCount).sub(f.position);
        if (this.tmpV3.lengthSq() > 0) {
          this.tmpV3.normalize().multiplyScalar(maxSpeed).sub(f.velocity);
          this.tmpV3.clampLength(0, maxForce);
          finalCoh.copy(this.tmpV3);
        }
      }

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
        this.tmpV6.copy(f.position).add(f.velocity);
        f.mesh.lookAt(this.tmpV6);
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
    const innerXZ = this.BOUNDS_XZ - margin;
    if (f.position.x > innerXZ) force.x = -(f.position.x - innerXZ) * 1.5;
    if (f.position.x < -innerXZ) force.x = -(f.position.x + innerXZ) * 1.5;
    if (f.position.z > innerXZ) force.z = -(f.position.z - innerXZ) * 1.5;
    if (f.position.z < -innerXZ) force.z = -(f.position.z + innerXZ) * 1.5;
    if (f.position.y > this.CEILING - margin) force.y = -(f.position.y - (this.CEILING - margin)) * 1.5;
    if (f.position.y < this.GROUND_CLEARANCE + margin) force.y = (this.GROUND_CLEARANCE + margin - f.position.y) * 2.0;
    return force;
  }

  public getFishMeshes(): THREE.Object3D[] {
    return this.fishes.map((f) => f.mesh);
  }
}
