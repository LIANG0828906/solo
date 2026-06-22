import * as THREE from 'three';

export interface GalaxyParams {
  particleCount: number;
  mass: number;
  radius: number;
  armCount: number;
  position: THREE.Vector3;
  rotationSpeed: number;
  colorScheme?: 'blue' | 'red' | 'mixed';
}

export interface StarData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  originalPosition: THREE.Vector3;
  color: THREE.Color;
  size: number;
  starType: 'blue' | 'red' | 'mainSequence';
  mass: number;
}

export class Galaxy {
  public particles: THREE.Points;
  public stars: StarData[] = [];
  public center: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass: number;
  public radius: number;
  public particleCount: number;
  public coreGlow: THREE.Mesh;
  public heatmapMesh: THREE.Mesh;
  public heatmapCanvas: HTMLCanvasElement;
  public heatmapIntensity: number = 0.5;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  constructor(params: GalaxyParams) {
    this.center = params.position.clone();
    this.velocity = new THREE.Vector3();
    this.mass = params.mass;
    this.radius = params.radius;
    this.particleCount = params.particleCount;

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.position.copy(this.center);

    this.coreGlow = this.createCoreGlow();
    this.particles.add(this.coreGlow);

    this.heatmapCanvas = document.createElement('canvas');
    this.heatmapCanvas.width = 128;
    this.heatmapCanvas.height = 128;
    this.heatmapMesh = this.createHeatmap();
    this.particles.add(this.heatmapMesh);

    this.generateStars(params);
    this.updateGeometry();
  }

