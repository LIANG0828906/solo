import * as THREE from 'three';

export type InteractionMode = 'browse' | 'place';

export interface InteractionHandlers {
  onPlaceBuilding: (worldPosition: THREE.Vector3) => void;
  onSelectBuilding: (id: number | null) => void;
  onStartDrag: (id: number) => void;
  onUpdateDrag: (worldPosition: THREE.Vector3) => void;
  onFinishDrag: () => void;
  onPanStart: () => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onRotate: (deltaX: number, deltaY: number) => void;
  onZoom: (delta: number) => void;
  onResetView: () => void;
  onToggleBirdView: () => void;
  onToggleMode: () => void;
  onDeleteSelected: () => void;
  onChangeColor: (index: number) => void;
  pickBuildingAtScreen: (ndcX: number, ndcY: number) => { id: number; point: THREE.Vector3 } | null;
  raycastGround: (ndcX: number, ndcY: number) => THREE.Vector3 | null;
}

interface DragState {
  isDragging: boolean;
  buildingId: number | null;
  startScreenX: number;
  startScreenY: number;
  moved: boolean;
}

export class InteractionController {
  private domElement: HTMLElement;
  private handlers: InteractionHandlers;

  private mode: InteractionMode = 'browse';
  private isMouseDown = false;
  private mouseDownButton = -1;
  private mouseDownX = 0;
  private mouseDownY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private dragState: DragState = {
    isDragging: false,
    buildingId: null,
    startScreenX: 0,
    startScreenY: 0,
    moved: false
  };
  private clickThreshold = 5;

  constructor(
    domElement: HTMLElement,
    _camera: THREE.PerspectiveCamera,
    handlers: InteractionHandlers
  ) {
    this.domElement = domElement;
    this.handlers = handlers;

    this.bindEvents();
  }

  getMode(): InteractionMode {
    return this.mode;
  }

  setMode(mode: InteractionMode): void {
    this.mode = mode;
  }

  private toNDC(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  private bindEvents(): void {
    const el = this.domElement;

    el.addEventListener('contextmenu', this.onContextMenu);
    el.addEventListener('mousedown', this.onMouseDown);
    el.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('mouseleave', this.onMouseUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose(): void {
    const el = this.domElement;
    el.removeEventListener('contextmenu', this.onContextMenu);
    el.removeEventListener('mousedown', this.onMouseDown);
    el.removeEventListener('mousemove', this.onMouseMove);
    el.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('mouseleave', this.onMouseUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.isMouseDown = true;
    this.mouseDownButton = e.button;
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    const { x: ndcX, y: ndcY } = this.toNDC(e.clientX, e.clientY);

    if (e.button === 0) {
      const hit = this.handlers.pickBuildingAtScreen(ndcX, ndcY);
      if (hit) {
        this.handlers.onSelectBuilding(hit.id);
        this.dragState = {
          isDragging: true,
          buildingId: hit.id,
          startScreenX: e.clientX,
          startScreenY: e.clientY,
          moved: false
        };
        this.handlers.onStartDrag(hit.id);
      } else {
        this.handlers.onSelectBuilding(null);
        this.handlers.onPanStart();
      }
    } else if (e.button === 2) {
      if (this.mode === 'place') {
        const groundPoint = this.handlers.raycastGround(ndcX, ndcY);
        if (groundPoint) {
          this.handlers.onPlaceBuilding(groundPoint);
        }
      }
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isMouseDown) {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      return;
    }

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    const totalMovedX = Math.abs(e.clientX - this.mouseDownX);
    const totalMovedY = Math.abs(e.clientY - this.mouseDownY);
    const totalMoved = Math.sqrt(totalMovedX * totalMovedX + totalMovedY * totalMovedY);

    if (this.mouseDownButton === 0) {
      if (this.dragState.isDragging && this.dragState.buildingId !== null) {
        if (totalMoved > this.clickThreshold) {
          this.dragState.moved = true;
          const { x: ndcX, y: ndcY } = this.toNDC(e.clientX, e.clientY);
          const groundPoint = this.handlers.raycastGround(ndcX, ndcY);
          if (groundPoint) {
            this.handlers.onUpdateDrag(groundPoint);
          }
        }
      } else {
        if (totalMoved > this.clickThreshold) {
          this.handlers.onPan(deltaX, deltaY);
        }
      }
    } else if (this.mouseDownButton === 1) {
      this.handlers.onRotate(deltaX, deltaY);
    }

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseUp = (_e: MouseEvent): void => {
    if (this.mouseDownButton === 0 && this.dragState.isDragging && this.dragState.buildingId !== null) {
      if (this.dragState.moved) {
        this.handlers.onFinishDrag();
      }
    }

    this.isMouseDown = false;
    this.mouseDownButton = -1;
    this.dragState = {
      isDragging: false,
      buildingId: null,
      startScreenX: 0,
      startScreenY: 0,
      moved: false
    };
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.handlers.onZoom(e.deltaY > 0 ? 1 : -1);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.handlers.onResetView();
    } else if (e.code === 'KeyT') {
      this.handlers.onToggleBirdView();
    } else if (e.code === 'KeyR') {
      this.handlers.onToggleMode();
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
      this.handlers.onDeleteSelected();
    } else if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 5) {
        this.handlers.onChangeColor(num - 1);
      }
    }
  };
}
