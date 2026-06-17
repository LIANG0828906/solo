import * as THREE from 'three';
import { UIManager, UIControls } from './ui';
import { InteractionManager } from './interaction';
import { Particle, ForceField, FusionEvent, RingEffect, PARTICLE_RADIUS, hexToRgb } from './particle';

const GRAVITY_SCALE_MULTIPLIER = 1e10;

class ParticleSandbox {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private physicsWorker: Worker;
  private particles: Particle[] = [];
  private particleMesh: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private sphereMesh: THREE.LineSegments;
  private uiManager: UIManager;
  private interactionManager: InteractionManager;
  private clock: THREE.Clock;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private fusionMeshes: { mesh: THREE.Mesh; startTime: number; duration: number }[] = [];
  private ringMeshes: { mesh: THREE.Mesh; startTime: number; duration: number; startRadius: number; endRadius: number }[] = [];
  private forceFieldMesh: THREE.Mesh | null = null;
  private currentControls: UIControls;
  private pendingFusions: FusionEvent[] = [];
  private animationId: number | null = null;
  private particleCountTarget: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentControls = {
      repulsionStrength: 2,
      gravityScale: 1,
      colorFlickerFrequency: 1,
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.createBoundarySphere();
    this.createParticleSystem();
    this.createForceFieldVisual();

    this.uiManager = new UIManager(container, this.onControlChange.bind(this));
    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer,
      this.onForceFieldChange.bind(this),
      this.onAddParticle.bind(this)
    );

