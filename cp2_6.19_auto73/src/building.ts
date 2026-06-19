import * as THREE from 'three';
import type { BuildingInfo } from './ui';
import { generateBuildingInfo } from './ui';

export interface BuildingData {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  originalPosition: THREE.Vector3;
  originalColor: THREE.Color;
  originalScale: THREE.Vector3;
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
  private buildingMeshes: THREE.Mesh[] = [];
  private instancedMesh!: THREE.InstancedMesh;
  private buildingDataMap: Map<number, BuildingData> = new Map();
  private hoveredBuilding: BuildingData | null = null;
  private selectedBuilding: BuildingData | null = null;
  private clickCallback: BuildingClickCallback | null = null;
  private hoverCallback: BuildingHoverCallback | null = null;
  private readonly gridSize = 5;
  private readonly blockSize = 12;
  private readonly buildingBaseSize = 7;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
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

  private createBuildings(): void {
    const positions: { x: number; z: number; height: number; color: THREE.Color }[] = [];
    const halfGrid = (this.gridSize - 1) / 2;

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

        positions.push({ x, z, height, color });
      }
    }

    const boxGeometry = new THREE.BoxGeometry(this.buildingBaseSize, 1, this.buildingBaseSize);
    this.instancedMesh = new THREE.InstancedMesh(boxGeometry, new THREE.MeshStandardMaterial(), positions.length);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = positions.length;

    const dummy = new THREE.Object3D();

    positions.forEach((pos, index) => {
      dummy.position.set(pos.x, pos.height / 2, pos.z);
      dummy.scale.set(1, pos.height, 1);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(index, dummy.matrix);
      this.instancedMesh.setColorAt(index, pos.color);

      const info = generateBuildingInfo(index);
      const meshGeometry = new THREE.BoxGeometry(this.buildingBaseSize, pos.height, this.buildingBaseSize);
      const meshMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        roughness: 0.5,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
      mesh.position.set(pos.x, pos.height / 2, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      mesh.userData.buildingIndex = index;

      const edgeGeometry = new THREE.EdgesGeometry(meshGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edges.position.copy(mesh.position);
      edges.visible = false;
      edges.userData.buildingIndex = index;

      this.scene.add(mesh);
      this.scene.add(edges);
      this.buildingMeshes.push(mesh);

      const buildingData: BuildingData = {
        mesh,
        edges,
        originalPosition: mesh.position.clone(),
        originalColor: pos.color.clone(),
        originalScale: new THREE.Vector3(1, 1, 1),
        info,
        isSelected: false,
        isHovered: false,
        height: pos.height,
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
      };

      this.buildings.push(buildingData);
      this.buildingDataMap.set(index, buildingData);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.instancedMesh);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.buildings.map((b) => b.mesh);
    const instancedIntersects = this.raycaster.intersectObject(this.instancedMesh, false);

    let newHovered: BuildingData | null = null;

    if (instancedIntersects.length > 0 && instancedIntersects[0].instanceId !== undefined) {
      const index = instancedIntersects[0].instanceId;
      newHovered = this.buildingDataMap.get(index) || null;
    } else {
      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const index = mesh.userData.buildingIndex;
        newHovered = this.buildingDataMap.get(index) || null;
      }
    }

    if (newHovered !== this.hoveredBuilding) {
      if (this.hoveredBuilding && !this.hoveredBuilding.isSelected) {
        this.setBuildingHovered(this.hoveredBuilding, false);
      }
      if (newHovered && !newHovered.isSelected) {
        this.setBuildingHovered(newHovered, true);
      }
      this.hoveredBuilding = newHovered;
      this.hoverCallback?.(newHovered);
    }
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    let clickedBuilding: BuildingData | null = null;
    const instancedIntersects = this.raycaster.intersectObject(this.instancedMesh, false);

    if (instancedIntersects.length > 0 && instancedIntersects[0].instanceId !== undefined) {
      const index = instancedIntersects[0].instanceId;
      clickedBuilding = this.buildingDataMap.get(index) || null;
    } else {
      const meshes = this.buildings.map((b) => b.mesh);
      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const index = mesh.userData.buildingIndex;
        clickedBuilding = this.buildingDataMap.get(index) || null;
      }
    }

    if (clickedBuilding) {
      if (this.selectedBuilding && this.selectedBuilding !== clickedBuilding) {
        this.deselectBuilding(this.selectedBuilding);
      }
      if (!clickedBuilding.isSelected) {
        this.selectBuilding(clickedBuilding);
        this.clickCallback?.(clickedBuilding.info, clickedBuilding);
      }
    } else {
      if (this.selectedBuilding) {
        this.deselectBuilding(this.selectedBuilding);
        this.clickCallback?.(null, null);
      }
    }
  }

  private setBuildingHovered(building: BuildingData, hovered: boolean): void {
    building.isHovered = hovered;

    if (hovered) {
      building.mesh.visible = true;
      building.edges.visible = true;
      (building.edges.material as THREE.LineBasicMaterial).color.set(0xffffff);
      (building.edges.material as THREE.LineBasicMaterial).opacity = 0.9;

      const idx = building.info.id;
      this.hideInstancedBuilding(idx);
    } else if (!building.isSelected) {
      building.mesh.visible = false;
      building.edges.visible = false;
      const idx = building.info.id;
      this.showInstancedBuilding(idx);
    }
  }

  private selectBuilding(building: BuildingData): void {
    building.isSelected = true;
    this.selectedBuilding = building;
    building.mesh.visible = true;
    building.edges.visible = true;
    (building.edges.material as THREE.LineBasicMaterial).color.set(0x00ffff);
    (building.edges.material as THREE.LineBasicMaterial).opacity = 1;

    const idx = building.info.id;
    this.hideInstancedBuilding(idx);

    building.selectAnimation.active = true;
    building.selectAnimation.startTime = performance.now();
    building.selectAnimation.direction = 1;

    this.createLightBeam(building);
  }

  private deselectBuilding(building: BuildingData): void {
    building.isSelected = false;
    if (this.selectedBuilding === building) {
      this.selectedBuilding = null;
    }
    building.edges.visible = false;
    building.mesh.visible = false;

    const idx = building.info.id;
    this.showInstancedBuilding(idx);

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
    const dummy = new THREE.Object3D();
    dummy.position.set(0, -10000, 0);
    dummy.scale.set(0.0001, 0.0001, 0.0001);
    dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private showInstancedBuilding(index: number): void {
    const building = this.buildingDataMap.get(index);
    if (!building) return;

    const dummy = new THREE.Object3D();
    dummy.position.copy(building.originalPosition);
    dummy.scale.set(1, building.height, 1);
    dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private createLightBeam(building: BuildingData): void {
    const beamHeight = building.height + 15;
    const beamGeometry = new THREE.CylinderGeometry(1.5, 3, beamHeight, 16, 1, true);
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

  public updateAnimations(time: number): void {
    this.buildings.forEach((building) => {
      if (building.selectAnimation.active) {
        const elapsed = (time - building.selectAnimation.startTime) / 300;
        const t = building.selectAnimation.direction > 0 ? Math.min(1, elapsed) : Math.max(0, 1 - elapsed);
        const eased = 1 - Math.pow(1 - t, 3);

        const targetY = building.originalPosition.y + 5 * eased;
        building.mesh.position.y = targetY;
        building.edges.position.y = targetY;

        const material = building.mesh.material as THREE.MeshStandardMaterial;
        material.opacity = 1 - 0.5 * eased;
        material.transparent = eased > 0;

        const targetScale = 1 + 0.05 * eased;
        building.mesh.scale.set(targetScale, 1, targetScale);
        building.edges.scale.set(targetScale, 1, targetScale);

        if (elapsed >= 1) {
          building.selectAnimation.active = false;
        }
      }

      if (building.lightBeamAnimation.active && building.lightBeam) {
        const elapsed = (time - building.lightBeamAnimation.startTime) / 500;
        if (elapsed < 1) {
          const opacity = Math.sin(elapsed * Math.PI) * 0.6;
          (building.lightBeam.material as THREE.MeshBasicMaterial).opacity = opacity;
        } else {
          building.lightBeamAnimation.active = false;
          if (!building.isSelected && building.lightBeam) {
            this.scene.remove(building.lightBeam);
            building.lightBeam.geometry.dispose();
            (building.lightBeam.material as THREE.Material).dispose();
            building.lightBeam = null;
          } else if (building.lightBeam) {
            (building.lightBeam.material as THREE.MeshBasicMaterial).opacity = 0.15;
          }
        }
      }
    });
  }

  public onBuildingClick(callback: BuildingClickCallback): void {
    this.clickCallback = callback;
  }

  public onBuildingHover(callback: BuildingHoverCallback): void {
    this.hoverCallback = callback;
  }

  public getSelectedBuilding(): BuildingData | null {
    return this.selectedBuilding;
  }

  public clearSelection(): void {
    if (this.selectedBuilding) {
      this.deselectBuilding(this.selectedBuilding);
      this.selectedBuilding = null;
    }
  }
}
