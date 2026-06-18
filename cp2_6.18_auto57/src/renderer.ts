import * as THREE from 'three';
import { SegmentData, PlayerState, EnergyBlockData, ObstacleData } from './eventBus';

interface Particle {
  mesh: THREE.Points;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface SegmentMesh {
  index: number;
  group: THREE.Group;
  track: THREE.Mesh;
  glowEdges: THREE.Mesh[];
  obstacles: Map<number, THREE.Mesh>;
  energyBlocks: Map<number, THREE.Mesh>;
}

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private playerMesh: THREE.Mesh;
  private segmentMeshes: Map<number, SegmentMesh> = new Map();
  private particles: Particle[] = [];
  private maxParticles: number = 50;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private trackTexture: THREE.CanvasTexture | null = null;
  private animateTrackTexture: boolean = true;
  private fps: number = 60;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private lowQualityMode: boolean = false;
  private cameraDistance: number = 8;
  private cameraHeight: number = 5;
  private cameraLerpSpeed: number = 5;
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private lightStripCanvas: HTMLCanvasElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0E27);
    this.scene.fog = new THREE.Fog(0x0A0E27, 30, 80);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, -8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.createTrackTexture();

    this.playerMesh = this.createPlayer();
    this.scene.add(this.playerMesh);
    
    this.setupLights();

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xFFD700,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    const playerLight = new THREE.PointLight(0x4A90D9, 1, 10);
    playerLight.position.set(0, 2, 0);
    this.playerMesh.add(playerLight);
  }

  private createTrackTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.lightStripCanvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.updateTrackTexture(ctx, 0);

    this.trackTexture = new THREE.CanvasTexture(canvas);
    this.trackTexture.wrapS = THREE.RepeatWrapping;
    this.trackTexture.wrapT = THREE.RepeatWrapping;
    this.trackTexture.repeat.set(2, 1);
  }

  private updateTrackTexture(ctx: CanvasRenderingContext2D, offset: number): void {
    const canvas = ctx.canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3A7BC8');
    gradient.addColorStop(0.5, '#4A90D9');
    gradient.addColorStop(1, '#3A7BC8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.animateTrackTexture) {
      const stripeCount = 5;
      const stripeWidth = 20;
      for (let i = 0; i < stripeCount; i++) {
        const x = ((i * 60 + offset * 50) % canvas.width) - stripeWidth;
        const stripeGradient = ctx.createLinearGradient(x, 0, x + stripeWidth, 0);
        stripeGradient.addColorStop(0, 'rgba(128, 191, 255, 0)');
        stripeGradient.addColorStop(0.5, 'rgba(128, 191, 255, 0.8)');
        stripeGradient.addColorStop(1, 'rgba(128, 191, 255, 0)');
        ctx.fillStyle = stripeGradient;
        ctx.fillRect(x, 0, stripeWidth, canvas.height);
      }
    }

    ctx.strokeStyle = '#80BFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#80BFFF';
    ctx.shadowBlur = 10;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }

  private createPlayer(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4A90D9,
      transparent: true,
      opacity: 0.9,
      emissive: 0x4A90D9,
      emissiveIntensity: 0.3,
      shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  createSegment(segment: SegmentData): void {
    if (this.segmentMeshes.has(segment.index)) return;

    const group = new THREE.Group();
    group.position.z = -segment.startZ;

    const trackMesh = this.createTrackMesh(segment);
    group.add(trackMesh);

    const glowEdges = this.createGlowEdges(segment);
    for (const edge of glowEdges) {
      group.add(edge);
    }

    const obstacleMeshes = new Map<number, THREE.Mesh>();
    segment.obstacles.forEach((obstacle, index) => {
      const mesh = this.createObstacle(obstacle);
      mesh.position.set(obstacle.x, 0.5, -(obstacle.z - segment.startZ));
      group.add(mesh);
      obstacleMeshes.set(index, mesh);
    });

    const energyMeshes = new Map<number, THREE.Mesh>();
    segment.energyBlocks.forEach((energy, index) => {
      const mesh = this.createEnergyBlock(energy);
      mesh.position.set(energy.x, 0.8, -(energy.z - segment.startZ));
      group.add(mesh);
      energyMeshes.set(index, mesh);
    });

    const centerZ = -(segment.startZ + segment.length / 2);
    const tiltRad = (segment.tiltAngle * Math.PI) / 180;
    const bendRad = (segment.bendAngle * Math.PI) / 180;
    
    group.position.x = Math.sin(bendRad) * segment.length * 0.3;
    group.rotation.z = -tiltRad;
    group.rotation.y = bendRad * 0.3;

    this.scene.add(group);

    this.segmentMeshes.set(segment.index, {
      index: segment.index,
      group,
      track: trackMesh,
      glowEdges,
      obstacles: obstacleMeshes,
      energyBlocks: energyMeshes,
    });
  }

  private createTrackMesh(segment: SegmentData): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      segment.width,
      0.2,
      segment.length
    );

    let material: THREE.MeshStandardMaterial;
    if (this.trackTexture) {
      material = new THREE.MeshStandardMaterial({
        map: this.trackTexture,
        roughness: 0.3,
        metalness: 0.5,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: 0x4A90D9,
        roughness: 0.3,
        metalness: 0.5,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.position.z = -segment.length / 2;

    return mesh;
  }

  private createGlowEdges(segment: SegmentData): THREE.Mesh[] {
    const edges: THREE.Mesh[] = [];
    const edgeHeight = 0.1;
    const edgeWidth = 0.1;

    const edgeGeometry = new THREE.BoxGeometry(edgeWidth, edgeHeight, segment.length);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x80BFFF,
      transparent: true,
      opacity: 0.8,
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial.clone());
    leftEdge.position.set(-segment.width / 2, 0.15, -segment.length / 2);
    edges.push(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial.clone());
    rightEdge.position.set(segment.width / 2, 0.15, -segment.length / 2);
    edges.push(rightEdge);

    return edges;
  }

  private createObstacle(obstacle: ObstacleData): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createEnergyBlock(energy: EnergyBlockData): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    return mesh;
  }

  removeSegment(segmentIndex: number): void {
    const segmentMesh = this.segmentMeshes.get(segmentIndex);
    if (segmentMesh) {
      this.scene.remove(segmentMesh.group);
      segmentMesh.track.geometry.dispose();
      (segmentMesh.track.material as THREE.Material).dispose();
      
      for (const [, mesh] of segmentMesh.obstacles) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      for (const [, mesh] of segmentMesh.energyBlocks) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      
      this.segmentMeshes.delete(segmentIndex);
    }
  }

  update(playerState: PlayerState, segments: SegmentData[], deltaTime: number): void {
    this.updateFPS();

    this.playerMesh.position.set(
      playerState.x,
      playerState.y,
      -playerState.z
    );

    this.playerMesh.rotation.y += deltaTime * 2;

    this.updateCamera(playerState, deltaTime);

    for (const segment of segments) {
      const segMesh = this.segmentMeshes.get(segment.index);
      if (!segMesh) {
        this.createSegment(segment);
        continue;
      }

      segment.energyBlocks.forEach((energy, index) => {
        const mesh = segMesh.energyBlocks.get(index);
        if (mesh) {
          mesh.visible = !energy.collected;
          if (!energy.collected) {
            mesh.position.y = 0.8 + Math.sin(performance.now() * 0.003 + index) * 0.1;
            mesh.rotation.y += deltaTime * 2;
          }
        }
      });

      segment.obstacles.forEach((obstacle, index) => {
        const mesh = segMesh.obstacles.get(index);
        if (mesh) {
          mesh.visible = !obstacle.collected;
        }
      });
    }

    this.updateParticles(deltaTime);

    if (this.trackTexture && this.animateTrackTexture && this.lightStripCanvas) {
      const ctx = this.lightStripCanvas.getContext('2d');
      if (ctx) {
        this.updateTrackTexture(ctx, playerState.z * 0.1);
        this.trackTexture.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(playerState: PlayerState, deltaTime: number): void {
    const targetX = playerState.x;
    const targetY = playerState.y + this.cameraHeight;
    const targetZ = -playerState.z + this.cameraDistance;

    this.camera.position.x += (targetX - this.camera.position.x) * this.cameraLerpSpeed * deltaTime;
    this.camera.position.y += (targetY - this.camera.position.y) * this.cameraLerpSpeed * deltaTime;
    this.camera.position.z += (targetZ - this.camera.position.z) * this.cameraLerpSpeed * deltaTime;

    this.camera.lookAt(playerState.x, playerState.y, -playerState.z);
  }

  spawnParticles(position: THREE.Vector3, color: number, count: number = 15): void {
    if (this.particles.length >= this.maxParticles) return;

    const particleCount = Math.min(count, this.maxParticles - this.particles.length);
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3,
        (Math.random() - 0.5) * 3
      );
      velocities.push(velocity);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.15,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        mesh: points,
        velocity: velocities[i],
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const positions = particle.mesh.geometry.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        positions[j] += particle.velocity.x * deltaTime;
        positions[j + 1] += particle.velocity.y * deltaTime;
        positions[j + 2] += particle.velocity.z * deltaTime;
        particle.velocity.y -= 9.8 * deltaTime * 0.5;
      }
      particle.mesh.geometry.attributes.position.needsUpdate = true;

      const material = particle.mesh.material as THREE.PointsMaterial;
      material.opacity = (particle.life / particle.maxLife) * 0.8;
    }
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.adjustQuality();
    }
  }

  private adjustQuality(): void {
    if (this.fps < 30 && !this.lowQualityMode) {
      this.lowQualityMode = true;
      this.maxParticles = 20;
      this.animateTrackTexture = false;
      this.renderer.setPixelRatio(1);
      this.particles = [];
    } else if (this.fps >= 55 && this.lowQualityMode) {
      this.lowQualityMode = false;
      this.maxParticles = 50;
      this.animateTrackTexture = true;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getFPS(): number {
    return this.fps;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    if (this.trackTexture) {
      this.trackTexture.dispose();
    }
  }
}
