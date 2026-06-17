import * as THREE from 'three';
import { gsap } from 'gsap';
import { ParticleData, ClusterInfo } from './ParticleClusterGenerator';

export interface SceneRendererOptions {
  container: HTMLElement;
  particles: ParticleData[];
  clusters: ClusterInfo[];
}

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: ParticleData[];
  private clusters: ClusterInfo[];

  private points!: THREE.Points;
  private pointsGeometry!: THREE.BufferGeometry;
  private clusterMeshes: THREE.Mesh[] = [];
  private lineSegments: THREE.LineSegments | null = null;

  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };

  private spherical: { radius: number; theta: number; phi: number };
  private sphericalVelocity: { theta: number; phi: number; radius: number };
  private target: THREE.Vector3;

  private autoRotateSpeed: number = 0.002;
  private damping: number = 0.08;

  private minDistance: number = 5;
  private maxDistance: number = 50;
  private minPolarAngle: number = Math.PI / 6;
  private maxPolarAngle: number = Math.PI * 5 / 6;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private clusterGlowMaterials: THREE.MeshBasicMaterial[] = [];
  private highlightAnimation: gsap.core.Tween | null = null;
  private flyToAnimation: gsap.core.Tween | null = null;

  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  private sizes: { width: number; height: number } = { width: 0, height: 0 };

  private onResizeBound: () => void;

  constructor(options: SceneRendererOptions) {
    this.container = options.container;
    this.particles = options.particles;
    this.clusters = options.clusters;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.spherical = { radius: 35, theta: 0, phi: Math.PI / 2 };
    this.sphericalVelocity = { theta: 0, phi: 0, radius: 0 };
    this.target = new THREE.Vector3(0, 0, 0);

    this.onResizeBound = this.onResize.bind(this);

    this.init();
  }

  private init(): void {
    this.sizes.width = this.container.clientWidth;
    this.sizes.height = this.container.clientHeight;

    this.camera.fov = 60;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.updateCameraPosition();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.createParticles();
    this.createClusterGlows();
    this.createConnections();
    this.setupEventListeners();
    this.startAnimation();
  }

  private updateCameraPosition(): void {
    const sinPhiRadius = this.spherical.radius * Math.sin(this.spherical.phi);

    this.camera.position.x = this.target.x + sinPhiRadius * Math.sin(this.spherical.theta);
    this.camera.position.y = this.target.y + this.spherical.radius * Math.cos(this.spherical.phi);
    this.camera.position.z = this.target.z + sinPhiRadius * Math.cos(this.spherical.theta);

    this.camera.lookAt(this.target);
  }

  private createParticles(): void {
    const positions = new Float32Array(this.particles.length * 3);
    const colors = new Float32Array(this.particles.length * 3);
    const sizes = new Float32Array(this.particles.length);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;

      sizes[i] = p.size;
    }

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.pointsGeometry, material);
    this.scene.add(this.points);
  }

  private createClusterGlows(): void {
    for (const cluster of this.clusters) {
      const geometry = new THREE.SphereGeometry(cluster.radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: cluster.color,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(cluster.center);
      this.scene.add(mesh);
      this.clusterMeshes.push(mesh);
      this.clusterGlowMaterials.push(material);
    }
  }

  private createConnections(): void {
    const linePositions: number[] = [];
    const gridSize = 12;
    const grid: Map<string, number[]> = new Map();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const gx = Math.floor(p.position.x / gridSize);
      const gy = Math.floor(p.position.y / gridSize);
      const gz = Math.floor(p.position.z / gridSize);
      const key = `${gx},${gy},${gz}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(i);
    }

    const maxConnections = 3000;
    let connectionCount = 0;

    for (let i = 0; i < this.particles.length && connectionCount < maxConnections; i++) {
      const p = this.particles[i];
      const gx = Math.floor(p.position.x / gridSize);
      const gy = Math.floor(p.position.y / gridSize);
      const gz = Math.floor(p.position.z / gridSize);

      for (let dx = -1; dx <= 1 && connectionCount < maxConnections; dx++) {
        for (let dy = -1; dy <= 1 && connectionCount < maxConnections; dy++) {
          for (let dz = -1; dz <= 1 && connectionCount < maxConnections; dz++) {
            const key = `${gx + dx},${gy + dy},${gz + dz}`;
            const cell = grid.get(key);
            if (!cell) continue;

            for (const j of cell) {
              if (j <= i) continue;

              const p2 = this.particles[j];
              const dist = p.position.distanceTo(p2.position);

              if (dist < 12) {
                linePositions.push(
                  p.position.x, p.position.y, p.position.z,
                  p2.position.x, p2.position.y, p2.position.z
                );
                connectionCount++;
                if (connectionCount >= maxConnections) break;
              }
            }
          }
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15
    });

    this.lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lineSegments);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    window.addEventListener('resize', this.onResizeBound);
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    this.sphericalVelocity.theta = 0;
    this.sphericalVelocity.phi = 0;
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
    this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;

    if (!this.isDragging) return;

    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y
    };

    const rotationSpeed = 0.005;
    this.sphericalVelocity.theta = -deltaMove.x * rotationSpeed;
    this.sphericalVelocity.phi = -deltaMove.y * rotationSpeed;

    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const zoomSpeed = 0.001;
    const delta = event.deltaY * zoomSpeed;

    const newRadius = this.spherical.radius * (1 + delta);
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, newRadius));
  }

  public onParticleClick(callback: (clusterId: number, particleIndex: number) => void): void {
    const canvas = this.renderer.domElement;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('mousedown', (event) => {
      isDragging = false;
      startX = event.clientX;
      startY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
      const dx = Math.abs(event.clientX - startX);
      const dy = Math.abs(event.clientY - startY);
      if (dx > 3 || dy > 3) {
        isDragging = true;
      }
    });

    canvas.addEventListener('click', (event) => {
      if (isDragging) return;

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObject(this.points);

      if (intersects.length > 0) {
        const index = intersects[0].index!;
        const clusterId = this.particles[index].clusterId;
        this.animateParticleClick(index);
        callback(clusterId, index);
      }
    });
  }

  private animateParticleClick(index: number): void {
    const sizeAttribute = this.pointsGeometry.getAttribute('size') as THREE.BufferAttribute;
    const originalSize = sizeAttribute.array[index] as number;
    const sizeArray = sizeAttribute.array as Float32Array;

    gsap.to({}, {
      duration: 0.2,
      repeat: 1,
      yoyo: true,
      onUpdate: function () {
        const progress = this.progress();
        sizeArray[index] = originalSize + (10 - originalSize) * progress;
        sizeAttribute.needsUpdate = true;
      },
      onComplete: () => {
        sizeArray[index] = originalSize;
        sizeAttribute.needsUpdate = true;
      }
    });
  }

  private onResize(): void {
    this.sizes.width = this.container.clientWidth;
    this.sizes.height = this.container.clientHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const material = this.points.material as THREE.ShaderMaterial;
    material.uniforms.pixelRatio.value = this.renderer.getPixelRatio();
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private update(delta: number): void {
    if (!this.isDragging) {
      this.spherical.theta += this.autoRotateSpeed * delta;
    }

    this.spherical.theta += this.sphericalVelocity.theta;
    this.spherical.phi += this.sphericalVelocity.phi;

    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

    this.sphericalVelocity.theta *= (1 - this.damping);
    this.sphericalVelocity.phi *= (1 - this.damping);

    if (Math.abs(this.sphericalVelocity.theta) < 0.0001) {
      this.sphericalVelocity.theta = 0;
    }
    if (Math.abs(this.sphericalVelocity.phi) < 0.0001) {
      this.sphericalVelocity.phi = 0;
    }

    this.updateCameraPosition();
  }

  public flyToCluster(clusterId: number): void {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    if (this.flyToAnimation) {
      this.flyToAnimation.kill();
      this.flyToAnimation = null;
    }

    const targetCenter = cluster.center.clone();
    const targetRadius = Math.min(cluster.radius * 3, 25);

    const currentTarget = this.target.clone();

    const startState = {
      targetX: currentTarget.x,
      targetY: currentTarget.y,
      targetZ: currentTarget.z,
      radius: this.spherical.radius
    };

    const endState = {
      targetX: targetCenter.x,
      targetY: targetCenter.y,
      targetZ: targetCenter.z,
      radius: targetRadius
    };

    this.flyToAnimation = gsap.to(startState, {
      ...endState,
      duration: 1.5,
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      onUpdate: () => {
        this.target.set(startState.targetX, startState.targetY, startState.targetZ);
        this.spherical.radius = startState.radius;
        this.updateCameraPosition();
      }
    });
  }

  public highlightCluster(clusterId: number | null): void {
    if (this.highlightAnimation) {
      this.highlightAnimation.kill();
      this.highlightAnimation = null;
    }

    for (let i = 0; i < this.clusterGlowMaterials.length; i++) {
      const material = this.clusterGlowMaterials[i];

      if (clusterId !== null && i === clusterId) {
        this.highlightAnimation = gsap.to(material, {
          opacity: 0.25,
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      } else {
        gsap.to(material, {
          opacity: 0.05,
          duration: 0.3
        });
      }
    }
  }

  public getClusterCenter(clusterId: number): THREE.Vector3 | null {
    const cluster = this.clusters.find(c => c.id === clusterId);
    return cluster ? cluster.center.clone() : null;
  }

  public projectToScreen(position: THREE.Vector3): THREE.Vector2 {
    const vector = position.clone();
    vector.project(this.camera);

    return new THREE.Vector2(
      (vector.x + 1) / 2 * this.sizes.width,
      (-vector.y + 1) / 2 * this.sizes.height
    );
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.highlightAnimation) {
      this.highlightAnimation.kill();
    }

    if (this.flyToAnimation) {
      this.flyToAnimation.kill();
    }

    this.pointsGeometry.dispose();
    (this.points.material as THREE.Material).dispose();

    for (const mesh of this.clusterMeshes) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }

    if (this.lineSegments) {
      this.lineSegments.geometry.dispose();
      (this.lineSegments.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    window.removeEventListener('resize', this.onResizeBound);
  }
}
