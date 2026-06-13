import * as THREE from 'three';
import { Terrain } from './terrain';
import { BrushController } from './brush';
import { UIController } from './ui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain: Terrain;
  private brushController: BrushController;
  private uiController: UIController;
  private container: HTMLElement;

  private isRotating: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 3;
  private cameraDistance: number = 35;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  constructor() {
    this.container = document.getElementById('app')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.Fog(0x0f172a, 50, 100);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.sh