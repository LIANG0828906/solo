import * as THREE from 'three';
import { ImageryData, getColorHex } from './semanticParser';

export interface ParticleGroup {
  id: string;
  imageryData: ImageryData;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  positions: Float32Array;
  basePositions: Float32Array;
  phases: Float32Array;
  periods: Float32Array;
  boundingSphere: THREE.Sphere;
  rippleActive: boolean;
  rippleStartTime: number;
  rippleGroup: THREE.Group | null;
}

export type ParticleInteractionCallback = (group: ParticleGroup, intersection: THREE.Intersection) => void;

const PARTICLE_SIZE = 0.15;
const RIPPLE_DURATION = 1500;
const RIPPLE_MAX_RADIUS = 8;
const MAX_UPDATES_PER_FRAME = 500;

export class ParticleEngine {
  private scene: THREE.Scene;
  private particleGroups: Map<string, ParticleGroup> = new Map();
  private interactionCallback: ParticleInteractionCallback | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private updateIndex: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.setupInteraction();
  }

  private setupInteraction(): void {
    this.domElement.addEventListener('click', (event) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleClick();
    });
  }

  private handleClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const pointsArray: THREE.Object3D[] = [];
    this.particleGroups.forEach((group) => {
      pointsArray.push(group.points);
    });

    const intersects = this.raycaster.intersectObjects(pointsArray, false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object as THREE.Points;
      let hitGroup: ParticleGroup | null = null;

      this.particleGroups.forEach((group) => {
        if (group.points === hitObject) {
          hitGroup = group;
        }
      });

      if (hitGroup && this.interactionCallback) {
        this.triggerRipple(hitGroup, intersects[0]);
        this.interactionCallback(hitGroup, intersects[0]);
      }
    }
  }

  private triggerRipple(group: ParticleGroup, intersection: THREE.Intersection): void {
    if (group.rippleGroup) {
      this.scene.remove(group.rippleGroup);
      group.rippleGroup = null;
    }

    const rippleGroup = new THREE.Group();
    const point = intersection.point.clone();

    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: group.imageryData.color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(point);
      ring.lookAt(this.camera.position);
      ring.userData.ringIndex = i;
      rippleGroup.add(ring);
    }

    this.scene.add(rippleGroup);
    group.rippleGroup = rippleGroup;
    group.rippleActive = true;
    group.rippleStartTime = performance.now();
  }

  private updateRipples(time: number): void {
    this.particleGroups.forEach((group) => {
      if (!group.rippleActive || !group.rippleGroup) return;

      const elapsed = time - group.rippleStartTime;
      if (elapsed > RIPPLE_DURATION) {
        group.rippleActive = false;
        this.scene.remove(group.rippleGroup);
        group.rippleGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
          if ((obj as THREE.Mesh).material) {
            const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) {
              mat.forEach((m) => m.dispose());
            } else {
              mat.dispose();
            }
          }
        });
        group.rippleGroup = null;
        return;
      }

      const progress = elapsed / RIPPLE_DURATION;
      group.rippleGroup.children.forEach((ring, idx) => {
        const ringMesh = ring as THREE.Mesh;
        const ringProgress = Math.max(0, progress - idx * 0.15);
        const ringMat = ringMesh.material as THREE.MeshBasicMaterial;

        if (ringProgress >= 0 && ringProgress <= 1) {
          const radius = ringProgress * RIPPLE_MAX_RADIUS;
          const opacity = (1 - ringProgress) * 0.8;

          ringMesh.scale.setScalar(Math.max(0.01, radius * 10));
          ringMat.opacity = opacity;
          ringMesh.visible = true;
        } else {
          ringMesh.visible = false;
        }
      });
    });
  }

  public setInteractionCallback(callback: ParticleInteractionCallback): void {
    this.interactionCallback = callback;
  }

  public createParticleGroups(imageryList: ImageryData[]): ParticleGroup[] {
    const createdGroups: ParticleGroup[] = [];

    for (const imagery of imageryList) {
      const group = this.createSingleParticleGroup(imagery);
      if (group) {
        createdGroups.push(group);
      }
    }

    return createdGroups;
  }

  private createSingleParticleGroup(imagery: ImageryData): ParticleGroup | null {
    const count = imagery.particleCount;
    if (count < 1) return null;

    const positions = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const periods = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const color = new THREE.Color(getColorHex(imagery.color));
    const spreadRadius = 2.5 + Math.random() * 1.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * spreadRadius;

      const ox = r * Math.sin(phi) * Math.cos(theta);
      const oy = r * Math.sin(phi) * Math.sin(theta);
      const oz = r * Math.cos(phi);

      const px = imagery.position.x + ox;
      const py = imagery.position.y + oy;
      const pz = imagery.position.z + oz;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      basePositions[i3] = px;
      basePositions[i3 + 1] = py;
      basePositions[i3 + 2] = pz;

      const colorJitter = 0.85 + Math.random() * 0.3;
      colors[i3] = Math.min(1, color.r * colorJitter);
      colors[i3 + 1] = Math.min(1, color.g * colorJitter);
      colors[i3 + 2] = Math.min(1, color.b * colorJitter);

      phases[i] = Math.random() * Math.PI * 2;
      periods[i] = imagery.motionParams.periodMin +
        Math.random() * (imagery.motionParams.periodMax - imagery.motionParams.periodMin);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    const material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    const group: ParticleGroup = {
      id: imagery.id,
      imageryData: imagery,
      points,
      geometry,
      material,
      positions,
      basePositions,
      phases,
      periods,
      boundingSphere: new THREE.Sphere(
        new THREE.Vector3(imagery.position.x, imagery.position.y, imagery.position.z),
        spreadRadius + 1
      ),
      rippleActive: false,
      rippleStartTime: 0,
      rippleGroup: null
    };

    this.particleGroups.set(imagery.id, group);

    return group;
  }

  public update(time: number, deltaTime: number): void {
    const now = time;

    this.updateRipples(now);

    const positionAttribute = new Map<string, THREE.BufferAttribute>();
    this.particleGroups.forEach((group, id) => {
      const attr = group.geometry.getAttribute('position') as THREE.BufferAttribute;
      positionAttribute.set(id, attr);
    });

    let updatesThisFrame = 0;
    const totalGroups = this.particleGroups.size;
    if (totalGroups === 0) return;

    const groupsArray = Array.from(this.particleGroups.values());

    for (const group of groupsArray) {
      const count = group.imageryData.particleCount;
      const amp = group.imageryData.motionParams.amplitude;
      const attr = positionAttribute.get(group.id);
      if (!attr) continue;

      const positions = attr.array as Float32Array;

      for (let relativeIdx = 0; relativeIdx < count && updatesThisFrame < MAX_UPDATES_PER_FRAME; relativeIdx++) {
        const i = (this.updateIndex + relativeIdx) % count;
        const i3 = i * 3;

        const phase = group.phases[i];
        const period = group.periods[i];
        const omega = (2 * Math.PI) / period;

        const t = now * 0.001;

        const dx = Math.sin(omega * t + phase) * amp;
        const dy = Math.cos(omega * 1.3 * t + phase * 0.7) * amp * 0.8;
        const dz = Math.sin(omega * 0.8 * t + phase * 1.2) * amp;

        positions[i3] = group.basePositions[i3] + dx;
        positions[i3 + 1] = group.basePositions[i3 + 1] + dy;
        positions[i3 + 2] = group.basePositions[i3 + 2] + dz;

        updatesThisFrame++;
      }

      attr.needsUpdate = true;

      if (updatesThisFrame >= MAX_UPDATES_PER_FRAME) break;
    }

    this.updateIndex = (this.updateIndex + Math.floor(MAX_UPDATES_PER_FRAME / Math.max(1, totalGroups))) % 5000;
  }

  public clearAll(): void {
    this.particleGroups.forEach((group) => {
      this.scene.remove(group.points);
      if (group.rippleGroup) {
        this.scene.remove(group.rippleGroup);
      }
      group.geometry.dispose();
      group.material.dispose();

      if (group.rippleGroup) {
        group.rippleGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
          if ((obj as THREE.Mesh).material) {
            const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) {
              mat.forEach((m) => m.dispose());
            } else {
              mat.dispose();
            }
          }
        });
      }
    });

    this.particleGroups.clear();
    this.updateIndex = 0;
  }

  public getTotalParticleCount(): number {
    let total = 0;
    this.particleGroups.forEach((g) => {
      total += g.imageryData.particleCount;
    });
    return total;
  }

  public getGroupById(id: string): ParticleGroup | undefined {
    return this.particleGroups.get(id);
  }

  public getAllGroups(): ParticleGroup[] {
    return Array.from(this.particleGroups.values());
  }
}
