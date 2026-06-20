import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { BuildingManager } from './buildingManager';
import {
  GRID_SIZE,
  CELL_SIZE,
  worldToGrid,
  gridToWorld
} from '../models/buildingConfig';

export class InteractionManager {
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  private container: HTMLElement;
  private buildingManager: BuildingManager;
  private sceneManager: SceneManager;
  private previewMesh: THREE.Mesh | null = null;
  private previewEdges: THREE.LineSegments | null = null;
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private currentGridPos: { x: number; z: number } | null = null;
  private groundPlane: THREE.Mesh;

  constructor(
    container: HTMLElement,
    buildingManager: BuildingManager,
    sceneManager: SceneManager,
    groundPlane: THREE.Mesh
  ) {
    this.container = container;
    this.buildingManager = buildingManager;
    this.sceneManager = sceneManager;
    this.groundPlane = groundPlane;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.createPreviewMesh();
    this.setupEventListeners();
  }

  private createPreviewMesh(): void {
    const previewGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, 3, CELL_SIZE * 0.9);
    const previewMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      wireframe: false
    });
    this.previewMesh = new THREE.Mesh(previewGeometry, previewMaterial);
    this.previewMesh.visible = false;
    this.previewMesh.position.y = 1.5;

    const edgesGeometry = new THREE.EdgesGeometry(previewGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    this.previewEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.previewEdges.visible = false;

    this.sceneManager.getScene().add(this.previewMesh);
    this.sceneManager.getScene().add(this.previewEdges);
  }

  private setupEventListeners(): void {
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.lastMousePos.x;
      const dy = event.clientY - this.lastMousePos.y;
      
      if (event.buttons === 2) {
        const controls = this.sceneManager.getControls();
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(controls.object.position.clone().sub(controls.target));
        spherical.theta -= dx * 0.005;
        spherical.phi += dy * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, spherical.phi));
        const newPos = new THREE.Vector3().setFromSpherical(spherical).add(controls.target);
        controls.object.position.copy(newPos);
        controls.object.lookAt(controls.target);
      }
      
      this.lastMousePos = { x: event.clientX, y: event.clientY };
      return;
    }

    this.updateMousePosition(event);
    this.updatePreview();
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 2) {
      this.isDragging = true;
      this.lastMousePos = { x: event.clientX, y: event.clientY };
      if (this.previewMesh) this.previewMesh.visible = false;
      if (this.previewEdges) this.previewEdges.visible = false;
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 2) {
      this.isDragging = false;
    }
  }

  private onMouseLeave(event: MouseEvent): void {
    this.isDragging = false;
    if (this.previewMesh) this.previewMesh.visible = false;
    if (this.previewEdges) this.previewEdges.visible = false;
  }

  updateMousePosition(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updatePreview(): void {
    const gridPos = this.getGridPosition();
    this.currentGridPos = gridPos;

    if (gridPos && this.previewMesh && this.previewEdges) {
      const worldPos = gridToWorld(gridPos.x, gridPos.z);
      this.previewMesh.position.set(worldPos.x, 1.5, worldPos.z);
      this.previewEdges.position.set(worldPos.x, 1.5, worldPos.z);
      
      const isOccupied = this.isGridOccupied(gridPos.x, gridPos.z);
      const previewMaterial = this.previewMesh.material as THREE.MeshBasicMaterial;
      const edgesMaterial = this.previewEdges.material as THREE.LineBasicMaterial;
      
      if (isOccupied) {
        previewMaterial.color.setHex(0xff3366);
        edgesMaterial.color.setHex(0xff3366);
        previewMaterial.opacity = 0.3;
      } else {
        previewMaterial.color.setHex(0x00ffff);
        edgesMaterial.color.setHex(0x00ffff);
        previewMaterial.opacity = 0.2;
      }
      
      this.previewMesh.visible = true;
      this.previewEdges.visible = true;
      
      const time = Date.now() * 0.003;
      const pulse = 0.8 + Math.sin(time) * 0.2;
      edgesMaterial.opacity = 0.6 + pulse * 0.2;
    } else {
      if (this.previewMesh) this.previewMesh.visible = false;
      if (this.previewEdges) this.previewEdges.visible = false;
    }
  }

  handleClick(event: MouseEvent): void {
    if (this.isDragging) return;
    
    this.updateMousePosition(event);
    const gridPos = this.getGridPosition();
    
    if (gridPos && !this.isGridOccupied(gridPos.x, gridPos.z)) {
      const building = this.buildingManager.placeBuilding(gridPos.x, gridPos.z);
      if (building) {
        this.spawnClickEffect(gridPos);
      }
    }
  }

  private spawnClickEffect(gridPos: { x: number; z: number }): void {
    const worldPos = gridToWorld(gridPos.x, gridPos.z);
    
    for (let i = 0; i < 8; i++) {
      const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.set(worldPos.x, 0.5, worldPos.z);
      this.sceneManager.getScene().add(particle);
      
      const angle = (i / 8) * Math.PI * 2;
      const speed = 0.15;
      const vx = Math.cos(angle) * speed;
      const vy = 0.2 + Math.random() * 0.1;
      const vz = Math.sin(angle) * speed;
      
      const startTime = Date.now();
      const duration = 800;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        particle.position.x += vx;
        particle.position.y += vy - progress * 0.05;
        particle.position.z += vz;
        particle.scale.setScalar(1 - progress * 0.8);
        particleMat.opacity = 1 - progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.sceneManager.getScene().remove(particle);
          particleGeo.dispose();
          particleMat.dispose();
        }
      };
      animate();
    }
  }

  getGridPosition(): { x: number; z: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());
    
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      return worldToGrid(point.x, point.z);
    }
    
    return null;
  }

  private isGridOccupied(gridX: number, gridZ: number): boolean {
    const cellKey = `${gridX},${gridZ}`;
    const buildingManagerAny = this.buildingManager as any;
    return buildingManagerAny.occupiedCells?.has(cellKey) ?? false;
  }

  update(): void {
    if (this.previewEdges && this.previewEdges.visible) {
      const time = Date.now() * 0.003;
      const pulse = 0.8 + Math.sin(time) * 0.2;
      const edgesMaterial = this.previewEdges.material as THREE.LineBasicMaterial;
      edgesMaterial.opacity = 0.6 + pulse * 0.2;
    }
  }

  dispose(): void {
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('click', this.handleClick.bind(this));
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('mouseleave', this.onMouseLeave.bind(this));

    if (this.previewMesh) {
      this.sceneManager.getScene().remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      (this.previewMesh.material as THREE.Material).dispose();
    }
    if (this.previewEdges) {
      this.sceneManager.getScene().remove(this.previewEdges);
      this.previewEdges.geometry.dispose();
      (this.previewEdges.material as THREE.Material).dispose();
    }
  }
}
