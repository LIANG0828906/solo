import * as THREE from 'three';

export interface RingInfo {
  name: string;
  mesh: THREE.Mesh;
  glowMesh?: THREE.Mesh;
  diameter: number;
  color: number;
  type: 'horizon' | 'equator' | 'ecliptic';
}

export class ArmillarySphere {
  public group: THREE.Group;
  public rings: RingInfo[] = [];
  public horizonRing!: RingInfo;
  public equatorRing!: RingInfo;
  public eclipticRing!: RingInfo;
  public eclipticGroup: THREE.Group;

  private tickness = 0.08;
  private selectedRing: RingInfo | null = null;
  private scanAngle = 0;

  constructor() {
    this.group = new THREE.Group();
    this.eclipticGroup = new THREE.Group();
    this.eclipticGroup.rotation.x = THREE.MathUtils.degToRad(23.5);
    this.group.add(this.eclipticGroup);
    this.build();
  }

  private build(): void {
    this.horizonRing = this.createRing(10, 0x2E8B57, 'horizon', '地平环');
    this.equatorRing = this.createRing(8, 0xCD853F, 'equator', '赤道环');
    this.eclipticRing = this.createRing(6, 0xDAA520, 'ecliptic', '黄道环');
    
    this.group.add(this.horizonRing.mesh);
    if (this.horizonRing.glowMesh) this.group.add(this.horizonRing.glowMesh);
    
    this.group.add(this.equatorRing.mesh);
    if (this.equatorRing.glowMesh) this.group.add(this.equatorRing.glowMesh);
    
    this.eclipticGroup.add(this.eclipticRing.mesh);
    if (this.eclipticRing.glowMesh) this.eclipticGroup.add(this.eclipticRing.glowMesh);
    
    this.addScaleMarks(this.horizonRing);
    this.addScaleMarks(this.equatorRing);
    this.addScaleMarks(this.eclipticRing);
    
    this.rings = [this.horizonRing, this.equatorRing, this.eclipticRing];
  }

  private createRing(diameter: number, color: number, type: 'horizon' | 'equator' | 'ecliptic', name: string): RingInfo {
    const radius = diameter / 2;
    
    const tubeGeometry = new THREE.TorusGeometry(radius, this.tickness / 2, 16, 128);
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.85,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.12
    });
    
    const mesh = new THREE.Mesh(tubeGeometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.userData = { type: 'ring', ringType: type, name };
    
    const glowGeometry = new THREE.TorusGeometry(radius + this.tickness * 0.8, this.tickness * 0.6, 16, 128);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.rotation.x = Math.PI / 2;
    glowMesh.visible = false;
    
    return { name, mesh, glowMesh, diameter, color, type };
  }

  private addScaleMarks(ring: RingInfo): void {
    const radius = ring.diameter / 2 + this.tickness * 0.6;
    const markGroup = new THREE.Group();
    
    const longLineGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.02);
    const shortLineGeometry = new THREE.BoxGeometry(0.015, 0.1, 0.02);
    
    const markMaterial = new THREE.MeshBasicMaterial({
      color: ring.color,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < 360; i += 10) {
      const isLong = i % 30 === 0;
      const geometry = isLong ? longLineGeometry : shortLineGeometry;
      const mark = new THREE.Mesh(geometry, markMaterial);
      
      const angle = THREE.MathUtils.degToRad(i);
      mark.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      mark.lookAt(0, 0, 0);
      mark.rotateZ(Math.PI / 2);
      
      markGroup.add(mark);
    }
    
    markGroup.rotation.x = Math.PI / 2;
    if (ring.type === 'ecliptic') {
      this.eclipticGroup.add(markGroup);
    } else {
      this.group.add(markGroup);
    }
  }

  public selectRing(ring: RingInfo | null): void {
    if (this.selectedRing?.glowMesh) {
      this.selectedRing.glowMesh.visible = false;
    }
    this.selectedRing = ring;
    if (ring?.glowMesh) {
      ring.glowMesh.visible = true;
    }
  }

  public getSelectedRing(): RingInfo | null {
    return this.selectedRing;
  }

  public update(delta: number, timeSpeed: number): void {
    this.scanAngle += delta * timeSpeed * Math.PI;
    
    this.rings.forEach(ring => {
      const material = ring.mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.12 + Math.sin(this.scanAngle * 0.5) * 0.03;
    });
    
    if (this.selectedRing?.glowMesh) {
      const glowMat = this.selectedRing.glowMesh.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.15 + Math.sin(this.scanAngle) * 0.1;
    }
  }

  public dispose(): void {
    this.rings.forEach(ring => {
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
      if (ring.glowMesh) {
        ring.glowMesh.geometry.dispose();
        (ring.glowMesh.material as THREE.Material).dispose();
      }
    });
  }
}
