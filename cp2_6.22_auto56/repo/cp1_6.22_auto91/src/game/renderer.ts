import * as THREE from 'three';
import { FrequencyData } from '@/audio/analyzer';

export interface TrackSegment {
  mesh: THREE.Mesh;
  index: number;
  angle: number;
  radius: number;
  height: number;
}

export interface Obstacle {
  mesh: THREE.Mesh;
  type: 'jump' | 'slide';
  segmentIndex: number;
  passed: boolean;
}

export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  private trackSegments: TrackSegment[] = [];
  private obstacles: Obstacle[] = [];
  private particles: ParticleData[] = [];
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particleSystem: THREE.Points;

  private playerGroup: THREE.Group;
  private playerBody: THREE.Mesh;
  private playerHead: THREE.Mesh;
  private playerScarf: THREE.Line;
  private scarfVertices: Float32Array;

  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLight: THREE.PointLight;

  private currentSpectrumPhase = 0;
  private frequencyData: FrequencyData = {
    low: 0, mid: 0, high: 0, overall: 0, spectrum: new Uint8Array(128),
  };

  private readonly SEGMENTS_COUNT = 400;
  private readonly SEGMENT_WIDTH = 2.2;
  private readonly SEGMENT_HEIGHT = 0.3;
  private readonly HELIX_RADIUS_START = 6;
  private readonly HELIX_RADIUS_GROWTH = 0.12;
  private readonly HELIX_TURNS = 15;
  private readonly PARTICLE_COUNT = 500;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 20, 10);
    this.scene.add(this.directionalLight);

    this.pointLight = new THREE.PointLight(0x00d4ff, 2, 50);
    this.pointLight.position.set(0, 5, 0);
    this.scene.add(this.pointLight);

    this.playerGroup = new THREE.Group();
    this.playerBody = this.createPlayerBody();
    this.playerHead = this.createPlayerHead();
    this.playerScarf = this.createPlayerScarf();
    this.playerGroup.add(this.playerBody);
    this.playerGroup.add(this.playerHead);
    this.playerGroup.add(this.playerScarf);
    this.scene.add(this.playerGroup);

    this.scarfVertices = new Float32Array(10 * 3);
    this.initScarf();

    this.createTrack();
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.initParticles();
    this.scene.add(this.particleSystem);

    window.addEventListener('resize', this.onResize);
  }

  private createPlayerBody(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.4, 0.8, 5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      roughness: 0.4,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.4;
    return mesh;
  }

  private createPlayerHead(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(0.25, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      roughness: 0.3,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1.05;
    return mesh;
  }

  private createPlayerScarf(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(10 * 3);
    const colors = new Float32Array(10 * 3);

    for (let i = 0; i < 10; i++) {
      vertices[i * 3] = 0;
      vertices[i * 3 + 1] = 0.75 - i * 0.08;
      vertices[i * 3 + 2] = 0.15 + i * 0.1;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.2;
      colors[i * 3 + 2] = 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 3,
    });

    return new THREE.Line(geometry, material);
  }

  private initScarf(): void {
    for (let i = 0; i < 10; i++) {
      this.scarfVertices[i * 3] = 0;
      this.scarfVertices[i * 3 + 1] = 0.75 - i * 0.08;
      this.scarfVertices[i * 3 + 2] = 0.15 + i * 0.1;
    }
  }

  private createTrack(): void {
    for (let i = 0; i < this.SEGMENTS_COUNT; i++) {
      const pos = this.getHelixPosition(i);
      const angle = this.getHelixAngle(i);

      const geometry = new THREE.BoxGeometry(this.SEGMENT_WIDTH, this.SEGMENT_HEIGHT, 1.2);
      const material = new THREE.MeshStandardMaterial({
        color: this.getTrackColor(0),
        transparent: true,
        opacity: 0.85,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      mesh.rotation.y = -angle;

      this.scene.add(mesh);
      this.trackSegments.push({
        mesh,
        index: i,
        angle,
        radius: this.getHelixRadius(i),
        height: pos.y,
      });
    }
  }

  getHelixPosition(index: number): THREE.Vector3 {
    const angle = this.getHelixAngle(index);
    const radius = this.getHelixRadius(index);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = index * 0.05;
    return new THREE.Vector3(x, y, z);
  }

  getHelixAngle(index: number): number {
    return (index / this.SEGMENTS_COUNT) * this.HELIX_TURNS * Math.PI * 2;
  }

  getHelixRadius(index: number): number {
    return this.HELIX_RADIUS_START + (index / this.SEGMENTS_COUNT) * this.HELIX_RADIUS_GROWTH * this.SEGMENTS_COUNT;
  }

  getTrackColor(phase: number): THREE.Color {
    const t = (Math.sin(phase) + 1) / 2;
    if (t < 0.5) {
      const blend = t / 0.5;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x0066ff),
        new THREE.Color(0x7b2ff7),
        blend,
      );
    } else {
      const blend = (t - 0.5) / 0.5;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x7b2ff7),
        new THREE.Color(0x0066ff),
        blend,
      );
    }
  }

  private initParticles(): void {
    const positions = new Float32Array(this.PARTICLE_COUNT * 3);
    const colors = new Float32Array(this.PARTICLE_COUNT * 3);
    const sizes = new Float32Array(this.PARTICLE_COUNT);

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const segmentIndex = Math.random() * this.SEGMENTS_COUNT;
      const pos = this.getHelixPosition(segmentIndex);
      const angle = this.getHelixAngle(segmentIndex);
      const side = Math.random() > 0.5 ? 1 : -1;
      const offset = this.SEGMENT_WIDTH * (0.6 + Math.random() * 0.8);

      const perpX = -Math.sin(angle) * side;
      const perpZ = Math.cos(angle) * side;

      positions[i * 3] = pos.x + perpX * offset + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = pos.z + perpZ * offset + (Math.random() - 0.5) * 2;

      const color = Math.random() > 0.5
        ? new THREE.Color(0x00d4ff)
        : new THREE.Color(0x7b2ff7);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.1 + Math.random() * 0.2;

      this.particles.push({
        position: new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2],
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
        size: sizes[i],
        life: Math.random(),
        maxLife: 1,
        color: color.clone(),
      });
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }

  updateFrequencyData(data: FrequencyData): void {
    this.frequencyData = data;
  }

  updateCameraAndPlayer(progress: number, playerY: number, isJumping: boolean, isSliding: boolean, jumpRotation: number, scarfWave: number): void {
    const clampedProgress = Math.max(0, Math.min(this.SEGMENTS_COUNT - 20, progress));

    const playerPos = this.getHelixPosition(clampedProgress);
    const nextPos = this.getHelixPosition(clampedProgress + 1);

    const lookDir = new THREE.Vector3().subVectors(nextPos, playerPos).normalize();

    this.playerGroup.position.set(playerPos.x, playerPos.y + 0.3 + playerY, playerPos.z);
    this.playerGroup.lookAt(playerPos.x + lookDir.x, playerPos.y + 0.5 + playerY, playerPos.z + lookDir.z);
    this.playerGroup.rotateY(Math.PI);

    if (isJumping) {
      this.playerGroup.rotateZ(jumpRotation * Math.PI * 2);
    }

    this.playerBody.scale.y = isSliding ? 0.4 : 1;
    this.playerBody.position.y = isSliding ? 0.15 : 0.4;
    this.playerHead.position.y = isSliding ? 0.55 : 1.05;
    this.playerHead.scale.y = isSliding ? 0.7 : 1;

    const scarfPosAttr = this.playerScarf.geometry.getAttribute('position') as THREE.BufferAttribute;
    const scarfArr = scarfPosAttr.array as Float32Array;
    for (let i = 0; i < 10; i++) {
      scarfArr[i * 3] = Math.sin(scarfWave + i * 0.5) * 0.1 * (i / 10);
      scarfArr[i * 3 + 1] = 0.75 - i * 0.08;
      scarfArr[i * 3 + 2] = 0.15 + i * 0.12 + Math.sin(scarfWave * 1.3 + i * 0.3) * 0.05;
    }
    scarfPosAttr.needsUpdate = true;

    const camProgress = Math.max(0, clampedProgress - 8);
    const camPos = this.getHelixPosition(camProgress);
    const camAngle = this.getHelixAngle(camProgress);

    const camOffset = new THREE.Vector3(
      -Math.sin(camAngle) * 3.5,
      4.5,
      -Math.cos(camAngle) * 3.5,
    );

    this.camera.position.lerp(camPos.clone().add(camOffset), 0.08);
    this.camera.lookAt(playerPos.x, playerPos.y + 0.8, playerPos.z);

    this.pointLight.position.set(playerPos.x, playerPos.y + 3, playerPos.z);
    this.pointLight.intensity = 1.5 + this.frequencyData.overall * 2;
  }

  updateTrack(deltaTime: number): void {
    this.currentSpectrumPhase += deltaTime * (1 + this.frequencyData.overall * 3);

    for (let i = 0; i < this.trackSegments.length; i++) {
      const segment = this.trackSegments[i];
      const phase = this.currentSpectrumPhase + i * 0.05;
      const color = this.getTrackColor(phase);
      const material = segment.mesh.material as THREE.MeshStandardMaterial;
      material.color.copy(color);
      material.emissive.copy(color);
      material.emissiveIntensity = 0.25 + this.frequencyData.overall * 0.6;
    }
  }

  updateParticles(deltaTime: number): void {
    const positions = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const sizes = this.particleGeometry.getAttribute('size') as THREE.BufferAttribute;
    const sizeArr = sizes.array as Float32Array;
    const colors = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const colorArr = colors.array as Float32Array;

    const beatPulse = 1 + this.frequencyData.low * 0.8;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.position.x += p.velocity.x * (1 + this.frequencyData.mid * 5);
      p.position.y += p.velocity.y * (1 + this.frequencyData.mid * 5);
      p.position.z += p.velocity.z * (1 + this.frequencyData.mid * 5);

      p.life -= deltaTime * 0.3;
      if (p.life <= 0) {
        const segmentIndex = Math.random() * this.SEGMENTS_COUNT;
        const pos = this.getHelixPosition(segmentIndex);
        const angle = this.getHelixAngle(segmentIndex);
        const side = Math.random() > 0.5 ? 1 : -1;
        const offset = this.SEGMENT_WIDTH * (0.6 + Math.random() * 0.8);

        const perpX = -Math.sin(angle) * side;
        const perpZ = Math.cos(angle) * side;

        p.position.set(
          pos.x + perpX * offset,
          pos.y + (Math.random() - 0.5) * 2,
          pos.z + perpZ * offset,
        );
        p.life = 1;
      }

      posArr[i * 3] = p.position.x;
      posArr[i * 3 + 1] = p.position.y;
      posArr[i * 3 + 2] = p.position.z;

      sizeArr[i] = (0.08 + p.size * beatPulse * (0.5 + this.frequencyData.high)) * p.life;

      const targetColor = Math.random() > 0.5 ? 0x00d4ff : 0x7b2ff7;
      p.color.lerp(new THREE.Color(targetColor), deltaTime * 2);
      colorArr[i * 3] = p.color.r * p.life;
      colorArr[i * 3 + 1] = p.color.g * p.life;
      colorArr[i * 3 + 2] = p.color.b * p.life;
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    colors.needsUpdate = true;
    this.particleMaterial.size = 0.15 + this.frequencyData.overall * 0.1;
  }

  spawnObstacle(segmentIndex: number, type: 'jump' | 'slide'): void {
    const clampedIndex = Math.max(0, Math.min(this.SEGMENTS_COUNT - 1, segmentIndex));
    const existing = this.obstacles.find((o) => o.segmentIndex === clampedIndex);
    if (existing) return;

    const pos = this.getHelixPosition(clampedIndex);
    const angle = this.getHelixAngle(clampedIndex);

    let geometry: THREE.BufferGeometry;
    if (type === 'jump') {
      geometry = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    } else {
      geometry = new THREE.BoxGeometry(1.5, 1.8, 0.8);
    }

    const color = type === 'jump' ? 0xff4466 : 0xffaa00;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.position.y += type === 'jump' ? 0.5 : 0.9;
    mesh.rotation.y = -angle;

    this.scene.add(mesh);
    this.obstacles.push({ mesh, type, segmentIndex: clampedIndex, passed: false });
  }

  updateObstacles(currentProgress: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      if (obstacle.segmentIndex < currentProgress - 30) {
        this.scene.remove(obstacle.mesh);
        obstacle.mesh.geometry.dispose();
        (obstacle.mesh.material as THREE.Material).dispose();
        this.obstacles.splice(i, 1);
      }
    }
  }

  checkCollision(currentProgress: number, playerY: number, isSliding: boolean): 'hit' | 'pass' | 'none' {
    for (const obstacle of this.obstacles) {
      const dist = obstacle.segmentIndex - currentProgress;
      if (dist > -1 && dist < 1 && !obstacle.passed) {
        obstacle.passed = true;
        if (obstacle.type === 'jump') {
          if (playerY < 0.4) {
            return 'hit';
          }
          return 'pass';
        } else {
          if (!isSliding) {
            return 'hit';
          }
          return 'pass';
        }
      }
    }
    return 'none';
  }

  clearObstacles(): void {
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle.mesh);
      obstacle.mesh.geometry.dispose();
      (obstacle.mesh.material as THREE.Material).dispose();
    }
    this.obstacles = [];
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);

    for (const segment of this.trackSegments) {
      segment.mesh.geometry.dispose();
      (segment.mesh.material as THREE.Material).dispose();
    }

    this.clearObstacles();

    this.particleGeometry.dispose();
    this.particleMaterial.dispose();

    this.playerBody.geometry.dispose();
    (this.playerBody.material as THREE.Material).dispose();
    this.playerHead.geometry.dispose();
    (this.playerHead.material as THREE.Material).dispose();
    this.playerScarf.geometry.dispose();
    (this.playerScarf.material as THREE.Material).dispose();

    this.renderer.dispose();
  }

  getMaxSegments(): number {
    return this.SEGMENTS_COUNT;
  }
}
