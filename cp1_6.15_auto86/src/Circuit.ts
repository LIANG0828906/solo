import * as THREE from 'three';
import { CONFIG, Obstacle, EnergyRing, SteamCloud } from './types';

export class Circuit {
  private scene: THREE.Scene;
  private trackPoints: THREE.Vector3[] = [];
  private obstacles: Obstacle[] = [];
  private energyRings: EnergyRing[] = [];
  private steamClouds: SteamCloud[] = [];
  private trackGroup: THREE.Group = new THREE.Group();
  private startLinePosition: THREE.Vector3 = new THREE.Vector3();
  private startLineDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  generate(): void {
    this.generateTrackPoints();
    this.generateTrackMesh();
    this.generateFences();
    this.generateObstacles();
    this.generateEnergyRings();
    this.generateSteamClouds();
    this.scene.add(this.trackGroup);
  }

  private generateTrackPoints(): void {
    this.trackPoints = [];
    const radius = CONFIG.TRACK_PERIMETER / (2 * Math.PI);
    const segmentAngle = (2 * Math.PI) / CONFIG.TRACK_SEGMENTS;
    
    let currentAngle = 0;
    let currentHeight = 0;
    
    for (let i = 0; i <= CONFIG.TRACK_SEGMENTS; i++) {
      const curvatureOffset = (Math.random() - 0.5) * 2 * CONFIG.CURVATURE_VARIATION;
      const heightOffset = (Math.random() - 0.5) * 2 * CONFIG.HEIGHT_VARIATION;
      currentHeight = THREE.MathUtils.clamp(currentHeight + heightOffset, -CONFIG.HEIGHT_VARIATION, CONFIG.HEIGHT_VARIATION);
      
      const angle = currentAngle + curvatureOffset;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = currentHeight;
      
      this.trackPoints.push(new THREE.Vector3(x, y, z));
      currentAngle += segmentAngle;
    }
    
    this.startLinePosition.copy(this.trackPoints[0]);
    if (this.trackPoints.length > 1) {
      this.startLineDirection.subVectors(this.trackPoints[1], this.trackPoints[0]).normalize();
    }
  }

  private generateCheckerboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    const size = 32;
    for (let y = 0; y < 256; y += size) {
      for (let x = 0; x < 256; x += size) {
        const isLight = ((x / size) + (y / size)) % 2 === 0;
        ctx.fillStyle = isLight ? '#5a5a5a' : '#3a3a3a';
        ctx.fillRect(x, y, size, size);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 2);
    return texture;
  }

  private generateTrackMesh(): void {
    const curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    const trackGeometry = new THREE.TubeGeometry(curve, 200, CONFIG.TRACK_WIDTH / 2, 8, true);
    
    const trackTexture = this.generateCheckerboardTexture();
    const trackMaterial = new THREE.MeshStandardMaterial({
      map: trackTexture,
      roughness: 0.7,
      metalness: 0.3,
      color: CONFIG.COLORS.TRACK_METAL,
    });
    
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.receiveShadow = true;
    this.trackGroup.add(trackMesh);
  }

