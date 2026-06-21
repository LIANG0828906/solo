import * as THREE from 'three';
import { AudioData } from './AudioAnalyzer';

export interface ColorGradient {
  name: string;
  start: THREE.Color;
  end: THREE.Color;
}

export const COLOR_GRADIENTS: ColorGradient[] = [
  { name: '蓝红渐变', start: new THREE.Color(0x0066ff), end: new THREE.Color(0xff3300) },
  { name: '绿紫渐变', start: new THREE.Color(0x00ff66), end: new THREE.Color(0x9933ff) },
  { name: '橙青渐变', start: new THREE.Color(0xff8800), end: new THREE.Color(0x00ffff) },
  { name: '黑白渐变', start: new THREE.Color(0xffffff), end: new THREE.Color(0x222222) }
];

export type ParticleShape = 'point' | 'cube';

export interface ParticleSystemOptions {
  particleCount: number;
  radius: number;
  shape?: ParticleShape;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleCount: number;
  private radius: number;
  private shape: ParticleShape;
  
  private positions: Float32Array;
  private basePositions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private brownianOffsets: Float32Array;
  private brownianSpeed: Float32Array;
  
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial | THREE.MeshBasicMaterial;
  private points: THREE.Points | THREE.InstancedMesh;
  
  private currentGradient: ColorGradient;
  private targetGradient: ColorGradient;
  private gradientTransitionProgress: number;
  private isTransitioningGradient: boolean;
  
  private currentLowEnergy: number;
  private currentMidEnergy: number;
  private currentHighEnergy: number;
  private targetLowEnergy: number;
  private targetMidEnergy: number;
  private targetHighEnergy: number;
  
  private rotationAngle: number;
  private particleSize: number;
  private rotationSpeedMultiplier: number;
  
  private time: number;
  private smoothingFactor: number;
  
  private starField: THREE.Points;
  
  private dummy: THREE.Object3D;
  private instancedColors: Float32Array;

  constructor(scene: THREE.Scene, options: ParticleSystemOptions) {
    this.scene = scene;
    this.particleCount = options.particleCount;
    this.radius = options.radius;
    this.shape = options.shape || 'point';
    
    this.positions = new Float32Array(this.particleCount * 3);
    this.basePositions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.brownianOffsets = new Float32Array(this.particleCount * 3);
    this.brownianSpeed = new Float32Array(this.particleCount);
    
    this.currentGradient = COLOR_GRADIENTS[0];
    this.targetGradient = COLOR_GRADIENTS[0];
    this.gradientTransitionProgress = 1;
    this.isTransitioningGradient = false;
    
    this.currentLowEnergy = 0;
    this.currentMidEnergy = 0;
    this.currentHighEnergy = 0;
    this.targetLowEnergy = 0;
    this.targetMidEnergy = 0;
    this.targetHighEnergy = 0;
    
    this.rotationAngle = 0;
    this.particleSize = 3;
    this.rotationSpeedMultiplier = 1.0;
    
    this.time = 0;
    this.smoothingFactor = 0.2;
    
    this.dummy = new THREE.Object3D();
    this.instancedColors = new Float32Array(this.particleCount * 3);
    
    this.initializeParticlePositions();
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();
    this.points = this.createParticleSystem();
    
    this.starField = this.createStarField();
    
    this.scene.add(this.points);
    this.scene.add(this.starField);
  }

