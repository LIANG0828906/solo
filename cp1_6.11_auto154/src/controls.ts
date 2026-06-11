import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type PlateClickCallback = (plate: any) => void;

export class Controls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private orbitControls: OrbitControls | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private pickableObjects: THREE.Object3D[] = [];
  private plateClickCallback: PlateClickCallback | null = null;
  private isDragging: boolean = false;
  private clickThreshold: number = 5;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public enableOrbit(): void {
    this.orbitControls = new OrbitControls(this.camera, this.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 8;
    this.orbitControls.maxDistance = 30;
    this.orbitControls.enablePan = false;
    this.orbitControls.rotateSpeed = 0.5;
    this.orbitControls.zoomSpeed = 0.8;
  }

  public enablePicking(objects: THREE.Object3D[]): void {
    this.pickableObjects = objects.filter(obj => 
      obj.type === 'Mesh' || (obj as any).isGroup
    );
    
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = false;
    this.mouseDownPos = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(event: MouseEvent): void {
    const dx = event.clientX - this.mouseDownPos.x;
    const dy = event.clientY - this.mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.clickThreshold) {
      this.handleClick(event.clientX, event.clientY);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const dx = event.clientX - this.mouseDownPos.x;
    const dy = event.clientY - this.mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > this.clickThreshold) {
      this.isDragging = true;
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = false;
      this.mouseDownPos = { 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      };
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1 && !this.isDragging) {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.mouseDownPos.x;
      const dy = touch.clientY - this.mouseDownPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.clickThreshold * 2) {
        this.handleClick(touch.clientX, touch.clientY);
      }
    }
  }

  private handleClick(clientX: number, clientY: number): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(
      this.pickableObjects, 
      true
    );

    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData && obj.userData.plate) {
          if (this.plateClickCallback) {
            this.plateClickCallback(obj.userData.plate);
          }
          return;
        }
        obj = obj.parent;
      }
    }

    if (this.plateClickCallback) {
      this.plateClickCallback(null);
    }
  }

  public onPlateClick(callback: PlateClickCallback): void {
    this.plateClickCallback = callback;
  }

  public update(): void {
    if (this.orbitControls) {
      this.orbitControls.update();
    }
  }

  public dispose(): void {
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}