  private generateFences(): void {
    const curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    const fenceHeight = 1;
    const fenceGeometry = new THREE.BoxGeometry(0.5, fenceHeight, CONFIG.TRACK_PERIMETER / 100);
    
    const rustMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.FENCE_COPPER,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      const centerPoint = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      for (const side of [-1, 1]) {
        const fencePos = centerPoint.clone().add(normal.clone().multiplyScalar(side * CONFIG.TRACK_WIDTH / 2));
        fencePos.y += fenceHeight / 2;
        
        const fence = new THREE.Mesh(fenceGeometry, rustMaterial);
        fence.position.copy(fencePos);
        fence.lookAt(centerPoint);
        fence.rotateY(Math.PI / 2);
        fence.castShadow = true;
        fence.receiveShadow = true;
        this.trackGroup.add(fence);
      }
    }
  }

  private generateObstacles(): void {
    const curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    const spacing = 20;
    const count = Math.floor(CONFIG.TRACK_PERIMETER / spacing);
    
    for (let i = 1; i < count; i++) {
      const t = (i * spacing) / CONFIG.TRACK_PERIMETER;
      const centerPoint = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const side = Math.random() > 0.5 ? 1 : -1;
      const distance = CONFIG.TRACK_WIDTH / 2 + 2 + Math.random() * 3;
      const pos = centerPoint.clone().add(normal.clone().multiplyScalar(side * distance));
      
      const height = 2 + Math.random() * 4;
      pos.y += height / 2;
      
      const rockGeometry = new THREE.IcosahedronGeometry(height / 2, 0);
      const colorValue = THREE.MathUtils.lerp(
        CONFIG.COLORS.ROCK_MIN,
        CONFIG.COLORS.ROCK_MAX,
        Math.random()
      );
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: colorValue,
        roughness: 0.9,
        flatShading: true,
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.copy(pos);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.5, 1 + Math.random() * 0.3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      const bbox = new THREE.Box3().setFromObject(rock);
      
      this.obstacles.push({
        position: pos.clone(),
        boundingBox: bbox,
        mesh: rock,
      });
      
      this.trackGroup.add(rock);
    }
  }

  private generateEnergyRings(): void {
    const curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    const spacing = 30;
    const count = Math.floor(CONFIG.TRACK_PERIMETER / spacing);
    
    const ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.ENERGY_RING,
      emissive: CONFIG.COLORS.ENERGY_RING,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    
    for (let i = 0; i < count; i++) {
      const t = (i * spacing + 15) / CONFIG.TRACK_PERIMETER;
      const centerPoint = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(centerPoint);
      ring.position.y += 3;
      ring.lookAt(centerPoint.clone().add(tangent));
      ring.rotateX(Math.PI / 2);
      
      const bbox = new THREE.Box3().setFromObject(ring);
      
      this.energyRings.push({
        position: ring.position.clone(),
        rotation: 0,
        collected: false,
        mesh: ring,
        boundingBox: bbox,
      });
      
      this.trackGroup.add(ring);
    }
  }

  private generateSteamClouds(): void {
    const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.STEAM_CLOUD,
      transparent: true,
      opacity: 0.4,
      roughness: 1,
    });
    
    for (let i = 0; i < 15; i++) {
      const size = 8 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const radius = CONFIG.TRACK_PERIMETER / (2 * Math.PI) + 20 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 5 + Math.random() * 25;
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(x, y, z);
      cloud.scale.set(size, size * 0.6, size);
      
      this.steamClouds.push({
        position: cloud.position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.5
        ),
        mesh: cloud,
      });
      
      this.trackGroup.add(cloud);
    }
  }

  update(dt: number): void {
    this.energyRings.forEach(ring => {
      if (!ring.collected) {
        ring.rotation += 0.3 * dt * Math.PI * 2;
        ring.mesh.rotation.z = ring.rotation;
        ring.mesh.position.y = ring.position.y + Math.sin(Date.now() * 0.002) * 0.3;
        ring.boundingBox.setFromObject(ring.mesh);
      }
    });
    
    this.steamClouds.forEach(cloud => {
      cloud.position.add(cloud.velocity.clone().multiplyScalar(dt));
      cloud.mesh.position.copy(cloud.position);
      
      const centerDist = Math.sqrt(cloud.position.x ** 2 + cloud.position.z ** 2);
      const maxDist = CONFIG.TRACK_PERIMETER / Math.PI + 60;
      if (centerDist > maxDist) {
        cloud.velocity.negate();
      }
    });
  }

  getTrackPoints(): THREE.Vector3[] {
    return this.trackPoints;
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  getEnergyRings(): EnergyRing[] {
    return this.energyRings;
  }

  getStartLinePosition(): THREE.Vector3 {
    return this.startLinePosition.clone();
  }

  getStartLineDirection(): THREE.Vector3 {
    return this.startLineDirection.clone();
  }

  getTrackCurve(): THREE.CatmullRomCurve3 {
    return new THREE.CatmullRomCurve3(this.trackPoints, true);
  }

  resetEnergyRings(): void {
    this.energyRings.forEach(ring => {
      ring.collected = false;
      ring.mesh.visible = true;
    });
  }

  getProgressOnTrack(position: THREE.Vector3): number {
    const curve = this.getTrackCurve();
    let closestT = 0;
    let closestDist = Infinity;
    
    for (let t = 0; t <= 1; t += 0.005) {
      const point = curve.getPoint(t);
      const dist = position.distanceTo(point);
      if (dist < closestDist) {
        closestDist = dist;
        closestT = t;
      }
    }
    
    return closestT;
  }

  isOnTrack(position: THREE.Vector3): boolean {
    const curve = this.getTrackCurve();
    const t = this.getProgressOnTrack(position);
    const trackPoint = curve.getPoint(t);
    const dist = position.distanceTo(trackPoint);
    return dist < CONFIG.TRACK_WIDTH / 2 + 2;
  }

  getTrackHeightAt(position: THREE.Vector3): number {
    const curve = this.getTrackCurve();
    const t = this.getProgressOnTrack(position);
    const trackPoint = curve.getPoint(t);
    return trackPoint.y;
  }
}
