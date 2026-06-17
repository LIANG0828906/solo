import * as THREE from 'three';
import { gsap } from 'gsap';
import type { LayerConfig } from './dataParser';

export class EffectsManager {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight | null = null;
  private pointLight: THREE.PointLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupLighting();
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);

    this.pointLight = new THREE.PointLight(0x88ffaa, 0.5, 30);
    this.pointLight.position.set(0, 5, 5);
    this.scene.add(this.pointLight);
  }

  public animateLayerPeel(
    mesh: THREE.Mesh,
    _layerConfig: LayerConfig,
    onComplete?: () => void
  ): void {
    const initialRotation = mesh.rotation.y;
    const targetRotation = initialRotation + Math.PI * 2;

    gsap.to(mesh.rotation, {
      y: targetRotation,
      duration: 1.2,
      ease: 'power3.out',
    });

    gsap.to(mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: 'power3.out',
    });

    const material = mesh.material as THREE.MeshStandardMaterial;
    gsap.to(material, {
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      onComplete: () => {
        mesh.visible = false;
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  public animateLayerRestore(
    mesh: THREE.Mesh,
    layerConfig: LayerConfig,
    onComplete?: () => void
  ): void {
    mesh.visible = true;
    mesh.scale.set(0, 0, 0);
    mesh.rotation.y = 0;

    const material = mesh.material as THREE.MeshStandardMaterial;
    material.opacity = 0;

    gsap.to(mesh.rotation, {
      y: Math.PI * 2,
      duration: 1.2,
      ease: 'power3.out',
    });

    gsap.to(mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.2,
      ease: 'power3.out',
    });

    gsap.to(material, {
      opacity: layerConfig.opacity,
      duration: 1.2,
      ease: 'power3.out',
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  public animateLayerFadeIn(
    mesh: THREE.Mesh,
    targetOpacity: number,
    duration: number = 0.8
  ): void {
    const material = mesh.material as THREE.MeshStandardMaterial;
    gsap.to(material, {
      opacity: targetOpacity,
      duration,
      ease: 'power2.out',
    });
  }

  public animateVascularHighlight(
    mesh: THREE.Mesh,
    isHighlighted: boolean
  ): void {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const targetColor = isHighlighted ? 0x00ff88 : 0x006400;
    const targetEmissive = isHighlighted ? 0x00ff88 : 0x000000;
    const targetEmissiveIntensity = isHighlighted ? 0.3 : 0;

    gsap.to(material.color, {
      r: ((targetColor >> 16) & 255) / 255,
      g: ((targetColor >> 8) & 255) / 255,
      b: (targetColor & 255) / 255,
      duration: 0.3,
      ease: 'power2.out',
    });

    gsap.to(material.emissive, {
      r: ((targetEmissive >> 16) & 255) / 255,
      g: ((targetEmissive >> 8) & 255) / 255,
      b: (targetEmissive & 255) / 255,
      duration: 0.3,
      ease: 'power2.out',
    });

    gsap.to(material, {
      emissiveIntensity: targetEmissiveIntensity,
      duration: 0.3,
      ease: 'power2.out',
    });
  }

  public animatePanelFade(
    element: HTMLElement,
    show: boolean,
    className: string = 'visible'
  ): void {
    if (show) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }

  public dispose(): void {
    gsap.killTweensOf('*');
  }
}
