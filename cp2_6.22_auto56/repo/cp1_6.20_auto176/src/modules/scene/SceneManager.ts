import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Star, SPECTRAL_COLORS, SpectralType } from './StarData';
import { ConstellationLine } from './ConstellationSystem';

export type DisplayMode = 'stars-only' | 'stars-constellations' | 'stars-nebula' | 'full';

interface StarObject {
  mesh: THREE.Mesh;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  baseOpacity: number;
  highlightRing?: THREE.Mesh;
  highlightStartTime?: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private starObjects: Map<string, StarObject> = new Map();
  private nebulaParticles: THREE.Points[] = [];
  private constellationLines: THREE.Line[] = [];
  private distanceLabels: THREE.Sprite[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationId: number = 0;
  private time: number = 0;
  private onStarClick?: (starId: string) => void;
  private onStarDoubleClick?: (starId: string) => void;
  private lastClickTime: number = 0;
  private lastClickedStarId: string | null = null;
  private displayMode: DisplayMode = 'full';
  private targetNebulaOpacity: number = 1;
  private currentNebulaOpacity: number = 1;
  private targetConstellationOpacity: number = 1;
  private currentConstellationOpacity: number = 1;
  private highlightedStarId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 80);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 150;

    this.setupBackground();
    this.setupNebulaParticles();
    this.setupEventListeners();
    this.animate();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0a0a1f');
    gradient.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;
  }

  private setupNebulaParticles(): void {
    const layers = [
      { count: 500, size: 1.5, color: 0x6366f1, opacity: 0.3, radius: 60 },
      { count: 300, size: 1.0, color: 0xa78bfa, opacity: 0.4, radius: 55 },
      { count: 200, size: 0.8, color: 0xffffff, opacity: 0.2, radius: 50 },
    ];

    for (const layer of layers) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(layer.count * 3);
      const sizes = new Float32Array(layer.count);

      for (let i = 0; i < layer.count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = layer.radius * (0.5 + Math.random() * 0.5);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = layer.size * (0.5 + Math.random() * 1.5);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.PointsMaterial({
        color: layer.color,
        size: layer.size,
        transparent: true,
        opacity: layer.opacity,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      this.scene.add(points);
      this.nebulaParticles.push(points);
    }
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.starObjects.values()).map(s => s.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const starId = clickedMesh.userData.starId;

      const now = Date.now();
      if (now - this.lastClickTime < 300 && this.lastClickedStarId === starId) {
        this.onStarDoubleClick?.(starId);
      } else {
        this.onStarClick?.(starId);
      }

      this.lastClickTime = now;
      this.lastClickedStarId = starId;
    }
  }

  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  setOnStarClick(callback: (starId: string) => void): void {
    this.onStarClick = callback;
  }

  setOnStarDoubleClick(callback: (starId: string) => void): void {
    this.onStarDoubleClick = callback;
  }

  addStars(stars: Star[]): void {
    for (const star of stars) {
      this.addStar(star);
    }
  }

  addStar(star: Star): void {
    const radius = this.magnitudeToRadius(star.magnitude);
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const color = new THREE.Color(SPECTRAL_COLORS[star.spectralType]);
    
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...star.position);
    mesh.userData.starId = star.id;
    this.scene.add(mesh);

    const pulsePhase = Math.random() * Math.PI * 2;
    const pulseSpeed = 0.5 + Math.random() * 0.5;

    this.starObjects.set(star.id, {
      mesh,
      radius,
      pulsePhase,
      pulseSpeed,
      baseOpacity: 1,
    });
  }

  private magnitudeToRadius(magnitude: number): number {
    const minMag = 0;
    const maxMag = 10;
    const minRadius = 0.2;
    const maxRadius = 0.6;
    
    const normalized = 1 - (magnitude - minMag) / (maxMag - minMag);
    return minRadius + normalized * (maxRadius - minRadius);
  }

  highlightStar(starId: string): void {
    const starObj = this.starObjects.get(starId);
    if (!starObj) return;

    if (this.highlightedStarId && this.highlightedStarId !== starId) {
      this.removeHighlight(this.highlightedStarId);
    }

    if (starObj.highlightRing) {
      this.scene.remove(starObj.highlightRing);
    }

    const starRadius = starObj.mesh.geometry.parameters.radius;
    const ringGeometry = new THREE.RingGeometry(starRadius * 1.5, starRadius * 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xaeea00,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(starObj.mesh.position);
    ring.lookAt(this.camera.position);
    this.scene.add(ring);

    starObj.highlightRing = ring;
    starObj.highlightStartTime = this.time;
    this.highlightedStarId = starId;

    setTimeout(() => {
      this.removeHighlight(starId);
    }, 2000);
  }

  private removeHighlight(starId: string): void {
    const starObj = this.starObjects.get(starId);
    if (starObj && starObj.highlightRing) {
      this.scene.remove(starObj.highlightRing);
      starObj.highlightRing = undefined;
      starObj.highlightStartTime = undefined;
    }
    if (this.highlightedStarId === starId) {
      this.highlightedStarId = null;
    }
  }

  setStarOpacity(starId: string, opacity: number, animate: boolean = true): void {
    const starObj = this.starObjects.get(starId);
    if (!starObj) return;

    starObj.baseOpacity = opacity;
    
    if (!animate) {
      (starObj.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }

  filterStars(visibleStarIds: Set<string>): void {
    for (const [starId, starObj] of this.starObjects) {
      const isVisible = visibleStarIds.has(starId);
      starObj.baseOpacity = isVisible ? 1 : 0.2;
    }
  }

  addConstellationLine(startStar: Star, endStar: Star): void {
    const startPos = new THREE.Vector3(...startStar.position);
    const endPos = new THREE.Vector3(...endStar.position);

    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const distance = direction.length();
    const offset = distance * 0.1;
    
    const up = new THREE.Vector3(0, 1, 0);
    const perpendicular = new THREE.Vector3().crossVectors(direction, up).normalize();
    midPoint.add(perpendicular.multiplyScalar(offset));

    const curve = new THREE.CatmullRomCurve3([
      startPos,
      midPoint,
      endPos,
    ]);

    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const startColor = new THREE.Color(SPECTRAL_COLORS[startStar.spectralType]);
    const endColor = new THREE.Color(SPECTRAL_COLORS[endStar.spectralType]);
    
    const colors = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const color = startColor.clone().lerp(endColor, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.constellationLines.push(line);

    this.addDistanceLabel(startPos, endPos, distance);
  }

  private addDistanceLabel(startPos: THREE.Vector3, endPos: THREE.Vector3, distance: number): void {
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.stroke();
    
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '20px "Source Code Pro", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${distance.toFixed(2)} ly`, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(midPoint);
    sprite.scale.set(8, 2, 1);
    this.scene.add(sprite);
    this.distanceLabels.push(sprite);
  }

  clearConstellationLines(): void {
    for (const line of this.constellationLines) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.constellationLines = [];

    for (const label of this.distanceLabels) {
      this.scene.remove(label);
      (label.material as THREE.Material).dispose();
    }
    this.distanceLabels = [];
  }

  loadConstellation(stars: Star[], lines: ConstellationLine[]): void {
    this.clearConstellationLines();
    
    const starMap = new Map(stars.map(s => [s.id, s]));
    
    for (const line of lines) {
      const startStar = starMap.get(line.startStarId);
      const endStar = starMap.get(line.endStarId);
      
      if (startStar && endStar) {
        this.addConstellationLine(startStar, endStar);
      }
    }
  }

  setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;

    switch (mode) {
      case 'stars-only':
        this.targetNebulaOpacity = 0;
        this.targetConstellationOpacity = 0;
        break;
      case 'stars-constellations':
        this.targetNebulaOpacity = 0;
        this.targetConstellationOpacity = 1;
        break;
      case 'stars-nebula':
        this.targetNebulaOpacity = 1;
        this.targetConstellationOpacity = 0;
        break;
      case 'full':
        this.targetNebulaOpacity = 1;
        this.targetConstellationOpacity = 1;
        break;
    }
  }

  flyToStar(starId: string, duration: number = 1000): void {
    const starObj = this.starObjects.get(starId);
    if (!starObj) return;

    const targetPosition = starObj.mesh.position.clone();
    const direction = targetPosition.clone().normalize();
    const cameraDistance = 15;
    const newCameraPos = targetPosition.clone().add(direction.multiplyScalar(cameraDistance));

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(({ t }) => {
        this.camera.position.lerpVectors(startPos, newCameraPos, t);
        this.controls.target.lerpVectors(startTarget, targetPosition, t);
      })
      .start();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.time += 0.016;

    TWEEN.update();
    this.controls.update();

    this.updateStarPulses();
    this.updateNebulaOpacity();
    this.updateConstellationOpacity();
    this.updateNebulaRotation();
    this.updateHighlightRings();
    this.updateStarOpacityAnimation();

    this.renderer.render(this.scene, this.camera);
  }

  private updateStarPulses(): void {
    for (const starObj of this.starObjects.values()) {
      const pulse = 0.8 + 0.2 * Math.sin(this.time * starObj.pulseSpeed + starObj.pulsePhase);
      const material = starObj.mesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = starObj.baseOpacity * pulse;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
    }
  }

  private updateNebulaOpacity(): void {
    const diff = this.targetNebulaOpacity - this.currentNebulaOpacity;
    if (Math.abs(diff) > 0.001) {
      this.currentNebulaOpacity += diff * 0.03;
      
      for (let i = 0; i < this.nebulaParticles.length; i++) {
        const baseOpacities = [0.3, 0.4, 0.2];
        (this.nebulaParticles[i].material as THREE.PointsMaterial).opacity = 
          baseOpacities[i] * this.currentNebulaOpacity;
      }
    }
  }

  private updateConstellationOpacity(): void {
    const diff = this.targetConstellationOpacity - this.currentConstellationOpacity;
    if (Math.abs(diff) > 0.001) {
      this.currentConstellationOpacity += diff * 0.03;
      
      const targetLineOpacity = 0.7 * this.currentConstellationOpacity;
      const targetLabelOpacity = 0.9 * this.currentConstellationOpacity;
      
      for (const line of this.constellationLines) {
        (line.material as THREE.LineBasicMaterial).opacity = targetLineOpacity;
      }
      for (const label of this.distanceLabels) {
        (label.material as THREE.SpriteMaterial).opacity = targetLabelOpacity;
      }
    }
  }

  private updateNebulaRotation(): void {
    const rotationSpeed = 0.0002;
    for (let i = 0; i < this.nebulaParticles.length; i++) {
      const speedMultiplier = 1 + i * 0.3;
      this.nebulaParticles[i].rotation.y += rotationSpeed * speedMultiplier;
    }
  }

  private updateHighlightRings(): void {
    for (const starObj of this.starObjects.values()) {
      if (starObj.highlightRing && starObj.highlightStartTime !== undefined) {
        const elapsed = this.time - starObj.highlightStartTime;
        const material = starObj.highlightRing.material as THREE.MeshBasicMaterial;
        
        if (elapsed < 2) {
          const pulseScale = 1 + 0.2 * Math.sin(elapsed * 8);
          starObj.highlightRing.scale.setScalar(pulseScale);
          material.opacity = 1 - (elapsed / 2) * 0.5;
        }
        
        starObj.highlightRing.lookAt(this.camera.position);
      }
    }
  }

  private updateStarOpacityAnimation(): void {
    for (const starObj of this.starObjects.values()) {
      const material = starObj.mesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = starObj.baseOpacity;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.controls.dispose();
    
    for (const starObj of this.starObjects.values()) {
      starObj.mesh.geometry.dispose();
      (starObj.mesh.material as THREE.Material).dispose();
    }
    
    for (const points of this.nebulaParticles) {
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    }
    
    this.clearConstellationLines();
    
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
