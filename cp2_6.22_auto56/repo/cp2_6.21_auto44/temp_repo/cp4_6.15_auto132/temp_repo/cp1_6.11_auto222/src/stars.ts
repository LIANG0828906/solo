import * as THREE from 'three';

export interface ConstellationStar {
  name: string;
  mansion: string;
  position: THREE.Vector3;
  baseMagnitude: number;
  color: number;
}

export interface Mansion {
  name: string;
  direction: 'east' | 'south' | 'west' | 'north';
  color: number;
  angle: number;
  marker: THREE.Mesh;
  glowMesh: THREE.Mesh;
  stars: ConstellationStar[];
}

const MANSIONS_DATA = [
  { name: '角宿', direction: 'east' as const },
  { name: '亢宿', direction: 'east' as const },
  { name: '氐宿', direction: 'east' as const },
  { name: '房宿', direction: 'east' as const },
  { name: '心宿', direction: 'east' as const },
  { name: '尾宿', direction: 'east' as const },
  { name: '箕宿', direction: 'east' as const },
  { name: '斗宿', direction: 'north' as const },
  { name: '牛宿', direction: 'north' as const },
  { name: '女宿', direction: 'north' as const },
  { name: '虚宿', direction: 'north' as const },
  { name: '危宿', direction: 'north' as const },
  { name: '室宿', direction: 'north' as const },
  { name: '壁宿', direction: 'north' as const },
  { name: '奎宿', direction: 'west' as const },
  { name: '娄宿', direction: 'west' as const },
  { name: '胃宿', direction: 'west' as const },
  { name: '昴宿', direction: 'west' as const },
  { name: '毕宿', direction: 'west' as const },
  { name: '觜宿', direction: 'west' as const },
  { name: '参宿', direction: 'west' as const },
  { name: '井宿', direction: 'south' as const },
  { name: '鬼宿', direction: 'south' as const },
  { name: '柳宿', direction: 'south' as const },
  { name: '星宿', direction: 'south' as const },
  { name: '张宿', direction: 'south' as const },
  { name: '翼宿', direction: 'south' as const },
  { name: '轸宿', direction: 'south' as const },
];

const DIRECTION_COLORS = {
  east: 0x00FF7F,
  south: 0xFF4500,
  west: 0xF5F5F5,
  north: 0x9370DB
};

export class StarField {
  public group: THREE.Group;
  public mansions: Mansion[] = [];
  public backgroundStars: THREE.Points;
  
  private equatorRadius = 3.7;
  private selectedMansion: Mansion | null = null;
  private scanAngle = 0;
  
  private positions: Float32Array;
  private colors: Float32Array;
  private bgPositions: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    
    const bgResult = this.createBackgroundStars();
    this.backgroundStars = bgResult.points;
    this.bgPositions = bgResult.positions;
    this.group.add(this.backgroundStars);
    
    const result = this.createMansions();
    this.positions = result.positions;
    this.colors = result.colors;
  }

  private createBackgroundStars(): { points: THREE.Points; positions: Float32Array } {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const bgRadius = 50;
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = bgRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = bgRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = bgRadius * Math.cos(phi);
      
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = (0.02 + Math.random() * 0.03) * 10;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    const points = new THREE.Points(geometry, material);
    return { points, positions };
  }

  private createMansions(): { positions: Float32Array; colors: Float32Array } {
    const starCount = 28;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    MANSIONS_DATA.forEach((data, index) => {
      const angle = (index / 28) * Math.PI * 2 - Math.PI / 2;
      const color = DIRECTION_COLORS[data.direction];
      
      const markerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      const x = Math.cos(angle) * this.equatorRadius;
      const z = Math.sin(angle) * this.equatorRadius;
      
      marker.position.set(x, 0, z);
      marker.userData = { 
        type: 'mansion', 
        name: data.name,
        index,
        angle,
        color,
        direction: data.direction
      };
      
      const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(marker.position);
      glowMesh.visible = false;
      
      const mansion: Mansion = {
        name: data.name,
        direction: data.direction,
        color,
        angle,
        marker,
        glowMesh,
        stars: []
      };
      
      this.mansions.push(mansion);
      this.group.add(marker);
      this.group.add(glowMesh);
      
      positions[index * 3] = x;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = z;
      
      const colorObj = new THREE.Color(color);
      colors[index * 3] = colorObj.r;
      colors[index * 3 + 1] = colorObj.g;
      colors[index * 3 + 2] = colorObj.b;
    });
    
    return { positions, colors };
  }

  public selectMansion(mansion: Mansion | null): void {
    if (this.selectedMansion) {
      this.selectedMansion.glowMesh.visible = false;
    }
    this.selectedMansion = mansion;
    if (mansion) {
      mansion.glowMesh.visible = true;
    }
  }

  public getSelectedMansion(): Mansion | null {
    return this.selectedMansion;
  }

  public getMansionInfo(mansion: Mansion): { lon: number; lat: number; mag: number } {
    const lon = THREE.MathUtils.radToDeg(mansion.angle);
    const normalizedLon = ((lon % 360) + 360) % 360;
    return {
      lon: normalizedLon,
      lat: 0,
      mag: 1.2 + Math.sin(this.scanAngle * 0.3 + mansion.angle) * 0.2
    };
  }

  public update(delta: number, timeSpeed: number, currentTime: number): void {
    this.scanAngle += delta * timeSpeed;
    
    this.mansions.forEach((mansion, index) => {
      const pulse = 0.9 + Math.sin(this.scanAngle * 2 + index * 0.5) * 0.1;
      const material = mansion.marker.material as THREE.MeshBasicMaterial;
      material.opacity = 0.7 + pulse * 0.3;
      
      const scale = 1 + Math.sin(this.scanAngle * 0.5 + index * 0.3) * 0.05;
      mansion.marker.scale.setScalar(scale);
      
      if (mansion.glowMesh.visible) {
        const glowMat = mansion.glowMesh.material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.3 + Math.sin(this.scanAngle * 2) * 0.2;
        mansion.glowMesh.scale.setScalar(1 + Math.sin(this.scanAngle) * 0.2);
      }
    });
  }

  public dispose(): void {
    this.backgroundStars.geometry.dispose();
    (this.backgroundStars.material as THREE.Material).dispose();
    
    this.mansions.forEach(mansion => {
      mansion.marker.geometry.dispose();
      (mansion.marker.material as THREE.Material).dispose();
      mansion.glowMesh.geometry.dispose();
      (mansion.glowMesh.material as THREE.Material).dispose();
    });
  }
}
