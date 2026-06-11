import * as THREE from 'three';
import type { CompassData } from './compass';

interface FengShuiReport {
  auspiciousComment: string;
  fiveElementDiagnosis: string;
  stars: StarInfo[];
  remedies: string[];
  grade: '上吉' | '中吉' | '平' | '小凶' | '大凶';
  gradeScore: number;
}

interface StarInfo {
  position: number;
  name: string;
  number: string;
  color: string;
  isAuspicious: boolean;
  palace: string;
}

const COURTYARD_SIZE = 25;
const HALF = COURTYARD_SIZE / 2;

const GRADE_TYPES = ['上吉', '中吉', '平', '小凶', '大凶'] as const;

const ELEMENT_POSITIONS: Record<string, { x: number; z: number }> = {
  东: { x: -HALF + 5, z: 0 },
  西: { x: HALF - 5, z: 0 },
  南: { x: 0, z: HALF - 5 },
  北: { x: 0, z: -HALF + 5 },
  中央: { x: 0, z: 0 },
  东南: { x: -HALF + 5, z: HALF - 5 },
  西南: { x: HALF - 5, z: HALF - 5 },
  东北: { x: -HALF + 5, z: -HALF + 5 },
  西北: { x: HALF - 5, z: -HALF + 5 }
};

const ELEMENT_GENERATES: Record<string, string> = {
  '金': '水',
  '水': '木',
  '木': '火',
  '火': '土',
  '土': '金'
};

const ELEMENT_OVERCOMES: Record<string, string> = {
  '金': '木',
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金'
};

const POSITION_ELEMENT: Record<string, string> = {
  '东': '木',
  '西': '金',
  '南': '火',
  '北': '水',
  '中央': '土',
  '东南': '木',
  '西南': '土',
  '东北': '土',
  '西北': '金'
};

const POSITION_NAMES = ['西北', '北', '东北', '西', '中央', '东', '西南', '南', '东南'];

export class FengShui {
  private scene: THREE.Scene;
  public courtyardGroup: THREE.Group;
  
  private eastRockery!: THREE.Group;
  private westWell!: THREE.Group;
  private southLotus!: THREE.Group;
  private northScreen!: THREE.Group;
  private centerPatio!: THREE.Group;
  
  private haloMeshes: Record<string, THREE.Mesh> = {};
  
  private floorplanCanvas: HTMLCanvasElement;
  private floorplanCtx: CanvasRenderingContext2D;
  private reportCanvas: HTMLCanvasElement;
  private reportCtx: CanvasRenderingContext2D;
  
  private pulseTime = 0;
  private isSurveying = false;
  private currentSurveyAngle = 180;
  private arrowStarAlpha = 0;
  private arrowStarDirection = 1;
  
  private houses: {
    mainBuilding: THREE.Group;
    eastBuilding: THREE.Group;
    westBuilding: THREE.Group;
    southBuilding: THREE.Group;
  } | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.courtyardGroup = new THREE.Group();
    
    this.floorplanCanvas = document.getElementById('floorplan-canvas') as HTMLCanvasElement;
    this.floorplanCtx = this.floorplanCanvas.getContext('2d')!;
    this.reportCanvas = document.getElementById('report-canvas') as HTMLCanvasElement;
    this.reportCtx = this.reportCanvas.getContext('2d')!;
    
