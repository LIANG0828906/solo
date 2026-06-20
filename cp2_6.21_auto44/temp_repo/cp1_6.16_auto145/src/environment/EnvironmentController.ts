import * as THREE from 'three';
import { useStore, EnvironmentState } from '../store/useStore';

export class EnvironmentController {
  private scene: THREE.Scene;
  private oceanSurface: THREE.Mesh | null = null;
  private seaFloor: THREE.Mesh | null = null;
  private planktonParticles: THREE.Points | null = null;
  private planktonVelocities: Float32Array = new Float32Array();
  private causticLight: THREE.SpotLight | null = null;
  private causticTexture: THREE.Texture | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initEnvironment();
  }

  private initEnvironment(): void {
    this.createSeaFloor();
    this.createOceanSurface();
    this.createPlanktonParticles();
    this.createLights();
    this.createCausticEffect();
  }

  private createSeaFloor(): void {
    const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const noise = this.perlinNoise(x * 0.08, y * 0.08) * 2.5 + 
                    this.perlinNoise(x * 0.25, y * 0.25) * 0.8 +
                    this.perlinNoise(x * 0.5, y * 0.5) * 0.3;
      positions.setZ(i, noise);
    }
    
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x3E2723,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
      vertexColors: true,
    });

    const colors = new Float32Array(positions.count * 3);
    const colorDeep = new THREE.Color(0x2E1B0F);
    const colorMid = new THREE.Color(0x5D4037);
    const colorLight = new THREE.Color(0x8D6E63);
    const colorGray = new THREE.Color(0x607D8B);
    
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      const distFromCenter = Math.sqrt(
        positions.getX(i) ** 2 + positions.getY(i) ** 2
      );
      
      let color: THREE.Color;
      if (z < -1) {
        color = colorDeep.clone().lerp(colorMid, (z + 2) / 1);
      } else if (z < 1) {
        color = colorMid.clone().lerp(colorLight, (z + 1) / 2);
      } else {
        color = colorLight.clone().lerp(colorGray, Math.min(1, (z - 1) / 2));
      }
      
      const depthFactor = Math.min(1, distFromCenter / 40);
      color.lerp(new THREE.Color(0x1a1a2e), depthFactor * 0.3);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.seaFloor = new THREE.Mesh(geometry, material);
    this.seaFloor.rotation.x = -Math.PI / 2;
    this.seaFloor.position.y = -5;
    this.seaFloor.receiveShadow = true;
    this.seaFloor.name = 'seaFloor';
    this.scene.add(this.seaFloor);
  }

  private perlinNoise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    const aa = this.hash(X + this.hash(Y));
    const ab = this.hash(X + this.hash(Y + 1));
    const ba = this.hash(X + 1 + this.hash(Y));
    const bb = this.hash(X + 1 + this.hash(Y + 1));
    
    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    
    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private hash(n: number): number {
    return ((n * 2654435761) % 256 + 256) % 256;
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private createOceanSurface(): void {
    const geometry = new THREE.PlaneGeometry(120, 120, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2980b9,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      shininess: 150,
      specular: 0x88ccff,
    });

    this.oceanSurface = new THREE.Mesh(geometry, material);
    this.oceanSurface.position.y = 5;
    this.oceanSurface.rotation.x = Math.PI / 2;
    this.scene.add(this.oceanSurface);

    const foamGeometry = new THREE.PlaneGeometry(120, 120, 64, 64);
    const foamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const foam = new THREE.Mesh(foamGeometry, foamMaterial);
    foam.position.y = 5.1;
    foam.rotation.x = Math.PI / 2;
    foam.name = 'oceanFoam';
    this.scene.add(foam);
  }

  private createPlanktonParticles(): void {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.planktonVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = -5 + Math.random() * 8;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      this.planktonVelocities[i * 3] = (Math.random() - 0.5) * 0.01;
      this.planktonVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      this.planktonVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.planktonParticles = new THREE.Points(geometry, material);
    this.scene.add(this.planktonParticles);
  }

  private createLights(): void {
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3e2723, 0.6);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.scene.add(this.directionalLight);

    const ambientLight = new THREE.AmbientLight(0x6080a0, 0.5);
    this.scene.add(ambientLight);
  }

  private createCausticEffect(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    this.causticTexture = new THREE.CanvasTexture(canvas);
    this.causticTexture.wrapS = THREE.RepeatWrapping;
    this.causticTexture.wrapT = THREE.RepeatWrapping;

    this.causticLight = new THREE.SpotLight(0xffffff, 0.5, 100, Math.PI / 4, 0.5);
    this.causticLight.position.set(0, 20, 0);
    this.causticLight.target.position.set(0, -5, 0);
    this.causticLight.castShadow = true;
    this.scene.add(this.causticLight);
    this.scene.add(this.causticLight.target);
  }

  private updateCausticTexture(time: number): void {
    if (!this.causticTexture) return;
    
    const canvas = this.causticTexture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 512, 512);
    
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
    
    ctx.fillStyle = gradient;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.1;
      const radius = 80 + Math.sin(time * 0.5 + i) * 40;
      const x = 256 + Math.cos(angle) * radius;
      const y = 256 + Math.sin(angle) * radius;
      const size = 30 + Math.sin(time * 0.8 + i * 2) * 15;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    this.causticTexture.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    const env = useStore.getState().environment;

    if (this.oceanSurface) {
      const positions = this.oceanSurface.geometry.attributes.position;
      const originalPositions = (this.oceanSurface.geometry as any)._originalPositions;
      
      if (!originalPositions) {
        (this.oceanSurface.geometry as any)._originalPositions = 
          new Float32Array(positions.array);
        return;
      }
      
      const orig = (this.oceanSurface.geometry as any)._originalPositions;
      
      for (let i = 0; i < positions.count; i++) {
        const x = orig[i * 3];
        const z = orig[i * 3 + 2];
        
        const wave1 = Math.sin(x * 0.2 + this.time * 0.5) * 0.2;
        const wave2 = Math.sin(z * 0.15 + this.time * 0.3) * 0.15;
        const wave3 = Math.sin((x + z) * 0.1 + this.time * 0.4) * 0.1;
        
        positions.setY(i, wave1 + wave2 + wave3);
      }
      
      positions.needsUpdate = true;
      this.oceanSurface.geometry.computeVertexNormals();
    }

    if (this.planktonParticles && this.planktonVelocities.length > 0) {
      const positions = this.planktonParticles.geometry.attributes.position;
      const posArray = positions.array as Float32Array;
      
      for (let i = 0; i < positions.count; i++) {
        posArray[i * 3] += this.planktonVelocities[i * 3] * env.currentStrength;
        posArray[i * 3 + 1] += this.planktonVelocities[i * 3 + 1];
        posArray[i * 3 + 2] += this.planktonVelocities[i * 3 + 2] * env.currentStrength;

        posArray[i * 3] += env.currentDirection.x * 0.02 * env.currentStrength;
        posArray[i * 3 + 2] += env.currentDirection.z * 0.02 * env.currentStrength;

        const dist = Math.sqrt(
          posArray[i * 3] ** 2 + 
          posArray[i * 3 + 2] ** 2
        );
        
        if (dist > 45) {
          const angle = Math.atan2(posArray[i * 3 + 2], posArray[i * 3]);
          posArray[i * 3] = -Math.cos(angle) * 45;
          posArray[i * 3 + 2] = -Math.sin(angle) * 45;
        }
        
        if (posArray[i * 3 + 1] > 3 || posArray[i * 3 + 1] < -4.5) {
          this.planktonVelocities[i * 3 + 1] *= -1;
        }
      }
      
      positions.needsUpdate = true;
    }

    if (this.directionalLight) {
      this.directionalLight.intensity = 0.5 + env.lightIntensity * 0.3;
      this.directionalLight.position.set(
        env.lightDirection.x * 20,
        20 + env.lightDirection.y * 10,
        env.lightDirection.z * 20
      );
    }

    if (this.causticLight) {
      this.causticLight.intensity = 0.3 * env.lightIntensity;
      this.causticLight.rotation.y = this.time * 0.1;
      this.updateCausticTexture(this.time);
    }

    useStore.getState().updateTime(deltaTime);
  }

  public getUniforms(): { [key: string]: THREE.IUniform } {
    const env = useStore.getState().environment;
    return {
      uTime: { value: this.time },
      uCurrentStrength: { value: env.currentStrength },
      uCurrentDirection: { value: new THREE.Vector2(env.currentDirection.x, env.currentDirection.z) },
      uWaterTemperature: { value: env.waterTemperature },
      uLightIntensity: { value: env.lightIntensity },
      uCausticTexture: { value: this.causticTexture },
    };
  }

  public getEnvironment(): EnvironmentState {
    return useStore.getState().environment;
  }

  public getSeaFloor(): THREE.Mesh | null {
    return this.seaFloor;
  }

  public dispose(): void {
    if (this.seaFloor) {
      this.seaFloor.geometry.dispose();
      (this.seaFloor.material as THREE.Material).dispose();
    }
    if (this.oceanSurface) {
      this.oceanSurface.geometry.dispose();
      (this.oceanSurface.material as THREE.Material).dispose();
    }
    if (this.planktonParticles) {
      this.planktonParticles.geometry.dispose();
      (this.planktonParticles.material as THREE.Material).dispose();
    }
    if (this.causticTexture) {
      this.causticTexture.dispose();
    }
  }
}
