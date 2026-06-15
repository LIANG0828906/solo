import * as THREE from 'three';

export interface PlanetConfig {
  radius: number;
  textureWidth: number;
  textureHeight: number;
}

export interface ImpactInfo {
  worldPosition: THREE.Vector3;
  radius: number;
  depth: number;
}

export class Planet {
  public mesh: THREE.Mesh;
  public texture: THREE.CanvasTexture;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImageData: ImageData;
  private config: PlanetConfig;

  private isDragging = false;
  private previousMouse = new THREE.Vector2();
  private rotationVelocity = new THREE.Vector2();
  private dampingFactor = 0.95;
  private dampingTime = 0.3;
  private dampingTimer = 0;

  constructor(config: PlanetConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.textureWidth;
    this.canvas.height = config.textureHeight;
    this.ctx = this.canvas.getContext('2d')!;

    this.generateTerrainTexture();
    this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.85,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
  }

  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const n00 = this.noise2D(ix, iy);
    const n10 = this.noise2D(ix + 1, iy);
    const n01 = this.noise2D(ix, iy + 1);
    const n11 = this.noise2D(ix + 1, iy + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;

    return nx0 * (1 - sy) + nx1 * sy;
  }

  private fbm(x: number, y: number, octaves: number = 5): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.smoothNoise(x * frequency, y * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  }

