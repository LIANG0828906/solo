import * as THREE from 'three';
import { DataPoint } from './dataParser';

interface Column {
  mesh: THREE.Mesh;
  data: DataPoint;
  targetHeight: number;
  currentHeight: number;
  isEntering: boolean;
  isExiting: boolean;
  enterProgress: number;
  exitProgress: number;
  isHighlighted: boolean;
}

interface ConnectionPlane {
  mesh: THREE.Mesh;
  leftIndex: number;
  rightIndex: number;
}

interface Particle {
  mesh: THREE.Mesh;
  angle: number;
  radius: number;
  speed: number;
  yOffset: number;
}

const COLORS = {
  bottom: new THREE.Color(0x64FFDA),
  top: new THREE.Color(0x1E90FF),
  highlight: new THREE.Color(0xFFFFFF),
  connection: new THREE.Color(0x64FFDA),
  grid: new THREE.Color(0x64FFDA)
};

const DIMENSIONS = {
  columnWidth: 1.5,
  columnDepth: 0.8,
  columnSpacing: 2.5,
  maxHeight: 10,
  viewportWidth: 30,
  maxColumns: 100
};

export class WaterfallController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private columns: Column[] = [];
  private connections: ConnectionPlane[] = [];
  private particles: Particle[] = [];
  private data: DataPoint[] = [];
  private scrollOffset: number = 0;
  private scrollSpeed: number = 1;
  private isPaused: boolean = false;
  private cameraAngle: number = 0;
  private cameraRadius: number = 25;
  private cameraHeight: number = 20;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedColumn: Column | null = null;
  private onColumnSelect: ((data: DataPoint | null) => void) | null = null;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.setupGround();
    this.setupParticles();
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private setupScene(): void {
    this.scene.fog = new THREE.FogExp2(0x0A192F, 0.015);
  }

  private setupCamera(): void {
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = Math.sin(this.cameraAngle) * this.cameraRadius;
    const z = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 2, 0);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x64FFDA, 0.5, 30);
    pointLight1.position.set(-15, 10, -15);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x1E90FF, 0.5, 30);
    pointLight2.position.set(15, 10, 15);
    this.scene.add(pointLight2);
  }

  private setupGround(): void {
    const gridHelper = new THREE.GridHelper(100, 100, COLORS.grid, COLORS.grid);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x0A192F,
      transparent: true,
      opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);
  }

  private setupParticles(): void {
    const corners = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 }
    ];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? COLORS.bottom : COLORS.top,
          transparent: true,
          opacity: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        const corner = corners[i];
        mesh.position.set(
          corner.x + (Math.random() - 0.5) * 5,
          1 + Math.random() * 3,
          corner.z + (Math.random() - 0.5) * 5
        );
        
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          angle: Math.random() * Math.PI * 2,
          radius: 2 + Math.random() * 2,
          speed: 0.3 + Math.random() * 0.5,
          yOffset: mesh.position.y
        });
      }
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.columns.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const column = this.columns.find(c => c.mesh === clickedMesh);
      
      if (column) {
        this.highlightColumn(column);
        if (this.onColumnSelect) {
          this.onColumnSelect(column.data);
        }
      }
    } else {
      this.clearSelection();
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private highlightColumn(column: Column): void {
    if (this.selectedColumn) {
      this.setColumnHighlight(this.selectedColumn, false);
    }
    
    this.selectedColumn = column;
    this.setColumnHighlight(column, true);
  }

  private clearSelection(): void {
    if (this.selectedColumn) {
      this.setColumnHighlight(this.selectedColumn, false);
      this.selectedColumn = null;
    }
    if (this.onColumnSelect) {
      this.onColumnSelect(null);
    }
  }

  private setColumnHighlight(column: Column, highlighted: boolean): void {
    column.isHighlighted = highlighted;
    const material = column.mesh.material as THREE.MeshPhongMaterial;
    
    if (highlighted) {
      material.emissive = COLORS.highlight;
      material.emissiveIntensity = 0.3;
    } else {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  public setData(data: DataPoint[]): void {
    this.clearAll();
    this.data = [...data];
    this.scrollOffset = 0;
    this.rebuildColumns();
  }

  private clearAll(): void {
    for (const column of this.columns) {
      this.scene.remove(column.mesh);
      column.mesh.geometry.dispose();
      (column.mesh.material as THREE.Material).dispose();
    }
    
    for (const conn of this.connections) {
      this.scene.remove(conn.mesh);
      conn.mesh.geometry.dispose();
      (conn.mesh.material as THREE.Material).dispose();
    }
    
    this.columns = [];
    this.connections = [];
    this.selectedColumn = null;
  }

  private rebuildColumns(): void {
    for (let i = 0; i < this.data.length; i++) {
      this.createColumn(this.data[i], i);
    }
    this.rebuildConnections();
  }

  private createColumn(data: DataPoint, index: number): Column {
    const geometry = new THREE.BoxGeometry(
      DIMENSIONS.columnWidth,
      0.01,
      DIMENSIONS.columnDepth
    );

    const material = new THREE.MeshPhongMaterial({
      color: COLORS.bottom,
      transparent: true,
      opacity: 1,
      shininess: 100
    });

    const mesh = new THREE.Mesh(geometry, material);
    const x = index * DIMENSIONS.columnSpacing;
    mesh.position.set(x, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.applyGradient(material, data.normalizedValue);

    this.scene.add(mesh);

    const column: Column = {
      mesh,
      data,
      targetHeight: data.normalizedValue,
      currentHeight: 0.01,
      isEntering: true,
      isExiting: false,
      enterProgress: 0,
      exitProgress: 0,
      isHighlighted: false
    };

    this.columns.push(column);
    return column;
  }

  private applyGradient(material: THREE.MeshPhongMaterial, height: number): void {
    const t = height / DIMENSIONS.maxHeight;
    const color = COLORS.bottom.clone().lerp(COLORS.top, t);
    material.color = color;
  }

  private rebuildConnections(): void {
    for (const conn of this.connections) {
      this.scene.remove(conn.mesh);
      conn.mesh.geometry.dispose();
      (conn.mesh.material as THREE.Material).dispose();
    }
    this.connections = [];

    for (let i = 0; i < this.columns.length - 1; i++) {
      this.createConnection(i, i + 1);
    }
  }

  private createConnection(leftIndex: number, rightIndex: number): void {
    const leftColumn = this.columns[leftIndex];
    const rightColumn = this.columns[rightIndex];

    const leftX = leftColumn.mesh.position.x;
    const rightX = rightColumn.mesh.position.x;
    const depth = DIMENSIONS.columnDepth;

    const geometry = new THREE.PlaneGeometry(
      rightX - leftX,
      1,
      10,
      1
    );

    const material = new THREE.MeshPhongMaterial({
      color: COLORS.connection,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      shininess: 50
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((leftX + rightX) / 2, 0, depth / 2 + 0.01);
    mesh.rotation.x = -Math.PI / 2;

    this.updateConnectionGeometry(geometry, leftColumn, rightColumn);

    this.scene.add(mesh);
    this.connections.push({
      mesh,
      leftIndex,
      rightIndex
    });
  }

  private updateConnectionGeometry(
    geometry: THREE.PlaneGeometry,
    leftColumn: Column,
    rightColumn: Column
  ): void {
    const positions = geometry.attributes.position;
    const leftHeight = leftColumn.currentHeight;
    const rightHeight = rightColumn.currentHeight;
    const width = geometry.parameters.width;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      const t = (x + width / 2) / width;
      const height = leftHeight + (rightHeight - leftHeight) * t;
      
      positions.setY(i, y + height);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  public setScrollSpeed(speed: number): void {
    this.scrollSpeed = Math.max(0.5, Math.min(2, speed));
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public setOnColumnSelect(callback: (data: DataPoint | null) => void): void {
    this.onColumnSelect = callback;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.scrollOffset += DIMENSIONS.columnSpacing * deltaTime * this.scrollSpeed;
      this.cameraAngle += 0.01 * deltaTime;
    }

    this.updateCameraPosition();
    this.updateColumns(deltaTime);
    this.updateConnections();
    this.updateParticles(deltaTime);
    this.manageColumnLifecycle();

    this.renderer.render(this.scene, this.camera);
  }

  private updateColumns(deltaTime: number): void {
    const baseX = -this.scrollOffset;

    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      const targetX = baseX + i * DIMENSIONS.columnSpacing;
      
      column.mesh.position.x = targetX;

      if (column.isEntering) {
        column.enterProgress = Math.min(1, column.enterProgress + deltaTime * 2);
        const easeProgress = this.easeOutCubic(column.enterProgress);
        column.currentHeight = column.targetHeight * easeProgress;
        this.updateColumnHeight(column);
        
        if (column.enterProgress >= 1) {
          column.isEntering = false;
        }
      } else if (column.isExiting) {
        column.exitProgress = Math.min(1, column.exitProgress + deltaTime * 2);
        const material = column.mesh.material as THREE.MeshPhongMaterial;
        material.opacity = 1 - column.exitProgress;
      }
    }
  }

  private updateColumnHeight(column: Column): void {
    const material = column.mesh.material as THREE.MeshPhongMaterial;
    
    if (!column.isHighlighted) {
      this.applyGradient(material, column.currentHeight);
    }

    column.mesh.scale.y = Math.max(0.01, column.currentHeight);
    column.mesh.position.y = column.currentHeight / 2;
  }

  private updateConnections(): void {
    for (const conn of this.connections) {
      const leftColumn = this.columns[conn.leftIndex];
      const rightColumn = this.columns[conn.rightIndex];
      
      if (leftColumn && rightColumn) {
        const geometry = conn.mesh.geometry as THREE.PlaneGeometry;
        this.updateConnectionGeometry(geometry, leftColumn, rightColumn);
        
        const material = conn.mesh.material as THREE.MeshPhongMaterial;
        const avgOpacity = (
          (leftColumn.mesh.material as THREE.MeshPhongMaterial).opacity +
          (rightColumn.mesh.material as THREE.MeshPhongMaterial).opacity
        ) / 2;
        material.opacity = avgOpacity * 0.3;
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.angle += particle.speed * deltaTime;
      particle.mesh.position.x += Math.cos(particle.angle) * deltaTime * 0.5;
      particle.mesh.position.z += Math.sin(particle.angle) * deltaTime * 0.5;
      particle.mesh.position.y = particle.yOffset + Math.sin(particle.angle * 2) * 0.3;
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(particle.angle * 3) * 0.2;
    }
  }

  private manageColumnLifecycle(): void {
    const viewportLeft = -DIMENSIONS.viewportWidth / 2;
    const viewportRight = DIMENSIONS.viewportWidth / 2;

    while (this.columns.length > DIMENSIONS.maxColumns) {
      this.removeColumn(0);
    }

    for (let i = this.columns.length - 1; i >= 0; i--) {
      const column = this.columns[i];
      
      if (column.mesh.position.x < viewportLeft - 5) {
        if (!column.isExiting) {
          column.isExiting = true;
          column.exitProgress = 0;
        }
        
        if (column.exitProgress >= 1) {
          this.removeColumn(i);
        }
      }
      
      if (column.mesh.position.x < viewportRight + 5 && 
          column.mesh.position.x > viewportLeft - 5) {
        column.mesh.visible = true;
      }
    }
  }

  private removeColumn(index: number): void {
    const column = this.columns[index];
    this.scene.remove(column.mesh);
    column.mesh.geometry.dispose();
    (column.mesh.material as THREE.Material).dispose();
    
    this.columns.splice(index, 1);
    
    if (this.selectedColumn === column) {
      this.selectedColumn = null;
      if (this.onColumnSelect) {
        this.onColumnSelect(null);
      }
    }
    
    this.rebuildConnections();
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public getLatestData(): DataPoint | null {
    if (this.columns.length === 0) return null;
    
    const visibleColumns = this.columns.filter(
      c => c.mesh.position.x > -DIMENSIONS.viewportWidth / 2 &&
           c.mesh.position.x < DIMENSIONS.viewportWidth / 2
    );
    
    if (visibleColumns.length === 0) return null;
    
    return visibleColumns[visibleColumns.length - 1].data;
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener('resize', this.onResize.bind(this));
    window.removeEventListener('click', this.onClick.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    
    this.clearAll();
    
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    
    this.renderer.dispose();
  }
}

export default WaterfallController;
