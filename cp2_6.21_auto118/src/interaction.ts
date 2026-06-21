import * as THREE from 'three';
import { GRID, ANIMATION } from './config';
import { grid, VoxelData } from './grid';
import { getScene } from './scene';
import type { SceneManager } from './scene';

type ToolMode = 'place' | 'remove';

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

class InteractionManager {
  private scene: SceneManager | null = null;
  private currentColor: string = '#ff4444';
  private mode: ToolMode = 'place';
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private isSelecting: boolean = false;
  private selectionRect: SelectionRect | null = null;
  private selectionBox: HTMLDivElement | null = null;

  private modeChangeListeners: ((mode: ToolMode) => void)[] = [];

  constructor() {
  }

  init(container: HTMLElement): void {
    this.scene = getScene();
    if (!this.scene) return;

    const canvas = this.scene.getRendererDomElement();

    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('keydown', this.handleKeyDown);

    this.createSelectionBox(container);
  }

  private createSelectionBox(container: HTMLElement): void {
    this.selectionBox = document.createElement('div');
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 2px solid #4488ff;
      background: rgba(68, 136, 255, 0.15);
      pointer-events: none;
      display: none;
      z-index: 50;
    `;
    container.appendChild(this.selectionBox);
  }

  setColor(color: string): void {
    this.currentColor = color;
  }

  getColor(): string {
    return this.currentColor;
  }

  getMode(): ToolMode {
    return this.mode;
  }

  setMode(mode: ToolMode): void {
    this.mode = mode;
    for (const listener of this.modeChangeListeners) {
      listener(mode);
    }
  }

  onModeChange(listener: (mode: ToolMode) => void): () => void {
    this.modeChangeListeners.push(listener);
    return () => {
      this.modeChangeListeners = this.modeChangeListeners.filter(l => l !== listener);
    };
  }

  toggleMode(): void {
    this.setMode(this.mode === 'place' ? 'remove' : 'place');
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.scene) return;

    this.scene.updateMouse(e.clientX, e.clientY);

    if (this.isSelecting && this.mode === 'remove' && this.selectionBox) {
      this.updateSelectionBox(e.clientX, e.clientY);
      return;
    }

    if (this.isDragging && !this.isSelecting) {
      return;
    }

    if (this.mode === 'place') {
      this.updatePlaceHover();
    } else {
      this.scene.hideHighlight(0);
    }
  };

  private updatePlaceHover(): void {
    if (!this.scene) return;

    const raycaster = this.scene.getRaycaster();
    const mouse = this.scene.getMouseVector();
    raycaster.setFromCamera(mouse, this.scene.camera);

    const voxelMeshes = this.scene.getVoxelMeshes();
    const groundPlane = this.scene.getGroundPlane();

    const targets = [groundPlane, ...voxelMeshes];
    const intersects = raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const face = intersect.face;
      if (!face) return;

      let placeX: number, placeY: number, placeZ: number;
      let faceCenter: THREE.Vector3;
      let normal: THREE.Vector3;

      if (intersect.object === groundPlane) {
        const point = intersect.point;
        const gx = Math.floor(point.x / GRID.CELL_SIZE);
        const gz = Math.floor(point.z / GRID.CELL_SIZE);
        const gy = GRID.GRID_MIN;

        if (grid.isInBounds(gx, gy, gz) && !grid.hasVoxel(gx, gy, gz)) {
          const half = GRID.CELL_SIZE / 2;
          faceCenter = new THREE.Vector3(
            gx * GRID.CELL_SIZE + half,
            GRID.GRID_MIN * GRID.CELL_SIZE,
            gz * GRID.CELL_SIZE + half
          );
          normal = new THREE.Vector3(0, 1, 0);
          this.scene.showHighlight(faceCenter, normal);
        } else {
          this.scene.hideHighlight(0);
        }
      } else {
        normal = face.normal.clone();
        normal.transformDirection(intersect.object.matrixWorld);

        const vx = (intersect.object as THREE.Mesh).userData.voxelX as number;
        const vy = (intersect.object as THREE.Mesh).userData.voxelY as number;
        const vz = (intersect.object as THREE.Mesh).userData.voxelZ as number;

        placeX = vx + Math.round(normal.x);
        placeY = vy + Math.round(normal.y);
        placeZ = vz + Math.round(normal.z);

        if (grid.isInBounds(placeX, placeY, placeZ) && !grid.hasVoxel(placeX, placeY, placeZ)) {
          const half = GRID.CELL_SIZE / 2;
          faceCenter = new THREE.Vector3(
            vx * GRID.CELL_SIZE + half + normal.x * half * 0.92,
            vy * GRID.CELL_SIZE + half + normal.y * half * 0.92,
            vz * GRID.CELL_SIZE + half + normal.z * half * 0.92
          );
          this.scene.showHighlight(faceCenter, normal);
        } else {
          this.scene.hideHighlight(0);
        }
      }
    } else {
      this.scene.hideHighlight(0);
    }
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;

    this.isDragging = true;
    this.dragStartPos = { x: e.clientX, y: e.clientY };

    if (this.mode === 'remove' && this.selectionBox) {
      this.isSelecting = true;
      this.selectionRect = {
        startX: e.clientX,
        startY: e.clientY,
        endX: e.clientX,
        endY: e.clientY
      };
      this.selectionBox.style.left = e.clientX + 'px';
      this.selectionBox.style.top = e.clientY + 'px';
      this.selectionBox.style.width = '0px';
      this.selectionBox.style.height = '0px';
      this.selectionBox.style.display = 'block';
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button !== 0) return;

    const dragDist = Math.hypot(e.clientX - this.dragStartPos.x, e.clientY - this.dragStartPos.y);

    if (this.isSelecting && this.selectionBox) {
      if (dragDist > 5 && this.mode === 'remove') {
        this.handleBoxSelection();
      } else if (dragDist <= 5) {
        this.handleClick(e);
      }
      this.selectionBox.style.display = 'none';
      this.isSelecting = false;
      this.selectionRect = null;
    } else if (dragDist < 5) {
      this.handleClick(e);
    }

    this.isDragging = false;
  };

  private handleMouseLeave = (): void => {
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }
    this.isSelecting = false;
    this.selectionRect = null;
    this.isDragging = false;
    if (this.scene) {
      this.scene.hideHighlight(0);
    }
  };

  private updateSelectionBox(clientX: number, clientY: number): void {
    if (!this.selectionBox || !this.selectionRect) return;

    this.selectionRect.endX = clientX;
    this.selectionRect.endY = clientY;

    const left = Math.min(this.selectionRect.startX, this.selectionRect.endX);
    const top = Math.min(this.selectionRect.startY, this.selectionRect.endY);
    const width = Math.abs(this.selectionRect.endX - this.selectionRect.startX);
    const height = Math.abs(this.selectionRect.endY - this.selectionRect.startY);

    this.selectionBox.style.left = left + 'px';
    this.selectionBox.style.top = top + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';
  }

  private handleClick = (e: MouseEvent): void => {
    if (!this.scene) return;

    this.scene.updateMouse(e.clientX, e.clientY);

    if (this.mode === 'place') {
      this.handlePlaceClick();
    } else {
      this.handleRemoveClick();
    }
  };

  private handlePlaceClick(): void {
    if (!this.scene) return;

    const raycaster = this.scene.getRaycaster();
    const mouse = this.scene.getMouseVector();
    raycaster.setFromCamera(mouse, this.scene.camera);

    const voxelMeshes = this.scene.getVoxelMeshes();
    const groundPlane = this.scene.getGroundPlane();

    const targets = [groundPlane, ...voxelMeshes];
    const intersects = raycaster.intersectObjects(targets, false);

    if (intersects.length === 0) return;

    const intersect = intersects[0];
    const face = intersect.face;
    if (!face) return;

    let placeX: number, placeY: number, placeZ: number;

    if (intersect.object === groundPlane) {
      const point = intersect.point;
      placeX = Math.floor(point.x / GRID.CELL_SIZE);
      placeY = GRID.GRID_MIN;
      placeZ = Math.floor(point.z / GRID.CELL_SIZE);
    } else {
      const normal = face.normal.clone();
      normal.transformDirection(intersect.object.matrixWorld);

      const vx = (intersect.object as THREE.Mesh).userData.voxelX as number;
      const vy = (intersect.object as THREE.Mesh).userData.voxelY as number;
      const vz = (intersect.object as THREE.Mesh).userData.voxelZ as number;

      placeX = vx + Math.round(normal.x);
      placeY = vy + Math.round(normal.y);
      placeZ = vz + Math.round(normal.z);
    }

    const success = grid.addVoxel(placeX, placeY, placeZ, this.currentColor);

    if (success) {
      this.scene.hideHighlight(ANIMATION.HIGHLIGHT_FADE_DELAY);
    } else {
      this.scene.showError();
    }
  }

  private handleRemoveClick(): void {
    if (!this.scene) return;

    const raycaster = this.scene.getRaycaster();
    const mouse = this.scene.getMouseVector();
    raycaster.setFromCamera(mouse, this.scene.camera);

    const voxelMeshes = this.scene.getVoxelMeshes();
    const intersects = raycaster.intersectObjects(voxelMeshes, false);

    if (intersects.length === 0) return;

    const intersect = intersects[0];
    const vx = (intersect.object as THREE.Mesh).userData.voxelX as number;
    const vy = (intersect.object as THREE.Mesh).userData.voxelY as number;
    const vz = (intersect.object as THREE.Mesh).userData.voxelZ as number;

    grid.removeVoxel(vx, vy, vz);
  }

  private handleBoxSelection(): void {
    if (!this.scene || !this.selectionRect) return;

    const canvas = this.scene.getRendererDomElement();
    const rect = canvas.getBoundingClientRect();

    const minX = Math.min(this.selectionRect.startX, this.selectionRect.endX) - rect.left;
    const maxX = Math.max(this.selectionRect.startX, this.selectionRect.endX) - rect.left;
    const minY = Math.min(this.selectionRect.startY, this.selectionRect.endY) - rect.top;
    const maxY = Math.max(this.selectionRect.startY, this.selectionRect.endY) - rect.top;

    const selectedVoxels: VoxelData[] = [];
    const voxels = grid.getVoxels();

    for (const voxel of voxels.values()) {
      const worldPos = new THREE.Vector3(
        voxel.x * GRID.CELL_SIZE + GRID.CELL_SIZE / 2,
        voxel.y * GRID.CELL_SIZE + GRID.CELL_SIZE / 2,
        voxel.z * GRID.CELL_SIZE + GRID.CELL_SIZE / 2
      );

      const screenPos = worldPos.clone().project(this.scene.camera);
      const screenX = (screenPos.x + 1) / 2 * rect.width;
      const screenY = (-screenPos.y + 1) / 2 * rect.height;

      if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
        if (screenPos.z < 1 && screenPos.z > -1) {
          selectedVoxels.push(voxel);
        }
      }
    }

    if (selectedVoxels.length > 0) {
      this.scene.flashVoxelsForRemove(selectedVoxels).then(() => {
        grid.removeVoxels(selectedVoxels);
      });
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'r' || e.key === 'R') {
      this.toggleMode();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        grid.redo();
      } else {
        grid.undo();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      grid.redo();
    }
  };

  undo(): void {
    grid.undo();
  }

  redo(): void {
    grid.redo();
  }

  clearAll(): void {
    grid.clearAll();
  }
}

export const interaction = new InteractionManager();