  private generateTerrainTexture(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imageData = this.ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = x / w * 4;
        const ny = y / h * 2;

        const elevation = this.fbm(nx, ny, 6);
        const moisture = this.fbm(nx + 100, ny + 100, 4);

        const lat = Math.abs((y / h) * 2 - 1);

        let r: number, g: number, b: number;

        if (lat > 0.85) {
          r = 240; g = 245; b = 250;
        } else if (elevation < 0.42) {
          const depth = (0.42 - elevation) / 0.42;
          r = Math.floor(20 + depth * 15);
          g = Math.floor(60 + depth * 40);
          b = Math.floor(120 + depth * 60);
        } else if (elevation < 0.48) {
          r = 194; g = 178; b = 128;
        } else if (elevation < 0.72) {
          if (moisture > 0.55) {
            r = Math.floor(34 + (elevation - 0.48) * 100);
            g = Math.floor(100 + (elevation - 0.48) * 150);
            b = Math.floor(34 + (elevation - 0.48) * 50);
          } else {
            r = Math.floor(120 + (elevation - 0.48) * 200);
            g = Math.floor(90 + (elevation - 0.48) * 100);
            b = Math.floor(50 + (elevation - 0.48) * 50);
          }
        } else if (elevation < 0.85) {
          r = Math.floor(100 + (elevation - 0.72) * 300);
          g = Math.floor(80 + (elevation - 0.72) * 200);
          b = Math.floor(60 + (elevation - 0.72) * 100);
        } else {
          const snowAmt = (elevation - 0.85) / 0.15;
          r = Math.floor(139 * (1 - snowAmt) + 245 * snowAmt);
          g = Math.floor(119 * (1 - snowAmt) + 246 * snowAmt);
          b = Math.floor(101 * (1 - snowAmt) + 250 * snowAmt);
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private worldToUV(position: THREE.Vector3): { u: number; v: number } {
    const normal = position.clone().normalize();
    const u = 0.5 + Math.atan2(normal.z, normal.x) / (2 * Math.PI);
    const v = 0.5 + Math.asin(normal.y) / Math.PI;
    return { u, v };
  }

  public addImpactCrater(impact: ImpactInfo): void {
    const { u, v } = this.worldToUV(impact.worldPosition);

    const w = this.canvas.width;
    const h = this.canvas.height;

    const centerX = u * w;
    const centerY = v * h;

    const planetCircumference = 2 * Math.PI * this.config.radius;
    const craterWorldRadius = impact.radius;
    const craterPixelRadius = (craterWorldRadius / planetCircumference) * w * 1.2;

    const craterPixelDepth = Math.min(80, impact.depth * 4);

    const radius = craterPixelRadius;

    const imageData = this.ctx.getImageData(
      Math.max(0, Math.floor(centerX - radius - 2)),
      Math.max(0, Math.floor(centerY - radius - 2)),
      Math.min(w, Math.ceil(radius * 2 + 4)),
      Math.min(h, Math.ceil(radius * 2 + 4))
    );

    const data = imageData.data;
    const ox = Math.max(0, Math.floor(centerX - radius - 2));
    const oy = Math.max(0, Math.floor(centerY - radius - 2));

    for (let py = 0; py < imageData.height; py++) {
      for (let px = 0; px < imageData.width; px++) {
        const dist = Math.sqrt((px + ox - centerX) ** 2 + (py + oy - centerY) ** 2);

        if (dist < radius) {
          const idx = (py * imageData.width + px) * 4;

          let darkenFactor: number;
          if (dist < radius * 0.3) {
            darkenFactor = 0.55 + (dist / (radius * 0.3)) * 0.15;
          } else if (dist < radius * 0.75) {
            const t = (dist - radius * 0.3) / (radius * 0.45);
            darkenFactor = 0.7 + (1 - t) * 0.25;
          } else {
            const t = (dist - radius * 0.75) / (radius * 0.25);
            darkenFactor = 0.35 + t * 0.65;
          }

          darkenFactor = Math.max(0.25, darkenFactor - craterPixelDepth / 200);

          data[idx] = Math.floor(data[idx] * darkenFactor);
          data[idx + 1] = Math.floor(data[idx + 1] * darkenFactor);
          data[idx + 2] = Math.floor(data[idx + 2] * (darkenFactor + 0.05));
        }
      }
    }

    this.ctx.putImageData(imageData, ox, oy);
    this.texture.needsUpdate = true;
  }

  public getSurfaceColorAt(position: THREE.Vector3): THREE.Color {
    const { u, v } = this.worldToUV(position);
    const x = Math.floor(u * this.canvas.width);
    const y = Math.floor(v * this.canvas.height);

    const clampedX = Math.max(0, Math.min(this.canvas.width - 1, x));
    const clampedY = Math.max(0, Math.min(this.canvas.height - 1, y));

    const pixel = this.ctx.getImageData(clampedX, clampedY, 1, 1).data;
    return new THREE.Color(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255);
  }

  public resetTexture(): void {
    this.ctx.putImageData(this.originalImageData, 0, 0);
    this.texture.needsUpdate = true;
  }

  public setupInteraction(domElement: HTMLElement, camera: THREE.Camera): void {
    domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    domElement.addEventListener('mouseup', () => this.onMouseUp());
    domElement.addEventListener('mouseleave', () => this.onMouseUp());
    domElement.addEventListener('wheel', (e) => this.onWheel(e, camera), { passive: false });
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.previousMouse.set(e.clientX, e.clientY);
    this.dampingTimer = 0;
    this.rotationVelocity.set(0, 0);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouse.x;
    const deltaY = e.clientY - this.previousMouse.y;

    const rotateSpeed = 0.005;
    this.mesh.rotation.y += deltaX * rotateSpeed;
    this.mesh.rotation.x += deltaY * rotateSpeed;
    this.mesh.rotation.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.mesh.rotation.x));

    this.rotationVelocity.set(deltaX * rotateSpeed, deltaY * rotateSpeed);
    this.previousMouse.set(e.clientX, e.clientY);
    this.dampingTimer = this.dampingTime;
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent, camera: THREE.Camera): void {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = e.deltaY * zoomSpeed;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.position.addScaledVector(direction, -delta * camera.position.length());

    const minDistance = this.config.radius * 2;
    const maxDistance = this.config.radius * 10;
    const currentDist = camera.position.length();

    if (currentDist < minDistance) {
      camera.position.setLength(minDistance);
    } else if (currentDist > maxDistance) {
      camera.position.setLength(maxDistance);
    }
  }

  public update(deltaTime: number): void {
    if (this.isDragging) return;

    if (this.dampingTimer > 0) {
      const dt = Math.min(deltaTime, this.dampingTimer);
      this.dampingTimer -= dt;

      const damping = Math.pow(this.dampingFactor, dt * 60);
      this.rotationVelocity.multiplyScalar(damping);

      this.mesh.rotation.y += this.rotationVelocity.x;
      this.mesh.rotation.x += this.rotationVelocity.y;
      this.mesh.rotation.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.mesh.rotation.x));

      if (this.rotationVelocity.length() < 0.0001) {
        this.dampingTimer = 0;
        this.rotationVelocity.set(0, 0);
      }
    }
  }
}
