import * as THREE from 'three';
import { Particle } from '../physics/particle';
import { SceneSetup } from './scene';

interface ParticleVisual {
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  trail: THREE.Line;
  trailPositions: Float32Array;
  trailColors: Float32Array;
  trailOpacities: Float32Array;
  trailLength: number;
  material: THREE.MeshStandardMaterial;
  glowMaterial: THREE.SpriteMaterial;
  trailMaterial: THREE.ShaderMaterial;
}

const MAX_TRAIL = 200;

const trailVertexShader = `
  attribute float aOpacity;
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    vOpacity = aOpacity;
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, vOpacity);
  }
`;

export class ParticleRenderer {
  private scene: THREE.Scene;
  private visuals: Map<Particle, ParticleVisual> = new Map();
  private glowTexture: THREE.Texture;
  private sphereGeo: THREE.SphereGeometry;
  private positiveColor = new THREE.Color(0xff6b6b);
  private negativeColor = new THREE.Color(0x4ecdc4);

  constructor(sceneSetup: SceneSetup) {
    this.scene = sceneSetup.scene;
    this.glowTexture = this.createGlowTexture();
    this.sphereGeo = new THREE.SphereGeometry(1, 16, 16);
  }

  private createGlowTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.2, 'rgba(200,200,255,0.4)');
    gradient.addColorStop(0.5, 'rgba(108,92,231,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private createVisual(particle: Particle): ParticleVisual {
    const color = particle.charge > 0 ? this.positiveColor : this.negativeColor;

    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.5,
    });

    const mesh = new THREE.Mesh(this.sphereGeo, material);
    mesh.scale.setScalar(particle.radius);
    this.scene.add(mesh);

    const glowMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
      color: color,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(particle.radius * 4);
    this.scene.add(glow);

    const trailPositions = new Float32Array(MAX_TRAIL * 3);
    const trailColors = new Float32Array(MAX_TRAIL * 3);
    const trailOpacities = new Float32Array(MAX_TRAIL);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    trailGeo.setAttribute('aOpacity', new THREE.BufferAttribute(trailOpacities, 1));
    trailGeo.setDrawRange(0, 0);

    const trailMaterial = new THREE.ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const trail = new THREE.Line(trailGeo, trailMaterial);
    this.scene.add(trail);

    return {
      mesh,
      glow,
      trail,
      trailPositions,
      trailColors,
      trailOpacities,
      trailLength: 0,
      material,
      glowMaterial,
      trailMaterial,
    };
  }

  private disposeVisual(visual: ParticleVisual): void {
    this.scene.remove(visual.mesh);
    this.scene.remove(visual.glow);
    this.scene.remove(visual.trail);
    visual.material.dispose();
    visual.glowMaterial.dispose();
    visual.trailMaterial.dispose();
    visual.trail.geometry.dispose();
  }

  update(particles: Particle[]): void {
    const currentSet = new Set(particles);

    for (const [particle, visual] of this.visuals) {
      if (!currentSet.has(particle)) {
        this.disposeVisual(visual);
        this.visuals.delete(particle);
      }
    }

    for (const particle of particles) {
      let visual = this.visuals.get(particle);
      if (!visual) {
        visual = this.createVisual(particle);
        this.visuals.set(particle, visual);
      }
      this.updateVisual(particle, visual);
    }
  }

  private updateVisual(particle: Particle, visual: ParticleVisual): void {
    visual.mesh.position.set(particle.x, particle.y, particle.z);
    visual.glow.position.set(particle.x, particle.y, particle.z);

    const flashIntensity = particle.flashTimer > 0 ? 1.0 + (particle.flashTimer / 0.3) * 3.0 : 1.0;
    visual.material.emissiveIntensity = 0.8 * flashIntensity;
    visual.glowMaterial.opacity = 0.5 * Math.min(flashIntensity, 2.0);

    const trailLen = particle.trail.length;
    if (trailLen === 0) {
      visual.trail.geometry.setDrawRange(0, 0);
      return;
    }

    const posAttr = visual.trail.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = visual.trail.geometry.getAttribute('color') as THREE.BufferAttribute;
    const opAttr = visual.trail.geometry.getAttribute('aOpacity') as THREE.BufferAttribute;

    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    const opArr = opAttr.array as Float32Array;

    const trailWidthFactor = 0.05 + 0.15 * Math.min(particle.speed / 5, 1);

    const cyanR = 0, cyanG = 1, cyanB = 1;
    const magR = 1, magG = 0, magB = 1;

    for (let i = 0; i < trailLen; i++) {
      const t = i / (trailLen - 1);

      posArr[i * 3] = particle.trail[i].x;
      posArr[i * 3 + 1] = particle.trail[i].y;
      posArr[i * 3 + 2] = particle.trail[i].z;

      colArr[i * 3] = cyanR + (magR - cyanR) * (1 - t);
      colArr[i * 3 + 1] = cyanG + (magG - cyanG) * (1 - t);
      colArr[i * 3 + 2] = cyanB + (magB - cyanB) * (1 - t);

      opArr[i] = 0.2 * t;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
    visual.trail.geometry.setDrawRange(0, trailLen);

    void trailWidthFactor;
  }

  dispose(): void {
    for (const [, visual] of this.visuals) {
      this.disposeVisual(visual);
    }
    this.visuals.clear();
    this.sphereGeo.dispose();
    this.glowTexture.dispose();
  }
}
