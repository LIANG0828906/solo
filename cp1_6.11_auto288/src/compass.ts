import * as THREE from 'three';

export interface CompassData {
  angle: number;
  mountainDirection: string;
  gua: string;
  guaName: string;
  guaElement: string;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const GUA_DATA = [
  { name: '乾', fullName: '乾天', element: '金', color: 0xF0F0F0, startAngle: 315, endAngle: 360, elementDirection: '西北' },
  { name: '乾', fullName: '乾天', element: '金', color: 0xF0F0F0, startAngle: 0, endAngle: 45, elementDirection: '西北' },
  { name: '艮', fullName: '艮山', element: '土', color: 0x8B5A2B, startAngle: 45, endAngle: 90, elementDirection: '东北' },
  { name: '震', fullName: '震雷', element: '木', color: 0x2E8B57, startAngle: 90, endAngle: 135, elementDirection: '东' },
  { name: '巽', fullName: '巽风', element: '木', color: 0x6A9FB5, startAngle: 135, endAngle: 180, elementDirection: '东南' },
  { name: '离', fullName: '离火', element: '火', color: 0xFF4500, startAngle: 180, endAngle: 225, elementDirection: '南' },
  { name: '坤', fullName: '坤地', element: '土', color: 0xC2B280, startAngle: 225, endAngle: 270, elementDirection: '西南' },
  { name: '兑', fullName: '兑泽', element: '金', color: 0xA9A9A9, startAngle: 270, endAngle: 315, elementDirection: '西' }
];

const MOUNTAIN_NAMES = [
  '壬', '子', '癸',
  '丑', '艮', '寅',
  '甲', '卯', '乙',
  '辰', '巽', '巳',
  '丙', '午', '丁',
  '未', '坤', '申',
  '庚', '酉', '辛',
  '戌', '乾', '亥'
];

const MOUNTAIN_DIRECTIONS: Record<string, string> = {
  '子午': '子午向', '壬丙': '壬丙向', '癸丁': '癸丁向',
  '丑未': '丑未向', '艮坤': '艮坤向', '寅申': '寅申向',
  '甲庚': '甲庚向', '卯酉': '卯酉向', '乙辛': '乙辛向',
  '辰戌': '辰戌向', '巽乾': '巽乾向', '巳亥': '巳亥向'
};

export class Compass {
  private scene: THREE.Scene;
  public group: THREE.Group;
  public compassRingGroup: THREE.Group;
  private pointerGroup: THREE.Group;
  private baguaMirror: THREE.Mesh;
  
  private particles: Particle[] = [];
  private maxParticles = 50;
  private lastParticleAngle = 0;
  
  public currentAngle = 180;
  private isDragging = false;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private pointerMesh: THREE.Mesh;
  
  private radius = 60;
  private pointerLength = 20;
  
  public onAngleChange?: (data: CompassData) => void;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.compassRingGroup = new THREE.Group();
    this.pointerGroup = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.baguaMirror = this.createBaguaMirror();
    this.group.add(this.baguaMirror);
    
    this.createCompassFace();
    this.createTwentyFourMountains();
    this.createTickMarks();
    this.createPointer();
    
    this.group.add(this.compassRingGroup);
    this.group.add(this.pointerGroup);
    
    this.pointerMesh = this.createPointerHitArea();
    this.pointerGroup.add(this.pointerMesh);
    
    this.setAngle(this.currentAngle, true);
  }
  
  private createBaguaMirror(): THREE.Mesh {
    const outerRadius = this.radius + 10;
    const geometry = new THREE.RingGeometry(outerRadius - 3, outerRadius, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6B4226,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const frame = new THREE.Mesh(geometry, material);
    frame.rotation.x = -Math.PI / 2;
    frame.position.y = -0.5;
    
    const innerGeometry = new THREE.CircleGeometry(outerRadius - 3, 64);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xB8860B,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.6
    });
    const mirror = new THREE.Mesh(innerGeometry, innerMaterial);
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -0.3;
    
