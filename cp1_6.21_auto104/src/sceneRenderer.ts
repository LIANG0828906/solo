/**
 * 3D场景渲染模块
 * 职责：初始化Three.js场景，加载户型网格并在地面上绘制10x10热力网格
 * 根据数据值设置每个方格的高度和颜色，支持鼠标OrbitControls
 * 点击方格弹出信息面板
 * 数据流向：dataReceiver → sceneRenderer → Three.js渲染输出
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { RoomData, dataReceiver } from './dataReceiver';

interface RoomLayout {
  id: number;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

interface HeatCell {
  mesh: THREE.Mesh;
  roomId: number;
  gridX: number;
  gridZ: number;
  targetHeight: number;
  currentHeight: number;
  baseColor: THREE.Color;
}

const ROOM_LAYOUTS: RoomLayout[] = [
  { id: 1, name: '客厅', x: 0, z: 0, width: 12, depth: 10 },
  { id: 3, name: '卧室', x: -11, z: 0, width: 8, depth: 10 },
  { id: 4, name: '书房', x: 11, z: 0, width: 8, depth: 10 },
  { id: 2, name: '厨房', x: 11, z: -11, width: 8, depth: 8 }
];

const GRID_SIZE = 10;
const MAX_HEIGHT = 1.5;
const WALL_HEIGHT = 0.02;

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private roomFloors: Map<number, THREE.Mesh> = new Map();
  private heatCells: Map<number, HeatCell[][]> = new Map();
  private cellMeshes: THREE.Mesh[] = [];

  private animationId: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  private onRoomClickCallback: ((roomId: number, roomData: RoomData) => void) | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  private init(): void {
    this.scene.background = new THREE.Color('#1A1A2E');
    this.scene.fog = new THREE.Fog('#1A1A2E', 35, 80);

    const { clientWidth, clientHeight } = this.container;
    this.camera.fov = 60;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(0, 22, 22);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.setupLights();
    this.createFloorPlan();
    this.createHeatGrid();
    this.createWalls();

    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(10, 20, 15);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 60;
    directional.shadow.camera.left = -25;
    directional.shadow.camera.right = 25;
    directional.shadow.camera.top = 25;
    directional.shadow.camera.bottom = -25;
    this.scene.add(directional);

    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.25);
    fillLight.position.set(-12, 10, -8);
    this.scene.add(fillLight);
  }

  private createFloorPlan(): void {
    const houseGroup = new THREE.Group();
    houseGroup.name = 'house';

    const totalGroup = new THREE.Group();
    totalGroup.name = 'floor';

    for (const room of ROOM_LAYOUTS) {
      const floorGeo = new THREE.PlaneGeometry(room.width, room.depth);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xE0E0E0,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        roughness: 0.85
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.x, WALL_HEIGHT, room.z);
      floor.receiveShadow = true;
      floor.userData.roomId = room.id;
      floor.userData.roomName = room.name;
      floor.name = `floor-${room.id}`;
      totalGroup.add(floor);
      this.roomFloors.set(room.id, floor);
    }

    houseGroup.add(totalGroup);
    this.scene.add(houseGroup);
  }

  private createWalls(): void {
    const wallGroup = new THREE.Group();
    wallGroup.name = 'walls';

    const wallMat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.2
    });

    for (const room of ROOM_LAYOUTS) {
      const hx = room.width / 2;
      const hz = room.depth / 2;
      const cx = room.x;
      const cz = room.z;
      const y = WALL_HEIGHT + 0.002;

      const corners: THREE.Vector3[] = [
        new THREE.Vector3(cx - hx, y, cz - hz),
        new THREE.Vector3(cx + hx, y, cz - hz),
        new THREE.Vector3(cx + hx, y, cz + hz),
        new THREE.Vector3(cx - hx, y, cz + hz),
        new THREE.Vector3(cx - hx, y, cz - hz)
      ];

      const lineGeo = new THREE.BufferGeometry().setFromPoints(corners);
      const line = new THREE.Line(lineGeo, wallMat);
      wallGroup.add(line);
    }

    this.scene.add(wallGroup);

    const labelsGroup = new THREE.Group();
    labelsGroup.name = 'roomLabels';
    this.scene.add(labelsGroup);
  }

  private createHeatGrid(): void {
    for (const room of ROOM_LAYOUTS) {
      const hx = room.width / 2;
      const hz = room.depth / 2;
      const cellW = room.width / GRID_SIZE;
      const cellD = room.depth / GRID_SIZE;
      const cells: HeatCell[][] = [];

      for (let gz = 0; gz < GRID_SIZE; gz++) {
        cells[gz] = [];
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const px = room.x - hx + cellW / 2 + gx * cellW;
          const pz = room.z - hz + cellD / 2 + gz * cellD;

          const boxGeo = new THREE.BoxGeometry(cellW * 0.92, 0.01, cellD * 0.92);
          const initialColor = this.heatToColor(0.3);

          const boxMat = new THREE.MeshStandardMaterial({
            color: initialColor,
            transparent: true,
            opacity: 0.7,
            roughness: 0.4,
            metalness: 0.1,
            emissive: initialColor.clone().multiplyScalar(0.15)
          });

          const mesh = new THREE.Mesh(boxGeo, boxMat);
          mesh.position.set(px, WALL_HEIGHT + 0.02, pz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.roomId = room.id;
          mesh.userData.isHeatCell = true;
          mesh.userData.gridX = gx;
          mesh.userData.gridZ = gz;

          this.scene.add(mesh);
          this.cellMeshes.push(mesh);

          cells[gz][gx] = {
            mesh,
            roomId: room.id,
            gridX: gx,
            gridZ: gz,
            targetHeight: 0,
            currentHeight: 0,
            baseColor: initialColor.clone()
          };
        }
      }

      this.heatCells.set(room.id, cells);
    }
  }

  private heatToColor(t: number): THREE.Color {
    const clamped = Math.min(Math.max(t, 0), 1);
    const hsl1 = { h: 240 / 360, s: 1, l: 0.5 };
    const hsl2 = { h: 120 / 360, s: 1, l: 0.5 };
    const hsl3 = { h: 0 / 360, s: 1, l: 0.5 };

    let result;
    if (clamped < 0.5) {
      const k = clamped / 0.5;
      result = this.lerpHSL(hsl1, hsl2, k);
    } else {
      const k = (clamped - 0.5) / 0.5;
      result = this.lerpHSL(hsl2, hsl3, k);
    }

    const color = new THREE.Color();
    color.setHSL(result.h, result.s, result.l);
    return color;
  }

  private lerpHSL(a: { h: number; s: number; l: number }, b: { h: number; s: number; l: number }, t: number) {
    return {
      h: a.h + (b.h - a.h) * t,
      s: a.s + (b.s - a.s) * t,
      l: a.l + (b.l - a.l) * t
    };
  }

  public updateRoomHeat(roomId: number, heatValue: number): void {
    const cells = this.heatCells.get(roomId);
    if (!cells) return;

    const targetHeight = heatValue * MAX_HEIGHT;
    const targetColor = this.heatToColor(heatValue);

    for (let gz = 0; gz < GRID_SIZE; gz++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const cell = cells[gz][gx];
        const noise = this.cellNoise(gx, gz);
        const cellTargetH = Math.max(0.02, targetHeight * (0.7 + 0.3 * noise));
        const cellColor = targetColor.clone();
        cellColor.offsetHSL(0, 0, noise * 0.06 - 0.03);

        cell.targetHeight = cellTargetH;
        cell.baseColor = cellColor.clone();

        const obj: { h: number } = { h: cell.currentHeight };
        const material = cell.mesh.material as THREE.MeshStandardMaterial;

        const startColor = material.color.clone();

        new TWEEN.Tween(obj)
          .to({ h: cellTargetH }, 500)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate(() => {
            cell.currentHeight = obj.h;
            cell.mesh.scale.y = Math.max(0.01, obj.h / 0.01);
            cell.mesh.position.y = WALL_HEIGHT + 0.02 + obj.h / 2;
          })
          .start();

        const colorObj = { t: 0 };
        new TWEEN.Tween(colorObj)
          .to({ t: 1 }, 500)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate(() => {
            const c = startColor.clone().lerp(cellColor, colorObj.t);
            material.color.copy(c);
            material.emissive.copy(c.clone().multiplyScalar(0.15));
            material.needsUpdate = true;
          })
          .start();
      }
    }
  }

  public updateAllRooms(rooms: Map<number, RoomData>): void {
    for (const [roomId, roomData] of rooms) {
      const heatValue = dataReceiver.computeHeatValue(roomData);
      this.updateRoomHeat(roomId, heatValue);
    }
  }

  private cellNoise(x: number, z: number): number {
    const seed = x * 374761393 + z * 668265263;
    let n = (seed ^ (seed >> 13)) * 1274126177;
    n = n ^ (n >> 16);
    return ((n & 0xffffff) / 0xffffff) * 0.5 + 0.5;
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const targets = [...this.cellMeshes];
    for (const floor of this.roomFloors.values()) {
      targets.push(floor);
    }

    const intersects = this.raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const roomId = hit.userData.roomId as number;
      if (roomId && this.onRoomClickCallback) {
        const roomData = dataReceiver.getRoomData(roomId);
        if (roomData) {
          this.onRoomClickCallback(roomId, roomData);
        }
      }
    }
  }

  public onRoomClick(callback: (roomId: number, roomData: RoomData) => void): void {
    this.onRoomClickCallback = callback;
  }

  private onResize(): void {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    TWEEN.update(time);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    if (time - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = time;
    }
  };

  public getFPS(): number {
    return this.fps;
  }

  public start(): void {
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
    console.log('[SceneRenderer] 渲染循环已启动');
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.removeEventListener('click', this.onMouseClick.bind(this));
    this.renderer.dispose();
    console.log('[SceneRenderer] 已销毁');
  }
}

export default SceneRenderer;
