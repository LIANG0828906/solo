import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CityModel, BuildingData } from './CityModel.js';
import { TimeLine } from './TimeLine.js';
import { InfoPanel } from './InfoPanel.js';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private cityModel: CityModel;
  private timeLine: TimeLine;
  private infoPanel: InfoPanel;
  private container: HTMLElement;
  private initialCameraPosition: THREE.Vector3;
  private initialTarget: THREE.Vector3;
  private isResettingCamera: boolean = false;
  private cameraResetStart: number = 0;
  private resetStartPosition: THREE.Vector3 = new THREE.Vector3();
  private resetStartTarget: THREE.Vector3 = new THREE.Vector3();
  private rangeFill: HTMLElement;
  private yearRangeText: HTMLElement;
  private yearMinInput: HTMLInputElement;
  private yearMaxInput: HTMLInputElement;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.rangeFill = document.getElementById('range-fill') as HTMLElement;
    this.yearRangeText = document.getElementById('year-range-text') as HTMLElement;
    this.yearMinInput = document.getElementById('year-min') as HTMLInputElement;
    this.yearMaxInput = document.getElementById('year-max') as HTMLInputElement;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.initialCameraPosition = new THREE.Vector3(18, 16, 22);
    this.initialTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.initialCameraPosition);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.copy(this.initialTarget);

    this.setupLights();

    this.cityModel = new CityModel(this.camera, this.renderer.domElement);
    this.scene.add(this.cityModel.group);

    this.infoPanel = new InfoPanel('info-panel');
    this.infoPanel.setOnClose(() => {
      this.timeLine.clearActiveDot();
    });

    this.timeLine = new TimeLine('timeline-container', {
      onYearChange: () => {},
      onBuildingSelect: (building: BuildingData) => {
        this.selectBuilding(building);
      }
    });
    this.timeLine.setBuildings(this.cityModel.getBuildingsData());

    this.cityModel.setOnBuildingClick((data: BuildingData | null) => {
      if (data) {
        this.selectBuilding(data);
      } else {
        this.infoPanel.hide();
        this.timeLine.clearActiveDot();
      }
    });

    this.setupControlPanel();
    this.setupWindowEvents();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xFFD700, 0x16213E, 0.35);
    this.scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8E24AA, 0.25);
    fillLight.position.set(-10, 8, -12);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFFB300, 0.2);
    rimLight.position.set(-8, 5, 15);
    this.scene.add(rimLight);
  }

  private selectBuilding(building: BuildingData): void {
    this.cityModel.highlightBuilding(building.id);
    this.timeLine.setActiveBuilding(building);
    this.infoPanel.show(building);
  }

  private setupControlPanel(): void {
    this.updateRangeFill();

    const onInput = () => {
      let min = parseInt(this.yearMinInput.value, 10);
      let max = parseInt(this.yearMaxInput.value, 10);

      if (min > max) {
        [min, max] = [max, min];
      }

      this.yearRangeText.textContent = `${min} - ${max}`;
      this.updateRangeFill();
      this.cityModel.filterByYearRange(min, max);
    };

    this.yearMinInput.addEventListener('input', onInput);
    this.yearMaxInput.addEventListener('input', onInput);

    const btnReset = document.getElementById('btn-reset')!;
    btnReset.addEventListener('click', () => {
      this.startCameraReset();
    });

    const btnSnapshot = document.getElementById('btn-snapshot')!;
    btnSnapshot.addEventListener('click', () => {
      this.exportSnapshot();
    });
  }

  private updateRangeFill(): void {
    const min = parseInt(this.yearMinInput.value, 10);
    const max = parseInt(this.yearMaxInput.value, 10);
    const total = 2024 - 1800;
    const left = ((Math.min(min, max) - 1800) / total) * 100;
    const width = ((Math.abs(max - min)) / total) * 100;
    this.rangeFill.style.left = `${left}%`;
    this.rangeFill.style.width = `${width}%`;
  }

  private startCameraReset(): void {
    this.isResettingCamera = true;
    this.cameraResetStart = performance.now();
    this.resetStartPosition.copy(this.camera.position);
    this.resetStartTarget.copy(this.controls.target);
  }

  private updateCameraReset(): void {
    if (!this.isResettingCamera) return;

    const elapsed = performance.now() - this.cameraResetStart;
    const duration = 1000;
    const progress = Math.min(elapsed / duration, 1);
    const t = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.camera.position.lerpVectors(this.resetStartPosition, this.initialCameraPosition, t);
    this.controls.target.lerpVectors(this.resetStartTarget, this.initialTarget, t);

    if (progress >= 1) {
      this.isResettingCamera = false;
    }
  }

  private exportSnapshot(): void {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `chronicle-of-light-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private setupWindowEvents(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate(): void {
    requestAnimationFrame(this.animate);

    this.updateCameraReset();
    this.cityModel.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.cityModel.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
