import * as THREE from 'three';
import { WindField } from './wind';

interface LanternState {
  ascending: boolean;
  ascendingTime: number;
  ascendingDuration: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  floatForce: number;
  windInfluence: number;
  extinguished: boolean;
  extinguishTime: number;
  resetting: boolean;
  resetStartTime: number;
  resetDuration: number;
  resetStartPos: THREE.Vector3;
  shaking: boolean;
  shakeStartTime: number;
  shakeDuration: number;
  targetTiltX: number;
  targetTiltZ: number;
  currentTiltX: number;
  currentTiltZ: number;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export class Lantern {
  public group: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private frameLines!: THREE.LineSegments;
  private candleLight!: THREE.PointLight;
  private flameParticles!: THREE.Points;
  private state: LanternState;
  private windField: WindField;

  constructor(scene: THREE.Scene, windField: WindField, index: number) {
    this.group = new THREE.Group();
    this.windField = windField;

    this.state = {
      ascending: false,
      ascendingTime: 0,
      ascendingDuration: 3,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      floatForce: 1.0,
      windInfluence: 1.0,
      extinguished: false,
      extinguishTime: 0,
      resetting: false,
      resetStartTime: 0,
      resetDuration: 1,
      resetStartPos: new THREE.Vector3(0, 0, 0),
      shaking: false,
      shakeStartTime: 0,
      shakeDuration: 1.2,
      targetTiltX: 0,
      targetTiltZ: 0,
      currentTiltX: 0,
      currentTiltZ: 0,
    };

    this.createBody();
    this.createFrame();
    this.createCandle();
    this.createFlameParticles();
    this.group.position.set(0, 0, 0);
    this.group.visible = false;
    scene.add(this.group);
  }

  private createBody(): void {
    const points: THREE.Vector2[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * 3.2 - 0.4;
      let r: number;
      if (t < 0.1) {
        r = 0.3 + t * 4;
      } else if (t < 0.7) {
        r = 0.7 + 0.3 * Math.sin(((t - 0.1) / 0.6) * Math.PI);
      } else {
        r = 1.0 - (t - 0.7) * 2.5;
      }
      r = Math.max(r, 0.05);
      points.push(new THREE.Vector2(r, y));
    }

    const geometry = new THREE.LatheGeometry(points, 16);
    const posAttr = geometry.getAttribute('position');
    const colors = new Float32Array(posAttr.count * 3);
    const colorA = new THREE.Color('#FFC107');
    const colorB = new THREE.Color('#FF722F');
    const tempColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = THREE.MathUtils.clamp((y + 0.4) / 3.2, 0, 1);
      tempColor.copy(colorA).lerp(colorB, t);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#FF8C00'),
      emissiveIntensity: 0.3,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.bodyMesh = new THREE.Mesh(geometry, material);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);
  }

