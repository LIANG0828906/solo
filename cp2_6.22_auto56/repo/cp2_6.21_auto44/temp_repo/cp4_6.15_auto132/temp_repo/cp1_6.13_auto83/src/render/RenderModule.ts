import * as THREE from 'three';
import { KeyPress } from '../player/PlayerInputModule';

export interface PulseRing {
  id: number;
  player: number;
  position: THREE.Vector3;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
  createdAt: number;
  points: THREE.Points;
}

export interface ParticleEffect {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class RenderModule {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pulseRings: PulseRing[] = [];
  private particleEffects: ParticleEffect[] = [];
  private stars: THREE.Points;
  private pulseIdCounter: number = 0;
  private particleIdCounter: number = 0;
  private maxPulseRings: number = 30;
  
  private playerColors: THREE.Color[] = [
    new THREE.Color(0x00aaff),
    new THREE.Color(0xff6600)
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a, 1);

    this.createStars();
    this.setupLighting();
    this.setupEventListeners();
  }

  private createStars(): void {
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = (Math.random() - 0.5) * 200;
      positions[i3 + 2] = (Math.random() - 0.5) * 200;
      
      const color = new THREE.Color();
      color.setHSL(0.1 + Math.random() * 0.3, 0.3, 0.3 + Math.random() * 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00aaff, 1, 50);
    pointLight1.position.set(-10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6600, 1, 50);
    pointLight2.position.set(10, 10, 10);
    this.scene.add(pointLight2);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  createPulseRing(press: KeyPress): void {
    if (this.pulseRings.length >= this.maxPulseRings) {
      const oldest = this.pulseRings.shift();
      if (oldest) {
        this.scene.remove(oldest.points);
        oldest.points.geometry.dispose();
        (oldest.points.material as THREE.Material).dispose();
      }
    }

    const color = this.playerColors[press.player];
    const particleCount = 64;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const i3 = i * 3;
      positions[i3] = press.position.x;
      positions[i3 + 1] = press.position.y;
      positions[i3 + 2] = press.position.z;
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = 0.08 + Math.random() * 0.04;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uTime;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + sin(uTime * 5.0) * 0.2);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uTime;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha *= (1.0 - cos(uTime * 10.0) * 0.1);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.pulseRings.push({
      id: this.pulseIdCounter++,
      player: press.player,
      position: new THREE.Vector3(press.position.x, press.position.y, press.position.z),
      radius: 0.1,
      maxRadius: 12,
      speed: 0.35,
      opacity: 1,
      createdAt: performance.now(),
      points
    });

    this.createScatterParticles(press);
  }

  private createScatterParticles(press: KeyPress): void {
    const color = this.playerColors[press.player];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.5;
      
      this.particleEffects.push({
        id: this.particleIdCounter++,
        position: new THREE.Vector3(press.position.x, press.position.y, press.position.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * 0.5,
          Math.sin(angle) * speed
        ),
        life: 1,
        maxLife: 1,
        color: color.clone()
      });
    }
  }

  update(): void {
    const now = performance.now();

    this.stars.rotation.y += 0.0002;
    this.stars.rotation.x += 0.0001;

    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const pulse = this.pulseRings[i];
      
      pulse.radius += pulse.speed;
      pulse.opacity = 1 - (pulse.radius / pulse.maxRadius);
      
      if (pulse.radius >= pulse.maxRadius || pulse.opacity <= 0.01) {
        this.scene.remove(pulse.points);
        pulse.points.geometry.dispose();
        (pulse.points.material as THREE.ShaderMaterial).dispose();
        this.pulseRings.splice(i, 1);
        continue;
      }

      const positions = pulse.points.geometry.attributes.position.array as Float32Array;
      const particleCount = positions.length / 3;

      for (let j = 0; j < particleCount; j++) {
        const angle = (j / particleCount) * Math.PI * 2;
        const i3 = j * 3;
        positions[i3] = pulse.position.x + Math.cos(angle) * pulse.radius;
        positions[i3 + 1] = pulse.position.y + Math.sin(angle) * 0.1 * Math.sin(now * 0.005);
        positions[i3 + 2] = pulse.position.z + Math.sin(angle) * pulse.radius;
      }

      pulse.points.geometry.attributes.position.needsUpdate = true;
      
      const material = pulse.points.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = now * 0.001;
      material.opacity = pulse.opacity;
    }

    for (let i = this.particleEffects.length - 1; i >= 0; i--) {
      const particle = this.particleEffects[i];
      
      particle.position.add(particle.velocity);
      particle.velocity.y -= 0.02;
      particle.life -= 0.02;
      
      if (particle.life <= 0) {
        this.particleEffects.splice(i, 1);
      }
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getPulseRings(): PulseRing[] {
    return this.pulseRings;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    
    for (const pulse of this.pulseRings) {
      this.scene.remove(pulse.points);
      pulse.points.geometry.dispose();
      (pulse.points.material as THREE.Material).dispose();
    }
    
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
