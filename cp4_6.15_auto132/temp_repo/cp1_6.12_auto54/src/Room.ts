import * as THREE from 'three';

export interface WindowData {
  id: string;
  wallIndex: number;
  position: THREE.Vector2;
  width: number;
  height: number;
}

export interface DoorData {
  id: string;
  wallIndex: number;
  position: THREE.Vector2;
  width: number;
  height: number;
}

export interface WallInfo {
  index: number;
  area: number;
  windows: number;
  doors: number;
  lightIntensity: number;
}

const WALL_HEIGHT = 3;
const DEFAULT_WINDOW_WIDTH = 1.5;
const DEFAULT_WINDOW_HEIGHT = 1.2;
const DEFAULT_DOOR_WIDTH = 0.9;
const DEFAULT_DOOR_HEIGHT = 2;

export class Room {
  public group: THREE.Group;
  public walls: THREE.Mesh[] = [];
  public wallEdges: THREE.LineSegments[] = [];
  public floor: THREE.Mesh;
  public ceiling: THREE.Mesh;
  public windows: { data: WindowData; mesh: THREE.Group; light: THREE.SpotLight }[] = [];
  public doors: { data: DoorData; mesh: THREE.Group }[] = [];
  public lightCones: THREE.Mesh[] = [];
  public lightSpots: THREE.Mesh[] = [];
  public airflowArrows: THREE.Group[] = [];
  public airflowParticles: THREE.Points | null = null;

  private length: number;
  private width: number;
  private height: number = WALL_HEIGHT;
  private targetLength: number;
  private targetWidth: number;
  private animating: boolean = false;
  private animProgress: number = 0;
  private startLength: number;
  private startWidth: number;

  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  private particleData: { positions: Float32Array; velocities: Float32Array; colors: Float32Array; offsets: number[] } | null = null;
  private airflowDensity: number = 5;
  private airflowSpeed: number = 1;

