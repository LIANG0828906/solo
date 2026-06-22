import * as THREE from 'three';
import { ShadowSimulator, SHICHEN_DATA, SOLAR_TERMS } from './ShadowSimulator';

const DIAL_RADIUS = 4;
const DIAL_TILT = 40;
const GNOMON_HEIGHT = 4;
const ORBIT_RADIUS = 10;
const PARTICLE_COUNT = 200;

interface ShichenMark {
  mesh: THREE.Mesh;
  label: THREE.Mesh;
  angle: number;
}

interface SolarBall {
  mesh: THREE.Mesh;
  day: number;
}

export class Sundial extends THREE.Group {
  private dial: THREE.Group;
  private dialBase: THREE.Mesh;
  private gnomon: THREE.Mesh;
  private shadow: THREE.Mesh;
  private lightBeam: THREE.Points;
  private particleData: { speed: number; offset: number }[] = [];
  private shichenMarks: ShichenMark[] = [];
  private solarBalls: SolarBall[] = [];
  private sunriseMarker: THREE.Mesh;
  private sunsetMarker: THREE.Mesh;
  private simulator: ShadowSimulator;
  private targetShadowAngle: number = 0;
  private currentShadowAngle: number = 0;
  private isAnimating: boolean = false;
  private animationStart: number = 0;
  private animationDuration: number = 500;
  private animationStartAngle: number = 0;
  private lastTriggeredShichen: number = -1;
  private shakeStartTime: number = 0;
  private isShaking: boolean = false;
  private canvas: HTMLCanvasElement;

  constructor(simulator: ShadowSimulator) {
    super();
    this.simulator = simulator;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 64;

    this.dial = new THREE.Group();
    this.dial.rotation.x = (DIAL_TILT * Math.PI) / 180;
    this.add(this.dial);

    this.dialBase = this.createDialBase();
    this.dial.add(this.dialBase);

    this.createDialMarkings();
    this.createShichenLabels();

    this.gnomon = this.createGnomon();
    this.dial.add(this.gnomon);

    this.shadow = this.createShadow();
    this.dial.add(this.shadow);

    this.lightBeam = this.createLightBeam();
    this.add(this.lightBeam);

    this.createSolarOrbit();

    this.sunriseMarker = this.createSunMarker(0xffd700);
    this.dial.add(this.sunriseMarker);

    this.sunsetMarker = this.createSunMarker(0xff8c00);
    this.dial.add(this.sunsetMarker);

    this.createPlatform();
  }

