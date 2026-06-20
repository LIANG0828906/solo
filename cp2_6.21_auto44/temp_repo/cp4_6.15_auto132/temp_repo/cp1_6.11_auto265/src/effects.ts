import {
  Scene,
  Camera,
  Vector3,
  Color,
  Mesh,
  RingGeometry,
  SphereGeometry,
  Points,
  PointsMaterial,
  MeshBasicMaterial,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  AdditiveBlending,
  Object3D,
  Material,
} from 'three';

export interface AnimationTrack {
  id: string;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export interface WeaveLine {
  id: string;
  type: 'warp' | 'weft';
  points: Vector3[];
  color: Color;
  lineWidth: number;
  isVisible: boolean;
  opacity: number;
  mesh?: Object3D;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export class EffectManager {
  private scene: Scene;
  private camera: Camera;
  private effectsGroup: Group;
  private animations: Map<string, AnimationTrack>;
  private animationObjects: Set<Object3D>;
  private currentTime: number;
  private animationIdCounter: number;

  constructor(scene: Scene, camera: Camera) {
    this.scene = scene;
    this.camera = camera;
    this.animations = new Map();
    this.animationObjects = new Set();
    this.currentTime = 0;
    this.animationIdCounter = 0;

    this.effectsGroup = new Group();
    this.effectsGroup.name = 'effectsGroup';
    this.scene.add(this.effectsGroup);
  }

  addAnimation(track: Omit<AnimationTrack, 'id' | 'startTime'>): string {
    const id = `anim_${this.animationIdCounter++}`;
    const fullTrack: AnimationTrack = {
      ...track,
      id,
      startTime: this.currentTime,
    };
    this.animations.set(id, fullTrack);
    return id;
  }

  createSlideInAnimation(line: WeaveLine, delay: number): AnimationTrack {
    const mesh = line.mesh;
    if (!mesh) {
      return {
        id: `empty_${this.animationIdCounter++}`,
        startTime: this.currentTime + delay,
        duration: 0,
        easing: easeInOutCubic,
        onUpdate: () => {},
      };
    }

    const originalPosition = mesh.position.clone();
    const edgeOffset = this.getEdgeOffset(line);

    mesh.position.copy(originalPosition.clone().add(edgeOffset));
    mesh.visible = true;

    if (mesh instanceof Mesh) {
      const material = mesh.material as MeshBasicMaterial;
      material.transparent = true;
      material.opacity = 0;
    }

    const track: AnimationTrack = {
      id: `slideIn_${line.id}`,
      startTime: this.currentTime + delay,
      duration: 0.6,
      easing: easeInOutCubic,
      onUpdate: (progress: number) => {
        const eased = easeInOutCubic(progress);
        mesh.position.lerpVectors(
          originalPosition.clone().add(edgeOffset),
          originalPosition,
          eased
        );

        if (mesh instanceof Mesh) {
          const material = mesh.material as MeshBasicMaterial;
          material.opacity = eased;
        }
      },
      onComplete: () => {
        if (mesh instanceof Mesh) {
          const material = mesh.material as MeshBasicMaterial;
          material.opacity = 1;
          material.transparent = false;
        }
        line.opacity = 1;
      },
    };

    this.animations.set(track.id, track);
    return track;
  }

  createHighlightAnimation(
    position: Vector3,
    color: Color = new Color(0x8b6914),
    duration: number = 1.2
  ): void {
    const ringGeometry = new RingGeometry(0.08, 0.12, 32);
    const ringMaterial = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      side: 2,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(this.camera.position);
    this.effectsGroup.add(ring);
    this.animationObjects.add(ring);

    const sphereGeometry = new SphereGeometry(0.05, 16, 16);
    const sphereMaterial = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(position);
    this.effectsGroup.add(sphere);
    this.animationObjects.add(sphere);

    const track: AnimationTrack = {
      id: `highlight_${this.animationIdCounter++}`,
      startTime: this.currentTime,
      duration,
      easing: easeInOutCubic,
      onUpdate: (progress: number) => {
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
        ring.scale.setScalar(scale);
        ring.lookAt(this.camera.position);

        const ringOpacity = 1 - Math.pow(progress, 2);
        ringMaterial.opacity = ringOpacity;

        const sphereScale = 1 - progress * 0.3;
        sphere.scale.setScalar(sphereScale);
        sphereMaterial.opacity = 0.8 * (1 - progress);
      },
      onComplete: () => {
        this.disposeObject(ring);
        this.disposeObject(sphere);
      },
    };

    this.animations.set(track.id, track);
  }

  createRippleAnimation(
    position: Vector3,
    color: Color = new Color(0xffd700),
    duration: number = 0.3
  ): void {
    const startColor = new Color(0xffd700);
    const endColor = new Color(0xfff8dc);

    const ringGeometry = new RingGeometry(0.02, 0.04, 32);
    const ringMaterial = new MeshBasicMaterial({
      color: startColor,
      transparent: true,
      opacity: 1,
      side: 2,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(this.camera.position);
    this.effectsGroup.add(ring);
    this.animationObjects.add(ring);

    const track: AnimationTrack = {
      id: `ripple_${this.animationIdCounter++}`,
      startTime: this.currentTime,
      duration,
      easing: easeOutQuad,
      onUpdate: (progress: number) => {
        const scale = 1 + progress * 4;
        ring.scale.setScalar(scale);
        ring.lookAt(this.camera.position);

        const currentColor = startColor.clone().lerp(endColor, progress);
        ringMaterial.color.copy(currentColor);

        const thickness = 0.04 * (1 - progress);
        ring.geometry.dispose();
        ring.geometry = new RingGeometry(0.02 * scale, (0.02 + thickness) * scale, 32);

        ringMaterial.opacity = 1 - progress;
      },
      onComplete: () => {
        this.disposeObject(ring);
      },
    };

    this.animations.set(track.id, track);
  }

  createEdgeFinishAnimation(weaveLines: WeaveLine[]): AnimationTrack {
    const edgeLines = weaveLines.filter((line) => this.isEdgeLine(line));
    const originalPoints = new Map<string, Vector3[]>();

    edgeLines.forEach((line) => {
      originalPoints.set(
        line.id,
        line.points.map((p) => p.clone())
      );
    });

    const center = new Vector3(0, 0, 0);
    edgeLines.forEach((line) => {
      line.points.forEach((p) => center.add(p));
    });
    center.divideScalar(edgeLines.length * Math.max(1, edgeLines[0]?.points.length || 1));

    const track: AnimationTrack = {
      id: `edgeFinish_${this.animationIdCounter++}`,
      startTime: this.currentTime,
      duration: 1.5,
      easing: easeInOutCubic,
      onUpdate: (progress: number) => {
        const eased = easeInOutCubic(progress);
        const bendFactor = eased * 0.3;

        edgeLines.forEach((line) => {
          const original = originalPoints.get(line.id);
          if (!original) return;

          line.points.forEach((point, index) => {
            const origPoint = original[index];
            const toCenter = center.clone().sub(origPoint);
            const distanceRatio = index / (line.points.length - 1);
            const edgeFactor = Math.max(distanceRatio, 1 - distanceRatio);

            point.copy(origPoint);
            point.add(toCenter.multiplyScalar(bendFactor * edgeFactor));
          });

          if (line.mesh) {
            this.updateLineGeometry(line);
          }
        });
      },
      onComplete: () => {
        edgeLines.forEach((line) => {
          if (line.mesh) {
            this.updateLineGeometry(line);
          }
        });
      },
    };

    this.animations.set(track.id, track);
    return track;
  }

  createJumpTrail(
    position: Vector3,
    color: Color = new Color(0xffd700),
    duration: number = 0.8
  ): void {
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.2;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.sin(angle) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      lifetimes[i] = Math.random();
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: color,
      size: 0.03,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new Points(geometry, material);
    this.effectsGroup.add(particles);
    this.animationObjects.add(particles);

    const track: AnimationTrack = {
      id: `jumpTrail_${this.animationIdCounter++}`,
      startTime: this.currentTime,
      duration,
      easing: easeOutQuad,
      onUpdate: (progress: number) => {
        const posAttr = geometry.getAttribute('position') as Float32BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const lifetime = lifetimes[i];
          const particleProgress = (progress - lifetime * 0.3) / (1 - lifetime * 0.3);

          if (particleProgress > 0 && particleProgress < 1) {
            posArray[i * 3] += velocities[i * 3] * 0.016;
            posArray[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
            posArray[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;

            velocities[i * 3 + 1] -= 0.002;
          }
        }

        posAttr.needsUpdate = true;
        material.opacity = 1 - progress;
        material.size = 0.03 * (1 - progress * 0.5);
      },
      onComplete: () => {
        this.disposeObject(particles);
      },
    };

    this.animations.set(track.id, track);
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    const completedAnimations: string[] = [];

    this.animations.forEach((track) => {
      const elapsed = this.currentTime - track.startTime;

      if (elapsed < 0) {
        return;
      }

      const progress = Math.min(elapsed / track.duration, 1);
      track.onUpdate(progress);

      if (progress >= 1) {
        completedAnimations.push(track.id);
        if (track.onComplete) {
          track.onComplete();
        }
      }
    });

    completedAnimations.forEach((id) => {
      this.animations.delete(id);
    });
  }

  dispose(): void {
    this.animations.clear();

    this.animationObjects.forEach((obj) => {
      this.disposeObject(obj);
    });
    this.animationObjects.clear();

    if (this.effectsGroup) {
      while (this.effectsGroup.children.length > 0) {
        const child = this.effectsGroup.children[0];
        this.disposeObject(child);
      }
      this.scene.remove(this.effectsGroup);
    }
  }

  private getEdgeOffset(line: WeaveLine): Vector3 {
    if (line.points.length < 2) {
      return new Vector3(0, 0, 0);
    }

    const first = line.points[0];
    const last = line.points[line.points.length - 1];
    const direction = last.clone().sub(first).normalize();

    const center = new Vector3();
    line.points.forEach((p) => center.add(p));
    center.divideScalar(line.points.length);

    const toCenter = center.clone().negate().normalize();
    const offset = direction.cross(toCenter).normalize();

    return offset.multiplyScalar(2);
  }

  private isEdgeLine(line: WeaveLine): boolean {
    if (line.points.length === 0) return false;

    const first = line.points[0];
    const last = line.points[line.points.length - 1];
    const distance = first.distanceTo(last);

    return distance > 1.5;
  }

  private updateLineGeometry(line: WeaveLine): void {
    if (!line.mesh) return;

    const mesh = line.mesh as Mesh;
    const geometry = mesh.geometry as BufferGeometry;
    const positions = geometry.getAttribute('position') as Float32BufferAttribute;

    if (positions && positions.count === line.points.length * 3) {
      line.points.forEach((point, index) => {
        positions.setXYZ(index, point.x, point.y, point.z);
      });
      positions.needsUpdate = true;
      geometry.computeBoundingSphere();
    }
  }

  private disposeObject(obj: Object3D): void {
    if (obj instanceof Mesh || obj instanceof Points) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }

      const materials = Array.isArray(obj.material)
        ? (obj.material as Material[])
        : [obj.material as Material];

      materials.forEach((mat) => {
        if (mat) {
          mat.dispose();
        }
      });
    }

    if (obj.parent) {
      obj.parent.remove(obj);
    }

    this.animationObjects.delete(obj);
  }
}