  private createFrame(): void {
    const framePoints: THREE.Vector3[] = [];
    const frameIndices: number[] = [];
    const frameMaterial = new THREE.LineBasicMaterial({
      color: 0x8B4513,
      linewidth: 1,
    });

    const rings = [0.0, 0.3, 0.6, 0.85, 1.0];
    const radii = [0.3, 0.85, 1.0, 0.75, 0.25];
    const numSeg = 8;

    for (let r = 0; r < rings.length; r++) {
      const y = rings[r] * 3.2 - 0.4;
      const radius = radii[r];
      const baseIdx = framePoints.length;
      for (let i = 0; i < numSeg; i++) {
        const angle = (i / numSeg) * Math.PI * 2;
        framePoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        ));
        frameIndices.push(baseIdx + i, baseIdx + (i + 1) % numSeg);
      }
    }

    for (let i = 0; i < numSeg; i++) {
      const topIdx = (rings.length - 1) * numSeg + i;
      const bottomIdx = i;
      frameIndices.push(bottomIdx, topIdx);
    }

    const frameGeom = new THREE.BufferGeometry().setFromPoints(framePoints);
    frameGeom.setIndex(frameIndices);
    this.frameLines = new THREE.LineSegments(frameGeom, frameMaterial);
    this.group.add(this.frameLines);
  }

  private createCandle(): void {
    this.candleLight = new THREE.PointLight(0xFF4500, 2, 15, 1.5);
    this.candleLight.position.set(0, 0.2, 0);
    this.candleLight.castShadow = true;
    this.candleLight.shadow.mapSize.width = 512;
    this.candleLight.shadow.mapSize.height = 512;
    this.candleLight.shadow.camera.near = 0.1;
    this.candleLight.shadow.camera.far = 15;
    this.group.add(this.candleLight);
  }

  private createFlameParticles(): void {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 1] = Math.random() * 0.3 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      sizes[i] = Math.random() * 0.08 + 0.04;
      lifetimes[i] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xFF6600,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.flameParticles = new THREE.Points(geom, mat);
    this.group.add(this.flameParticles);
  }

  setPosition(x: number, y: number, z: number): void {
    this.state.position.set(x, y, z);
    this.group.position.set(x, y, z);
  }

  setFloatForce(force: number): void {
    this.state.floatForce = force;
  }

  setWindInfluence(influence: number): void {
    this.state.windInfluence = influence;
  }

  launch(): void {
    this.state.ascending = true;
    this.state.ascendingTime = 0;
    this.state.extinguished = false;
    this.state.resetting = false;
    this.group.visible = true;
    this.group.position.set(0, 0, 0);
    this.state.position.set(0, 0, 0);
    this.state.velocity.set(0, 0, 0);
    this.candleLight.visible = true;
    this.flameParticles.visible = true;
    (this.bodyMesh.material as THREE.MeshStandardMaterial).opacity = 0.85;
  }

  reset(now: number): void {
    if (!this.group.visible) return;
    this.state.resetting = true;
    this.state.resetStartTime = now;
    this.state.resetStartPos.copy(this.state.position);
    this.state.ascending = false;
  }

  extinguish(): void {
    this.state.extinguished = true;
    this.state.extinguishTime = performance.now() / 1000;
    this.candleLight.visible = false;
    this.flameParticles.visible = false;
  }

  startShaking(now: number): void {
    if (this.state.shaking) return;
    this.state.shaking = true;
    this.state.shakeStartTime = now;
  }

  getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  isAlive(): boolean {
    return this.group.visible && !this.state.extinguished;
  }

  isResetting(): boolean {
    return this.state.resetting;
  }

  isLaunched(): boolean {
    return this.group.visible;
  }

  update(dt: number, now: number): void {
    if (!this.group.visible) return;

    if (this.state.resetting) {
      const elapsed = now - this.state.resetStartTime;
      const t = THREE.MathUtils.clamp(elapsed / this.state.resetDuration, 0, 1);
      const eased = easeInOutQuad(t);

      this.state.position.lerpVectors(
        this.state.resetStartPos,
        new THREE.Vector3(0, 0, 0),
        eased
      );

      const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.85 * (1 - t);

      if (t >= 1) {
        this.state.resetting = false;
        this.group.visible = false;
        this.state.position.set(0, 0, 0);
        mat.opacity = 0.85;
      }

      this.group.position.copy(this.state.position);
      return;
    }

    if (this.state.ascending) {
      this.state.ascendingTime += dt;
      const t = THREE.MathUtils.clamp(this.state.ascendingTime / this.state.ascendingDuration, 0, 1);
      const eased = easeInOutQuad(t);
      this.state.position.y = eased * 5;
    } else {
      const wind = this.windField.getWindVector();
      const buoyancy = this.state.floatForce * 2.0;
      const windEffect = wind.clone().multiplyScalar(this.state.windInfluence);

      if (!this.state.extinguished) {
        this.state.velocity.y += buoyancy * dt;
        this.state.velocity.x += windEffect.x * dt * 3;
        this.state.velocity.z += windEffect.z * dt * 3;
      } else {
        this.state.velocity.y -= 2.0 * dt;
        this.state.velocity.x += windEffect.x * dt * 1.5;
        this.state.velocity.z += windEffect.z * dt * 1.5;
      }

      this.state.velocity.multiplyScalar(0.98);

      this.state.position.add(this.state.velocity.clone().multiplyScalar(dt));

      if (this.state.position.y < -5) {
        this.group.visible = false;
        return;
      }
    }

    const tilt = this.windField.getTiltAngles();
    this.state.targetTiltX = tilt.x;
    this.state.targetTiltZ = tilt.z;

    const tiltLerp = 1 - Math.pow(0.05, dt);
    this.state.currentTiltX += (this.state.targetTiltX - this.state.currentTiltX) * tiltLerp;
    this.state.currentTiltZ += (this.state.targetTiltZ - this.state.currentTiltZ) * tiltLerp;

    if (this.state.shaking) {
      const shakeElapsed = now - this.state.shakeStartTime;
      if (shakeElapsed < this.state.shakeDuration) {
        const freq = 8 * Math.PI * 2;
        const amp = 0.3 * (1 - shakeElapsed / this.state.shakeDuration);
        const shakeX = Math.sin(freq * shakeElapsed) * amp;
        const shakeZ = Math.cos(freq * shakeElapsed * 1.3) * amp;
        this.group.position.set(
          this.state.position.x + shakeX,
          this.state.position.y,
          this.state.position.z + shakeZ
        );
      } else {
        this.state.shaking = false;
      }
    } else {
      this.group.position.copy(this.state.position);
    }

    this.group.rotation.x = this.state.currentTiltX;
    this.group.rotation.z = this.state.currentTiltZ;

    if (!this.state.extinguished) {
      this.updateFlameParticles(dt, now);
      const flicker = 1.5 + Math.sin(now * 15) * 0.3 + Math.sin(now * 23) * 0.2;
      this.candleLight.intensity = flicker;
    }
  }

  private updateFlameParticles(dt: number, now: number): void {
    const positions = this.flameParticles.geometry.getAttribute('position');
    const lifetimes = this.flameParticles.geometry.getAttribute('aLifetime');

    for (let i = 0; i < positions.count; i++) {
      let lt = lifetimes.getX(i) + dt * 3;
      if (lt > 1) lt = 0;

      const x = (Math.random() - 0.5) * 0.12;
      const y = lt * 0.35 + 0.05;
      const z = (Math.random() - 0.5) * 0.12;

      positions.setXYZ(i, x, y, z);
      lifetimes.setX(i, lt);
    }
    positions.needsUpdate = true;
    lifetimes.needsUpdate = true;
  }
}