  private initializeParticlePositions(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * this.radius;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;
      
      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;
      
      const gradientPos = Math.random();
      this.colors[i3] = this.lerp(this.currentGradient.start.r, this.currentGradient.end.r, gradientPos);
      this.colors[i3 + 1] = this.lerp(this.currentGradient.start.g, this.currentGradient.end.g, gradientPos);
      this.colors[i3 + 2] = this.lerp(this.currentGradient.start.b, this.currentGradient.end.b, gradientPos);
      
      this.sizes[i] = 1;
      
      this.brownianOffsets[i3] = Math.random() * 1000;
      this.brownianOffsets[i3 + 1] = Math.random() * 1000;
      this.brownianOffsets[i3 + 2] = Math.random() * 1000;
      
      this.brownianSpeed[i] = 0.5 + Math.random() * 0.5;
    }
  }

  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    return geometry;
  }

  private createMaterial(): THREE.PointsMaterial | THREE.MeshBasicMaterial {
    if (this.shape === 'point') {
      return new THREE.PointsMaterial({
        size: this.particleSize * 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
      });
    } else {
      return new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9
      });
    }
  }

  private createParticleSystem(): THREE.Points | THREE.InstancedMesh {
    if (this.shape === 'point') {
      return new THREE.Points(this.geometry, this.material as THREE.PointsMaterial);
    } else {
      const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const instancedMesh = new THREE.InstancedMesh(
        cubeGeometry,
        this.material as THREE.MeshBasicMaterial,
        this.particleCount
      );
      
      instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(this.particleCount * 3), 3
      );
      
      for (let i = 0; i < this.particleCount; i++) {
        this.dummy.position.set(
          this.positions[i * 3],
          this.positions[i * 3 + 1],
          this.positions[i * 3 + 2]
        );
        this.dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, this.dummy.matrix);
        
        instancedMesh.instanceColor.setXYZ(
          i,
          this.colors[i * 3],
          this.colors[i * 3 + 1],
          this.colors[i * 3 + 2]
        );
      }
      
      instancedMesh.instanceColor.needsUpdate = true;
      return instancedMesh;
    }
  }

  private createStarField(): THREE.Points {
    const starCount = 500;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starOpacities = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);
      
      starSizes[i] = 0.1 + Math.random() * 0.2;
      starOpacities[i] = 0.3 + Math.random() * 0.7;
    }
    
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.userData.opacities = starOpacities;
    stars.userData.twinkleSpeed = new Float32Array(starCount).map(() => 0.5 + Math.random() * 1.5);
    
    return stars;
  }

  update(deltaTime: number, audioData: AudioData): void {
    this.time += deltaTime;
    
    this.targetLowEnergy = audioData.lowFrequency;
    this.targetMidEnergy = audioData.midFrequency;
    this.targetHighEnergy = audioData.highFrequency;
    
    const smoothing = 1 - Math.pow(0.01, deltaTime / this.smoothingFactor);
    this.currentLowEnergy = this.lerp(this.currentLowEnergy, this.targetLowEnergy, smoothing);
    this.currentMidEnergy = this.lerp(this.currentMidEnergy, this.targetMidEnergy, smoothing);
    this.currentHighEnergy = this.lerp(this.currentHighEnergy, this.targetHighEnergy, smoothing);
    
    if (this.isTransitioningGradient) {
      this.gradientTransitionProgress += deltaTime / 0.5;
      if (this.gradientTransitionProgress >= 1) {
        this.gradientTransitionProgress = 1;
        this.isTransitioningGradient = false;
        this.currentGradient = this.targetGradient;
      }
    }
    
    const rotationSpeed = this.currentMidEnergy * 5 * this.rotationSpeedMultiplier;
    this.rotationAngle += rotationSpeed * deltaTime;
    
    this.updateParticles(deltaTime);
    this.updateStarField(deltaTime);
  }

  private updateParticles(_deltaTime: number): void {
    const waveAmplitude = this.currentLowEnergy * 2;
    const highFreqColorShift = this.currentHighEnergy;
    const colorChangeSpeed = 1 + highFreqColorShift * 3;
    const hasAudio = this.currentLowEnergy + this.currentMidEnergy + this.currentHighEnergy > 0.01;
    
    const gradientStart = this.isTransitioningGradient
      ? this.lerpColor(this.currentGradient.start, this.targetGradient.start, this.gradientTransitionProgress)
      : this.currentGradient.start;
    const gradientEnd = this.isTransitioningGradient
      ? this.lerpColor(this.currentGradient.end, this.targetGradient.end, this.gradientTransitionProgress)
      : this.currentGradient.end;

    if (this.shape === 'point') {
      const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute;

      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        
        const baseX = this.basePositions[i3];
        const baseY = this.basePositions[i3 + 1];
        const baseZ = this.basePositions[i3 + 2];
        
        const brownianX = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3])) * 0.01;
        const brownianY = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3 + 1])) * 0.01;
        const brownianZ = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3 + 2])) * 0.01;
        
        const distFromCenter = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
        const normalizedDist = distFromCenter / this.radius;
        
        const waveOffset = Math.sin(this.time * 3 + normalizedDist * 5) * waveAmplitude;
        
        const cos = Math.cos(this.rotationAngle);
        const sin = Math.sin(this.rotationAngle);
        const rotatedX = baseX * cos - baseZ * sin;
        const rotatedZ = baseX * sin + baseZ * cos;
        
        const finalX = rotatedX + brownianX;
        const finalY = baseY + (hasAudio ? waveOffset : 0) + brownianY;
        const finalZ = rotatedZ + brownianZ;
        
        positionAttr.array[i3] = finalX;
        positionAttr.array[i3 + 1] = finalY;
        positionAttr.array[i3 + 2] = finalZ;
        
        const colorPhase = (normalizedDist + this.time * 0.1 * colorChangeSpeed) % 1;
        const highFreqModulation = Math.sin(this.time * 5 + normalizedDist * 10) * highFreqColorShift * 0.3;
        const finalColorPos = Math.max(0, Math.min(1, colorPhase + highFreqModulation));
        
        colorAttr.array[i3] = this.lerp(gradientStart.r, gradientEnd.r, finalColorPos);
        colorAttr.array[i3 + 1] = this.lerp(gradientStart.g, gradientEnd.g, finalColorPos);
        colorAttr.array[i3 + 2] = this.lerp(gradientStart.b, gradientEnd.b, finalColorPos);
        
        const sizeModulation = 1 + this.currentAmplitude() * 0.5;
        sizeAttr.array[i] = this.particleSize * sizeModulation;
      }
      
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      
      (this.material as THREE.PointsMaterial).size = this.particleSize * 0.1;
    } else {
      const instancedMesh = this.points as THREE.InstancedMesh;
      
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        
        const baseX = this.basePositions[i3];
        const baseY = this.basePositions[i3 + 1];
        const baseZ = this.basePositions[i3 + 2];
        
        const brownianX = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3])) * 0.01;
        const brownianY = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3 + 1])) * 0.01;
        const brownianZ = (Math.sin(this.time * this.brownianSpeed[i] + this.brownianOffsets[i3 + 2])) * 0.01;
        
        const distFromCenter = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
        const normalizedDist = distFromCenter / this.radius;
        
        const waveOffset = Math.sin(this.time * 3 + normalizedDist * 5) * waveAmplitude;
        
        const cos = Math.cos(this.rotationAngle);
        const sin = Math.sin(this.rotationAngle);
        const rotatedX = baseX * cos - baseZ * sin;
        const rotatedZ = baseX * sin + baseZ * cos;
        
        const finalX = rotatedX + brownianX;
        const finalY = baseY + (hasAudio ? waveOffset : 0) + brownianY;
        const finalZ = rotatedZ + brownianZ;
        
        const sizeModulation = 1 + this.currentAmplitude() * 0.5;
        const finalSize = this.particleSize * 0.1 * sizeModulation;
        
        this.dummy.position.set(finalX, finalY, finalZ);
        this.dummy.scale.set(finalSize, finalSize, finalSize);
        this.dummy.rotation.y = this.rotationAngle + i * 0.01;
        this.dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, this.dummy.matrix);
        
        const colorPhase = (normalizedDist + this.time * 0.1 * colorChangeSpeed) % 1;
        const highFreqModulation = Math.sin(this.time * 5 + normalizedDist * 10) * highFreqColorShift * 0.3;
        const finalColorPos = Math.max(0, Math.min(1, colorPhase + highFreqModulation));
        
        this.instancedColors[i3] = this.lerp(gradientStart.r, gradientEnd.r, finalColorPos);
        this.instancedColors[i3 + 1] = this.lerp(gradientStart.g, gradientEnd.g, finalColorPos);
        this.instancedColors[i3 + 2] = this.lerp(gradientStart.b, gradientEnd.b, finalColorPos);
        
        instancedMesh.instanceColor!.setXYZ(
          i,
          this.instancedColors[i3],
          this.instancedColors[i3 + 1],
          this.instancedColors[i3 + 2]
        );
      }
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.instanceColor!.needsUpdate = true;
    }
  }

  private updateStarField(deltaTime: number): void {
    const material = this.starField.material as THREE.PointsMaterial;
    const opacities = this.starField.userData.opacities as Float32Array;
    const twinkleSpeeds = this.starField.userData.twinkleSpeed as Float32Array;
    
    const avgOpacity = opacities.reduce((sum, op, i) => {
      const twinkle = Math.sin(this.time * twinkleSpeeds[i]) * 0.3 + 0.7;
      return sum + op * twinkle;
    }, 0) / opacities.length;
    
    material.opacity = 0.4 + avgOpacity * 0.2;
    
    this.starField.rotation.y += deltaTime * 0.01;
  }

  setParticleSize(size: number): void {
    this.particleSize = size;
  }

  setRotationSpeedMultiplier(multiplier: number): void {
    this.rotationSpeedMultiplier = multiplier;
  }

  setColorGradient(gradientIndex: number): void {
    if (gradientIndex >= 0 && gradientIndex < COLOR_GRADIENTS.length) {
      this.targetGradient = COLOR_GRADIENTS[gradientIndex];
      this.gradientTransitionProgress = 0;
      this.isTransitioningGradient = true;
    }
  }

  setShape(shape: ParticleShape): void {
    if (this.shape === shape) return;
    
    this.scene.remove(this.points);
    if (this.points instanceof THREE.InstancedMesh) {
      this.points.geometry.dispose();
    }
    this.material.dispose();
    
    this.shape = shape;
    this.material = this.createMaterial();
    this.points = this.createParticleSystem();
    this.scene.add(this.points);
  }

  getCurrentGradientIndex(): number {
    return COLOR_GRADIENTS.findIndex(g => g.name === this.targetGradient.name);
  }

  getCurrentHighEnergy(): number {
    return this.currentHighEnergy;
  }

  private currentAmplitude(): number {
    return (this.currentLowEnergy + this.currentMidEnergy + this.currentHighEnergy) / 3;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
    return new THREE.Color(
      this.lerp(a.r, b.r, t),
      this.lerp(a.g, b.g, t),
      this.lerp(a.b, b.b, t)
    );
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.starField.geometry.dispose();
    (this.starField.material as THREE.Material).dispose();
    if (this.points instanceof THREE.InstancedMesh) {
      this.points.geometry.dispose();
    }
  }
}
