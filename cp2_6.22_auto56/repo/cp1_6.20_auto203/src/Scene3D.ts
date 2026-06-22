import * as THREE from 'three';
import type { AudioAnalysis } from './AudioEngine';

interface SceneTrigger {
  noteName: string;
  intensity: number;
}

interface GeometryState {
  scale: number;
  rotationSpeed: number;
  targetScale: number;
  targetRotationSpeed: number;
  opacity: number;
  emissiveIntensity: number;
}

const COLORS = {
  drum: 0x9d4edd,
  bass: 0x00f5d4,
  chord: 0xff6b35,
  fx: 0xff006e
};

const FREQ_COLORS = {
  low: new THREE.Color(0x7b2cbf),
  mid: new THREE.Color(0x00f5d4),
  high: new THREE.Color(0xff6b35)
};

export class Scene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private particleVelocities: THREE.Vector3[];
  private cubes: THREE.Mesh[];
  private cubeStates: GeometryState[];
  private cubeMaterials: THREE.MeshStandardMaterial[];
  private lights: THREE.PointLight[];
  private ambientLight: THREE.AmbientLight;
  private clock: THREE.Clock;
  private currentParticleColor: THREE.Color;
  private targetParticleColor: THREE.Color;
  private particleBasePositions: Float32Array;
  private animationId: number | null = null;
  private onFrame: ((color: string) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d0d);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.clock = new THREE.Clock();
    this.currentParticleColor = FREQ_COLORS.low.clone();
    this.targetParticleColor = FREQ_COLORS.low.clone();

    const particleResult = this.createParticles();
    this.particles = particleResult.points;
    this.particleVelocities = particleResult.velocities;
    this.particleBasePositions = particleResult.basePositions;

    const cubeResult = this.createCubes();
    this.cubes = cubeResult.meshes;
    this.cubeStates = cubeResult.states;
    this.cubeMaterials = cubeResult.materials;

    const lightResult = this.createLights();
    this.lights = lightResult;

    this.scene.add(this.particles);
    this.cubes.forEach(cube => this.scene.add(cube));
    this.lights.forEach(light => this.scene.add(light));
  }

  private createParticles(): {
    points: THREE.Points;
    velocities: THREE.Vector3[];
    basePositions: Float32Array;
  } {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 8;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ));

      colors[i * 3] = FREQ_COLORS.low.r;
      colors[i * 3 + 1] = FREQ_COLORS.low.g;
      colors[i * 3 + 2] = FREQ_COLORS.low.b;

      sizes[i] = 0.02 + Math.random() * 0.08;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    return { points: new THREE.Points(geometry, material), velocities, basePositions };
  }

  private createCubes(): {
    meshes: THREE.Mesh[];
    states: GeometryState[];
    materials: THREE.MeshStandardMaterial[];
  } {
    const noteNames: Array<'drum' | 'bass' | 'chord' | 'fx'> = ['drum', 'bass', 'chord', 'fx'];
    const meshes: THREE.Mesh[] = [];
    const states: GeometryState[] = [];
    const materials: THREE.MeshStandardMaterial[] = [];

    const positions = [
      [-2, 0, 0],
      [-0.7, 1.2, 0],
      [0.7, 1.2, 0],
      [2, 0, 0]
    ];

    noteNames.forEach((note, i) => {
      const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const material = new THREE.MeshStandardMaterial({
        color: COLORS[note],
        emissive: COLORS[note],
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      meshes.push(mesh);
      materials.push(material);
      states.push({
        scale: 1,
        rotationSpeed: 0.5,
        targetScale: 1,
        targetRotationSpeed: 0.5,
        opacity: 0.5,
        emissiveIntensity: 0.3
      });
    });

    return { meshes, states, materials };
  }

  private createLights(): THREE.PointLight[] {
    const noteNames: Array<'drum' | 'bass' | 'chord' | 'fx'> = ['drum', 'bass', 'chord', 'fx'];
    const lights: THREE.PointLight[] = [];

    const positions = [
      [-2, 0, 0],
      [-0.7, 1.2, 0],
      [0.7, 1.2, 0],
      [2, 0, 0]
    ];

    noteNames.forEach((note, i) => {
      const light = new THREE.PointLight(COLORS[note], 0.5, 5);
      light.position.set(positions[i][0], positions[i][1], positions[i][2] + 1);
      lights.push(light);
    });

    return lights;
  }

  setOnFrameCallback(callback: (color: string) => void): void {
    this.onFrame = callback;
  }

  triggerExplosion(noteName: string, intensity: number): void {
    const noteIndex = ['drum', 'bass', 'chord', 'fx'].indexOf(noteName);
    if (noteIndex === -1) return;

    const state = this.cubeStates[noteIndex];
    state.targetScale = 1.5;
    state.targetRotationSpeed = 3;
    state.opacity = 1;
    state.emissiveIntensity = 2;

    setTimeout(() => {
      state.targetScale = 1;
    }, 200);

    setTimeout(() => {
      state.targetRotationSpeed = 0.5;
    }, 500);

    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const cube = this.cubes[noteIndex];
    
    for (let i = 0; i < this.particleVelocities.length; i++) {
      const dx = positions[i * 3] - cube.position.x;
      const dy = positions[i * 3 + 1] - cube.position.y;
      const dz = positions[i * 3 + 2] - cube.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      
      const force = intensity * 0.3 / dist;
      this.particleVelocities[i].x += (dx / dist) * force;
      this.particleVelocities[i].y += (dy / dist) * force;
      this.particleVelocities[i].z += (dz / dist) * force;
    }

    this.lights[noteIndex].intensity = 2 * intensity;
    setTimeout(() => {
      this.lights[noteIndex].intensity = 0.5;
    }, 300);
  }

  update(analysis: AudioAnalysis, triggers: SceneTrigger[]): void {
    triggers.forEach(trigger => {
      this.triggerExplosion(trigger.noteName, trigger.intensity);
    });

    this.updateParticleColor(analysis.averageFrequency);
    this.updateParticles(analysis.volume);
    this.updateCubes();
    this.updateCamera(analysis.volume);

    this.renderer.render(this.scene, this.camera);

    if (this.onFrame) {
      this.onFrame(`rgb(${Math.floor(this.currentParticleColor.r * 255)}, ${Math.floor(this.currentParticleColor.g * 255)}, ${Math.floor(this.currentParticleColor.b * 255)})`);
    }
  }

  private updateParticleColor(frequency: number): void {
    if (frequency < 440) {
      this.targetParticleColor.copy(FREQ_COLORS.low);
    } else if (frequency < 880) {
      this.targetParticleColor.copy(FREQ_COLORS.mid);
    } else {
      this.targetParticleColor.copy(FREQ_COLORS.high);
    }

    this.currentParticleColor.lerp(this.targetParticleColor, 0.05);

    const colors = this.particles.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = this.currentParticleColor.r;
      colors[i + 1] = this.currentParticleColor.g;
      colors[i + 2] = this.currentParticleColor.b;
    }
    this.particles.geometry.attributes.color.needsUpdate = true;
  }

  private updateParticles(volume: number): void {
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const sizes = this.particles.geometry.attributes.size.array as Float32Array;
    const time = this.clock.getElapsedTime();

    for (let i = 0; i < this.particleVelocities.length; i++) {
      const vel = this.particleVelocities[i];

      vel.multiplyScalar(0.96);

      const baseX = this.particleBasePositions[i * 3];
      const baseY = this.particleBasePositions[i * 3 + 1];
      const baseZ = this.particleBasePositions[i * 3 + 2];

      vel.x += (baseX - positions[i * 3]) * 0.002;
      vel.y += (baseY - positions[i * 3 + 1]) * 0.002;
      vel.z += (baseZ - positions[i * 3 + 2]) * 0.002;

      vel.x += Math.sin(time + i * 0.1) * 0.0005;
      vel.y += Math.cos(time + i * 0.15) * 0.0005;
      vel.z += Math.sin(time * 0.7 + i * 0.2) * 0.0005;

      positions[i * 3] += vel.x;
      positions[i * 3 + 1] += vel.y;
      positions[i * 3 + 2] += vel.z;

      sizes[i] = 0.02 + Math.random() * 0.08 + volume * 0.1;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;
    (this.particles.material as THREE.PointsMaterial).size = 0.08 + volume * 0.1;
  }

  private updateCubes(): void {
    const delta = this.clock.getDelta();

    this.cubes.forEach((cube, i) => {
      const state = this.cubeStates[i];
      const material = this.cubeMaterials[i];

      state.scale += (state.targetScale - state.scale) * 0.2;
      cube.scale.setScalar(state.scale);

      state.rotationSpeed += (state.targetRotationSpeed - state.rotationSpeed) * 0.05;
      cube.rotation.y += state.rotationSpeed * delta;
      cube.rotation.x += state.rotationSpeed * delta * 0.5;

      if (state.opacity > 0.5) {
        state.opacity -= delta * 2;
        if (state.opacity < 0.5) state.opacity = 0.5;
      }
      if (state.emissiveIntensity > 0.3) {
        state.emissiveIntensity -= delta * 4;
        if (state.emissiveIntensity < 0.3) state.emissiveIntensity = 0.3;
      }

      material.opacity = state.opacity;
      material.emissiveIntensity = state.emissiveIntensity;
    });
  }

  private updateCamera(volume: number): void {
    const time = this.clock.getElapsedTime();
    this.camera.position.x = Math.sin(time * 0.3) * 0.2 + volume * 0.3;
    this.camera.position.y = Math.cos(time * 0.2) * 0.15 - volume * 0.2;
    this.camera.lookAt(0, 0, 0);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  startAnimationLoop(updateCallback: (analysis: AudioAnalysis, triggers: SceneTrigger[]) => void): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      updateCallback(
        { volume: 0, averageFrequency: 0, frequencyData: new Uint8Array(), timeDomainData: new Float32Array() },
        []
      );
    };
    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.stopAnimationLoop();

    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();

    this.cubes.forEach(cube => {
      cube.geometry.dispose();
    });
    this.cubeMaterials.forEach(mat => mat.dispose());

    this.lights.forEach(light => light.dispose());

    this.renderer.dispose();
  }
}
