import * as THREE from 'three';

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;

  private spherical: THREE.Spherical;
  private sphericalDelta: THREE.Spherical;
  private scale: number;

  private isDragging: boolean;
  private isMouseInside: boolean;
  private mouseNDC: THREE.Vector2;
  private mouseWorld: THREE.Vector3;
  private raycaster: THREE.Raycaster;

  private mouseMoveCallback?: (worldPos: THREE.Vector3, isOver: boolean) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;

    this.isDragging = false;
    this.isMouseInside = false;
    this.mouseNDC = new THREE.Vector2();
    this.mouseWorld = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(this.target);
    this.spherical.setFromVector3(offset);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('contextmenu', this.handleContextMenu);
    this.domElement.addEventListener('mousedown', this.handleMouseDown);
    this.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.domElement.addEventListener('mouseup', this.handleMouseUp);
    this.domElement.addEventListener('mouseleave', this.handleMouseLeave);
    this.domElement.addEventListener('mouseenter', this.handleMouseEnter);
    this.domElement.addEventListener('wheel', this.handleWheel, { passive: false });

    this.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.isDragging = true;
      this.domElement.style.cursor = 'grabbing';
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const distance = this.camera.position.length() * 0.5;
    this.mouseWorld.copy(this.raycaster.ray.origin).add(
      this.raycaster.ray.direction.clone().multiplyScalar(distance)
    );

    if (this.isDragging) {
      this.sphericalDelta.theta -= event.movementX * 0.005;
      this.sphericalDelta.phi -= event.movementY * 0.005;
    }

    if (this.mouseMoveCallback && this.isMouseInside) {
      this.mouseMoveCallback(this.mouseWorld, true);
    }
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
    if (this.isMouseInside) {
      this.domElement.style.cursor = 'grab';
    }
  };

  private handleMouseEnter = (): void => {
    this.isMouseInside = true;
    this.domElement.style.cursor = this.isDragging ? 'grabbing' : 'grab';
    if (this.mouseMoveCallback) {
      this.mouseMoveCallback(this.mouseWorld, true);
    }
  };

  private handleMouseLeave = (): void => {
    this.isMouseInside = false;
    this.isDragging = false;
    this.domElement.style.cursor = 'default';
    if (this.mouseMoveCallback) {
      this.mouseMoveCallback(this.mouseWorld, false);
    }
  };

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.scale *= 0.95;
    } else {
      this.scale *= 1.05;
    }
    this.scale = Math.max(0.3, Math.min(3, this.scale));
  };

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isDragging = true;
      const touch = event.touches[0];
      const rect = this.domElement.getBoundingClientRect();
      this.mouseNDC.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      const distance = this.camera.position.length() * 0.5;
      this.mouseWorld.copy(this.raycaster.ray.origin).add(
        this.raycaster.ray.direction.clone().multiplyScalar(distance)
      );

      if (this.mouseMoveCallback) {
        this.mouseMoveCallback(this.mouseWorld, true);
      }
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = this.domElement.getBoundingClientRect();

      const prevClientX = rect.left + (this.mouseNDC.x + 1) / 2 * rect.width;
      const prevClientY = rect.top + (1 - this.mouseNDC.y) / 2 * rect.height;
      const moveX = touch.clientX - prevClientX;
      const moveY = touch.clientY - prevClientY;

      this.mouseNDC.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      const distance = this.camera.position.length() * 0.5;
      this.mouseWorld.copy(this.raycaster.ray.origin).add(
        this.raycaster.ray.direction.clone().multiplyScalar(distance)
      );

      if (this.isDragging) {
        this.sphericalDelta.theta -= moveX * 0.005;
        this.sphericalDelta.phi -= moveY * 0.005;
      }

      if (this.mouseMoveCallback) {
        this.mouseMoveCallback(this.mouseWorld, true);
      }
    } else if (event.touches.length === 2) {
      event.preventDefault();
    }
  };

  private handleTouchEnd = (): void => {
    this.isDragging = false;
    if (this.mouseMoveCallback) {
      this.mouseMoveCallback(this.mouseWorld, false);
    }
  };

  public onMouseMove(callback: (worldPos: THREE.Vector3, isOver: boolean) => void): void {
    this.mouseMoveCallback = callback;
  }

  public update(): void {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);
    this.spherical.setFromVector3(offset);

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.spherical.radius *= this.scale;
    this.spherical.radius = Math.max(100, Math.min(600, this.spherical.radius));

    this.sphericalDelta.theta *= 0.9;
    this.sphericalDelta.phi *= 0.9;
    this.scale = 1;

    offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  public dispose(): void {
    this.domElement.removeEventListener('contextmenu', this.handleContextMenu);
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    this.domElement.removeEventListener('mousemove', this.handleMouseMove);
    this.domElement.removeEventListener('mouseup', this.handleMouseUp);
    this.domElement.removeEventListener('mouseleave', this.handleMouseLeave);
    this.domElement.removeEventListener('mouseenter', this.handleMouseEnter);
    this.domElement.removeEventListener('wheel', this.handleWheel);
    this.domElement.removeEventListener('touchstart', this.handleTouchStart);
    this.domElement.removeEventListener('touchmove', this.handleTouchMove);
    this.domElement.removeEventListener('touchend', this.handleTouchEnd);
  }
}
