import * as THREE from 'three';

const COLOR_BOTTOM = new THREE.Color(0x1a237e);
const COLOR_MIDDLE = new THREE.Color(0x7b1fa2);
const COLOR_TOP = new THREE.Color(0xf06292);
const MAX_PARTICLES = 15000;
const WAVE_AMPLITUDE = 1;
const WAVE_PERIOD = 3;
const DAMPING = 0.995;
const MAX_SPEED = 8;

export class ParticleSystem {
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  public count: number = 0;

  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private baseYs: Float32Array;
  private phases: Float32Array;
  private baseSizes: Float32Array;

  private texture: THREE.Texture;

  constructor() {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.baseYs = new Float32Array(MAX_PARTICLES);
    this.phases = new Float32Array(MAX_PARTICLES);
    this.baseSizes = new Float32Array(MAX_PARTICLES);

    this.texture = this.createParticleTexture();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.texture,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;

    this.initializeParticles(10000);
  }

  private createParticleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0,