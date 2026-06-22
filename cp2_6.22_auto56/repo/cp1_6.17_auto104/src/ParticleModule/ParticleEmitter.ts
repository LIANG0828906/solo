import {
  Points,
  ShaderMaterial,
  BufferGeometry,
  BufferAttribute,
  Vector3,
  Color,
  LineSegments,
  Float32BufferAttribute,
} from 'three';
import { Particle, BuildingBox, LightParams } from './types';

const vertexShader = `
  attribute float size;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    float innerGlow = smoothstep(1.0, 0.0, dist / 0.25);
    float outerGlow = smoothstep(1.0, 0.0, dist);
    
    vec3 innerColor = vColor * 1.5;
    vec3 outerColor = vColor * 0.2;
    
    vec3 finalColor = mix(outerColor, innerColor, innerGlow);
    float finalAlpha = (innerGlow * vAlpha + outerGlow * 0.2 * vAlpha);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export class ParticleEmitter {
  private pool: Particle[];
  private activeCount: number;
  private maxParticles: number = 3000;
  
  private points: Points;
  private geometry: BufferGeometry;
  private material: ShaderMaterial;
  
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  
  private trailGeometry: BufferGeometry;
  private trailMaterial: ShaderMaterial;
  private trailLines: LineSegments;
  private trailPositions: Float32Array;
  private trailColors: Float32Array;
  private maxTrailSegments: number = 3000;
  private trailCount: number = 0;
  private previousPositions: Vector3[];
  
  private tempColor: Color = new Color();
  private tempVector: Vector3 = new Vector3();
  
  constructor() {
    this.pool = [];
    this.activeCount = 0;
    this.previousPositions = [];
    
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        position: new Vector3(),
        velocity: new Vector3(),
        color: new Color(),
        baseColor: new Color(),
        size: 2 + Math.random() * 2,
        life: 0,
        maxLife: 5 + Math.random() * 10,
        alpha: 0,
        bounced: false,
        sourceType: 'building',
      });
      this.previousPositions.push(new Vector3());
    }
    
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.alphas = new Float32Array(this.maxParticles);
    
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('alpha', new BufferAttribute(this.alphas, 1));
    
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      blending: 2,
      depthWrite: false,
    });
    
    this.points = new Points(this.geometry, this.material);
    
    this.trailPositions = new Float32Array(this.maxTrailSegments * 6);
    this.trailColors = new Float32Array(this.maxTrailSegments * 6);
    
    this.trailGeometry = new BufferGeometry();
    this.trailGeometry.setAttribute('position', new Float32BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.setAttribute('color', new Float32BufferAttribute(this.trailColors, 3));
    
    this.trailMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = 0.3;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(vColor, vAlpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: 2,
      depthWrite: false,
    });
    
    this.trailLines = new LineSegments(this.trailGeometry, this.trailMaterial);
  }
  
  emit(
    sourceType: 'building' | 'advertisement' | 'streetLamp',
    position: Vector3,
    direction: Vector3,
    baseColor: Color
  ): void {
    if (this.activeCount >= this.maxParticles) return;
    
    const particle = this.pool[this.activeCount];
    
    particle.position.copy(position);
    particle.position.x += (Math.random() - 0.5) * 0.5;
    particle.position.y += (Math.random() - 0.5) * 0.5;
    particle.position.z += (Math.random() - 0.5) * 0.5;
    
    const spread = 0.5;
    particle.velocity.set(
      direction.x + (Math.random() - 0.5) * spread,
      direction.y + (Math.random() - 0.5) * spread + 0.2,
      direction.z + (Math.random() - 0.5) * spread
    ).normalize().multiplyScalar(0.5 + Math.random() * 1);
    
    particle.baseColor.copy(baseColor);
    particle.color.copy(baseColor);
    particle.size = 2 + Math.random() * 2;
    particle.maxLife = 5 + Math.random() * 10;
    particle.life = particle.maxLife;
    particle.alpha = 0.8 + Math.random() * 0.2;
    particle.bounced = false;
    particle.sourceType = sourceType;
    
    this.previousPositions[this.activeCount].copy(position);
    
    this.activeCount++;
  }
  
  update(
    deltaTime: number,
    buildingBoxes: BuildingBox[],
    lightParams: LightParams
  ): void {
    this.trailCount = 0;
    
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      
      this.previousPositions[i].copy(p.position);
      
      p.velocity.y -= lightParams.gravity * deltaTime;
      p.velocity.add(lightParams.windForce.clone().multiplyScalar(deltaTime));
      
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      
      for (const box of buildingBoxes) {
        if (this.checkCollision(p.position, box)) {
          this.resolveCollision(p, box, lightParams.bounceCoefficient);
          break;
        }
      }
      
      const lifeRatio = p.life / p.maxLife;
      this.tempColor.copy(p.baseColor).lerp(lightParams.ambientColor, 1 - lifeRatio);
      
      if (p.bounced) {
        this.tempColor.multiplyScalar(0.7).offsetHSL(0, 0, 0.1);
      }
      
      p.color.copy(this.tempColor);
      p.alpha = 0.8 * lifeRatio + 0.2;
      
      p.life -= deltaTime;
      
      if (p.life <= 0 || p.position.y < 0) {
        this.removeParticle(i);
        i--;
        continue;
      }
      
      if (this.trailCount < this.maxTrailSegments) {
        const prev = this.previousPositions[i];
        const curr = p.position;
        
        const ti = this.trailCount * 6;
        this.trailPositions[ti] = prev.x;
        this.trailPositions[ti + 1] = prev.y;
        this.trailPositions[ti + 2] = prev.z;
        this.trailPositions[ti + 3] = curr.x;
        this.trailPositions[ti + 4] = curr.y;
        this.trailPositions[ti + 5] = curr.z;
        
        this.trailColors[ti] = p.color.r;
        this.trailColors[ti + 1] = p.color.g;
        this.trailColors[ti + 2] = p.color.b;
        this.trailColors[ti + 3] = p.color.r * 0.5;
        this.trailColors[ti + 4] = p.color.g * 0.5;
        this.trailColors[ti + 5] = p.color.b * 0.5;
        
        this.trailCount++;
      }
      
      const pi = i * 3;
      this.positions[pi] = p.position.x;
      this.positions[pi + 1] = p.position.y;
      this.positions[pi + 2] = p.position.z;
      
      this.colors[pi] = p.color.r;
      this.colors[pi + 1] = p.color.g;
      this.colors[pi + 2] = p.color.b;
      
      this.sizes[i] = p.size;
      this.alphas[i] = p.alpha;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
    this.geometry.setDrawRange(0, this.activeCount);
    
    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.color.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, this.trailCount * 2);
  }
  
  private checkCollision(pos: Vector3, box: BuildingBox): boolean {
    return (
      pos.x >= box.minX && pos.x <= box.maxX &&
      pos.y >= box.minY && pos.y <= box.maxY &&
      pos.z >= box.minZ && pos.z <= box.maxZ
    );
  }
  
  private resolveCollision(
    p: Particle,
    box: BuildingBox,
    bounceCoefficient: number
  ): void {
    const centerX = (box.minX + box.maxX) / 2;
    const centerY = (box.minY + box.maxY) / 2;
    const centerZ = (box.minZ + box.maxZ) / 2;
    
    const dx = p.position.x - centerX;
    const dy = p.position.y - centerY;
    const dz = p.position.z - centerZ;
    
    const halfW = (box.maxX - box.minX) / 2;
    const halfH = (box.maxY - box.minY) / 2;
    const halfD = (box.maxZ - box.minZ) / 2;
    
    const overlapX = halfW - Math.abs(dx);
    const overlapY = halfH - Math.abs(dy);
    const overlapZ = halfD - Math.abs(dz);
    
    if (overlapX < overlapY && overlapX < overlapZ) {
      p.position.x = dx > 0 ? box.maxX : box.minX;
      p.velocity.x *= -bounceCoefficient;
    } else if (overlapY < overlapZ) {
      p.position.y = dy > 0 ? box.maxY : box.minY;
      p.velocity.y *= -bounceCoefficient;
    } else {
      p.position.z = dz > 0 ? box.maxZ : box.minZ;
      p.velocity.z *= -bounceCoefficient;
    }
    
    if (!p.bounced) {
      p.bounced = true;
    }
  }
  
  private removeParticle(index: number): void {
    if (index < this.activeCount - 1) {
      this.pool[index] = this.pool[this.activeCount - 1];
      this.previousPositions[index].copy(this.previousPositions[this.activeCount - 1]);
    }
    this.activeCount--;
  }
  
  getActiveParticles(): Particle[] {
    return this.pool.slice(0, this.activeCount);
  }
  
  getPoints(): Points {
    return this.points;
  }
  
  getTrailLines(): LineSegments {
    return this.trailLines;
  }
}