  private createDialBase(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(DIAL_RADIUS, DIAL_RADIUS * 1.1, 0.3, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xb8b2a0,
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.15;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createDialMarkings(): void {
    const markingsGroup = new THREE.Group();

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const innerRadius = DIAL_RADIUS * 0.75;
      const outerRadius = DIAL_RADIUS * 0.95;

      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      shape.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);

      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius),
          new THREE.Vector3(Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius)
        ]),
        1,
        0.05,
        8,
        false
      );

      const material = new THREE.MeshStandardMaterial({
        color: 0x2a1e14,
        roughness: 0.6
      });

      const mark = new THREE.Mesh(geometry, material);
      this.shichenMarks.push({ mesh: mark, label: new THREE.Mesh(), angle: angle * 180 / Math.PI });
      markingsGroup.add(mark);
    }

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const innerRadius = DIAL_RADIUS * 0.6;
      const outerRadius = DIAL_RADIUS * 0.95;

      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius),
          new THREE.Vector3(Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius)
        ]),
        1,
        0.02,
        4,
        false
      );

      const material = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.7
      });

      const mark = new THREE.Mesh(geometry, material);
      markingsGroup.add(mark);
    }

    const ringGeometry = new THREE.RingGeometry(DIAL_RADIUS * 0.7, DIAL_RADIUS * 0.71, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1e14,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    markingsGroup.add(ring);

    const outerRingGeometry = new THREE.RingGeometry(DIAL_RADIUS * 0.98, DIAL_RADIUS, 64);
    const outerRing = new THREE.Mesh(outerRingGeometry, ringMaterial);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.01;
    markingsGroup.add(outerRing);

    markingsGroup.position.y = 0.001;
    this.dial.add(markingsGroup);
  }

  private createShichenLabels(): void {
    const labelsGroup = new THREE.Group();

    SHICHEN_DATA.forEach((shichen, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const radius = DIAL_RADIUS * 0.85;

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 64, 64);
      ctx.font = 'bold 32px "Noto Serif SC", serif';
      ctx.fillStyle = '#2a1e14';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shichen.name.charAt(0), 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 8;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

      const geometry = new THREE.PlaneGeometry(0.5, 0.5);
      const label = new THREE.Mesh(geometry, material);
      label.position.set(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius);
      label.rotation.x = -Math.PI / 2;
      label.rotation.z = -angle - Math.PI / 2;

      if (this.shichenMarks[i]) {
        this.shichenMarks[i].label = label;
      }
      labelsGroup.add(label);
    });

    this.dial.add(labelsGroup);
  }

  private createGnomon(): THREE.Mesh {
    const baseGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16);
    const shaftGeometry = new THREE.CylinderGeometry(0.08, 0.12, GNOMON_HEIGHT, 16);
    const tipGeometry = new THREE.ConeGeometry(0.1, 0.4, 16);

    const material = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.4,
      metalness: 0.8
    });

    const group = new THREE.Group();

    const base = new THREE.Mesh(baseGeometry, material);
    base.position.y = 0.15;
    base.castShadow = true;
    group.add(base);

    const shaft = new THREE.Mesh(shaftGeometry, material);
    shaft.position.y = GNOMON_HEIGHT / 2 + 0.3;
    shaft.castShadow = true;
    group.add(shaft);

    const tip = new THREE.Mesh(tipGeometry, material);
    tip.position.y = GNOMON_HEIGHT + 0.3 + 0.2;
    tip.castShadow = true;
    group.add(tip);

    return group as unknown as THREE.Mesh;
  }

  private createShadow(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.3, 8, 8, 1, true);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    mesh.scale.y = 0;
    return mesh;
  }

  private createLightBeam(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const radius = t * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const distance = t * 8;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = distance;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.84;
      colors[i * 3 + 2] = 0;

      sizes[i] = 1 + Math.random();

      this.particleData.push({
        speed: 0.5 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.position.y = GNOMON_HEIGHT + 0.3;
    return points;
  }

  private createSolarOrbit(): void {
    const orbitGroup = new THREE.Group();

    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(365 * 3);

    for (let i = 0; i < 365; i++) {
      const angle = (i / 365) * Math.PI * 2;
      orbitPositions[i * 3] = Math.cos(angle) * ORBIT_RADIUS;
      orbitPositions[i * 3 + 1] = 0;
      orbitPositions[i * 3 + 2] = Math.sin(angle) * ORBIT_RADIUS;
    }

    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitMaterial = new THREE.PointsMaterial({
      color: 0x5a5a4e,
      size: 0.05,
      transparent: true,
      opacity: 0.5
    });

    const orbit = new THREE.Points(orbitGeometry, orbitMaterial);
    orbitGroup.add(orbit);

    const ballGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0xd4a017,
      emissiveIntensity: 0.3
    });

    SOLAR_TERMS.forEach((term) => {
      const angle = (term.day / 365) * Math.PI * 2;
      const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone());
      ball.position.set(Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS);
      ball.userData = { day: term.day, type: 'solarBall' };
      ball.castShadow = true;
      this.solarBalls.push({ mesh: ball, day: term.day });
      orbitGroup.add(ball);
    });

    this.add(orbitGroup);
  }

  private createSunMarker(color: number): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.03;
    return mesh;
  }

  private createPlatform(): void {
    const platformGeometry = new THREE.CylinderGeometry(12, 14, 0.5, 64);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a4e,
      roughness: 0.9,
      metalness: 0.1
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    this.add(platform);

    const stepsGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
    const stepsMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a3e,
      roughness: 0.9
    });

    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(stepsGeometry, stepsMaterial);
      step.position.set(0, -0.45 + i * 0.2, -12 + i * 1.5);
      step.receiveShadow = true;
      this.add(step);
    }
  }

  public update(deltaTime: number, elapsedTime: number): void {
    const targetAngle = this.simulator.getShadowAngle();
    const targetLength = this.simulator.getShadowLength();

    if (this.isAnimating) {
      const progress = Math.min(1, (elapsedTime - this.animationStart) / this.animationDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.currentShadowAngle = this.animationStartAngle + (this.targetShadowAngle - this.animationStartAngle) * eased;

      if (progress >= 1) {
        this.isAnimating = false;
        this.currentShadowAngle = this.targetShadowAngle;
      }
    } else {
      let angleDiff = targetAngle - this.currentShadowAngle;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      this.currentShadowAngle += angleDiff * Math.min(1, deltaTime * 10);
    }

    this.shadow.rotation.z = (this.currentShadowAngle * Math.PI) / 180;
    this.shadow.scale.y = Math.max(0.1, targetLength / 8);
    this.shadow.scale.x = 0.2 + (1 - targetLength / 16) * 0.3;

    this.updateLightBeam(elapsedTime);
    this.updateShichenHighlight();
    this.updateSunMarkers();
    this.updateShake(elapsedTime);

    const result = this.simulator.isOnShichenMark();
    if (result.isOn && result.shichenIndex !== this.lastTriggeredShichen) {
      this.triggerShichenEvent(result.shichenIndex);
      this.lastTriggeredShichen = result.shichenIndex;
    } else if (!result.isOn) {
      this.lastTriggeredShichen = -1;
    }
  }

  private updateLightBeam(elapsedTime: number): void {
    const positions = this.lightBeam.geometry.attributes.position.array as Float32Array;
    const colors = this.lightBeam.geometry.attributes.color.array as Float32Array;

    this.lightBeam.rotation.y = (this.currentShadowAngle * Math.PI) / 180 + Math.PI / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const flicker = Math.sin(elapsedTime * this.particleData[i].speed + this.particleData[i].offset) * 0.5 + 0.5;
      const radius = t * 0.5 * flicker;
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + elapsedTime * 0.5;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;

      const alpha = 0.5 + flicker * 0.5;
      colors[i * 3] = 1 * alpha;
      colors[i * 3 + 1] = 0.84 * alpha;
      colors[i * 3 + 2] = 0 * alpha;
    }

    this.lightBeam.geometry.attributes.position.needsUpdate = true;
    this.lightBeam.geometry.attributes.color.needsUpdate = true;
  }

  private updateShichenHighlight(): void {
    const currentAngle = this.simulator.getShadowAngle();

    this.shichenMarks.forEach((mark) => {
      let diff = Math.abs(currentAngle - mark.angle);
      if (diff > 180) diff = 360 - diff;

      const material = mark.mesh.material as THREE.MeshStandardMaterial;
      const labelMaterial = mark.label.material as THREE.MeshBasicMaterial;

      if (diff < 5) {
        const intensity = 1 - diff / 5;
        material.color.setHex(0xfffacd);
        material.emissive?.setHex(0xfffacd);
        material.emissiveIntensity = intensity * 0.5;
        mark.mesh.scale.setScalar(1 + intensity * 0.2);
        mark.label.scale.setScalar(1 + intensity * 0.2);
        if (labelMaterial.map) {
          labelMaterial.map.colorSpace = THREE.SRGBColorSpace;
        }
      } else {
        material.color.setHex(0x2a1e14);
        material.emissive?.setHex(0x000000);
        material.emissiveIntensity = 0;
        mark.mesh.scale.setScalar(1);
        mark.label.scale.setScalar(1);
      }
    });
  }

  private updateSunMarkers(): void {
    const sunriseAngle = this.simulator.getSunriseAzimuth();
    const sunsetAngle = this.simulator.getSunsetAzimuth();

    const sunriseRad = (sunriseAngle * Math.PI) / 180;
    const sunsetRad = (sunsetAngle * Math.PI) / 180;

    const radius = DIAL_RADIUS * 0.9;

    this.sunriseMarker.position.x = Math.cos(sunriseRad) * radius;
    this.sunriseMarker.position.z = Math.sin(sunriseRad) * radius;

    this.sunsetMarker.position.x = Math.cos(sunsetRad) * radius;
    this.sunsetMarker.position.z = Math.sin(sunsetRad) * radius;
  }

  private updateShake(elapsedTime: number): void {
    if (this.isShaking) {
      const progress = (elapsedTime - this.shakeStartTime) / 300;
      if (progress >= 1) {
        this.isShaking = false;
        this.dialBase.scale.setScalar(1);
        this.shichenMarks.forEach(mark => {
          if (mark.mesh.parent) {
            mark.mesh.parent.scale.setScalar(1);
          }
        });
      } else {
        const shake = 1 + Math.sin(progress * Math.PI) * 0.02;
        this.dialBase.scale.setScalar(shake);
      }
    }
  }

  private triggerShichenEvent(shichenIndex: number): void {
    this.playChimeSound();
    this.triggerShake();

    const event = new CustomEvent('shichen-aligned', {
      detail: { shichen: SHICHEN_DATA[shichenIndex], index: shichenIndex }
    });
    document.dispatchEvent(event);
  }

  private playChimeSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      // Audio not supported
    }
  }

  private triggerShake(): void {
    this.isShaking = true;
    this.shakeStartTime = performance.now();
  }

  public animateToShichen(shichenIndex: number): void {
    const targetAngle = this.simulator.getShichenAngle(shichenIndex);
    this.targetShadowAngle = targetAngle;
    this.animationStartAngle = this.currentShadowAngle;
    this.animationStart = performance.now();
    this.isAnimating = true;

    let angleDiff = targetAngle - this.animationStartAngle;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    this.targetShadowAngle = this.animationStartAngle + angleDiff;
  }

  public getSolarBalls(): SolarBall[] {
    return this.solarBalls;
  }

  public getDialGroup(): THREE.Group {
    return this.dial;
  }
}
