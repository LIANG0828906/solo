import * as THREE from 'three';
import type { BuildingInfo } from './ui';
import { generateBuildingInfo } from './ui';

export interface BuildingData {
  originalPosition: THREE.Vector3;
  originalColor: THREE.Color;
  info: BuildingInfo;
  isSelected: boolean;
  isHovered: boolean;
  height: number;
  selectAnimation: {
    active: boolean;
    startTime: number;
    direction: number;
  };
  lightBeam: THREE.Mesh | null;
  lightBeamAnimation: {
    active: boolean;
    startTime: number;
  };
  highlightMesh: THREE.Mesh | null;
  highlightEdges: THREE.LineSegments | null;
  currentLift: number;
  currentOpacity: number;
  currentScale: number;
}

export type BuildingClickCallback = (info: BuildingInfo | null, buildingData: BuildingData | null) => void;
export type BuildingHoverCallback = (buildingData: BuildingData | null) => void;

export class BuildingManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  public buildings: BuildingData[] = [];
  private instancedMesh!: THREE.InstancedMesh;
  private buildingDataMap: Map<number, BuildingData> = new Map();
  private hoveredIndex: number = -1;
  private selectedIndex: number = -1;
  private clickCallback: BuildingClickCallback | null = null;
  private hoverCallback: BuildingHoverCallback | null = null;
  private readonly gridSize = 5;
  private readonly blockSize = 12;
  private readonly buildingBaseSize = 7;
  private readonly dummy: THREE.Object3D;
  private readonly baseGeometry: THREE.BoxGeometry;
  private readonly baseMaterial: THREE.MeshStandardMaterial;
  public readonly sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxHeight: number };

  /**
   * 数据流：构造函数接收来自 main.ts 的 scene/camera/renderer 引用
   * 用于后续的场景添加、射线检测和交互监听
   */
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dummy = new THREE.Object3D();

    const halfGrid = (this.gridSize - 1) / 2;
    const halfBuilding = this.buildingBaseSize / 2;
    this.sceneBounds = {
      minX: -halfGrid * this.blockSize - halfBuilding,
      maxX: halfGrid * this.blockSize + halfBuilding,
      minZ: -halfGrid * this.blockSize - halfBuilding,
      maxZ: halfGrid * this.blockSize + halfBuilding,
      maxHeight: 30,
    };

    this.baseGeometry = new THREE.BoxGeometry(this.buildingBaseSize, 1, this.buildingBaseSize);
    this.baseMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.1,
    });

    this.createGround();
    this.createBuildings();
    this.setupEventListeners();
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(120, 120);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.01;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(120, 40, 0xffffff, 0xffffff);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.08;
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    const outerGrid = new THREE.GridHelper(120, 10, 0xffffff, 0xffffff);
    (outerGrid.material as THREE.Material).transparent = true;
    (outerGrid.material as THREE.Material).opacity = 0.15;
    outerGrid.position.y = 0.001;
    this.scene.add(outerGrid);
  }

  /**
   * 数据流：使用 InstancedMesh 管理所有 25 个建筑实例
   * 通过 setMatrixAt 设置每个实例的位置和缩放矩阵，
   * 通过 setColorAt 设置每个实例的颜色，实现高性能批量渲染
   * 仅为交互状态（悬停/选中）创建独立 Mesh，不常驻渲染
   */
  private createBuildings(): void {
    const buildingCount = this.gridSize * this.gridSize;
    const halfGrid = (this.gridSize - 1) / 2;

    this.instancedMesh = new THREE.InstancedMesh(
      this.baseGeometry,
      this.baseMaterial,
      buildingCount
    );
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = buildingCount;

    let idx = 0;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const x = (i - halfGrid) * this.blockSize;
        const z = (j - halfGrid) * this.blockSize;
        const height = 5 + Math.random() * 25;

        const t = height / 30;
        const r = Math.floor(0x3a + (0xa0 - 0x3a) * (1 - t));
        const g = Math.floor(0x4a + (0xb8 - 0x4a) * (1 - t));
        const b = Math.floor(0x5e + (0xe0 - 0x5e) * (1 - t));
        const color = new THREE.Color(r / 255, g / 255, b / 255);

        this.dummy.position.set(x, height / 2, z);
        this.dummy.scale.set(1, height, 1);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        this.instancedMesh.setColorAt(idx, color);

        const info = generateBuildingInfo(idx);
        const buildingData: BuildingData = {
          originalPosition: new THREE.Vector3(x, height / 2, z),
          originalColor: color.clone(),
          info,
          isSelected: false,
          isHovered: false,
          height,
          selectAnimation: {
            active: false,
            startTime: 0,
            direction: 1,
          },
          lightBeam: null,
          lightBeamAnimation: {
            active: false,
            startTime: 0,
          },
          highlightMesh: null,
          highlightEdges: null,
          currentLift: 0,
          currentOpacity: 1,
          currentScale: 1,
        };

        this.buildings.push(buildingData);
        this.buildingDataMap.set(idx, buildingData);
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.instancedMesh);
  }

  /**
   * 创建交互用的高亮 Mesh（仅在悬停或选中时临时创建）
   * 避免常驻 25 个独立 Mesh，降低渲染开销
   */
  private createHighlightMesh(building: BuildingData): void {
    if (building.highlightMesh) return;

    const geometry = new THREE.BoxGeometry(
      this.buildingBaseSize,
      building.height,
      this.buildingBaseSize
    );
    const material = new THREE.MeshStandardMaterial({
      color: building.originalColor.clone(),
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(building.originalPosition);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    building.highlightMesh = mesh;

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(building.originalPosition);
    this.scene.add(edges);
    building.highlightEdges = edges;
  }

  /**
   * 销毁高亮 Mesh，释放资源
   */
  private disposeHighlightMesh(building: BuildingData): void {
    if (building.highlightMesh) {
      this.scene.remove(building.highlightMesh);
      building.highlightMesh.geometry.dispose();
      (building.highlightMesh.material as THREE.Material).dispose();
      building.highlightMesh = null;
    }
    if (building.highlightEdges) {
      this.scene.remove(building.highlightEdges);
      building.highlightEdges.geometry.dispose();
      (building.highlightEdges.material as THREE.Material).dispose();
      building.highlightEdges = null;
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
  }

  /**
   * 数据流：鼠标事件 → Raycaster 检测 InstancedMesh → 命中 instanceId
   * → 查找对应 BuildingData → 触发悬停状态变更 → 回调通知外部模块
   */
  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const instancedIntersects = this.raycaster.intersectObject(this.instancedMesh, false);

    let newHoveredIndex = -1;
    if (instancedIntersects.length > 0 && instancedIntersects[0].instanceId !== undefined) {
      newHoveredIndex = instancedIntersects[0].instanceId;
    }

    if (newHoveredIndex !== this.hoveredIndex) {
      if (this.hoveredIndex >= 0) {
        const prevBuilding = this.buildingDataMap.get(this.hoveredIndex);
        if (prevBuilding && !prevBuilding.isSelected) {
          this.setBuildingHovered(prevBuilding, this.hoveredIndex, false);
        }
      }
      if (newHoveredIndex >= 0) {
        const newBuilding = this.buildingDataMap.get(newHoveredIndex);
        if (newBuilding && !newBuilding.isSelected) {
          this.setBuildingHovered(newBuilding, newHoveredIndex, true);
        }
        this.hoverCallback?.(newBuilding || null);
      } else {
        this.hoverCallback?.(null);
      }
      this.hoveredIndex = newHoveredIndex;
    }
  }

  /**
   * 数据流：鼠标点击事件 → Raycaster 检测 → 获取建筑索引
   * → 触发选中状态变更 + 光柱动画 → 回调传递 BuildingInfo 给 UI 模块
   */
  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const instancedIntersects = this.raycaster.intersectObject(this.instancedMesh, false);

    let clickedIndex = -1;
    if (instancedIntersects.length > 0 && instancedIntersects[0].instanceId !== undefined) {
      clickedIndex = instancedIntersects[0].instanceId;
    }

    if (clickedIndex >= 0) {
      const clickedBuilding = this.buildingDataMap.get(clickedIndex);
      if (clickedBuilding) {
        if (this.selectedIndex >= 0 && this.selectedIndex !== clickedIndex) {
          const prevBuilding = this.buildingDataMap.get(this.selectedIndex);
          if (prevBuilding) {
            this.deselectBuilding(prevBuilding, this.selectedIndex);
          }
        }
        if (!clickedBuilding.isSelected) {
          this.selectBuilding(clickedBuilding, clickedIndex);
          this.clickCallback?.(clickedBuilding.info, clickedBuilding);
        }
      }
    } else {
      if (this.selectedIndex >= 0) {
        const prevBuilding = this.buildingDataMap.get(this.selectedIndex);
        if (prevBuilding) {
          this.deselectBuilding(prevBuilding, this.selectedIndex);
        }
        this.clickCallback?.(null, null);
      }
    }
  }

  private setBuildingHovered(building: BuildingData, index: number, hovered: boolean): void {
    building.isHovered = hovered;

    if (hovered) {
      this.createHighlightMesh(building);
      if (building.highlightMesh && building.highlightEdges) {
        building.highlightMesh.visible = true;
        building.highlightEdges.visible = true;
        (building.highlightEdges.material as THREE.LineBasicMaterial).color.set(0xffffff);
        (building.highlightEdges.material as THREE.LineBasicMaterial).opacity = 0.9;
      }
      this.hideInstancedBuilding(index);
    } else if (!building.isSelected) {
      if (building.highlightMesh && building.highlightEdges) {
        building.highlightMesh.visible = false;
        building.highlightEdges.visible = false;
      }
      this.showInstancedBuilding(building, index);
    }
  }

  /**
   * 选中建筑：创建高亮 Mesh、显示边缘发光、启动升高动画、触发光柱效果
   * 数据流：选中状态 → 更新动画参数 → updateAnimations 每帧推进
   */
  private selectBuilding(building: BuildingData, index: number): void {
    building.isSelected = true;
    this.selectedIndex = index;

    this.createHighlightMesh(building);
    if (building.highlightMesh && building.highlightEdges) {
      building.highlightMesh.visible = true;
      building.highlightEdges.visible = true;
      (building.highlightEdges.material as THREE.LineBasicMaterial).color.set(0x00ffff);
      (building.highlightEdges.material as THREE.LineBasicMaterial).opacity = 1;
    }
    this.hideInstancedBuilding(index);

    building.selectAnimation.active = true;
    building.selectAnimation.startTime = performance.now();
    building.selectAnimation.direction = 1;

    this.createLightBeam(building);
  }

  private deselectBuilding(building: BuildingData, index: number): void {
    building.isSelected = false;
    if (this.selectedIndex === index) {
      this.selectedIndex = -1;
    }

    if (building.highlightMesh && building.highlightEdges) {
      building.highlightMesh.visible = false;
      building.highlightEdges.visible = false;
    }
    this.disposeHighlightMesh(building);
    this.showInstancedBuilding(building, index);

    building.selectAnimation.active = true;
    building.selectAnimation.startTime = performance.now();
    building.selectAnimation.direction = -1;

    if (building.lightBeam) {
      this.scene.remove(building.lightBeam);
      building.lightBeam.geometry.dispose();
      (building.lightBeam.material as THREE.Material).dispose();
      building.lightBeam = null;
    }
  }

  private hideInstancedBuilding(index: number): void {
    this.dummy.position.set(0, -10000, 0);
    this.dummy.scale.set(0.0001, 0.0001, 0.0001);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private showInstancedBuilding(building: BuildingData, index: number): void {
    this.dummy.position.copy(building.originalPosition);
    this.dummy.scale.set(1, building.height, 1);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * 创建从建筑底部向上的光柱动画
   * 数据流：点击建筑 → createLightBeam → 在 updateAnimations 中每帧更新透明度
   * 使用 sin(π*t) 实现先渐强后渐弱的脉冲效果，500ms 后消失
   */
  private createLightBeam(building: BuildingData): void {
    const beamHeight = building.height + 20;
    const beamGeometry = new THREE.CylinderGeometry(1.8, 3.5, beamHeight, 16, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(
      building.originalPosition.x,
      beamHeight / 2,
      building.originalPosition.z
    );
    this.scene.add(beam);
    building.lightBeam = beam;
    building.lightBeamAnimation.active = true;
    building.lightBeamAnimation.startTime = performance.now();
  }

  /**
   * 数据流：每帧由 main.ts 的 animate 循环调用
   * 遍历所有建筑，推进选中动画（升高、半透明、缩放）和光柱动画
   * 通过 performance.now() 计算已流逝时间，使用缓动函数实现平滑过渡
   */
  public updateAnimations(time: number): void {
    this.buildings.forEach((building) => {
      if (building.selectAnimation.active) {
        const elapsed = (time - building.selectAnimation.startTime) / 300;
        const t = building.selectAnimation.direction > 0
          ? Math.min(1, elapsed)
          : Math.max(0, 1 - elapsed);
        const eased = 1 - Math.pow(1 - t, 3);

        building.currentLift = 5 * eased;
        building.currentOpacity = 1 - 0.5 * eased;
        building.currentScale = 1 + 0.05 * eased;

        if (building.highlightMesh && building.highlightEdges) {
          building.highlightMesh.position.y = building.originalPosition.y + building.currentLift;
          building.highlightEdges.position.y = building.originalPosition.y + building.currentLift;

          const mat = building.highlightMesh.material as THREE.MeshStandardMaterial;
          mat.opacity = building.currentOpacity;
          mat.transparent = eased > 0;

          building.highlightMesh.scale.set(building.currentScale, 1, building.currentScale);
          building.highlightEdges.scale.set(building.currentScale, 1, building.currentScale);
        }

        if (elapsed >= 1) {
          building.selectAnimation.active = false;
        }
      }

      if (building.lightBeamAnimation.active && building.lightBeam) {
        const elapsed = (time - building.lightBeamAnimation.startTime) / 500;
        if (elapsed < 1) {
          const opacity = Math.sin(elapsed * Math.PI) * 0.7;
          (building.lightBeam.material as THREE.MeshBasicMaterial).opacity = opacity;

          const scale = 0.8 + Math.sin(elapsed * Math.PI) * 0.4;
          building.lightBeam.scale.set(scale, 1, scale);
        } else {
          building.lightBeamAnimation.active = false;
          if (!building.isSelected && building.lightBeam) {
            this.scene.remove(building.lightBeam);
            building.lightBeam.geometry.dispose();
            (building.lightBeam.material as THREE.Material).dispose();
            building.lightBeam = null;
          } else if (building.lightBeam) {
            (building.lightBeam.material as THREE.MeshBasicMaterial).opacity = 0.12;
            building.lightBeam.scale.set(0.9, 1, 0.9);
          }
        }
      }
    });
  }

  /**
   * 数据流：注册回调函数，当建筑被点击时
   * BuildingManager → 传递 BuildingInfo 给 UI 模块显示信息面板
   */
  public onBuildingClick(callback: BuildingClickCallback): void {
    this.clickCallback = callback;
  }

  public onBuildingHover(callback: BuildingHoverCallback): void {
    this.hoverCallback = callback;
  }

  public getSelectedBuilding(): BuildingData | null {
    if (this.selectedIndex >= 0) {
      return this.buildingDataMap.get(this.selectedIndex) || null;
    }
    return null;
  }

  public clearSelection(): void {
    if (this.selectedIndex >= 0) {
      const building = this.buildingDataMap.get(this.selectedIndex);
      if (building) {
        this.deselectBuilding(building, this.selectedIndex);
      }
      this.selectedIndex = -1;
    }
  }

  /**
   * 数据流：返回建筑群整体包围盒范围
   * 供 LightManager 动态计算阴影相机的视锥体参数
   */
  public getSceneBounds(): { minX: number; maxX: number; minZ: number; maxZ: number; maxHeight: number } {
    return { ...this.sceneBounds };
  }
}
