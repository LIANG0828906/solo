import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Particle } from '../types';
import { 
  PARTICLE_RADIUS, 
  BOUNDARY_RADIUS,
  TRAIL_LENGTH,
  MAX_BONDS
} from '../types';
import { useSimulationStore } from '../stores/simulationStore';

export class SceneRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  private particleMeshes: THREE.Mesh[] = [];
  private particlePoints: THREE.Points | null = null;
  private trailLines: THREE.Line[] = [];
  private bondLines: THREE.LineSegments | null = null;
  private boundarySphere: THREE.LineSegments;
  private gridHelper: THREE.GridHelper;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private currentMode: 'sphere' | 'points' = 'sphere';
  private particleGeometry: THREE.SphereGeometry;
  private particleMaterial: THREE.MeshStandardMaterial[] = [];
  private pointsGeometry: THREE.BufferGeometry | null = null;
  private pointsMaterial: THREE.PointsMaterial | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B0B1A);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(15, 12, 15);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 30;
    
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 20, 10);
    this.scene.add(this.directionalLight);
    
    this.gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0xffffff);
    (this.gridHelper.material as THREE.Material).opacity = 0.05;
    (this.gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(this.gridHelper);
    
    const boundaryGeo = new THREE.SphereGeometry(BOUNDARY_RADIUS, 32, 32);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x6464C8,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    this.boundarySphere = new THREE.LineSegments(
      new THREE.EdgesGeometry(boundaryGeo),
      boundaryMat
    );
    this.scene.add(this.boundarySphere);
    
    this.particleGeometry = new THREE.SphereGeometry(PARTICLE_RADIUS, 16, 16);
    
    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  public initParticles(particles: Particle[]): void {
    this.clearParticles();
    this.createSphereParticles(particles);
    this.createPointsParticles(particles);
    this.createTrailLines(particles);
    this.createBondLines();
    this.currentMode = 'sphere';
    this.updateRenderMode();
  }

  private clearParticles(): void {
    this.particleMeshes.forEach(mesh => this.scene.remove(mesh));
    this.particleMeshes = [];
    this.particleMaterial = [];
    
    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
      this.particlePoints = null;
    }
    
    this.trailLines.forEach(line => this.scene.remove(line));
    this.trailLines = [];
    
    if (this.bondLines) {
      this.scene.remove(this.bondLines);
      this.bondLines = null;
    }
  }

  private createSphereParticles(particles: Particle[]): void {
    for (const particle of particles) {
      const material = new THREE.MeshStandardMaterial({
        color: particle.color,
        emissive: particle.color,
        emissiveIntensity: 0.2,
        metalness: 0.3,
        roughness: 0.4
      });
      
      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.position.copy(particle.position);
      mesh.visible = false;
      
      this.scene.add(mesh);
      this.particleMeshes.push(mesh);
      this.particleMaterial.push(material);
    }
  }

  private createPointsParticles(particles: Particle[]): void {
    this.pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    
    for (let i = 0; i < particles.length; i++) {
      positions[i * 3] = particles[i].position.x;
      positions[i * 3 + 1] = particles[i].position.y;
      positions[i * 3 + 2] = particles[i].position.z;
      
      const color = new THREE.Color(particles[i].color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    this.pointsMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    this.particlePoints = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.particlePoints.visible = false;
    this.scene.add(this.particlePoints);
  }

  private createTrailLines(particles: Particle[]): void {
    for (const particle of particles) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(TRAIL_LENGTH * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({
        color: particle.color,
        transparent: true,
        opacity: 0.3
      });
      
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.scene.add(line);
      this.trailLines.push(line);
    }
  }

  private createBondLines(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_BONDS * 6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });
    
    this.bondLines = new THREE.LineSegments(geometry, material);
    this.bondLines.visible = false;
    this.scene.add(this.bondLines);
  }

  public updateRenderMode(): void {
    const store = useSimulationStore.getState();
    
    if (this.currentMode !== store.mode) {
      this.currentMode = store.mode;
    }
    
    const isSphere = this.currentMode === 'sphere';
    
    this.particleMeshes.forEach(mesh => {
      mesh.visible = isSphere;
    });
    
    if (this.particlePoints) {
      this.particlePoints.visible = !isSphere;
    }
    
    if (this.bondLines) {
      this.bondLines.visible = store.showBonds && isSphere;
    }
    
    this.trailLines.forEach(line => {
      line.visible = store.showTrails && isSphere;
    });
  }

  public update(particles: Particle[]): void {
    const store = useSimulationStore.getState();
    
    for (let i = 0; i < particles.length; i++) {
      if (this.particleMeshes[i]) {
        this.particleMeshes[i].position.copy(particles[i].position);
        
        const emissiveIntensity = 0.2 + (store.temperature - 0.1) / 4.9 * 0.8;
        this.particleMaterial[i].emissiveIntensity = Math.min(1.0, Math.max(0.2, emissiveIntensity));
      }
      
      if (this.pointsGeometry) {
        const positions = this.pointsGeometry.attributes.position.array as Float32Array;
        positions[i * 3] = particles[i].position.x;
        positions[i * 3 + 1] = particles[i].position.y;
        positions[i * 3 + 2] = particles[i].position.z;
        this.pointsGeometry.attributes.position.needsUpdate = true;
      }
      
      if (this.trailLines[i] && store.showTrails) {
        const trail = particles[i].trail;
        const positions = this.trailLines[i].geometry.attributes.position.array as Float32Array;
        
        for (let j = 0; j < TRAIL_LENGTH; j++) {
          if (j < trail.length) {
            positions[j * 3] = trail[j].x;
            positions[j * 3 + 1] = trail[j].y;
            positions[j * 3 + 2] = trail[j].z;
          } else if (trail.length > 0) {
            const last = trail[trail.length - 1];
            positions[j * 3] = last.x;
            positions[j * 3 + 1] = last.y;
            positions[j * 3 + 2] = last.z;
          }
        }
        
        this.trailLines[i].geometry.attributes.position.needsUpdate = true;
      }
    }
    
    if (this.bondLines && store.showBonds) {
      const bonds: number[] = [];
      let bondCount = 0;
      
      for (let i = 0; i < particles.length && bondCount < MAX_BONDS; i++) {
        for (let j = i + 1; j < particles.length && bondCount < MAX_BONDS; j++) {
          const dist = particles[i].position.distanceTo(particles[j].position);
          
          if (dist < 1.0) {
            bonds.push(
              particles[i].position.x,
              particles[i].position.y,
              particles[i].position.z,
              particles[j].position.x,
              particles[j].position.y,
              particles[j].position.z
            );
            bondCount++;
          }
        }
      }
      
      const positions = this.bondLines.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = i < bonds.length ? bonds[i] : 0;
      }
      this.bondLines.geometry.attributes.position.needsUpdate = true;
      this.bondLines.geometry.setDrawRange(0, bondCount * 2);
    }
    
    this.updateRenderMode();
  }

  public render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.forEach(m => m.dispose());
    
    if (this.pointsGeometry) this.pointsGeometry.dispose();
    if (this.pointsMaterial) this.pointsMaterial.dispose();
    
    this.trailLines.forEach(line => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    
    if (this.bondLines) {
      this.bondLines.geometry.dispose();
      (this.bondLines.material as THREE.Material).dispose();
    }
    
    this.renderer.dispose();
  }
}
