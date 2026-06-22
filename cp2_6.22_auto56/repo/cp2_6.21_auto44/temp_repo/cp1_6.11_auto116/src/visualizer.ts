import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer } from './audioAnalyzer';

export class Visualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  private centralSphere: THREE.Mesh;
  private particles: THREE.Points;
  private stars: THREE.Points;
  private particleCount = 5000;
  private starCount = 200;

  private particleBasePositions: Float32Array;
  private particleAngles: Float32Array;
  private particleRadii: Float32Array;
  private particleSpeeds: Float32Array;
  private particleColors: Float32Array;

  private starColors: Float32Array;

  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedHigh = 0;
  private smoothFactor = 0.15;

  private rotationSpeed = 0.01;
  private globalTime = 0;

  private clock: THREE.Clock;
  private readonly FIXED_DT = 1 / 60;
  private accumulator = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 45);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 80;
    this.controls.enablePan = false;

    this.centralSphere = this.createCentralSphere();
    this.scene.add(this.centralSphere);

    const particleData = this.createParticles();
    this.particles = particleData.points;
    this.particleBasePositions = particleData.basePositions;
    this.particleAngles = particleData.angles;
    this.particleRadii = particleData.radii;
    this.particleSpeeds = particleData.speeds;
    this.particleColors = particleData.colors;
    this.scene.add(this.particles);

    const starData = this.createStars();
    this.stars = starData.points;
    this.starColors = starData.colors;
    this.scene.add(this.stars);

    this.addLights();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private createCentralSphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(15, 30, 30);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00BFFF,
      transparent: true,
      opacity: 0.4,
      emissive: 0x004466,
      emissiveIntensity: 0.5,
      shininess: 100,
      side: THREE.DoubleSide,
      wireframe: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  private createParticles(): {
    points: THREE.Points;
    basePositions: Float32Array;
    angles: Float32Array;
    radii: Float32Array;
    speeds: Float32Array;
    colors: Float32Array;
  } {
    const positions = new Float32Array(this.particleCount * 3);
    const basePositions = new Float32Array(this.particleCount * 3);
    const angles = new Float32Array(this.particleCount);
    const radii = new Float32Array(this.particleCount);
    const speeds = new Float32Array(this.particleCount);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    const colorGreen = new THREE.Color(0x00FF7F);
    const colorOrange = new THREE.Color(0xFF8C00);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 12;
      const height = (Math.random() - 0.5) * 20;
      const speed = 0.3 + Math.random() * 0.7;

      angles[i] = angle;
      radii[i] = radius;
      speeds[i] = speed;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height + Math.sin(angle * 2) * 2;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      const t = Math.random();
      const color = new THREE.Color().lerpColors(colorGreen, colorOrange, t);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.45;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    return { points, basePositions, angles, radii, speeds, colors };
  }

  private createStars(): { points: THREE.Points; colors: Float32Array } {
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 150;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      colors[i3] = 1.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 1.0;

      sizes[i] = 0.1 + Math.random() * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    return { points, colors };
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00FFFF, 1, 100);
    pointLight1.position.set(30, 30, 30);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF69B4, 1, 100);
    pointLight2.position.set(-30, -30, 30);
    this.scene.add(pointLight2);
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private lerpColorHex(color1: number, color2: number, t: number): THREE.Color {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t);
  }

  update(audioAnalyzer: AudioAnalyzer): void {
    this.accumulator += this.clock.getDelta();

    while (this.accumulator >= this.FIXED_DT) {
      this.globalTime += this.FIXED_DT;
      this.fixedUpdate(audioAnalyzer);
      this.accumulator -= this.FIXED_DT;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private fixedUpdate(audioAnalyzer: AudioAnalyzer): void {
    const bass = audioAnalyzer.getBassEnergy();
    const mid = audioAnalyzer.getMidEnergy();
    const high = audioAnalyzer.getHighEnergy();

    this.smoothedBass += (bass - this.smoothedBass) * this.smoothFactor;
    this.smoothedMid += (mid - this.smoothedMid) * this.smoothFactor;
    this.smoothedHigh += (high - this.smoothedHigh) * this.smoothFactor;

    const scaleFactor = 0.8 + this.smoothedBass * 0.4;
    this.centralSphere.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const sphereColor = this.lerpColorHex(0x00BFFF, 0x8A2BE2, this.smoothedBass);
    const sphereMaterial = this.centralSphere.material as THREE.MeshPhongMaterial;
    sphereMaterial.color.copy(sphereColor);
    sphereMaterial.emissive.copy(sphereColor).multiplyScalar(0.3);
    sphereMaterial.emissiveIntensity = 0.3 + this.smoothedBass * 0.5;

    this.rotationSpeed = 0.01 + this.smoothedMid * 0.04;

    this.updateParticles();
    this.updateStars();
  }

  private updateParticles(): void {
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const colors = this.particles.geometry.attributes.color.array as Float32Array;
    const sizes = this.particles.geometry.attributes.size.array as Float32Array;

    const bassScale = 0.8 + this.smoothedBass * 0.4;
    const highJitter = this.smoothedHigh * 2;
    const saturationBoost = 0.5 + this.smoothedMid * 0.5;

    const colorGreen = new THREE.Color(0x00FF7F);
    const colorOrange = new THREE.Color(0xFF8C00);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      this.particleAngles[i] += this.rotationSpeed * this.particleSpeeds[i] * this.FIXED_DT * 60;

      const angle = this.particleAngles[i];
      const radius = this.particleRadii[i] * bassScale;
      const baseY = this.particleBasePositions[i3 + 1];

      const spiralOffset = Math.sin(this.globalTime * this.particleSpeeds[i] + angle) * 2;

      positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * highJitter;
      positions[i3 + 1] = baseY + spiralOffset + (Math.random() - 0.5) * highJitter;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * highJitter;

      const colorT = (Math.sin(angle * 0.5 + this.globalTime * 0.2) + 1) * 0.5;
      const mixedColor = new THREE.Color().lerpColors(colorGreen, colorOrange, colorT);
      const saturation = 0.6 + saturationBoost * 0.4;

      const hsl = { h: 0, s: 0, l: 0 };
      mixedColor.getHSL(hsl);
      hsl.s = Math.min(1, hsl.s * saturation);
      mixedColor.setHSL(hsl.h, hsl.s, hsl.l);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      sizes[i] = (0.05 + Math.random() * 0.01) * bassScale * 2;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;

    const particleMaterial = this.particles.material as THREE.PointsMaterial;
    particleMaterial.size = 0.3 + this.smoothedBass * 0.3;
  }

  private updateStars(): void {
    const colors = this.stars.geometry.attributes.color.array as Float32Array;
    const totalEnergy = (this.smoothedBass + this.smoothedMid + this.smoothedHigh) / 3;

    const isHighEnergy = totalEnergy > 0.4;

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;

      if (isHighEnergy) {
        const flicker = 0.6 + Math.sin(this.globalTime * 5 + i) * 0.4;
        colors[i3] = 0.8 * flicker;
        colors[i3 + 1] = 0.5 * flicker;
        colors[i3 + 2] = 1.0 * flicker;
      } else {
        const dim = 0.8 + Math.sin(this.globalTime * 0.5 + i) * 0.2;
        colors[i3] = 1.0 * dim;
        colors[i3 + 1] = 1.0 * dim;
        colors[i3 + 2] = 1.0 * dim;
      }
    }

    this.stars.geometry.attributes.color.needsUpdate = true;

    const starMaterial = this.stars.material as THREE.PointsMaterial;
    starMaterial.opacity = isHighEnergy ? 1.0 : 0.7;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));

    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
    this.centralSphere.geometry.dispose();
    (this.centralSphere.material as THREE.Material).dispose();
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();

    this.renderer.dispose();
    this.controls.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
