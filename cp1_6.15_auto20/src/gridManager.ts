import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export type StallType = 'burger' | 'milktea' | 'bbq';

export interface StallConfig {
  type: StallType;
  name: string;
  price: number;
  taste: number;
  queueCapacity: number;
  color: number;
  icon: string;
}

export interface Stall {
  id: string;
  type: StallType;
  gridX: number;
  gridZ: number;
  owner: 'player' | 'ai';
  customers: number;
  satisfaction: number;
  revenuePerHour: number[];
  mesh: THREE.Group;
  isFlashing: boolean;
  flashIntensity: number;
  buildProgress: number;
}

export interface Customer {
  id: string;
  mesh: THREE.Mesh;
  fromStall: Stall | null;
  toStall: Stall;
  progress: number;
  speed: number;
  path: THREE.Vector3[];
}

export const STALL_CONFIGS: Record<StallType, StallConfig> = {
  burger: {
    type: 'burger',
    name: '汉堡车',
    price: 500,
    taste: 4,
    queueCapacity: 8,
    color: 0xFFB6C1,
    icon: '🍔'
  },
  milktea: {
    type: 'milktea',
    name: '奶茶铺',
    price: 400,
    taste: 4.5,
    queueCapacity: 10,
    color: 0x98FB98,
    icon: '🧋'
  },
  bbq: {
    type: 'bbq',
    name: '烧烤摊',
    price: 600,
    taste: 5,
    queueCapacity: 6,
    color: 0xFF7F50,
    icon: '🍖'
  }
};

const GRID_SIZE = 6;
const CELL_SIZE = 2;
const MAX_CUSTOMERS = 30;

export class GridManager {
  scene: THREE.Scene;
  grid: (Stall | null)[][];
  stalls: Stall[];
  customers: Customer[];
  customerPool: THREE.Mesh[];
  pathLines: THREE.Line[];
  gridHelper: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    this.stalls = [];
    this.customers = [];
    this.customerPool = [];
    this.pathLines = [];
    this.gridHelper = new THREE.Group();
    