    const group = new THREE.Group();
    group.add(frame);
    group.add(mirror);
    return group as unknown as THREE.Mesh;
  }
  
  private createCompassFace(): void {
    const baseGeometry = new THREE.CylinderGeometry(this.radius, this.radius, 2, 64);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2C1810,
      roughness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0;
    this.compassRingGroup.add(base);
    
    const faceGeometry = new THREE.CylinderGeometry(this.radius - 1, this.radius - 1, 0.1, 64);
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5E6B8,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.y = 1.05;
    this.compassRingGroup.add(face);
    
    const goldRingGeometry = new THREE.TorusGeometry(this.radius - 2, 0.8, 16, 64);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.2,
      metalness: 0.9
    });
    const goldRing = new THREE.Mesh(goldRingGeometry, goldMaterial);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 1.1;
    this.compassRingGroup.add(goldRing);
    
    this.createBaguaSectors();
    this.createCenterCircle();
  }
  
  private createBaguaSectors(): void {
    const sectorAngle = (Math.PI * 2) / 8;
    const innerRadius = 12;
    const outerRadius = this.radius - 4;
    
    const sectors = [
      { name: '乾', color: 0xF0F0F0, symbol: '☰' },
      { name: '艮', color: 0x8B5A2B, symbol: '☶' },
      { name: '坎', color: 0x1E90FF, symbol: '☵' },
      { name: '震', color: 0x2E8B57, symbol: '☳' },
      { name: '巽', color: 0x6A9FB5, symbol: '☴' },
      { name: '离', color: 0xFF4500, symbol: '☲' },
      { name: '坤', color: 0xC2B280, symbol: '☷' },
      { name: '兑', color: 0xA9A9A9, symbol: '☱' }
    ];
    
    for (let i = 0; i < 8; i++) {
      const startAngle = i * sectorAngle - Math.PI / 2;
      const endAngle = startAngle + sectorAngle;
      const midAngle = startAngle + sectorAngle / 2;
      
      const shape = new THREE.Shape();
      shape.moveTo(
        innerRadius * Math.cos(startAngle),
        innerRadius * Math.sin(startAngle)
      );
      shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
      shape.lineTo(
        innerRadius * Math.cos(endAngle),
        innerRadius * Math.sin(endAngle)
      );
      shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshStandardMaterial({
        color: sectors[i].color,
        roughness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const sector = new THREE.Mesh(geometry, material);
      sector.rotation.x = -Math.PI / 2;
      sector.position.y = 1.12;
      this.compassRingGroup.add(sector);
      
      const divGeometry = new THREE.BoxGeometry(0.3, 0.2, outerRadius - innerRadius);
      const divMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        roughness: 0.3,
        metalness: 0.8
      });
      const divider = new THREE.Mesh(divGeometry, divMaterial);
      divider.rotation.z = -startAngle;
      divider.rotation.x = -Math.PI / 2;
      const divR = (innerRadius + outerRadius) / 2;
      divider.position.set(
        divR * Math.cos(startAngle),
        1.2,
        divR * Math.sin(startAngle)
      );
      this.compassRingGroup.add(divider);
      
      const labelR = (innerRadius + outerRadius) / 2;
      this.createTextLabel(
        sectors[i].name,
        labelR * Math.cos(midAngle),
        1.25,
        labelR * Math.sin(midAngle),
        0x2C1810,
        5,
        midAngle + Math.PI / 2
      );
    }
  }
  
  private createTwentyFourMountains(): void {
    const count = 24;
    const sectorAngle = (Math.PI * 2) / count;
    const innerRadius = this.radius - 14;
    const outerRadius = this.radius - 4;
    
    for (let i = 0; i < count; i++) {
      const startAngle = i * sectorAngle - Math.PI / 2;
      const endAngle = startAngle + sectorAngle;
      const midAngle = startAngle + sectorAngle / 2;
      
      const isHeavenly = i % 3 === 0;
      const isEarthly = i % 3 === 1;
      
      let fillColor = 0xF5E6B8;
      if (isHeavenly) fillColor = 0x90EE90;
      else if (isEarthly) fillColor = 0xFFD700;
      else fillColor = 0xFF6B6B;
      
      const shape = new THREE.Shape();
      shape.moveTo(
        innerRadius * Math.cos(startAngle),
        innerRadius * Math.sin(startAngle)
      );
      shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
      shape.lineTo(
        innerRadius * Math.cos(endAngle),
        innerRadius * Math.sin(endAngle)
      );
      shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshStandardMaterial({
        color: fillColor,
        roughness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const sector = new THREE.Mesh(geometry, material);
      sector.rotation.x = -Math.PI / 2;
      sector.position.y = 1.13;
      this.compassRingGroup.add(sector);
      
      const labelR = (innerRadius + outerRadius) / 2 + 2;
      this.createTextLabel(
        MOUNTAIN_NAMES[i],
        labelR * Math.cos(midAngle),
        1.3,
        labelR * Math.sin(midAngle),
        0x2C1810,
        4,
        midAngle + Math.PI / 2
      );
    }
  }
  
  private createTickMarks(): void {
    const outerR = this.radius - 4;
    const innerR = this.radius - 6;
    
    for (let i = 0; i < 360; i++) {
      const angle = (i * Math.PI) / 180 - Math.PI / 2;
      const isMajor = i % 15 === 0;
      const isMid = i % 5 === 0;
      
      let r1 = outerR;
      let r2 = isMajor ? outerR - 5 : isMid ? outerR - 3 : outerR - 1.5;
      if (r2 < innerR) r2 = innerR;
      
      const points = [
        new THREE.Vector3(r1 * Math.cos(angle), 1.22, r1 * Math.sin(angle)),
        new THREE.Vector3(r2 * Math.cos(angle), 1.22, r2 * Math.sin(angle))
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: isMajor ? 0xD4AF37 : 0x8B6914,
        linewidth: isMajor ? 3 : 1
      });
      const line = new THREE.Line(geometry, material);
      this.compassRingGroup.add(line);
    }
  }
  
  private createCenterCircle(): void {
    const geometry = new THREE.CircleGeometry(10, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 1.2;
    this.compassRingGroup.add(circle);
    
    const innerGeometry = new THREE.CircleGeometry(7, 64);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5E6B8,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.position.y = 1.25;
    this.compassRingGroup.add(innerCircle);
    
    const taijiRadius = 6;
    const taijiGeom = new THREE.CircleGeometry(taijiRadius, 64);
    const taijiMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const taiji = new THREE.Mesh(taijiGeom, taijiMat);
    taiji.rotation.x = -Math.PI / 2;
    taiji.position.y = 1.26;
    this.compassRingGroup.add(taiji);
    
    this.createTaijiDetail(taijiRadius, 1.27);
  }
  
  private createTaijiDetail(radius: number, y: number): void {
    const halfGeom = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI);
    const halfMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide
    });
    const whiteHalf = new THREE.Mesh(halfGeom, halfMat);
    whiteHalf.rotation.x = -Math.PI / 2;
    whiteHalf.rotation.y = Math.PI;
    whiteHalf.position.y = y;
    whiteHalf.scale.set(1, 1, 0.01);
    this.compassRingGroup.add(whiteHalf);
    
    const smallWhiteGeom = new THREE.CircleGeometry(radius / 2, 32);
    const smallWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide
    });
    const smallWhite = new THREE.Mesh(smallWhiteGeom, smallWhiteMat);
    smallWhite.rotation.x = -Math.PI / 2;
    smallWhite.position.set(0, y + 0.01, -radius / 2);
    this.compassRingGroup.add(smallWhite);
    
    const smallBlackGeom = new THREE.CircleGeometry(radius / 2, 32);
    const smallBlackMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      side: THREE.DoubleSide
    });
    const smallBlack = new THREE.Mesh(smallBlackGeom, smallBlackMat);
    smallBlack.rotation.x = -Math.PI / 2;
    smallBlack.position.set(0, y + 0.01, radius / 2);
    this.compassRingGroup.add(smallBlack);
    
    const dotWhiteGeom = new THREE.CircleGeometry(radius / 6, 16);
    const dotWhite = new THREE.Mesh(dotWhiteGeom, smallBlackMat);
    dotWhite.rotation.x = -Math.PI / 2;
    dotWhite.position.set(0, y + 0.02, -radius / 2);
    this.compassRingGroup.add(dotWhite);
    
    const dotBlackGeom = new THREE.CircleGeometry(radius / 6, 16);
    const dotBlack = new THREE.Mesh(dotBlackGeom, smallWhiteMat);
    dotBlack.rotation.x = -Math.PI / 2;
    dotBlack.position.set(0, y + 0.02, radius / 2);
    this.compassRingGroup.add(dotBlack);
  }
  
  private createTextLabel(
    text: string,
    x: number,
    y: number,
    z: number,
    color: number,
    size: number,
    rotation: number = 0
  ): void {
    const canvas = document.createElement('canvas');
    const canvasSize = 256;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = `bold ${Math.floor(canvasSize * 0.6)}px 'Noto Serif SC', 'KaiTi', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasSize / 2, canvasSize / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -rotation;
    this.compassRingGroup.add(mesh);
  }
  
  private createPointer(): void {
    const arrowShape = new THREE.Shape();
    const len = this.pointerLength;
    const tailWidth = 3;
    const tipWidth = 0;
    const headLen = 8;
    const headWidth = 6;
    
    arrowShape.moveTo(0, -tailWidth / 2);
    arrowShape.lineTo(len - headLen, -tailWidth / 2);
    arrowShape.lineTo(len - headLen, -headWidth / 2);
    arrowShape.lineTo(len, tipWidth);
    arrowShape.lineTo(len - headLen, headWidth / 2);
    arrowShape.lineTo(len - headLen, tailWidth / 2);
    arrowShape.lineTo(0, tailWidth / 2);
    arrowShape.lineTo(0, -tailWidth / 2);
    
    const geometry = new THREE.ShapeGeometry(arrowShape);
    const material = new THREE.MeshStandardMaterial({
      color: 0xCC0000,
      roughness: 0.3,
      metalness: 0.5,
      side: THREE.DoubleSide,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
    
    const arrow = new THREE.Mesh(geometry, material);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.y = 1.5;
    this.pointerGroup.add(arrow);
    
    const edgeGeom = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x8B0000, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeom, edgeMat);
    edges.rotation.x = -Math.PI / 2;
    edges.position.y = 1.51;
    this.pointerGroup.add(edges);
    
    const pivotGeom = new THREE.CylinderGeometry(4, 4, 1.2, 32);
    const pivotMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.2,
      metalness: 0.95
    });
    const pivot = new THREE.Mesh(pivotGeom, pivotMat);
    pivot.position.y = 2;
    this.pointerGroup.add(pivot);
    
    const pivotCapGeom = new THREE.SphereGeometry(3, 16, 16);
    const pivotCap = new THREE.Mesh(pivotCapGeom, pivotMat);
    pivotCap.position.y = 2.8;
    pivotCap.scale.set(1, 0.5, 1);
    this.pointerGroup.add(pivotCap);
    
    const tailGeom = new THREE.CircleGeometry(4, 32);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.9
    });
    const tail = new THREE.Mesh(tailGeom, tailMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 1.51, 0);
    this.pointerGroup.add(tail);
  }
  
  private createPointerHitArea(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.pointerLength + 20, this.pointerLength + 20);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 1.6;
    return mesh;
  }
  
  public setAngle(angle: number, silent: boolean = false): void {
    this.currentAngle = ((angle % 360) + 360) % 360;
    const angleRad = (this.currentAngle * Math.PI) / 180 - Math.PI / 2;
    
    this.pointerGroup.rotation.y = angleRad;
    this.compassRingGroup.rotation.y = -angleRad;
    
    const angleDiff = Math.abs(this.currentAngle - this.lastParticleAngle);
    if (angleDiff >= 5 || angleDiff <= -5 || angleDiff >= 355) {
      this.emitParticles();
      this.lastParticleAngle = this.currentAngle;
    }
    
    if (!silent && this.onAngleChange) {
      this.onAngleChange(this.getCompassData());
    }
  }
  
  private emitParticles(): void {
    if (this.particles.length >= this.maxParticles) return;
    
    const particleCount = 8;
    const angleRad = (this.currentAngle * Math.PI) / 180 - Math.PI / 2;
    const edgeR = this.radius;
    
    for (let i = 0; i < particleCount; i++) {
      const spread = ((Math.random() - 0.5) * Math.PI) / 3;
      const pAngle = angleRad + spread;
      const px = edgeR * Math.cos(pAngle) + (Math.random() - 0.5) * 5;
      const pz = edgeR * Math.sin(pAngle) + (Math.random() - 0.5) * 5;
      
      const geometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(px, 1.5, pz);
      this.group.add(mesh);
      
      const velocity = new THREE.Vector3(
        Math.cos(pAngle) * (15 + Math.random() * 25),
        5 + Math.random() * 10,
        Math.sin(pAngle) * (15 + Math.random() * 25)
      );
      
      this.particles.push({
        mesh,
        velocity,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }
  
  public updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      
      const t = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 20 * delta;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = t * 0.9;
      p.mesh.scale.setScalar(0.5 + t * 0.5);
    }
  }
  
  public updateBaguaMirror(delta: number): void {
    this.baguaMirror.rotation.y -= delta * 0.15;
  }
  
  public getCompassData(): CompassData {
    const angle = this.currentAngle;
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    let guaData = GUA_DATA[0];
    for (const g of GUA_DATA) {
      if (normalizedAngle >= g.startAngle && normalizedAngle < g.endAngle) {
        guaData = g;
        break;
      }
    }
    
    const mountainIndex = Math.floor((normalizedAngle + 7.5) / 15) % 24;
    const oppositeIndex = (mountainIndex + 12) % 24;
    const facingMountain = MOUNTAIN_NAMES[oppositeIndex];
    const sittingMountain = MOUNTAIN_NAMES[mountainIndex];
    const dirKey = sittingMountain + facingMountain;
    const mountainDirection = MOUNTAIN_DIRECTIONS[dirKey] || `${sittingMountain}${facingMountain}向`;
    
    return {
      angle: Math.round(normalizedAngle),
      mountainDirection,
      gua: guaData.name,
      guaName: guaData.fullName,
      guaElement: guaData.element
    };
  }
  
  public handleMouseDown(event: MouseEvent, camera: THREE.Camera, container: HTMLElement): boolean {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(this.pointerMesh, true);
    
    if (intersects.length > 0) {
      this.isDragging = true;
      return true;
    }
    return false;
  }
  
  public handleMouseMove(event: MouseEvent, camera: THREE.Camera, container: HTMLElement): void {
    if (!this.isDragging) return;
    
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.6);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
      const angleRad = Math.atan2(intersection.z, intersection.x);
      let angleDeg = ((angleRad * 180) / Math.PI + 90) % 360;
      this.setAngle(angleDeg, false);
    }
  }
  
  public handleMouseUp(): void {
    this.isDragging = false;
  }
  
  public getIsDragging(): boolean {
    return this.isDragging;
  }
}
