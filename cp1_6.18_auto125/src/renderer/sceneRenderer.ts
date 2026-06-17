import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AlgorithmType, StepSnapshot, HighlightItem } from '../utils/colorUtils';
import { getGradientColor } from '../utils/colorUtils';

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationId: number | null = null;
  private algorithmType: AlgorithmType = 'eightQueens';
  private sceneObjects: Map<string, THREE.Object3D> = new Map();
  private gridHelper: THREE.GridHelper | null = null;
  private clock: THREE.Clock;
  private highlightedIds: Set<string> = new Set();
  private completedIds: Set<string> = new Set();

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0F0F23);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 12, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.setupGrid();
    this.initScene('eightQueens');
    this.animate();

    window.addEventListener('resize', this.handleResize);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x6C63FF, 0x1A1A2E, 0.4);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }

  private setupGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.opacity = 0.4;
    gridMaterial.transparent = true;
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);
    this.gridHelper = gridHelper;
  }

  private clearSceneObjects(): void {
    this.sceneObjects.forEach((obj) => {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.sceneObjects.clear();
    this.highlightedIds.clear();
    this.completedIds.clear();
  }

  initScene(type: AlgorithmType): void {
    this.algorithmType = type;
    this.clearSceneObjects();

    switch (type) {
      case 'eightQueens':
        this.initEightQueens();
        this.camera.position.set(0, 12, 12);
        break;
      case 'aStar':
        this.initAStar();
        this.camera.position.set(0, 18, 18);
        break;
      case 'binaryTree':
        this.initBinaryTree();
        this.camera.position.set(0, 8, 14);
        break;
    }

    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private initEightQueens(): void {
    const boardSize = 8;
    const cellSize = 1;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isLight = (row + col) % 2 === 0;
        const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
        const material = new THREE.MeshStandardMaterial({
          color: isLight ? 0x2D2D44 : 0x1A1A2E,
          side: THREE.DoubleSide,
          roughness: 0.8,
          metalness: 0.2,
        });
        const cell = new THREE.Mesh(geometry, material);
        cell.rotation.x = -Math.PI / 2;
        cell.position.set(
          col - boardSize / 2 + cellSize / 2,
          0,
          row - boardSize / 2 + cellSize / 2
        );
        cell.receiveShadow = true;
        cell.name = `cell-${row}-${col}`;
        this.scene.add(cell);
        this.sceneObjects.set(`cell-${row}-${col}`, cell);

        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
          color: 0x3D3D5C,
          transparent: true,
          opacity: 0.5,
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.rotation.x = -Math.PI / 2;
        edges.position.copy(cell.position);
        this.scene.add(edges);
        this.sceneObjects.set(`cell-edge-${row}-${col}`, edges);
      }
    }
  }

  private initAStar(): void {
    const gridSize = 20;
    const cellSize = 0.9;
    const offset = -gridSize / 2 + cellSize / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
        const material = new THREE.MeshStandardMaterial({
          color: 0x1A1A2E,
          side: THREE.DoubleSide,
          roughness: 0.9,
        });
        const cell = new THREE.Mesh(geometry, material);
        cell.rotation.x = -Math.PI / 2;
        cell.position.set(offset + x, 0, offset + y);
        cell.receiveShadow = true;
        cell.name = `grid-${x}-${y}`;
        this.scene.add(cell);
        this.sceneObjects.set(`grid-${x}-${y}`, cell);
      }
    }

    const obstaclePositions = [
      [5, 2], [5, 3], [5, 4], [5, 5], [5, 6],
      [10, 8], [10, 9], [10, 10], [10, 11], [10, 12],
      [14, 5], [14, 6], [14, 7], [14, 8], [14, 9],
      [3, 10], [4, 10], [5, 10], [6, 10],
      [15, 14], [15, 15], [15, 16], [15, 17],
      [8, 14], [9, 14], [10, 14], [11, 14],
    ];

    obstaclePositions.forEach(([x, y]) => {
      const geometry = new THREE.BoxGeometry(cellSize, 0.5, cellSize);
      const material = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.6,
        metalness: 0.3,
      });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(offset + x, 0.25, offset + y);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      obstacle.name = `obstacle-${x}-${y}`;
      this.scene.add(obstacle);
      this.sceneObjects.set(`obstacle-${x}-${y}`, obstacle);
    });

    this.createMarkerSphere('start', offset, 0, 0, 0x00FF88);
    this.createMarkerSphere('end', offset, 19, 19, 0xFF4444);
  }

  private createMarkerSphere(
    prefix: string,
    offset: number,
    x: number,
    y: number,
    color: number
  ): void {
    const geometry = new THREE.SphereGeometry(0.35, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.5,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(offset + x, 0.5, offset + y);
    sphere.castShadow = true;
    sphere.name = `${prefix}-${x}-${y}`;
    this.scene.add(sphere);
    this.sceneObjects.set(`${prefix}-${x}-${y}`, sphere);
  }

  private initBinaryTree(): void {
    interface TreeNode {
      value: number;
      left: TreeNode | null;
      right: TreeNode | null;
    }

    const buildSampleTree = (): TreeNode => ({
      value: 1,
      left: {
        value: 2,
        left: { value: 4, left: null, right: null },
        right: { value: 5, left: null, right: null },
      },
      right: {
        value: 3,
        left: { value: 6, left: null, right: null },
        right: { value: 7, left: null, right: null },
      },
    });

    const root = buildSampleTree();
    const positions: Map<number, { x: number; y: number }> = new Map();

    const calcPositions = (node: TreeNode | null, depth: number, x: number): void => {
      if (!node) return;
      const y = 5 - depth * 1.8;
      positions.set(node.value, { x: x * 2, y });
      calcPositions(node.left, depth + 1, x - 1);
      calcPositions(node.right, depth + 1, x + 1);
    };
    calcPositions(root, 0, 0);

    const totalNodes = positions.size;
    const nodeIndexMap = new Map<number, number>();
    let idx = 0;
    [1, 2, 3, 4, 5, 6, 7].forEach((v) => {
      nodeIndexMap.set(v, idx++);
    });

    const createEdge = (x1: number, y1: number, x2: number, y2: number, id: string): void => {
      const points = [new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(geometry, material);
      line.name = id;
      this.scene.add(line);
      this.sceneObjects.set(id, line);
    };

    const addEdges = (node: TreeNode | null): void => {
      if (!node) return;
      const p = positions.get(node.value)!;
      if (node.left) {
        const lp = positions.get(node.left.value)!;
        createEdge(p.x, p.y, lp.x, lp.y, `edge-${node.value}-${node.left.value}`);
        addEdges(node.left);
      }
      if (node.right) {
        const rp = positions.get(node.right.value)!;
        createEdge(p.x, p.y, rp.x, rp.y, `edge-${node.value}-${node.right.value}`);
        addEdges(node.right);
      }
    };
    addEdges(root);

    positions.forEach((pos, value) => {
      const nodeIdx = nodeIndexMap.get(value)!;
      const colorHex = getGradientColor(nodeIdx, totalNodes);
      const color = new THREE.Color(colorHex);

      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.3,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pos.x, pos.y, 0);
      sphere.castShadow = true;
      sphere.name = `node-${value}`;
      this.scene.add(sphere);
      this.sceneObjects.set(`node-${value}`, sphere);
    });
  }

  updateSnapshot(snapshot: StepSnapshot): void {
    const newHighlighted = new Set(snapshot.highlightedItems.map((h) => h.id));
    const newCompleted = new Set(snapshot.completedItems);
    const newPlaced = new Set(snapshot.placedItems);

    this.sceneObjects.forEach((obj, id) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (id.startsWith('queen-')) {
          this.scene.remove(obj);
          obj.geometry.dispose();
          obj.material.dispose();
          this.sceneObjects.delete(id);
        }
      }
    });

    newPlaced.forEach((id) => {
      if (id.startsWith('queen-') && !this.sceneObjects.has(id)) {
        const parts = id.split('-');
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);
        this.createQueen(row, col);
      }
      if (id.startsWith('path-') && !this.sceneObjects.has(id)) {
        const parts = id.split('-');
        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        this.createPathNode(x, y);
      }
    });

    this.sceneObjects.forEach((obj, id) => {
      const isHighlighted = newHighlighted.has(id);
      const isCompleted = newCompleted.has(id);

      if (obj instanceof THREE.Mesh) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (isHighlighted) {
              mat.emissive = new THREE.Color(0xFFD700);
              mat.emissiveIntensity = 0.6;
              mat.opacity = 1;
              mat.transparent = false;
            } else if (isCompleted) {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
              mat.opacity = 0.4;
              mat.transparent = true;
            } else {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
              mat.opacity = 1;
              mat.transparent = false;
            }
            mat.needsUpdate = true;
          }
        });

        if (isHighlighted) {
          const highlightItem = snapshot.highlightedItems.find((h) => h.id === id);
          if (highlightItem?.effect === 'scale' && !id.startsWith('cell-')) {
            obj.scale.setScalar(1.2);
          } else {
            obj.scale.setScalar(1);
          }
        } else {
          obj.scale.setScalar(1);
        }
      }

      if (id.startsWith('cell-edge-')) {
        const cellId = id.replace('cell-edge-', 'cell-');
        const edgeMat = (obj as THREE.LineSegments).material as THREE.LineBasicMaterial;
        if (newHighlighted.has(cellId)) {
          edgeMat.color = new THREE.Color(0xFFD700);
          edgeMat.opacity = 1;
        } else {
          edgeMat.color = new THREE.Color(0x3D3D5C);
          edgeMat.opacity = 0.5;
        }
      }
    });

    this.highlightedIds = newHighlighted;
    this.completedIds = newCompleted;
  }

  private createQueen(row: number, col: number): void {
    const boardSize = 8;
    const geometry = new THREE.SphereGeometry(0.35, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.8,
    });
    const queen = new THREE.Mesh(geometry, material);
    queen.position.set(
      col - boardSize / 2 + 0.5,
      0.5,
      row - boardSize / 2 + 0.5
    );
    queen.castShadow = true;
    queen.name = `queen-${row}-${col}`;
    this.scene.add(queen);
    this.sceneObjects.set(`queen-${row}-${col}`, queen);
  }

  private createPathNode(x: number, y: number): void {
    const gridSize = 20;
    const cellSize = 0.9;
    const offset = -gridSize / 2 + cellSize / 2;
    const geometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6C63FF,
      emissive: 0x6C63FF,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      metalness: 0.3,
    });
    const node = new THREE.Mesh(geometry, material);
    node.position.set(offset + x, 0.3, offset + y);
    node.castShadow = true;
    node.name = `path-${x}-${y}`;
    this.scene.add(node);
    this.sceneObjects.set(`path-${x}-${y}`, node);
  }

  private handleResize = (): void => {
    this.resize();
  };

  resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();

    this.highlightedIds.forEach((id) => {
      const obj = this.sceneObjects.get(id);
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        const pulse = Math.sin(elapsed * 4) * 0.3 + 0.5;
        obj.material.emissiveIntensity = 0.3 + pulse * 0.5;
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.clearSceneObjects();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