    this.initCustomerPool();
    this.createGrid();
  }
  
  private initCustomerPool(): void {
    const customerGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const colors = [0xFF69B4, 0x87CEEB, 0x98FB98, 0xFFD700, 0xFF7F50];
    
    for (let i = 0; i < MAX_CUSTOMERS; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const customerMat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(customerGeo, customerMat);
      mesh.visible = false;
      mesh.userData.poolIndex = i;
      this.customerPool.push(mesh);
      this.scene.add(mesh);
    }
  }
  
  private createGrid(): void {
    const gridGroup = new THREE.Group();
    gridGroup.name = 'grid';
    
    const streetTexture = this.createStreetTexture();
    const planeGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const planeMat = new THREE.MeshLambertMaterial({ 
      map: streetTexture,
      transparent: true
    });
    const ground = new THREE.Mesh(planeGeo, planeMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.raycast = () => {};
    gridGroup.add(ground);
    
    const lineMat = new THREE.LineBasicMaterial({ color: 0xE8E8E8, transparent: true, opacity: 0.6 });
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      const points1 = [
        new THREE.Vector3(-GRID_SIZE * CELL_SIZE / 2 + i * CELL_SIZE, 0, -GRID_SIZE * CELL_SIZE / 2),
        new THREE.Vector3(-GRID_SIZE * CELL_SIZE / 2 + i * CELL_SIZE, 0, GRID_SIZE * CELL_SIZE / 2)
      ];
      const line1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points1), lineMat);
      line1.raycast = () => {};
      gridGroup.add(line1);
      
      const points2 = [
        new THREE.Vector3(-GRID_SIZE * CELL_SIZE / 2, 0, -GRID_SIZE * CELL_SIZE / 2 + i * CELL_SIZE),
        new THREE.Vector3(GRID_SIZE * CELL_SIZE / 2, 0, -GRID_SIZE * CELL_SIZE / 2 + i * CELL_SIZE)
      ];
      const line2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points2), lineMat);
      line2.raycast = () => {};
      gridGroup.add(line2);
    }
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cellGeo = new THREE.BoxGeometry(CELL_SIZE * 0.9, 0.02, CELL_SIZE * 0.9);
        const cellMat = new THREE.MeshLambertMaterial({ 
          color: 0xFAFAFA, 
          transparent: true, 
          opacity: 0.3
        });
        const cell = new THREE.Mesh(cellGeo, cellMat);
        cell.position.set(
          -GRID_SIZE * CELL_SIZE / 2 + (x + 0.5) * CELL_SIZE,
          0.02,
          -GRID_SIZE * CELL_SIZE / 2 + (z + 0.5) * CELL_SIZE
        );
        cell.userData = { gridX: x, gridZ: z, isCell: true };
        cell.name = `cell_${x}_${z}`;
        gridGroup.add(cell);
      }
    }
    
    this.gridHelper = gridGroup;
    this.scene.add(gridGroup);
  }
  
  private createStreetTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.fillStyle = '#E8E0D0';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 64, 0);
      ctx.lineTo(i * 64, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * 64);
      ctx.lineTo(512, i * 64);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  gridToWorld(gridX: number, gridZ: number): THREE.Vector3 {
    return new THREE.Vector3(
      -GRID_SIZE * CELL_SIZE / 2 + (gridX + 0.5) * CELL_SIZE,
      0,
      -GRID_SIZE * CELL_SIZE / 2 + (gridZ + 0.5) * CELL_SIZE
    );
  }
  
  worldToGrid(worldX: number, worldZ: number): { gridX: number; gridZ: number } | null {
    const gridX = Math.floor((worldX + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);
    const gridZ = Math.floor((worldZ + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);
    
    if (gridX >= 0 && gridX < GRID_SIZE && gridZ >= 0 && gridZ < GRID_SIZE) {
      return { gridX, gridZ };
    }
    return null;
  }
  
  canBuild(gridX: number, gridZ: number): boolean {
    return this.grid[gridX]?.[gridZ] === null;
  }
  
  buildStall(type: StallType, gridX: number, gridZ: number, owner: 'player' | 'ai'): Stall | null {
    if (!this.canBuild(gridX, gridZ)) return null;
    
    const stallGroup = this.createStallMesh(type);
    const worldPos = this.gridToWorld(gridX, gridZ);
    stallGroup.position.copy(worldPos);
    stallGroup.scale.set(0, 0, 0);
    
    const stall: Stall = {
      id: uuidv4(),
      type,
      gridX,
      gridZ,
      owner,
      customers: 0,
      satisfaction: 0.7 + Math.random() * 0.3,
      revenuePerHour: Array(24).fill(0),
      mesh: stallGroup,
      isFlashing: false,
      flashIntensity: 0,
      buildProgress: 0
    };
    
    stallGroup.userData.stall = stall;
    this.grid[gridX][gridZ] = stall;
    this.stalls.push(stall);
    this.scene.add(stallGroup);
    
    return stall;
  }
  
  private createStallMesh(type: StallType): THREE.Group {
    const config = STALL_CONFIGS[type];
    const group = new THREE.Group();
    
    const baseGeo = new THREE.BoxGeometry(CELL_SIZE * 0.85, 0.1, CELL_SIZE * 0.85);
    const baseMat = new THREE.MeshLambertMaterial({ color: config.color });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    const bodyGeo = new THREE.BoxGeometry(CELL_SIZE * 0.7, 0.8, CELL_SIZE * 0.7);
    const bodyMat = new THREE.MeshLambertMaterial({ 
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);
    
    const roofGeo = new THREE.ConeGeometry(CELL_SIZE * 0.5, 0.4, 4);
    const roofMat = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.15;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
    
    const signGeo = new THREE.BoxGeometry(0.8, 0.3, 0.05);
    const signMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 0.8, CELL_SIZE * 0.36);
    group.add(sign);
    
    if (type === 'burger') {
      const bunGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16);
      const bunMat = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
      const topBun = new THREE.Mesh(bunGeo, bunMat);
      topBun.position.set(0.3, 1.0, 0);
      topBun.castShadow = true;
      group.add(topBun);
      
      const pattyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
      const pattyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const patty = new THREE.Mesh(pattyGeo, pattyMat);
      patty.position.set(0.3, 0.9, 0);
      group.add(patty);
    } else if (type === 'milktea') {
      const cupGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.3, 16);
      const cupMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(0.3, 1.0, 0);
      cup.castShadow = true;
      group.add(cup);
      
      const teaGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.2, 16);
      const teaMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
      const tea = new THREE.Mesh(teaGeo, teaMat);
      tea.position.set(0.3, 0.98, 0);
      group.add(tea);
    } else if (type === 'bbq') {
      const grillGeo = new THREE.BoxGeometry(0.4, 0.1, 0.3);
      const grillMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const grill = new THREE.Mesh(grillGeo, grillMat);
      grill.position.set(0.3, 0.95, 0);
      group.add(grill);
      
      const skewerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
      const skewerMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
      for (let i = 0; i < 3; i++) {
        const skewer = new THREE.Mesh(skewerGeo, skewerMat);
        skewer.rotation.z = Math.PI / 2;
        skewer.position.set(0.2 + i * 0.1, 1.0, 0);
        group.add(skewer);
      }
    }
    
    const ownerIndicatorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    const ownerIndicatorMat = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    });
    const ownerIndicator = new THREE.Mesh(ownerIndicatorGeo, ownerIndicatorMat);
    ownerIndicator.position.y = 1.5;
    ownerIndicator.name = 'ownerIndicator';
    group.add(ownerIndicator);
    
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.isStallPart = true;
      }
    });
    
    return group;
  }
  
  setOwnerIndicator(stall: Stall): void {
    const indicator = stall.mesh.getObjectByName('ownerIndicator') as THREE.Mesh;
    if (indicator) {
      const mat = indicator.material as THREE.MeshLambertMaterial;
      if (stall.owner === 'player') {
        mat.color.setHex(0xFF7F50);
        mat.emissive.setHex(0xFF7F50);
      } else {
        mat.color.setHex(0x87CEEB);
        mat.emissive.setHex(0x87CEEB);
      }
    }
  }
  
  updatePathLines(): void {
    this.pathLines.forEach(line => this.scene.remove(line));
    this.pathLines = [];
    
    if (this.stalls.length < 2) return;
    
    for (let i = 0; i < this.stalls.length; i++) {
      for (let j = i + 1; j < this.stalls.length; j++) {
        const stallA = this.stalls[i];
        const stallB = this.stalls[j];
        
        if (stallA.type === stallB.type) {
          const lineMat = new THREE.LineDashedMaterial({
            color: 0xAAAAAA,
            dashSize: 0.1,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.4
          });
          
          const points = [
            new THREE.Vector3(
              -GRID_SIZE * CELL_SIZE / 2 + (stallA.gridX + 0.5) * CELL_SIZE,
              0.1,
              -GRID_SIZE * CELL_SIZE / 2 + (stallA.gridZ + 0.5) * CELL_SIZE
            ),
            new THREE.Vector3(
              -GRID_SIZE * CELL_SIZE / 2 + (stallB.gridX + 0.5) * CELL_SIZE,
              0.1,
              -GRID_SIZE * CELL_SIZE / 2 + (stallB.gridZ + 0.5) * CELL_SIZE
            )
          ];
          
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            lineMat
          );
          line.computeLineDistances();
          this.pathLines.push(line);
          this.scene.add(line);
        }
      }
    }
  }
  
  spawnCustomer(fromStall: Stall | null, toStall: Stall): boolean {
    if (this.customers.length >= MAX_CUSTOMERS) return false;
    
    const availableMesh = this.customerPool.find(m => !m.visible);
    if (!availableMesh) return false;
    
    const fromPos = fromStall 
      ? this.gridToWorld(fromStall.gridX, fromStall.gridZ)
      : this.getRandomEdgePosition();
    const toPos = this.gridToWorld(toStall.gridX, toStall.gridZ);
    
    const path = this.createPath(fromPos, toPos);
    
    availableMesh.visible = true;
    availableMesh.position.copy(path[0]);
    
    const customer: Customer = {
      id: uuidv4(),
      mesh: availableMesh,
      fromStall,
      toStall,
      progress: 0,
      speed: 0.5 + Math.random() * 0.5,
      path
    };
    
    this.customers.push(customer);
    return true;
  }
  
  private getRandomEdgePosition(): THREE.Vector3 {
    const halfSize = GRID_SIZE * CELL_SIZE / 2;
    const edge = Math.floor(Math.random() * 4);
    const offset = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE * 0.8;
    
    switch (edge) {
      case 0: return new THREE.Vector3(offset, 0.2, -halfSize - 1);
      case 1: return new THREE.Vector3(halfSize + 1, 0.2, offset);
      case 2: return new THREE.Vector3(offset, 0.2, halfSize + 1);
      default: return new THREE.Vector3(-halfSize - 1, 0.2, offset);
    }
  }
  
  private createPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
    const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 2;
    const midZ = (from.z + to.z) / 2 + (Math.random() - 0.5) * 2;
    const mid = new THREE.Vector3(midX, 0.2, midZ);
    
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    return curve.getPoints(20);
  }
  
  updateCustomers(deltaTime: number): void {
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const customer = this.customers[i];
      customer.progress += deltaTime * customer.speed * 0.3;
      
      if (customer.progress >= 1) {
        customer.mesh.visible = false;
        this.customers.splice(i, 1);
        
        if (customer.toStall.customers < STALL_CONFIGS[customer.toStall.type].queueCapacity) {
          customer.toStall.customers++;
          const revenue = this.calculateRevenue(customer.toStall);
          customer.toStall.revenuePerHour[customer.toStall.revenuePerHour.length - 1] += revenue;
        }
      } else {
        const pointIndex = Math.floor(customer.progress * (customer.path.length - 1));
        const nextIndex = Math.min(pointIndex + 1, customer.path.length - 1);
        const t = (customer.progress * (customer.path.length - 1)) % 1;
        
        customer.mesh.position.lerpVectors(
          customer.path[pointIndex],
          customer.path[nextIndex],
          t
        );
        
        const direction = new THREE.Vector3()
          .subVectors(customer.path[nextIndex], customer.path[pointIndex])
          .normalize();
        customer.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
  }
  
  calculateRevenue(stall: Stall): number {
    const basePrice = STALL_CONFIGS[stall.type].price / 10;
    const tasteBonus = STALL_CONFIGS[stall.type].taste * 5;
    return basePrice + tasteBonus * stall.satisfaction;
  }
  
  updateStallCompetition(): void {
    const typeCounts: Record<StallType, number> = { burger: 0, milktea: 0, bbq: 0 };
    
    this.stalls.forEach(stall => {
      typeCounts[stall.type]++;
    });
    
    this.stalls.forEach(stall => {
      const sameTypeCount = typeCounts[stall.type];
      if (sameTypeCount > 1) {
        const competitionFactor = 1 / sameTypeCount;
        stall.satisfaction = Math.max(0.3, stall.satisfaction * competitionFactor * 1.2);
      } else {
        stall.satisfaction = Math.min(1, stall.satisfaction * 1.02);
      }
    });
  }
  
  aiBuild(): Stall | null {
    const emptyCells: { x: number; z: number }[] = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (this.grid[x][z] === null) {
          emptyCells.push({ x, z });
        }
      }
    }
    
    if (emptyCells.length === 0) return null;
    
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const types: StallType[] = ['burger', 'milktea', 'bbq'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return this.buildStall(type, cell.x, cell.z, 'ai');
  }
  
  getStallAt(gridX: number, gridZ: number): Stall | null {
    return this.grid[gridX]?.[gridZ] || null;
  }
  
  highlightCell(gridX: number, gridZ: number, canBuild: boolean): void {
    const cellName = `cell_${gridX}_${gridZ}`;
    const cell = this.gridHelper.getObjectByName(cellName) as THREE.Mesh;
    if (cell) {
      const mat = cell.material as THREE.MeshLambertMaterial;
      mat.color.setHex(canBuild ? 0x98FB98 : 0xFFB6C1);
      mat.opacity = 0.5;
    }
  }
  
  unhighlightCell(gridX: number, gridZ: number): void {
    const cellName = `cell_${gridX}_${gridZ}`;
    const cell = this.gridHelper.getObjectByName(cellName) as THREE.Mesh;
    if (cell) {
      const mat = cell.material as THREE.MeshLambertMaterial;
      mat.color.setHex(0xFAFAFA);
      mat.opacity = 0.3;
    }
  }
  
  unhighlightAllCells(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        this.unhighlightCell(x, z);
      }
    }
  }
  
  setStallFlashing(stall: Stall, flashing: boolean): void {
    stall.isFlashing = flashing;
    if (!flashing) {
      stall.flashIntensity = 0;
      stall.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
          child.material.emissiveIntensity = child.name === 'ownerIndicator' ? 0.5 : 0.1;
        }
      });
    }
  }
  
  update(deltaTime: number): void {
    this.stalls.forEach(stall => {
      if (stall.buildProgress < 1) {
        stall.buildProgress = Math.min(1, stall.buildProgress + deltaTime * 2);
        const scale = this.elasticOut(stall.buildProgress);
        stall.mesh.scale.setScalar(scale);
      }
      
      if (stall.isFlashing) {
        stall.flashIntensity = (Math.sin(Date.now() * 0.01) + 1) / 2;
        stall.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
            child.material.emissiveIntensity = 0.2 + stall.flashIntensity * 0.8;
          }
        });
      }
    });
    
    this.updateCustomers(deltaTime);
  }
  
  private elasticOut(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }
  
  resetHourRevenue(): void {
    this.stalls.forEach(stall => {
      stall.revenuePerHour.push(0);
      if (stall.revenuePerHour.length > 24) {
        stall.revenuePerHour.shift();
      }
    });
  }
  
  get gridSize(): number {
    return GRID_SIZE;
  }
  
  get cellSize(): number {
    return CELL_SIZE;
  }
}