  private createCoreGlow(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.radius * 0.15, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x6699ff) },
        intensity: { value: 2.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float distance = length(vPosition) / 30.0;
          float glow = pow(1.0 - distance, 2.0);
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          vec3 color = glowColor * (glow * intensity + fresnel * 0.5);
          float alpha = min(1.0, glow + fresnel * 0.3);
          gl_FragColor = vec4(color, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  private createHeatmap(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.radius * 2.5, this.radius * 2.5, 1, 1);
    const texture = new THREE.CanvasTexture(this.heatmapCanvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -5;
    return mesh;
  }

  private generateStars(params: GalaxyParams): void {
    const { particleCount, radius, armCount, rotationSpeed, colorScheme = 'mixed' } = params;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radiusFactor = Math.pow(Math.random(), 0.6);
      const r = radius * radiusFactor;
      
      const armAngle = (i % armCount) / armCount * Math.PI * 2;
      const spiralAngle = armAngle + r / radius * 2.5;
      
      const scatter = (Math.random() - 0.5) * 0.4 * (1 - radiusFactor * 0.5);
      const angle = spiralAngle + scatter;
      
      const x = Math.cos(angle) * r * (1 + scatter * 0.3);
      const z = Math.sin(angle) * r * (1 + scatter * 0.3);
      const y = (Math.random() - 0.5) * radius * 0.15 * (1 - radiusFactor * 0.7);

      const starType = this.getStarType(radiusFactor);
      const color = this.getStarColor(starType, colorScheme);
      const size = this.getStarSize(starType);
      const starMass = this.getStarMass(starType);

      const speed = rotationSpeed * Math.sqrt(radius) * (1 - radiusFactor * 0.3);
      const velocity = new THREE.Vector3(
        -Math.sin(angle) * speed,
        (Math.random() - 0.5) * 0.1,
        Math.cos(angle) * speed
      );

      const position = new THREE.Vector3(x, y, z);
      
      this.stars.push({
        position: position.clone(),
        velocity,
        originalPosition: position.clone(),
        color,
        size,
        starType,
        mass: starMass
      });

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = size;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }

  private getStarType(radiusFactor: number): 'blue' | 'red' | 'mainSequence' {
    const rand = Math.random();
    if (radiusFactor < 0.3) {
      if (rand < 0.15) return 'blue';
      if (rand < 0.35) return 'red';
      return 'mainSequence';
    } else if (radiusFactor < 0.6) {
      if (rand < 0.08) return 'blue';
      if (rand < 0.2) return 'red';
      return 'mainSequence';
    } else {
      if (rand < 0.05) return 'blue';
      if (rand < 0.15) return 'red';
      return 'mainSequence';
    }
  }

  private getStarColor(type: string, colorScheme: string): THREE.Color {
    switch (type) {
      case 'blue':
        return new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.9, 0.7 + Math.random() * 0.2);
      case 'red':
        return new THREE.Color().setHSL(0.02 + Math.random() * 0.05, 0.9, 0.6 + Math.random() * 0.2);
      case 'mainSequence':
      default:
        if (colorScheme === 'blue') {
          return new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.6, 0.5 + Math.random() * 0.3);
        } else if (colorScheme === 'red') {
          return new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 0.7, 0.5 + Math.random() * 0.3);
        } else {
          const t = Math.random();
          if (t < 0.5) {
            return new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.5, 0.5 + Math.random() * 0.3);
          } else {
            return new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 0.6, 0.55 + Math.random() * 0.25);
          }
        }
    }
  }

  private getStarSize(type: string): number {
    switch (type) {
      case 'blue':
        return 2.5 + Math.random() * 2;
      case 'red':
        return 3 + Math.random() * 2.5;
      case 'mainSequence':
      default:
        return 1 + Math.random() * 1.5;
    }
  }

  private getStarMass(type: string): number {
    switch (type) {
      case 'blue':
        return 2.5 + Math.random() * 2;
      case 'red':
        return 1.5 + Math.random() * 1.5;
      case 'mainSequence':
      default:
        return 0.5 + Math.random() * 1;
    }
  }

  public updateGeometry(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      positions[i * 3] = star.position.x;
      positions[i * 3 + 1] = star.position.y;
      positions[i * 3 + 2] = star.position.z;

      colors[i * 3] = star.color.r;
      colors[i * 3 + 1] = star.color.g;
      colors[i * 3 + 2] = star.color.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    this.particles.position.copy(this.center);
  }

  public updateHeatmap(): void {
    const ctx = this.heatmapCanvas.getContext('2d')!;
    const width = this.heatmapCanvas.width;
    const height = this.heatmapCanvas.height;

    ctx.clearRect(0, 0, width, height);

    const gridSize = 32;
    const densityGrid = new Float32Array(gridSize * gridSize);
    const halfRadius = this.radius;

    for (const star of this.stars) {
      const relX = (star.position.x + halfRadius) / (halfRadius * 2);
      const relZ = (star.position.z + halfRadius) / (halfRadius * 2);
      
      const gridX = Math.floor(relX * gridSize);
      const gridZ = Math.floor(relZ * gridSize);
      
      if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
        densityGrid[gridZ * gridSize + gridX] += star.mass;
      }
    }

    let maxDensity = 0;
    for (let i = 0; i < densityGrid.length; i++) {
      maxDensity = Math.max(maxDensity, densityGrid[i]);
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gx = Math.floor((x / width) * gridSize);
        const gy = Math.floor((y / height) * gridSize);
        const idx = gy * gridSize + gx;
        
        const density = densityGrid[idx] / maxDensity;
        const pixelIdx = (y * width + x) * 4;
        
        const heatIntensity = Math.pow(density, 0.7) * this.heatmapIntensity;
        
        if (heatIntensity > 0.01) {
          const r = Math.min(255, Math.floor(heatIntensity * 255 * 2));
          const g = Math.min(255, Math.floor(heatIntensity * 150));
          const b = Math.floor(heatIntensity * 50);
          const a = Math.floor(heatIntensity * 200);
          
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = a;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    const material = this.heatmapMesh.material as THREE.MeshBasicMaterial;
    const texture = material.map as THREE.CanvasTexture;
    texture.needsUpdate = true;
  }

  public calculateKineticEnergy(): number {
    let ke = 0;
    for (const star of this.stars) {
      const v = star.velocity.length();
      ke += 0.5 * star.mass * v * v;
    }
    return ke;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    if (this.coreGlow.material instanceof THREE.Material) {
      this.coreGlow.material.dispose();
    }
    this.coreGlow.geometry.dispose();
    this.heatmapMesh.geometry.dispose();
    if (this.heatmapMesh.material instanceof THREE.Material) {
      this.heatmapMesh.material.dispose();
    }
  }
}