    this.physicsWorker = new Worker(new URL('./physics.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.physicsWorker.onmessage = this.onWorkerMessage.bind(this);
    this.physicsWorker.postMessage({
      type: 'init',
      config: { particleCount: 1000, sphereRadius: 3 },
    });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createBoundarySphere() {
    const geometry = new THREE.SphereGeometry(3, 12, 12);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.6,
    });
    this.sphereMesh = new THREE.LineSegments(edges, material);
    this.scene.add(this.sphereMesh);

    const innerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      })
    );
    this.scene.add(innerSphere);
  }

  private createParticleSystem() {
    this.particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(1000 * 3);
    const colors = new Float32Array(1000 * 3);
    const sizes = new Float32Array(1000);

    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 0.29;
      colors[i * 3 + 1] = 0.56;
      colors[i * 3 + 2] = 0.85;
      sizes[i] = PARTICLE_RADIUS * 60;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flickerFrequency: { value: 1.0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        uniform float flickerFrequency;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float flicker = 1.0 + 0.15 * sin(time * flickerFrequency + position.x * 10.0 + position.y * 10.0);
          gl_PointSize = size * flicker * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 0.9;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleMesh = new THREE.Points(this.particleGeometry, material);
    this.scene.add(this.particleMesh);
  }

  private createForceFieldVisual() {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    this.forceFieldMesh = new THREE.Mesh(geometry, material);
    this.forceFieldMesh.visible = false;
    this.scene.add(this.forceFieldMesh);
  }

  private onWorkerMessage(e: MessageEvent) {
    const data = e.data;
    if (data.type === 'update') {
      this.particles = data.particles;
      this.pendingFusions = data.fusions || [];
      this.updateParticleGeometry();
      this.processFusions();
    }
  }

  private updateParticleGeometry() {
    const count = this.particles.length;
    if (count !== this.particleCountTarget) {
      this.particleGeometry.dispose();
      this.particleGeometry = new THREE.BufferGeometry();
      this.particleMesh.geometry = this.particleGeometry;
      this.particleCountTarget = count;
    }

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
      sizes[i] = PARTICLE_RADIUS * 60 * Math.max(1, Math.sqrt(p.mass));
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
  }

  private processFusions() {
    for (const fusion of this.pendingFusions) {
      this.createFusionEffect(fusion.x, fusion.y, fusion.z);
    }
    this.pendingFusions = [];
  }

  private createFusionEffect(x: number, y: number, z: number) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.fusionMeshes.push({ mesh, startTime: performance.now(), duration: 300 });
  }

  private createRingEffect(
    x: number,
    y: number,
    z: number,
    color: { r: number; g: number; b: number }
  ) {
    const colorHex = Math.round(color.r * 255) * 65536 + Math.round(color.g * 255) * 256 + Math.round(color.b * 255);
    const geometry = new THREE.RingGeometry(0.45, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.lookAt(this.camera.position);
    this.scene.add(mesh);
    this.ringMeshes.push({
      mesh,
      startTime: performance.now(),
      duration: 1000,
      startRadius: 0.5,
      endRadius: 2,
    });
  }

  private updateEffects() {
    const now = performance.now();

    for (let i = this.fusionMeshes.length - 1; i >= 0; i--) {
      const f = this.fusionMeshes[i];
      const t = (now - f.startTime) / f.duration;
      if (t >= 1) {
        this.scene.remove(f.mesh);
        (f.mesh.material as THREE.Material).dispose();
        (f.mesh.geometry as THREE.BufferGeometry).dispose();
        this.fusionMeshes.splice(i, 1);
      } else {
        (f.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        f.mesh.scale.setScalar(1 + t * 0.5);
      }
    }

    for (let i = this.ringMeshes.length - 1; i >= 0; i--) {
      const r = this.ringMeshes[i];
      const t = (now - r.startTime) / r.duration;
      if (t >= 1) {
        this.scene.remove(r.mesh);
        (r.mesh.material as THREE.Material).dispose();
        (r.mesh.geometry as THREE.BufferGeometry).dispose();
        this.ringMeshes.splice(i, 1);
      } else {
        const radius = r.startRadius + (r.endRadius - r.startRadius) * t;
        (r.mesh.geometry as THREE.RingGeometry).dispose();
        r.mesh.geometry = new THREE.RingGeometry(radius * 0.95, radius, 32);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
        r.mesh.lookAt(this.camera.position);
      }
    }
  }

  private onControlChange(controls: UIControls) {
    this.currentControls = controls;
    this.interactionManager.setRepulsionStrength(controls.repulsionStrength);
    this.physicsWorker.postMessage({
      type: 'setGravityScale',
      scale: controls.gravityScale * GRAVITY_SCALE_MULTIPLIER,
    });
    const mat = this.particleMesh.material as THREE.ShaderMaterial;
    if (mat.uniforms) {
      mat.uniforms.flickerFrequency.value = controls.colorFlickerFrequency;
    }
  }

  private onForceFieldChange(field: ForceField | null) {
    if (this.forceFieldMesh) {
      if (field && field.active) {
        this.forceFieldMesh.visible = true;
        this.forceFieldMesh.position.set(field.x, field.y, field.z);
        this.forceFieldMesh.scale.setScalar(field.radius);
      } else {
        this.forceFieldMesh.visible = false;
      }
    }
    this.physicsWorker.postMessage({ type: 'forceField', forceField: field });
  }

  private onAddParticle(
    x: number,
    y: number,
    z: number,
    color: { r: number; g: number; b: number }
  ) {
    this.createRingEffect(x, y, z, color);
    this.physicsWorker.postMessage({
      type: 'addParticle',
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.5,
      color,
    });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const dt = Math.min(this.clock.getDelta(), 0.05);

      this.frameCount++;
      const now = performance.now();
      if (now - this.lastTime >= 500) {
        this.fps = (this.frameCount * 1000) / (now - this.lastTime);
        this.frameCount = 0;
        this.lastTime = now;
      }

      this.interactionManager.update();

      this.physicsWorker.postMessage({ type: 'update', dt });

      if (this.forceFieldMesh && this.interactionManager.isForceFieldActive()) {
        const pos = this.interactionManager.getForceFieldPosition();
        this.forceFieldMesh.position.copy(pos);
      }

      const mat = this.particleMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.time.value += dt;
      }

      this.updateEffects();

      const coords = this.interactionManager.getSphericalCoords();
      this.uiManager.updateInfo(this.particles.length, this.fps, coords.theta, coords.phi);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.physicsWorker.terminate();
    this.uiManager.destroy();
    this.interactionManager.destroy();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
  }
}

const root = document.getElementById('root');
if (root) {
  const app = new ParticleSandbox(root);
  app.start();
}
