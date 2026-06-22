import * as THREE from 'three';

interface TunnelSegment {
  mesh: THREE.Mesh;
  startZ: number;
  length: number;
  radius: number;
}

export class Tunnel {
  private scene: THREE.Scene;
  private segments: TunnelSegment[] = [];
  private readonly segmentLength = 20;
  private readonly maxSegments = 3;
  
  private currentRadius = 10;
  private readonly minRadius = 7;
  private readonly tubeRadius = 1.5;
  
  private rotationAngle = 0;
  private readonly rotationSpeed = 0.3;
  
  private moveSpeed = 0.5;
  private readonly maxSpeed = 1.5;
  private totalDistance = 0;
  
  private texture: THREE.CanvasTexture | null = null;
  private sharedGeometry: THREE.TubeGeometry | null = null;
  
  private difficultyTimer = 0;
  
  private cameraOffsetZ = 5;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createTexture();
    this.createSharedGeometry();
    this.initializeSegments();
  }

  private createTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      const stripeCount = 24;
      
      for (let i = 0; i <= stripeCount; i++) {
        const t = i / stripeCount;
        const hue = 220 + t * 80;
        const lightness = 30 + Math.sin(t * Math.PI * 4) * 15;
        gradient.addColorStop(t, `hsl(${hue}, 80%, ${lightness}%)`);
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < stripeCount; i++) {
        const x = (i / stripeCount) * canvas.width;
        const alpha = 0.3 + Math.sin(i * 0.8) * 0.2;
        ctx.fillStyle = `rgba(150, 180, 255, ${alpha})`;
        ctx.fillRect(x, 0, 2, canvas.height);
      }
      
      this.texture = new THREE.CanvasTexture(canvas);
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.wrapT = THREE.RepeatWrapping;
      this.texture.repeat.set(4, 1);
    }
  }

  private createSharedGeometry(): void {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -this.segmentLength / 3),
      new THREE.Vector3(0, 0, -this.segmentLength * 2 / 3),
      new THREE.Vector3(0, 0, -this.segmentLength)
    ]);
    
    this.sharedGeometry = new THREE.TubeGeometry(
      curve,
      64,
      this.tubeRadius,
      32,
      false
    );
  }

  private createSegmentMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9
    });
  }

  private initializeSegments(): void {
    for (let i = 0; i < this.maxSegments; i++) {
      this.addSegment(-i * this.segmentLength);
    }
  }

  private addSegment(startZ: number): void {
    if (!this.sharedGeometry) return;
    
    const material = this.createSegmentMaterial();
    const mesh = new THREE.Mesh(this.sharedGeometry, material);
    mesh.position.z = startZ;
    
    const edgeGeometry = new THREE.EdgesGeometry(this.sharedGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x6688ff,
      transparent: true,
      opacity: 0.4
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    mesh.add(edges);
    
    this.scene.add(mesh);
    
    this.segments.push({
      mesh,
      startZ,
      length: this.segmentLength,
      radius: this.currentRadius
    });
    
    this.updateSegmentScale(mesh, this.currentRadius);
  }

  private updateSegmentScale(mesh: THREE.Mesh, radius: number): void {
    const scale = radius / 10;
    mesh.scale.set(scale, scale, 1);
  }

  getCameraPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, this.cameraOffsetZ);
  }

  getTunnelRadius(): number {
    return this.currentRadius;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  getRotationAngle(): number {
    return this.rotationAngle;
  }

  update(deltaTime: number, speedMultiplier: number): void {
    this.difficultyTimer += deltaTime;
    
    if (this.difficultyTimer > 5) {
      this.difficultyTimer = 0;
      if (this.moveSpeed < this.maxSpeed) {
        this.moveSpeed = Math.min(this.maxSpeed, this.moveSpeed + 0.1);
      }
      if (this.currentRadius > this.minRadius) {
        this.currentRadius = Math.max(this.minRadius, this.currentRadius - 0.3);
      }
    }
    
    this.rotationAngle += this.rotationSpeed * deltaTime;
    
    const moveDistance = this.moveSpeed * speedMultiplier * deltaTime * 60;
    this.totalDistance += moveDistance;
    
    for (const segment of this.segments) {
      segment.mesh.position.z += moveDistance;
      segment.mesh.rotation.z = this.rotationAngle;
    }
    
    if (this.segments.length > 0) {
      const firstSegment = this.segments[0];
      if (firstSegment.mesh.position.z > this.segmentLength) {
        this.removeSegment(firstSegment);
      }
    }
    
    if (this.segments.length > 0) {
      const lastSegment = this.segments[this.segments.length - 1];
      if (lastSegment.mesh.position.z > -this.segmentLength * (this.maxSegments - 1)) {
        const newStartZ = lastSegment.mesh.position.z - this.segmentLength;
        this.addSegment(newStartZ);
        
        for (const segment of this.segments) {
          this.updateSegmentScale(segment.mesh, this.currentRadius);
          segment.radius = this.currentRadius;
        }
      }
    }
  }

  private removeSegment(segment: TunnelSegment): void {
    const index = this.segments.indexOf(segment);
    if (index > -1) {
      this.scene.remove(segment.mesh);
      if (segment.mesh.material instanceof THREE.Material) {
        segment.mesh.material.dispose();
      }
      this.segments.splice(index, 1);
    }
  }

  getCurrentSpeed(): number {
    return this.moveSpeed;
  }

  getCurrentRadius(): number {
    return this.currentRadius;
  }

  reset(): void {
    for (const segment of this.segments) {
      this.scene.remove(segment.mesh);
      if (segment.mesh.material instanceof THREE.Material) {
        segment.mesh.material.dispose();
      }
    }
    this.segments = [];
    
    this.currentRadius = 10;
    this.moveSpeed = 0.5;
    this.rotationAngle = 0;
    this.totalDistance = 0;
    this.difficultyTimer = 0;
    
    this.initializeSegments();
  }

  dispose(): void {
    for (const segment of this.segments) {
      this.scene.remove(segment.mesh);
      if (segment.mesh.material instanceof THREE.Material) {
        segment.mesh.material.dispose();
      }
    }
    this.segments = [];
    
    if (this.sharedGeometry) {
      this.sharedGeometry.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
    }
  }
}