    this.createCourtyard();
    this.drawInitialFloorplan();
  }
  
  private createCourtyard(): void {
    this.createWallsAndBuildings();
    this.createElementFeatures();
    this.createGround();
    
    this.scene.add(this.courtyardGroup);
  }
  
  private createGround(): void {
    const size = COURTYARD_SIZE;
    const geom = new THREE.PlaneGeometry(size * 1.5, size * 1.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xD4C4A8,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(geom, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50.05;
    this.courtyardGroup.add(ground);
    
    const patioSize = 12;
    const tileGeom = new THREE.PlaneGeometry(patioSize, patioSize);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8
    });
    const patio = new THREE.Mesh(tileGeom, tileMat);
    patio.rotation.x = -Math.PI / 2;
    patio.position.y = -49.98;
    this.courtyardGroup.add(patio);
    
    for (let i = -patioSize / 2; i <= patioSize / 2; i += 2) {
      const lineGeom = new THREE.BoxGeometry(patioSize + 0.1, 0.05, 0.1);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x4A4A4A });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.set(0, -49.95, i);
      this.courtyardGroup.add(line);
    }
    for (let i = -patioSize / 2; i <= patioSize / 2; i += 2) {
      const lineGeom = new THREE.BoxGeometry(0.1, 0.05, patioSize + 0.1);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x4A4A4A });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.set(i, -49.95, 0);
      this.courtyardGroup.add(line);
    }
  }
  
  private createWallsAndBuildings(): void {
    const buildings: { position: THREE.Vector3; rotation: number; name: string; isMain?: boolean; isSouth?: boolean }[] = [
      { position: new THREE.Vector3(0, 0, -HALF + 3), rotation: 0, name: 'main', isMain: true },
      { position: new THREE.Vector3(-HALF + 3, 0, 0), rotation: Math.PI / 2, name: 'east' },
      { position: new THREE.Vector3(HALF - 3, 0, 0), rotation: -Math.PI / 2, name: 'west' },
      { position: new THREE.Vector3(0, 0, HALF - 3), rotation: Math.PI, name: 'south', isSouth: true }
    ];
    
    const houses: any = {};
    
    for (const b of buildings) {
      const house = this.createHouse(b.isMain || false, b.isSouth || false);
      house.position.set(b.position.x, -50, b.position.z);
      house.rotation.y = b.rotation;
      this.courtyardGroup.add(house);
      
      if (b.name === 'main') houses.mainBuilding = house;
      else if (b.name === 'east') houses.eastBuilding = house;
      else if (b.name === 'west') houses.westBuilding = house;
      else if (b.name === 'south') houses.southBuilding = house;
    }
    
    this.houses = houses;
  }
  
  private createHouse(isMain: boolean = false, isSouth: boolean = false): THREE.Group {
    const group = new THREE.Group();
    
    const width = isMain ? 20 : 16;
    const height = isMain ? 8 : 6;
    const depth = 8;
    
    const wallGeom = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF5F0E1,
      roughness: 0.85
    });
    const walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.y = height / 2;
    group.add(walls);
    
    const brickRowGeom = new THREE.BoxGeometry(width + 0.05, 0.3, depth + 0.05);
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0xA0826D,
      roughness: 0.9
    });
    for (let r = 0; r < 3; r++) {
      const row = new THREE.Mesh(brickRowGeom, brickMat);
      row.position.y = 0.5 + r * (height / 3);
      group.add(row);
    }
    
    const roofWidth = width + 3;
    const roofDepth = depth + 3;
    const roofHeight = isMain ? 5 : 4;
    
    const roofGeom = new THREE.ConeGeometry(
      Math.sqrt(roofWidth * roofWidth + roofDepth * roofDepth) / 2,
      roofHeight,
      4
    );
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = height + roofHeight / 2;
    group.add(roof);
    
    const eaveGeom = new THREE.BoxGeometry(roofWidth, 0.4, roofDepth);
    const eave = new THREE.Mesh(eaveGeom, roofMat);
    eave.position.y = height + 0.2;
    group.add(eave);
    
    if (isSouth) {
      const doorWidth = 3;
      const doorHeight = 5;
      const doorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, 0.3);
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x8B0000,
        roughness: 0.4,
        metalness: 0.3
      });
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(0, doorHeight / 2 + 0.5, depth / 2 + 0.15);
      group.add(door);
      
      const handleGeom = new THREE.SphereGeometry(0.15, 16, 16);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleL = new THREE.Mesh(handleGeom, handleMat);
      handleL.position.set(-0.8, doorHeight / 2 + 0.5, depth / 2 + 0.4);
      group.add(handleL);
      const handleR = handleL.clone();
      handleR.position.x = 0.8;
      group.add(handleR);
      
      this.createLatticeWindow(0, height - 1.2, depth / 2 + 0.1, group, true);
    } else {
      const windowY = height / 2 + 0.5;
      this.createLatticeWindow(-width / 4, windowY, depth / 2 + 0.1, group);
      this.createLatticeWindow(width / 4, windowY, depth / 2 + 0.1, group);
    }
    
    return group;
  }
  
  private createLatticeWindow(x: number, y: number, z: number, group: THREE.Group, isLarge: boolean = false): void {
    const w = isLarge ? 4 : 2.5;
    const h = isLarge ? 3 : 2;
    
    const frameGeom = new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x6B4226,
      roughness: 0.6
    });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(x, y, z);
    group.add(frame);
    
    const paneGeom = new THREE.PlaneGeometry(w, h);
    const paneMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFF0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const pane = new THREE.Mesh(paneGeom, paneMat);
    pane.position.set(x, y, z + 0.11);
    group.add(pane);
    
    const lineMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    const hLineGeom = new THREE.BoxGeometry(w, 0.1, 0.25);
    const vLineGeom = new THREE.BoxGeometry(0.1, h, 0.25);
    
    for (let i = -2; i <= 2; i++) {
      const hLine = new THREE.Mesh(hLineGeom, lineMat);
      hLine.position.set(x, y + (i * h) / 4, z + 0.1);
      group.add(hLine);
      
      const vLine = new THREE.Mesh(vLineGeom, lineMat);
      vLine.position.set(x + (i * w) / 4, y, z + 0.1);
      group.add(vLine);
    }
    
    const diag1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, Math.sqrt(w * w + h * h) / 2, 0.25), lineMat);
    diag1.position.set(x + w / 4, y + h / 4, z + 0.1);
    diag1.rotation.z = Math.atan2(h, w);
    group.add(diag1);
    
    const diag2 = diag1.clone();
    diag2.position.set(x - w / 4, y + h / 4, z + 0.1);
    diag2.rotation.z = -Math.atan2(h, w);
    group.add(diag2);
  }
  
  private createElementFeatures(): void {
    this.eastRockery = this.createRockery();
    const eastPos = this.rotatePosition(-HALF + 5, -48, 0);
    this.eastRockery.position.copy(eastPos);
    this.courtyardGroup.add(this.eastRockery);
    this.registerHalo('东', this.eastRockery, 0x90EE90, 6);
    
    this.westWell = this.createWell();
    const westPos = this.rotatePosition(HALF - 5, -48, 0);
    this.westWell.position.copy(westPos);
    this.courtyardGroup.add(this.westWell);
    this.registerHalo('西', this.westWell, 0xE0E0E0, 5);
    
    this.southLotus = this.createLotusPot();
    const southPos = this.rotatePosition(0, -48, HALF - 5);
    this.southLotus.position.copy(southPos);
    this.courtyardGroup.add(this.southLotus);
    this.registerHalo('南', this.southLotus, 0xFF6B6B, 5);
    
    this.northScreen = this.createScreenWall();
    const northPos = this.rotatePosition(0, -48, -HALF + 5);
    this.northScreen.position.copy(northPos);
    this.courtyardGroup.add(this.northScreen);
    this.registerHalo('北', this.northScreen, 0x87CEEB, 6);
  }
  
  private rotatePosition(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x, y, z);
  }
  
  private createRockery(): THREE.Group {
    const group = new THREE.Group();
    
    for (let i = 0; i < 6; i++) {
      const size = 1.5 + Math.random() * 2;
      const rockGeom = new THREE.DodecahedronGeometry(size, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x708090,
        roughness: 0.9,
        flatShading: true
      });
      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(
        (Math.random() - 0.5) * 4,
        i * 1.2 + size / 2,
        (Math.random() - 0.5) * 4
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.set(
        0.8 + Math.random() * 0.4,
        0.7 + Math.random() * 0.5,
        0.8 + Math.random() * 0.4
      );
      group.add(rock);
    }
    
    for (let i = 0; i < 8; i++) {
      const bamboo = this.createBamboo();
      const angle = (i / 8) * Math.PI * 2;
      const r = 4 + Math.random() * 2;
      bamboo.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      bamboo.rotation.y = Math.random() * Math.PI;
      group.add(bamboo);
    }
    
    return group;
  }
  
  private createBamboo(): THREE.Group {
    const group = new THREE.Group();
    
    const height = 5 + Math.random() * 3;
    const segments = 5;
    const radius = 0.15;
    
    for (let i = 0; i < segments; i++) {
      const segHeight = height / segments;
      const segGeom = new THREE.CylinderGeometry(radius, radius * 0.95, segHeight, 8);
      const segMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x228B22 : 0x32CD32,
        roughness: 0.7
      });
      const seg = new THREE.Mesh(segGeom, segMat);
      seg.position.y = i * segHeight + segHeight / 2;
      group.add(seg);
      
      const nodeGeom = new THREE.TorusGeometry(radius + 0.02, 0.03, 8, 16);
      const nodeMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      node.rotation.x = Math.PI / 2;
      node.position.y = (i + 1) * segHeight;
      group.add(node);
    }
    
    for (let i = 0; i < 5; i++) {
      const leafGeom = new THREE.SphereGeometry(0.8, 8, 4);
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x2E8B57,
        roughness: 0.8,
        flatShading: true
      });
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(
        (Math.random() - 0.5) * 1.5,
        height - 0.5 - Math.random() * 2,
        (Math.random() - 0.5) * 1.5
      );
      leaf.scale.set(0.3, 1, 0.15);
      leaf.rotation.set(Math.random(), Math.random(), (Math.random() - 0.5) * 0.5);
      group.add(leaf);
    }
    
    return group;
  }
  
  private createWell(): THREE.Group {
    const group = new THREE.Group();
    
    const wellGeom = new THREE.CylinderGeometry(2.5, 2.8, 2, 24, 1, true);
    const wellMat = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const well = new THREE.Mesh(wellGeom, wellMat);
    well.position.y = 1;
    group.add(well);
    
    const innerGeom = new THREE.CylinderGeometry(2.3, 2.3, 3, 24);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x1a5276,
      roughness: 0.3,
      metalness: 0.2
    });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    inner.position.y = 0.5;
    group.add(inner);
    
    const waterGeom = new THREE.CircleGeometry(2.2, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4682B4,
      roughness: 0.1,
      metalness: 0.5,
      side: THREE.DoubleSide
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 2;
    group.add(water);
    
    const rimGeom = new THREE.TorusGeometry(2.65, 0.2, 8, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x4682B4,
      metalness: 0.4,
      roughness: 0.5
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2.1;
    group.add(rim);
    
    const pillarGeom = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
    leftPillar.position.set(-2, 4.5, 0);
    group.add(leftPillar);
    const rightPillar = leftPillar.clone();
    rightPillar.position.x = 2;
    group.add(rightPillar);
    
    const topBeamGeom = new THREE.BoxGeometry(5, 0.3, 0.3);
    const topBeam = new THREE.Mesh(topBeamGeom, pillarMat);
    topBeam.position.y = 7;
    group.add(topBeam);
    
    const bucketGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const bucket = new THREE.Mesh(bucketGeom, bucketMat);
    bucket.position.set(0, 5, 0);
    group.add(bucket);
    
    return group;
  }
  
  private createLotusPot(): THREE.Group {
    const group = new THREE.Group();
    
    const potGeom = new THREE.CylinderGeometry(3, 2.5, 2, 32);
    const potMat = new THREE.MeshStandardMaterial({
      color: 0xB22222,
      roughness: 0.5,
      metalness: 0.2
    });
    const pot = new THREE.Mesh(potGeom, potMat);
    pot.position.y = 1;
    group.add(pot);
    
    const rimGeom = new THREE.TorusGeometry(3, 0.2, 8, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2;
    group.add(rim);
    
    const waterGeom = new THREE.CylinderGeometry(2.8, 2.8, 0.8, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x6495ED,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = 1.8;
    group.add(water);
    
    for (let i = 0; i < 8; i++) {
      const leaf = this.createLotusLeaf();
      const angle = (i / 8) * Math.PI * 2;
      const r = 1 + Math.random() * 1.2;
      leaf.position.set(Math.cos(angle) * r, 2.3, Math.sin(angle) * r);
      leaf.rotation.set(-0.2 + Math.random() * 0.4, Math.random() * Math.PI, 0);
      leaf.scale.setScalar(0.6 + Math.random() * 0.4);
      group.add(leaf);
    }
    
    for (let i = 0; i < 5; i++) {
      const flower = this.createLotusFlower();
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.5;
      flower.position.set(Math.cos(angle) * r, 2.8, Math.sin(angle) * r);
      flower.scale.setScalar(0.8 + Math.random() * 0.4);
      group.add(flower);
    }
    
    return group;
  }
  
  private createLotusLeaf(): THREE.Group {
    const group = new THREE.Group();
    const geom = new THREE.CircleGeometry(1.5, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(geom, mat);
    leaf.rotation.x = -Math.PI / 2;
    group.add(leaf);
    
    for (let i = 0; i < 8; i++) {
      const veinGeom = new THREE.BoxGeometry(1.5, 0.02, 0.05);
      const veinMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
      const vein = new THREE.Mesh(veinGeom, veinMat);
      vein.rotation.y = (i / 8) * Math.PI * 2;
      vein.position.x = 0.75;
      vein.position.y = 0.01;
      group.add(vein);
    }
    
    return group;
  }
  
  private createLotusFlower(): THREE.Group {
    const group = new THREE.Group();
    
    const petalCount = 12;
    for (let i = 0; i < petalCount; i++) {
      const petalShape = new THREE.Shape();
      petalShape.moveTo(0, 0);
      petalShape.quadraticCurveTo(0.3, 0.6, 0, 1);
      petalShape.quadraticCurveTo(-0.3, 0.6, 0, 0);
      
      const petalGeom = new THREE.ShapeGeometry(petalShape);
      const layer = i < 5 ? 0 : 1;
      const petalMat = new THREE.MeshStandardMaterial({
        color: layer === 0 ? 0xFF69B4 : 0xFF1493,
        roughness: 0.4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.rotation.y = (i / petalCount) * Math.PI * 2;
      petal.rotation.x = layer === 0 ? -0.5 : -0.2;
      petal.position.y = layer * 0.3;
      petal.scale.setScalar(layer === 0 ? 1 : 0.7);
      group.add(petal);
    }
    
    const centerGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.3,
      metalness: 0.4
    });
    const center = new THREE.Mesh(centerGeom, centerMat);
    center.position.y = 0.6;
    group.add(center);
    
    return group;
  }
  
  private createScreenWall(): THREE.Group {
    const group = new THREE.Group();
    
    const baseGeom = new THREE.BoxGeometry(10, 1.5, 1.5);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.8
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.75;
    group.add(base);
    
    const wallGeom = new THREE.BoxGeometry(8, 7, 1);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.85
    });
    const wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.y = 1.5 + 3.5;
    group.add(wall);
    
    const brickColor = 0x808080;
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 4; col++) {
        const brickGeom = new THREE.BoxGeometry(2, 1, 1.05);
        const brick = new THREE.Mesh(brickGeom, brickMat);
        const offsetX = (row % 2 === 0) ? 0 : 1;
        brick.position.set(
          -4 + 1 + col * 2 + offsetX,
          1.5 + 0.5 + row * 1,
          0
        );
        group.add(brick);
      }
    }
    
    const roofGeom = new THREE.BoxGeometry(9, 0.8, 2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 1.5 + 7 + 0.4;
    group.add(roof);
    
    const capGeom = new THREE.ConeGeometry(5.5, 1.5, 4);
    const cap = new THREE.Mesh(capGeom, roofMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 1.5 + 7 + 0.8 + 0.75;
    group.add(cap);
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 472, 472);
    
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 180px "KaiTi", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const fuGeom = new THREE.PlaneGeometry(5, 5);
    const fuMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const fu = new THREE.Mesh(fuGeom, fuMat);
    fu.position.set(0, 1.5 + 3.5, 0.52);
    group.add(fu);
    
    return group;
  }
  
  private registerHalo(key: string, parent: THREE.Group, color: number, radius: number): void {
    const haloGeom = new THREE.RingGeometry(radius - 0.5, radius, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.1;
    parent.add(halo);
    this.haloMeshes[key] = halo;
  }
  
  public survey(data: CompassData): void {
    this.isSurveying = true;
    this.currentSurveyAngle = data.angle;
    this.adjustElementHalos(data);
    this.drawFloorplanWithArrow(data);
    const report = this.generateReport(data);
    this.drawReport(report);
    this.showReport();
  }
  
  private adjustElementHalos(data: CompassData): void {
    const facingElement = data.guaElement;
    
    for (const key of Object.keys(this.haloMeshes)) {
      const mesh = this.haloMeshes[key];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const posElement = POSITION_ELEMENT[key];
      
      if (!posElement || !facingElement) {
        mat.opacity = 0;
        continue;
      }
      
      const generates = ELEMENT_GENERATES[facingElement];
      const overcomes = ELEMENT_OVERCOMES[facingElement];
      
      if (posElement === facingElement) {
        mat.color.setHex(this.getElementAuspiciousColor(posElement));
        mat.opacity = 0.7;
      } else if (posElement === generates) {
        mat.color.setHex(this.getElementAuspiciousColor(posElement));
        mat.opacity = 0.5;
      } else if (posElement === overcomes) {
        mat.color.setHex(0xFFD700);
        mat.opacity = 0.6;
      } else {
        mat.opacity = 0.15;
      }
    }
  }
  
  private getElementAuspiciousColor(element: string): number {
    switch (element) {
      case '金': return 0xE0E0E0;
      case '木': return 0x90EE90;
      case '水': return 0x87CEEB;
      case '火': return 0xFF6B6B;
      case '土': return 0xD2B48C;
      default: return 0xFFFFFF;
    }
  }
  
  public updateHalos(delta: number): void {
    this.pulseTime += delta;
    const pulse = (Math.sin(this.pulseTime * (Math.PI * 2 / 0.6)) + 1) / 2;
    const baseMin = 0.3;
    
    for (const key of Object.keys(this.haloMeshes)) {
      const mesh = this.haloMeshes[key];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (this.isSurveying && mat.opacity > 0) {
        const currentTarget = mat.userData.targetOpacity ?? mat.opacity;
        const minOpacity = Math.max(baseMin, currentTarget * 0.5);
        mat.opacity = minOpacity + (currentTarget - minOpacity) * (0.5 + pulse * 0.5);
      }
    }
    
    if (this.isSurveying) {
      this.arrowStarAlpha += delta * 3 * this.arrowStarDirection;
      if (this.arrowStarAlpha >= 1) { this.arrowStarAlpha = 1; this.arrowStarDirection = -1; }
      if (this.arrowStarAlpha <= 0.3) { this.arrowStarAlpha = 0.3; this.arrowStarDirection = 1; }
    }
  }
  
  private drawInitialFloorplan(): void {
    const ctx = this.floorplanCtx;
    const w = this.floorplanCanvas.width;
    const h = this.floorplanCanvas.height;
    
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(0, 0, w, h);
    
    const margin = 20;
    const plotX = margin;
    const plotY = margin;
    const plotW = w - margin * 2;
    const plotH = h - margin * 2;
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(plotX, plotY, plotW, plotH);
    
    ctx.fillStyle = '#D4C4A8';
    ctx.fillRect(plotX + 2, plotY + 2, plotW - 4, plotH - 4);
    
    this.drawHouse(ctx, plotX + plotW / 2, plotY + 15, plotW - 60, 35, true);
    this.drawHouse(ctx, plotX + plotW / 2, plotY + plotH - 15, plotW - 60, 35, false, true);
    this.drawHouse(ctx, plotX + 15, plotY + plotH / 2, 35, plotH - 60, false, false, true);
    this.drawHouse(ctx, plotX + plotW - 15, plotY + plotH / 2, 35, plotH - 60);
    
    const centerX = plotX + plotW / 2;
    const centerY = plotY + plotH / 2;
    
    const tileSize = (plotW - 80) / 6;
    const tileStartX = centerX - tileSize * 3;
    const tileStartY = centerY - tileSize * 3;
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(tileStartX + i * tileSize, tileStartY);
      ctx.lineTo(tileStartX + i * tileSize, tileStartY + tileSize * 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tileStartX, tileStartY + i * tileSize);
      ctx.lineTo(tileStartX + tileSize * 6, tileStartY + i * tileSize);
      ctx.stroke();
    }
    
    this.drawEastFeatures(ctx, plotX + 45, centerY);
    this.drawWestFeatures(ctx, plotX + plotW - 45, centerY);
    this.drawSouthFeatures(ctx, centerX, plotY + plotH - 45);
    this.drawNorthFeatures(ctx, centerX, plotY + 45);
    
    ctx.fillStyle = '#2C1810';
    ctx.font = '14px "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('北', centerX, 10);
    ctx.fillText('南', centerX, h - 4);
    ctx.fillText('东', 8, centerY + 5);
    ctx.fillText('西', w - 8, centerY + 5);
  }
  
  private drawHouse(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    w: number, h: number,
    isMain: boolean = false, isSouth: boolean = false, vertical: boolean = false
  ): void {
    ctx.fillStyle = '#F5F0E1';
    ctx.strokeStyle = '#4A2C1A';
    ctx.lineWidth = 2;
    
    if (vertical) {
      ctx.fillRect(cx - h / 2, cy - w / 2, h, w);
      ctx.strokeRect(cx - h / 2, cy - w / 2, h, w);
      
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(cx - h / 2 - 3, cy - w / 2 - 5, h + 6, 8);
    } else {
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(cx - w / 2 - 5, cy - h / 2 - 3, w + 10, 8);
    }
    
    if (isSouth) {
      ctx.fillStyle = '#8B0000';
      const dw = vertical ? 8 : 14;
      const dh = vertical ? 14 : 20;
      if (vertical) {
        ctx.fillRect(cx + h / 2 - 4, cy - dh / 2, dw, dh);
      } else {
        ctx.fillRect(cx - dw / 2, cy + h / 2 - dh, dw, dh);
      }
    }
    
    if (isMain) {
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 12px "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('正房', cx, cy);
    }
  }
  
  private drawEastFeatures(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sx = x + Math.cos(angle) * 18;
      const sy = y + Math.sin(angle) * 18;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - 18);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#228B22';
    ctx.font = '10px "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('山竹', x, y + 35);
  }
  
  private drawWestFeatures(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = '#4682B4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#6495ED';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '10px "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('石井', x, y + 30);
  }
  
  private drawSouthFeatures(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#B22222';
    ctx.beginPath();
    ctx.ellipse(x, y, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const lx = x + Math.cos(angle) * 8;
      const ly = y + Math.sin(angle) * 5;
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '10px "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('荷缸', x, y + 25);
  }
  
  private drawNorthFeatures(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#696969';
    ctx.fillRect(x - 20, y - 12, 40, 24);
    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 20, y - 12, 40, 24);
    
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 14px "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', x, y);
    
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x - 24, y - 16, 48, 5);
    
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '10px "KaiTi", serif';
    ctx.fillText('影壁', x, y + 28);
  }
  
  private drawFloorplanWithArrow(data: CompassData): void {
    this.drawInitialFloorplan();
    
    const ctx = this.floorplanCtx;
    const w = this.floorplanCanvas.width;
    const h = this.floorplanCanvas.height;
    const margin = 20;
    const plotW = w - margin * 2;
    const plotH = h - margin * 2;
    const cx = margin + plotW / 2;
    const cy = margin + plotH / 2;
    
    const angleRad = ((data.angle - 90) * Math.PI) / 180;
    const arrowLength = Math.min(plotW, plotH) / 2 - 40;
    
    ctx.save();
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const endX = cx + Math.cos(angleRad) * arrowLength;
    const endY = cy + Math.sin(angleRad) * arrowLength;
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#CC0000';
    ctx.beginPath();
    const headLen = 14;
    const backAngle1 = angleRad + Math.PI - Math.PI / 6;
    const backAngle2 = angleRad + Math.PI + Math.PI / 6;
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + Math.cos(backAngle1) * headLen, endY + Math.sin(backAngle1) * headLen);
    ctx.lineTo(endX + Math.cos(backAngle2) * headLen, endY + Math.sin(backAngle2) * headLen);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    this.drawStar(endX, endY, 8, 4, this.arrowStarAlpha);
  }
  
  private drawStar(cx: number, cy: number, outerR: number, innerR: number, alpha: number): void {
    const ctx = this.floorplanCtx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  
  private generateReport(data: CompassData): FengShuiReport {
    const facing = data.mountainDirection;
    const element = data.guaElement;
    
    const comments: Record<string, string> = {
      '子午向': '子午向，坎离正位，水火既济，旺财丁，主科甲。南方开门，向阳纳气，家道兴隆。',
      '壬丙向': '壬丙向，杂卦兼向，主小财。需防口舌是非，宜于东南角置文昌塔。',
      '癸丁向': '癸丁向，阴阳得配，主人口安宁，利女性持家。西南宜静不宜动。',
      '丑未向': '丑未向，土气厚重，主田产丰盛，利于农耕置业。然慎防脾胃之疾。',
      '艮坤向': '艮坤向，土土比和，主子孙贤孝，家业稳固。宜多种花木以疏土气。',
      '寅申向': '寅申向，金木相冲，主官非诉讼。门口需置山海镇以化解冲煞。',
      '甲庚向': '甲庚向，东西正对，金木交战。主兄弟不和，宜中央设圆形鱼池通关。',
      '卯酉向': '卯酉向，正东西位，雷泽相薄。主财运起伏，宜藏风聚气，增设玄关。',
      '乙辛向': '乙辛向，阴木阴金，主女性掌权。西北方宜安奉祖先牌位。',
      '辰戌向': '辰戌向，天罗地网，主官司缠绵。须于吉位供奉关帝，以正压邪。',
      '巽乾向': '巽乾向，风天相会，主长女聪慧，利于文学艺术。东南宜置书桌。',
      '巳亥向': '巳亥向，水火相冲，主心肾不交。北方宜静，南方宜暗以缓火气。'
    };
    
    const auspiciousComment = comments[facing] || `${facing}，详察方位理气，配合三元九运，细推吉凶。`;
    
    const centerElement = '土';
    let diagnosis = '';
    if (ELEMENT_OVERCOMES[element] === centerElement) {
      diagnosis = `${data.guaName}属${element}，${element}旺克中央土。土主脾胃，当心中满腹胀、消化不良之症。宜于天井中央置圆形铜器，取土生金、金泄土气之意。`;
    } else if (ELEMENT_GENERATES[centerElement] === element) {
      diagnosis = `中央土生${data.guaName}${element}，为泄气之局。主人丁虚耗，精神不振。宜于北方增置流水之景，以金水相生，补益元气。`;
    } else if (ELEMENT_OVERCOMES[centerElement] === element) {
      diagnosis = `中央土克${data.guaName}${element}水，主肾气不足，耳病之虞。宜西方多置金器，土生金、金生水以通关。`;
    } else if (element === centerElement) {
      diagnosis = `${data.guaName}与中央同属土，二土比和，本为吉象。然土厚则埋金，宜于院中置水缸或鱼池，以水润土，生生不息。`;
    } else {
      diagnosis = `${data.guaName}属${element}，与中央土相生有情。五行流通，气场和顺，家宅安康。然须每年立春祭扫，以谢土神。`;
    }
    
    const baseStars: Omit<StarInfo, 'position'>[] = [
      { name: '一白', number: '一', color: '#FFFFFF', isAuspicious: true, palace: '坎' },
      { name: '二黑', number: '二', color: '#2C2C2C', isAuspicious: false, palace: '坤' },
      { name: '三碧', number: '三', color: '#00FF00', isAuspicious: false, palace: '震' },
      { name: '四绿', number: '四', color: '#228B22', isAuspicious: true, palace: '巽' },
      { name: '五黄', number: '五', color: '#DAA520', isAuspicious: false, palace: '中' },
      { name: '六白', number: '六', color: '#F0F0F0', isAuspicious: true, palace: '乾' },
      { name: '七赤', number: '七', color: '#FF6347', isAuspicious: false, palace: '兑' },
      { name: '八白', number: '八', color: '#FFFFFF', isAuspicious: true, palace: '艮' },
      { name: '九紫', number: '九', color: '#FF4500', isAuspicious: true, palace: '离' }
    ];
    
    const guaIndex: Record<string, number> = {
      '坎': 1, '坤': 2, '震': 3, '巽': 4, '中': 5, '乾': 6, '兑': 7, '艮': 8, '离': 9
    };
    
    const centerPalace = guaIndex[data.gua] || 5;
    const offset = ((5 - centerPalace) % 9 + 9) % 9;
    const stars: StarInfo[] = baseStars.map((s, i) => ({
      ...s,
      position: ((i + offset) % 9)
    }));
    
    const auspiciousCount = stars.filter(s => s.isAuspicious && (s.position === 0 || s.position === 4 || s.position === 8)).length;
    
    let gradeScore = 50;
    gradeScore += auspiciousCount * 8;
    if (['子午向', '艮坤向', '巽乾向'].includes(facing)) gradeScore += 15;
    if (['寅申向', '辰戌向'].includes(facing)) gradeScore -= 15;
    if (element === '土' || element === '金') gradeScore += 5;
    if (element === '木') gradeScore -= 3;
    gradeScore = Math.max(0, Math.min(100, gradeScore));
    
    let grade: FengShuiReport['grade'];
    if (gradeScore >= 85) grade = '上吉';
    else if (gradeScore >= 70) grade = '中吉';
    else if (gradeScore >= 55) grade = '平';
    else if (gradeScore >= 35) grade = '小凶';
    else grade = '大凶';
    
    const remedies: string[] = [];
    
    if (gradeScore < 70) {
      remedies.push('西南方安放铜葫芦，取金泄土、化病符之力。');
    }
    if (element === '木' || ELEMENT_OVERCOMES[element] === '土') {
      remedies.push('西北方择吉日良辰埋藏五色石，以镇地煞、稳八方。');
    }
    if (grade === '小凶' || grade === '大凶') {
      remedies.push('大门上方悬挂八卦凸镜，反射冲煞，护佑家宅。');
    }
    if (stars.find(s => s.position === 4 && !s.isAuspicious)) {
      remedies.push('五黄居中，宜于天井中央安放六枚乾隆铜钱，顺排化解。');
    }
    remedies.push('东南方位摆放文昌塔或文竹四盆，利读书科举、文运亨通。');
    if (ELEMENT_OVERCOMES['火'] === element || element === '火') {
      remedies.push('厨房忌设于南方，宜改移北方或东南方。灶口朝向宜取本命吉方。');
    }
    remedies.push('每月初一、十五清晨，于庭院中央焚香三炷，拜谢天地四方神祇。');
    
    return {
      auspiciousComment,
      fiveElementDiagnosis: diagnosis,
      stars,
      remedies,
      grade,
      gradeScore
    };
  }
  
  private drawReport(report: FengShuiReport): void {
    const ctx = this.reportCtx;
    const w = this.reportCanvas.width;
    
    let y = 0;
    
    const scrollTextureCanvas = document.createElement('canvas');
    scrollTextureCanvas.width = w;
    scrollTextureCanvas.height = 40;
    const sctx = scrollTextureCanvas.getContext('2d')!;
    sctx.fillStyle = '#F5E6B8';
    sctx.fillRect(0, 0, w, 40);
    sctx.fillStyle = '#D4C4A8';
    for (let i = 0; i < 80; i++) {
      sctx.fillRect(Math.random() * w, Math.random() * 40, 2, 2);
    }
    const scrollTexture = new THREE.CanvasTexture(scrollTextureCanvas);
    void scrollTexture;
    
    this.reportCanvas.height = 1400;
    const totalH = 1400;
    
    ctx.clearRect(0, 0, w, totalH);
    
    this.drawPaperBackground(ctx, w, totalH);
    
    y = 30;
    ctx.fillStyle = '#8B0000';
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 4;
    
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(10, y, w - 20, 60);
    ctx.strokeRect(10, y, w - 20, 60);
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(18, y + 8, w - 36, 44);
    
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 36px "KaiTi", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeText('風水勘測報告', w / 2, y + 30);
    ctx.fillText('風水勘測報告', w / 2, y + 30);
    y += 90;
    
    const dateStr = this.getChineseDate();
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '16px "KaiTi", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`歲次：${dateStr}`, w - 30, y);
    y += 30;
    
    this.drawSectionTitle(ctx, '一、山向吉凶評語', w, y);
    y += 50;
    this.drawTextBlock(ctx, report.auspiciousComment, 35, y, w - 70, 22);
    y += Math.ceil(report.auspiciousComment.length / 18) * 32 + 20;
    
    this.drawSectionTitle(ctx, '二、五行生克診斷', w, y);
    y += 50;
    this.drawTextBlock(ctx, report.fiveElementDiagnosis, 35, y, w - 70, 22);
    y += Math.ceil(report.fiveElementDiagnosis.length / 18) * 32 + 20;
    
    this.drawSectionTitle(ctx, '三、星宿飛宮流年圖', w, y);
    y += 50;
    this.drawStarPalace(ctx, report.stars, w / 2, y + 145);
    y += 310;
    
    this.drawSectionTitle(ctx, '四、趨吉避凶建議', w, y);
    y += 50;
    for (let i = 0; i < report.remedies.length; i++) {
      const text = `${i + 1}. ${report.remedies[i]}`;
      this.drawTextBlock(ctx, text, 45, y, w - 80, 20);
      y += Math.ceil(text.length / 17) * 30 + 8;
    }
    
    y += 30;
    this.drawGradeStamp(ctx, report.grade, w - 90, y + 40);
  }
  
  private drawPaperBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#FFF8DC');
    grd.addColorStop(0.5, '#F5E6B8');
    grd.addColorStop(1, '#EAD9A0');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = 'rgba(139, 90, 43, 0.06)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }
    
    ctx.fillStyle = 'rgba(139, 90, 43, 0.02)';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    
    for (let i = 0; i < 20; i++) {
      this.drawCrackPattern(ctx, Math.random() * w, Math.random() * h);
    }
  }
  
  private drawCrackPattern(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x, cy = y;
    for (let i = 0; i < 4; i++) {
      cx += (Math.random() - 0.5) * 15;
      cy += (Math.random() - 0.5) * 15;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.restore();
  }
  
  private drawSectionTitle(ctx: CanvasRenderingContext2D, title: string, w: number, y: number): void {
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w - 30, y);
    ctx.stroke();
    
    const tw = ctx.measureText(title).width;
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(w / 2 - tw / 2 - 15, y - 14, tw + 30, 28);
    
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 22px "KaiTi", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, w / 2, y);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(w / 2 - tw / 2 - 15, y - 14, tw + 30, 28);
  }
  
  private drawTextBlock(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    maxW: number,
    fontSize: number
  ): void {
    ctx.fillStyle = '#2C1810';
    ctx.font = `${fontSize}px "KaiTi", "Noto Serif SC", serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineHeight = fontSize * 1.5;
    
    const charsPerLine = Math.floor(maxW / (fontSize * 1.05));
    let currentY = y;
    for (let i = 0; i < text.length; i += charsPerLine) {
      const line = text.slice(i, i + charsPerLine);
      ctx.fillText(line, x, currentY);
      currentY += fontSize * 1.5;
    }
  }
  
  private drawStarPalace(ctx: CanvasRenderingContext2D, stars: StarInfo[], cx: number, cy: number): void {
    const cellSize = 80;
    const total = cellSize * 3;
    const startX = cx - total / 2;
    const startY = cy - total / 2;
    
    ctx.save();
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(startX - 5, startY - 5, total + 10, total + 10);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX - 5, startY - 5, total + 10, total + 10);
    
    ctx.strokeStyle = '#4A2C1A';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, total, total);
    
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * cellSize, startY);
      ctx.lineTo(startX + i * cellSize, startY + total);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX, startY + i * cellSize);
      ctx.lineTo(startX + total, startY + i * cellSize);
      ctx.stroke();
    }
    
    const palaceGridPositions = [
      { row: 0, col: 0, name: '巽' }, { row: 0, col: 1, name: '离' }, { row: 0, col: 2, name: '坤' },
      { row: 1, col: 0, name: '震' }, { row: 1, col: 1, name: '中' }, { row: 1, col: 2, name: '兑' },
      { row: 2, col: 0, name: '艮' }, { row: 2, col: 1, name: '坎' }, { row: 2, col: 2, name: '乾' }
    ];
    
    for (const s of stars) {
      const pos = palaceGridPositions[s.position];
      const cellX = startX + pos.col * cellSize;
      const cellY = startY + pos.row * cellSize;
      const cellCx = cellX + cellSize / 2;
      const cellCy = cellY + cellSize / 2;
      
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(cellCx, cellCy - 8, 24, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = s.isAuspicious ? '#D4AF37' : '#8B0000';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = s.color === '#FFFFFF' || s.color === '#F0F0F0' ? '#8B0000' : '#FFFFFF';
      ctx.font = 'bold 28px "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.number, cellCx, cellCy - 8);
      
      ctx.fillStyle = '#2C1810';
      ctx.font = '12px "KaiTi", serif';
      ctx.fillText(s.name, cellCx, cellCy + 18);
      
      ctx.fillStyle = '#6B4226';
      ctx.font = '11px "KaiTi", serif';
      ctx.fillText(pos.name + '宫', cellCx, cellY + cellSize - 10);
    }
    
    ctx.restore();
    
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '13px "KaiTi", serif';
    ctx.textAlign = 'left';
    ctx.fillText('【九星註】一白貪狼吉·二黑巨門凶·三碧禄存凶', cx - total / 2, cy + total / 2 + 30);
    ctx.fillText('四綠文曲吉·五黄廉貞大凶·六白武曲吉', cx - total / 2, cy + total / 2 + 48);
    ctx.fillText('七赤破軍凶·八白左輔吉·九紫右弼吉', cx - total / 2, cy + total / 2 + 66);
  }
  
  private drawGradeStamp(ctx: CanvasRenderingContext2D, grade: string, cx: number, cy: number): void {
    const radius = 40;
    
    ctx.save();
    
    ctx.fillStyle = 'rgba(204, 51, 51, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#CC3333';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    
    const rotation = -0.12;
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);
    
    ctx.fillStyle = '#CC3333';
    ctx.font = 'bold 28px "KaiTi", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(grade, cx, cy);
    
    ctx.restore();
    
    ctx.save();
    ctx.strokeStyle = 'rgba(204, 51, 51, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - radius + 5 + i * 17, cy + radius + 35);
      ctx.lineTo(cx - radius + 5 + i * 17 + 6, cy + radius + 45);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  private getChineseDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const yearOffset = (year - 4) % 60;
    const gan = tianGan[yearOffset % 10];
    const zhi = diZhi[yearOffset % 12];
    
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'];
    
    return `${gan}${zhi}年 ${lunarMonths[month - 1]}月${day}日`;
  }
  
  private showReport(): void {
    const container = document.getElementById('report-container');
    if (container) {
      container.classList.remove('open');
      void container.offsetWidth;
      container.classList.add('open');
    }
  }
  
  public hideReport(): void {
    const container = document.getElementById('report-container');
    if (container) {
      container.classList.remove('open');
    }
  }
  
  public reset(): void {
    this.isSurveying = false;
    this.pulseTime = 0;
    for (const key of Object.keys(this.haloMeshes)) {
      const mat = this.haloMeshes[key].material as THREE.MeshBasicMaterial;
      mat.opacity = 0;
    }
    this.drawInitialFloorplan();
    this.hideReport();
  }
}