import gsap from 'gsap';
import * as THREE from 'three';

export class EffectsManager {
  private scene: THREE.Scene;
  private explosionMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createExplosionRing(position: THREE.Vector3, radius: number = 15): void {
    const geometry = new THREE.RingGeometry(radius * 0.3, radius * 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.lookAt(new THREE.Vector3(0, 1, 0));
    ring.rotation.x = Math.PI / 2;

    this.scene.add(ring);
    this.explosionMeshes.push(ring);

    gsap.to(ring.scale, {
      x: 2,
      y: 2,
      z: 2,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring);
        geometry.dispose();
        material.dispose();
        const index = this.explosionMeshes.indexOf(ring);
        if (index > -1) {
          this.explosionMeshes.splice(index, 1);
        }
      }
    });
  }

  public createFadeInAnimation(
    target: { opacity: number },
    from: number = 0,
    to: number = 1,
    duration: number = 1
  ): gsap.core.Tween {
    target.opacity = from;
    return gsap.to(target, {
      opacity: to,
      duration,
      ease: 'power2.out'
    });
  }

  public createFadeOutAnimation(
    target: { opacity: number },
    to: number = 0,
    duration: number = 0.5
  ): gsap.core.Tween {
    return gsap.to(target, {
      opacity: to,
      duration,
      ease: 'power2.in'
    });
  }

  public pulseElement(element: HTMLElement): void {
    gsap.fromTo(
      element,
      { scale: 1 },
      {
        scale: 1.05,
        duration: 0.15,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      }
    );
  }

  public dispose(): void {
    this.explosionMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.explosionMeshes = [];
  }
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
