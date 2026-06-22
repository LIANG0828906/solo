import * as THREE from 'three';
import { eventBus } from './EventBus';
import { timeSimulator } from './TimeSimulator';
import { CelestialDataManager } from './CelestialDataManager';

const celestialDataManager = CelestialDataManager.getInstance();

class UserInteractionModule {
  private static instance: UserInteractionModule | null = null;

  public isMeasurementMode: boolean = false;
  public measurementPoints: string[] = [];
  public raycaster: THREE.Raycaster;
  public mouse: THREE.Vector2;
  public camera: THREE.PerspectiveCamera | null = null;
  public scene: THREE.Scene | null = null;
  public canvas: HTMLCanvasElement | null = null;

  private boundHandleClick: ((event: MouseEvent) => void) | null = null;
  private boundHandleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  private constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public static getInstance(): UserInteractionModule {
    if (!UserInteractionModule.instance) {
      UserInteractionModule.instance = new UserInteractionModule();
    }
    return UserInteractionModule.instance;
  }

  public initialize(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ): void {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = scene;

    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    canvas.addEventListener('click', this.boundHandleClick);
    window.addEventListener('keydown', this.boundHandleKeyDown);
  }

  public dispose(): void {
    if (this.canvas && this.boundHandleClick) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
    }
    if (this.boundHandleKeyDown) {
      window.removeEventListener('keydown', this.boundHandleKeyDown);
    }
    this.boundHandleClick = null;
    this.boundHandleKeyDown = null;
    this.canvas = null;
    this.camera = null;
    this.scene = null;
  }

  public handleClick(event: MouseEvent): void {
    if (!this.canvas || !this.camera || !this.scene) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.scene.children.filter(
      (child) => child instanceof THREE.Mesh && child.userData.bodyId
    );

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const bodyId = intersects[0].object.userData.bodyId as string;

      if (this.isMeasurementMode) {
        eventBus.emit('measurementPointSelected', { bodyId });
        this.addMeasurementPoint(bodyId);
      } else {
        eventBus.emit('planetSelected', { planetId: bodyId });
        eventBus.emit('viewFocusPlanet', { planetId: bodyId });
      }
    } else {
      if (!this.isMeasurementMode) {
        eventBus.emit('planetSelected', { planetId: null });
      }
    }
  }

  public handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        timeSimulator.togglePause();
        break;
      case 'KeyR':
        eventBus.emit('resetView', {});
        break;
      case 'KeyM':
        this.toggleMeasurementMode();
        break;
      case 'Escape':
        if (this.isMeasurementMode) {
          this.isMeasurementMode = false;
          this.measurementPoints = [];
          eventBus.emit('exitMeasurement', {});
        }
        break;
    }
  }

  public toggleMeasurementMode(): void {
    this.isMeasurementMode = !this.isMeasurementMode;
    this.measurementPoints = [];

    if (this.isMeasurementMode) {
      eventBus.emit('startMeasurement', { fromBodyId: '' });
    } else {
      eventBus.emit('exitMeasurement', {});
    }
  }

  public addMeasurementPoint(bodyId: string): void {
    if (this.measurementPoints.length >= 2) {
      this.measurementPoints = [];
    }

    this.measurementPoints.push(bodyId);

    if (this.measurementPoints.length === 2) {
      const [fromId, toId] = this.measurementPoints;
      const fromBody = celestialDataManager.getBody(fromId);
      const toBody = celestialDataManager.getBody(toId);

      if (fromBody && toBody) {
        const epochDays = timeSimulator.epochDays;
        const fromPos = celestialDataManager.calculatePosition(fromId, epochDays);
        const toPos = celestialDataManager.calculatePosition(toId, epochDays);

        const distanceInUnits = fromPos.distanceTo(toPos);
        const distanceInKm = distanceInUnits * (149597870.7 / 20);
        const distanceInMillionsKm = Math.round(distanceInKm / 1000000);

        eventBus.emit('measurementResult', {
          fromBodyId: fromId,
          toBodyId: toId,
          distance: distanceInMillionsKm,
        });
      }
    }
  }
}

export const userInteractionModule = UserInteractionModule.getInstance();