  constructor(scene: THREE.Scene, sunLight: THREE.DirectionalLight, ambientLight: THREE.AmbientLight, length: number = 6, width: number = 4) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.ambientLight = ambientLight;
    this.length = length;
    this.width = width;
    this.targetLength = length;
    this.targetWidth = width;
    this.startLength = length;
    this.startWidth = width;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.floor = this.createFloor();
    this.ceiling = this.createCeiling();
    this.createWalls();
    this.group.add(this.floor, this.ceiling);
  }

  private createFloor(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.length, this.width);
    const material = new THREE.MeshStandardMaterial({
      color: 0xd9d9d9,
      side: THREE.DoubleSide,
      roughness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'floor' };
    return mesh;
  }

  private createCeiling(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.length, this.width);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      roughness: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = this.height;
    mesh.userData = { type: 'ceiling' };
    return mesh;
  }

  private createWalls(): void {
    this.walls.forEach(w => this.group.remove(w));
    this.wallEdges.forEach(e => this.group.remove(e));
    this.walls = [];
    this.wallEdges = [];

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      roughness: 0.85
    });

    const halfL = this.length / 2;
    const halfW = this.width / 2;
    const h = this.height;

    const wallConfigs = [
      { size: [this.length, h], pos: [0, h / 2, -halfW], rot: [0, 0, 0], name: 'south' },
      { size: [this.length, h], pos: [0, h / 2, halfW], rot: [0, Math.PI, 0], name: 'north' },
      { size: [this.width, h], pos: [-halfL, h / 2, 0], rot: [0, Math.PI / 2, 0], name: 'west' },
      { size: [this.width, h], pos: [halfL, h / 2, 0], rot: [0, -Math.PI / 2, 0], name: 'east' }
    ];

    wallConfigs.forEach((config, index) => {
      const geometry = new THREE.PlaneGeometry(config.size[0], config.size[1]);
      const mesh = new THREE.Mesh(geometry, wallMaterial.clone());
      mesh.position.set(config.pos[0], config.pos[1], config.pos[2]);
      mesh.rotation.set(config.rot[0], config.rot[1], config.rot[2]);
      mesh.receiveShadow = true;
      mesh.userData = { type: 'wall', wallIndex: index, wallName: config.name };
      this.walls.push(mesh);
      this.group.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const line = new THREE.LineSegments(edges, lineMaterial);
      line.position.copy(mesh.position);
      line.rotation.copy(mesh.rotation);
      this.wallEdges.push(line);
      this.group.add(line);
    });
  }

  public setDimensions(length: number, width: number): void {
    if (length === this.length && width === this.width) return;
    this.startLength = this.length;
    this.startWidth = this.width;
    this.targetLength = length;
    this.targetWidth = width;
    this.animating = true;
    this.animProgress = 0;
  }

  public getLength(): number { return this.length; }
  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }

  public addWindow(): WindowData {
    const wallIndex = Math.floor(Math.random() * 4);
    const wallDims = this.getWallDimensions(wallIndex);
    const maxX = wallDims.x - DEFAULT_WINDOW_WIDTH;
    const maxY = wallDims.y - DEFAULT_WINDOW_HEIGHT;
    const position = new THREE.Vector2(
      Math.random() * maxX + DEFAULT_WINDOW_WIDTH / 2,
      Math.random() * maxY + DEFAULT_WINDOW_HEIGHT / 2 + 0.3
    );

    const data: WindowData = {
      id: 'win_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      wallIndex,
      position,
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT
    };

    const mesh = this.createWindowMesh(data);
    const light = this.createWindowLight(data);

    this.windows.push({ data, mesh, light });
    this.group.add(mesh);
    this.scene.add(light);
    this.updateLightConeAndSpot(data);

    this.refreshWindowsAndDoorsPositions();

    return data;
  }

  public addDoor(): DoorData {
    const wallIndex = Math.floor(Math.random() * 4);
    const wallDims = this.getWallDimensions(wallIndex);
    const maxX = wallDims.x - DEFAULT_DOOR_WIDTH;
    const position = new THREE.Vector2(
      Math.random() * maxX + DEFAULT_DOOR_WIDTH / 2,
      DEFAULT_DOOR_HEIGHT / 2
    );

    const data: DoorData = {
      id: 'door_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      wallIndex,
      position,
      width: DEFAULT_DOOR_WIDTH,
      height: DEFAULT_DOOR_HEIGHT
    };

    const mesh = this.createDoorMesh(data);
    this.doors.push({ data, mesh });
    this.group.add(mesh);

    this.refreshWindowsAndDoorsPositions();

    return data;
  }

  private createWindowMesh(data: WindowData): THREE.Group {
    const group = new THREE.Group();
    group.userData = { type: 'window', id: data.id, wallIndex: data.wallIndex };

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.3
    });

    const frameThickness = 0.05;
    const frameDepth = 0.05;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(data.width + frameThickness * 2, frameThickness, frameDepth),
      frameMaterial
    );
    top.position.y = data.height / 2;
    group.add(top);

    const bottom = top.clone();
    bottom.position.y = -data.height / 2;
    group.add(bottom);

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, data.height, frameDepth),
      frameMaterial
    );
    left.position.x = -data.width / 2;
    group.add(left);

    const right = left.clone();
    right.position.x = data.width / 2;
    group.add(right);

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xbfefff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(data.width - frameThickness * 2, data.height - frameThickness * 2),
      glassMaterial
    );
    glass.position.z = frameDepth / 2;
    group.add(glass);

    const worldPos = this.getWallWorldPosition(data.wallIndex, data.position);
    group.position.copy(worldPos.position);
    group.rotation.copy(worldPos.rotation);

    return group;
  }

  private createWindowLight(data: WindowData): THREE.SpotLight {
    const light = new THREE.SpotLight(0xfff4d6, 1.5, 30, Math.PI / 6, 0.5, 1);
    const worldPos = this.getWallWorldPosition(data.wallIndex, data.position);
    light.position.copy(worldPos.position);

    const dir = this.getWallNormal(data.wallIndex);
    const target = new THREE.Object3D();
    target.position.copy(worldPos.position).add(dir.multiplyScalar(10));
    light.target = target;
    this.scene.add(target);

    light.castShadow = false;
    light.userData = { windowId: data.id };
    return light;
  }

  private createDoorMesh(data: DoorData): THREE.Group {
    const group = new THREE.Group();
    group.userData = { type: 'door', id: data.id, wallIndex: data.wallIndex };

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.7,
      metalness: 0.1
    });

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(data.width, data.height, 0.08),
      doorMaterial
    );
    group.add(door);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.6
    });
    const frameThickness = 0.04;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(data.width + frameThickness * 2, frameThickness, 0.1),
      frameMaterial
    );
    top.position.y = data.height / 2 + frameThickness / 2;
    group.add(top);

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, data.height, 0.1),
      frameMaterial
    );
    left.position.x = -data.width / 2 - frameThickness / 2;
    group.add(left);

    const right = left.clone();
    right.position.x = data.width / 2 + frameThickness / 2;
    group.add(right);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 })
    );
    knob.position.set(data.width / 2 - 0.1, 0, 0.06);
    group.add(knob);

    const worldPos = this.getWallWorldPosition(data.wallIndex, data.position);
    group.position.copy(worldPos.position);
    group.rotation.copy(worldPos.rotation);

    return group;
  }

  public getWallDimensions(wallIndex: number): THREE.Vector2 {
    if (wallIndex === 0 || wallIndex === 1) {
      return new THREE.Vector2(this.length, this.height);
    } else {
      return new THREE.Vector2(this.width, this.height);
    }
  }

  public getWallNormal(wallIndex: number): THREE.Vector3 {
    switch (wallIndex) {
      case 0: return new THREE.Vector3(0, 0, 1);
      case 1: return new THREE.Vector3(0, 0, -1);
      case 2: return new THREE.Vector3(1, 0, 0);
      case 3: return new THREE.Vector3(-1, 0, 0);
      default: return new THREE.Vector3(0, 0, 1);
    }
  }

  public getWallWorldPosition(wallIndex: number, pos2D: THREE.Vector2): { position: THREE.Vector3; rotation: THREE.Euler } {
    const halfL = this.length / 2;
    const halfW = this.width / 2;
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();

    switch (wallIndex) {
      case 0:
        position.set(pos2D.x - this.length / 2, pos2D.y, -halfW);
        rotation.set(0, 0, 0);
        break;
      case 1:
        position.set(pos2D.x - this.length / 2, pos2D.y, halfW);
        rotation.set(0, Math.PI, 0);
        break;
      case 2:
        position.set(-halfL, pos2D.y, pos2D.x - this.width / 2);
        rotation.set(0, Math.PI / 2, 0);
        break;
      case 3:
        position.set(halfL, pos2D.y, pos2D.x - this.width / 2);
        rotation.set(0, -Math.PI / 2, 0);
        break;
    }

    return { position, rotation };
  }

  private refreshWindowsAndDoorsPositions(): void {
    this.windows.forEach(item => {
      const wp = this.getWallWorldPosition(item.data.wallIndex, item.data.position);
      item.mesh.position.copy(wp.position);
      item.mesh.rotation.copy(wp.rotation);

      const lightPos = this.getWallWorldPosition(item.data.wallIndex, item.data.position);
      item.light.position.copy(lightPos.position);
      const dir = this.getWallNormal(item.data.wallIndex);
      item.light.target.position.copy(lightPos.position).add(dir.multiplyScalar(10));
    });

    this.doors.forEach(item => {
      const wp = this.getWallWorldPosition(item.data.wallIndex, item.data.position);
      item.mesh.position.copy(wp.position);
      item.mesh.rotation.copy(wp.rotation);
    });
  }

  public moveWindow(id: string, newPos: THREE.Vector2): void {
    const win = this.windows.find(w => w.data.id === id);
    if (!win) return;

    const wallDims = this.getWallDimensions(win.data.wallIndex);
    const halfW = win.data.width / 2;
    const halfH = win.data.height / 2;

    newPos.x = Math.max(halfW, Math.min(wallDims.x - halfW, newPos.x));
    newPos.y = Math.max(halfH + 0.1, Math.min(wallDims.y - halfH, newPos.y));

    win.data.position.copy(newPos);
    this.refreshWindowsAndDoorsPositions();
    this.updateLightConeAndSpot(win.data);
  }

  public moveDoor(id: string, newPos: THREE.Vector2): void {
    const door = this.doors.find(d => d.data.id === id);
    if (!door) return;

    const wallDims = this.getWallDimensions(door.data.wallIndex);
    const halfW = door.data.width / 2;
    const halfH = door.data.height / 2;

    newPos.x = Math.max(halfW, Math.min(wallDims.x - halfW, newPos.x));
    newPos.y = Math.max(halfH, Math.min(wallDims.y - halfH, newPos.y));

    door.data.position.copy(newPos);
    this.refreshWindowsAndDoorsPositions();
  }

  public updateSunPosition(hour: number): void {
    const t = (hour - 6) / 12;
    const elevation = Math.sin(t * Math.PI) * 60 + 5;
    const azimuth = (t - 0.5) * 180;

    const elevRad = THREE.MathUtils.degToRad(elevation);
    const azimRad = THREE.MathUtils.degToRad(azimuth);

    const dist = 30;
    this.sunLight.position.set(
      dist * Math.cos(elevRad) * Math.sin(azimRad),
      dist * Math.sin(elevRad),
      dist * Math.cos(elevRad) * Math.cos(azimRad)
    );
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.intensity = Math.max(0.2, Math.sin(t * Math.PI) * 1.2);

    const ambientIntensity = 0.2 + Math.sin(t * Math.PI) * 0.4;
    this.ambientLight.intensity = ambientIntensity;

    this.windows.forEach(w => this.updateLightConeAndSpot(w.data));
  }

  public updateLightConeAndSpot(data: WindowData): void {
    const existingCone = this.lightCones.find(c => c.userData.windowId === data.id);
    const existingSpot = this.lightSpots.find(s => s.userData.windowId === data.id);

    const worldPos = this.getWallWorldPosition(data.wallIndex, data.position);
    const dir = this.getWallNormal(data.wallIndex);
    const sunDir = this.sunLight.position.clone().normalize();
    const dot = dir.dot(sunDir);

    if (existingCone) this.group.remove(existingCone);
    if (existingSpot) this.floor.remove(existingSpot);

    if (dot < 0) {
      this.lightCones = this.lightCones.filter(c => c !== existingCone);
      this.lightSpots = this.lightSpots.filter(s => s !== existingSpot);
      return;
    }

    const coneLength = 15;
    const coneRadius = data.width * 1.5;
    const coneGeom = new THREE.ConeGeometry(coneRadius, coneLength, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff4b8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.copy(worldPos.position).add(dir.clone().multiplyScalar(coneLength / 2));
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    cone.quaternion.copy(quat);
    cone.userData = { windowId: data.id, type: 'lightCone' };
    cone.visible = this.showLightCones;
    this.group.add(cone);
    if (existingCone) {
      this.lightCones = this.lightCones.filter(c => c !== existingCone);
    }
    this.lightCones.push(cone);

    const spotCanvas = document.createElement('canvas');
    spotCanvas.width = 128;
    spotCanvas.height = 128;
    const sctx = spotCanvas.getContext('2d')!;
    const gradient = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 250, 200, 0.7)');
    gradient.addColorStop(0.5, 'rgba(255, 250, 200, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 250, 200, 0)');
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, 128, 128);
    const spotTexture = new THREE.CanvasTexture(spotCanvas);

    const spotSize = data.width * 3;
    const spotGeom = new THREE.PlaneGeometry(spotSize, spotSize);
    const spotMat = new THREE.MeshBasicMaterial({
      map: spotTexture,
      transparent: true,
      opacity: dot * 0.8,
      depthWrite: false
    });
    const spot = new THREE.Mesh(spotGeom, spotMat);
    spot.rotation.x = -Math.PI / 2;
    const floorPos = worldPos.position.clone().add(dir.clone().multiplyScalar(coneLength * 0.6));
    spot.position.set(floorPos.x, 0.01, floorPos.z);
    spot.userData = { windowId: data.id, type: 'lightSpot' };
    spot.visible = this.showLightCones;
    this.group.add(spot);
    if (existingSpot) {
      this.lightSpots = this.lightSpots.filter(s => s !== existingSpot);
    }
    this.lightSpots.push(spot);
  }

  private showLightCones: boolean = true;
  private showAirflow: boolean = false;

  public setShowLightCones(show: boolean): void {
    this.showLightCones = show;
    this.lightCones.forEach(c => c.visible = show);
    this.lightSpots.forEach(s => s.visible = show);
  }

  public setShowAirflow(show: boolean): void {
    this.showAirflow = show;
    if (show) {
      this.buildAirflow();
    } else {
      this.clearAirflow();
    }
  }

  public setAirflowDensity(density: number): void {
    this.airflowDensity = density;
    if (this.showAirflow) {
      this.clearAirflow();
      this.buildAirflow();
    }
  }

  public setAirflowSpeed(speed: number): void {
    this.airflowSpeed = speed;
  }

  public getAirflowSpeed(): number { return this.airflowSpeed; }
  public getAirflowDensity(): number { return this.airflowDensity; }

  private buildAirflow(): void {
    this.clearAirflow();

    const westWindows = this.windows.filter(w => w.data.wallIndex === 2);
    const eastDoors = this.doors.filter(d => d.data.wallIndex === 3);

    if (westWindows.length === 0 || eastDoors.length === 0) return;

    const arrowCount = Math.min(this.airflowDensity * 2, 20);

    for (let i = 0; i < arrowCount; i++) {
      const win = westWindows[i % westWindows.length];
      const door = eastDoors[i % eastDoors.length];

      const startWP = this.getWallWorldPosition(win.data.wallIndex, win.data.position);
      const endWP = this.getWallWorldPosition(door.data.wallIndex, door.data.position);

      const start = startWP.position.clone();
      const end = endWP.position.clone();

      const mid1 = start.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * this.length * 0.4,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * this.width * 0.4
      ));
      const mid2 = end.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * this.length * 0.4,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * this.width * 0.4
      ));

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const arrowGroup = this.createArrowAlongCurve(curve);
      this.airflowArrows.push(arrowGroup);
      this.group.add(arrowGroup);
    }

    this.initAirflowParticles();
  }

  private createArrowAlongCurve(curve: THREE.CatmullRomCurve3): THREE.Group {
    const group = new THREE.Group();
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.5
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);

    const arrowGeom = new THREE.ConeGeometry(0.08, 0.2, 8);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x29b6f6,
      transparent: true,
      opacity: 0.7
    });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.userData = { curve, t: 0 };
    group.add(arrow);

    return group;
  }

  private initAirflowParticles(): void {
    const maxParticles = 500;
    const particleCount = Math.min(this.airflowDensity * 30, maxParticles);

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const offsets: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = -this.length / 2 + Math.random() * 0.5;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2;
      positions[i * 3 + 2] = -this.width / 2 + Math.random() * this.width;

      velocities[i * 3] = 0.02 + Math.random() * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      offsets.push(Math.random());
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });

    this.airflowParticles = new THREE.Points(geom, mat);
    this.particleData = { positions, velocities, colors, offsets };
    this.group.add(this.airflowParticles);
  }

  private clearAirflow(): void {
    this.airflowArrows.forEach(a => this.group.remove(a));
    this.airflowArrows = [];
    if (this.airflowParticles) {
      this.group.remove(this.airflowParticles);
      this.airflowParticles = null;
      this.particleData = null;
    }
  }

  public getWallInfo(wallIndex: number): WallInfo {
    const dims = this.getWallDimensions(wallIndex);
    const area = dims.x * dims.y;
    const windows = this.windows.filter(w => w.data.wallIndex === wallIndex).length;
    const doors = this.doors.filter(d => d.data.wallIndex === wallIndex).length;

    const hour = this.currentHour;
    const t = (hour - 6) / 12;
    const sunIntensity = Math.max(0, Math.sin(t * Math.PI));
    const wallNormal = this.getWallNormal(wallIndex);
    const sunDir = this.sunLight.position.clone().normalize();
    const dot = Math.max(0, wallNormal.dot(sunDir.negate()));
    const lightIntensity = sunIntensity * dot * 100;

    return { index: wallIndex, area, windows, doors, lightIntensity };
  }

  private currentHour: number = 12;
  public setCurrentHour(hour: number): void {
    this.currentHour = hour;
  }

  public update(delta: number): void {
    if (this.animating) {
      this.animProgress += delta / 0.3;
      if (this.animProgress >= 1) {
        this.animProgress = 1;
        this.animating = false;
        this.length = this.targetLength;
        this.width = this.targetWidth;
      } else {
        const ease = 1 - Math.pow(1 - this.animProgress, 3);
        this.length = this.startLength + (this.targetLength - this.startLength) * ease;
        this.width = this.startWidth + (this.targetWidth - this.startWidth) * ease;
      }
      this.rebuildGeometry();
    }

    this.airflowArrows.forEach(group => {
      group.children.forEach(child => {
        if ((child as THREE.Mesh).userData?.curve) {
          const arrow = child as THREE.Mesh;
          const curve = arrow.userData.curve as THREE.CatmullRomCurve3;
          arrow.userData.t = (arrow.userData.t + delta * 0.5 * this.airflowSpeed) % 1;
          const pos = curve.getPointAt(arrow.userData.t);
          arrow.position.copy(pos);
          const tangent = curve.getTangentAt(arrow.userData.t).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          arrow.quaternion.setFromUnitVectors(up, tangent);
        }
      });
    });

    if (this.airflowParticles && this.particleData) {
      const pos = this.particleData.positions;
      const vel = this.particleData.velocities;
      const halfL = this.length / 2;
      const halfW = this.width / 2;

      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3] += vel[i * 3] * this.airflowSpeed;
        pos[i * 3 + 1] += vel[i * 3 + 1] * this.airflowSpeed;
        pos[i * 3 + 2] += vel[i * 3 + 2] * this.airflowSpeed;

        if (pos[i * 3] > halfL - 0.1) {
          pos[i * 3] = -halfL + 0.1;
          pos[i * 3 + 1] = 0.5 + Math.random() * 2;
          pos[i * 3 + 2] = -halfW + Math.random() * this.width;
        }
        pos[i * 3 + 1] = Math.max(0.2, Math.min(this.height - 0.2, pos[i * 3 + 1]));
        pos[i * 3 + 2] = Math.max(-halfW + 0.1, Math.min(halfW - 0.1, pos[i * 3 + 2]));
      }
      (this.airflowParticles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private rebuildGeometry(): void {
    this.floor.geometry.dispose();
    this.floor.geometry = new THREE.PlaneGeometry(this.length, this.width);

    this.ceiling.geometry.dispose();
    this.ceiling.geometry = new THREE.PlaneGeometry(this.length, this.width);
    this.ceiling.position.y = this.height;

    this.createWalls();
    this.refreshWindowsAndDoorsPositions();
  }

  public dispose(): void {
    this.scene.remove(this.group);
    this.windows.forEach(w => {
      this.scene.remove(w.light);
      this.scene.remove(w.light.target);
    });
  }
}
