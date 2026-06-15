import * as THREE from 'three';
import { Cityscape, Building } from './cityscape';
import { TimeController } from './timeController';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cityscape: Cityscape;
  private timeController: TimeController;
  private ambientLight: THREE.AmbientLight;
  private pointLight: THREE.PointLight;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private infoPanel: HTMLDivElement;
  private selectedBuilding: Building | null = null;
  private hoveredBuildingIndex: number | null = null;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0x8899bb, 0.5);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xffffff, 1, 50);
    this.pointLight.position.set(5, 8, 5);
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.width = 1024;
    this.pointLight.shadow.mapSize.height = 1024;
    this.scene.add(this.pointLight);

    this.cityscape = new Cityscape(100, 10);
    this.scene.add(this.cityscape.group);

    const groundGeometry = new THREE.CircleGeometry(12, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.timeController = new TimeController(container);
    this.timeController.onTimeUpdate((ratio) => {
      this.updateLighting(ratio);
    });

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `
      position: absolute;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      font-size: 14px;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 50;
      white-space: nowrap;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
    `;
    container.appendChild(this.infoPanel);

    this.setupEventListeners();
    this.updateLighting(this.timeController.getTimeRatio());

    this.animate();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onClick(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cityscape.getBuildingMeshes());

    if (intersects.length > 0) {
      const index = intersects[0].object.userData.buildingIndex;
      if (index !== this.hoveredBuildingIndex) {
        this.hoveredBuildingIndex = index;
        this.cityscape.setHoveredBuilding(index);
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredBuildingIndex !== null) {
        this.hoveredBuildingIndex = null;
        this.cityscape.setHoveredBuilding(null);
        document.body.style.cursor = 'default';
      }
    }
  }

  private onClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cityscape.getBuildingMeshes());

    if (intersects.length > 0) {
      const index = intersects[0].object.userData.buildingIndex;
      this.selectedBuilding = this.cityscape.buildings[index];
      this.cityscape.setSelectedBuilding(index);
      this.showInfoPanel(this.selectedBuilding, event.clientX, event.clientY);
    } else {
      this.selectedBuilding = null;
      this.cityscape.setSelectedBuilding(null);
      this.hideInfoPanel();
    }
  }

  private showInfoPanel(building: Building, mouseX: number, mouseY: number): void {
    const hour = this.timeController.getTimeRatio() * 24;
    const hourStr = Math.floor(hour).toString().padStart(2, '0');
    const minuteStr = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
    const timeStr = `${hourStr}:${minuteStr}`;
    const heightStr = building.height.toFixed(1);

    this.infoPanel.textContent = `高度 ${heightStr}m | ${timeStr}`;
    this.infoPanel.style.opacity = '1';
    this.updateInfoPanelPosition(mouseX, mouseY);
  }

  private updateInfoPanelPosition(mouseX: number, mouseY: number): void {
    const panelWidth = this.infoPanel.offsetWidth;
    const panelHeight = this.infoPanel.offsetHeight;

    let left = mouseX - panelWidth / 2;
    let top = mouseY - panelHeight - 10;

    if (left < 10) left = 10;
    if (left + panelWidth > window.innerWidth - 10) {
      left = window.innerWidth - panelWidth - 10;
    }
    if (top < 10) top = mouseY + 20;

    this.infoPanel.style.left = `${left}px`;
    this.infoPanel.style.top = `${top}px`;
  }

  private hideInfoPanel(): void {
    this.infoPanel.style.opacity = '0';
  }

  private updateLighting(timeRatio: number): void {
    let ambientColor: THREE.Color;
    let lightColor: THREE.Color;
    let lightIntensity: number;
    let ambientIntensity: number;
    let lightAngle: number;

    if (timeRatio <= 0.3) {
      const t = timeRatio / 0.3;
      ambientColor = new THREE.Color().lerpColors(
        new THREE.Color(0x3a4a6a),
        new THREE.Color(0xfff5e6),
        t
      );
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffaa66),
        new THREE.Color(0xffffff),
        t
      );
      lightIntensity = 0.5 + t * 0.5;
      ambientIntensity = 0.3 + t * 0.4;
      lightAngle = 40 + t * 50;
    } else if (timeRatio <= 0.7) {
      const t = (timeRatio - 0.3) / 0.4;
      ambientColor = new THREE.Color().lerpColors(
        new THREE.Color(0xfff5e6),
        new THREE.Color(0xff8844),
        t
      );
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffffff),
        new THREE.Color(0xffcc88),
        t
      );
      lightIntensity = 1.0 - t * 0.2;
      ambientIntensity = 0.7 - t * 0.1;
      lightAngle = 90 - t * 50;
    } else {
      const t = (timeRatio - 0.7) / 0.3;
      ambientColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff8844),
        new THREE.Color(0x2a1a4a),
        t
      );
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff8844),
        new THREE.Color(0x443366),
        t
      );
      lightIntensity = 0.8 - t * 0.7;
      ambientIntensity = 0.6 - t * 0.4;
      lightAngle = 40 - t * 80;
    }

    this.ambientLight.color.copy(ambientColor);
    this.ambientLight.intensity = ambientIntensity;

    this.pointLight.color.copy(lightColor);
    this.pointLight.intensity = lightIntensity;

    const angleRad = (lightAngle * Math.PI) / 180;
    const lightDistance = 12;
    const lightHeight = Math.sin(angleRad) * lightDistance;
    const lightXZ = Math.cos(angleRad) * lightDistance;

    const timeOffset = timeRatio * Math.PI * 2;
    this.pointLight.position.set(
      Math.cos(timeOffset) * lightXZ,
      lightHeight,
      Math.sin(timeOffset) * lightXZ * 0.5 + 3
    );

    const bgColor = new THREE.Color().lerpColors(
      new THREE.Color(0x0a0a1a),
      new THREE.Color(0x1a1a2e),
      1 - Math.abs(timeRatio - 0.5) * 2
    );
    if (timeRatio > 0.7 || timeRatio < 0.05) {
      const nightFactor = timeRatio > 0.7 ? (timeRatio - 0.7) / 0.3 : (0.05 - timeRatio) / 0.05;
      bgColor.lerp(new THREE.Color(0x0a0a1a), nightFactor);
    }
    this.scene.background = bgColor;
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.timeController.update(delta * 60);

    const timeRatio = this.timeController.getTimeRatio();
    this.cityscape.updateTime(timeRatio, elapsedTime);

    if (this.selectedBuilding) {
      const building = this.selectedBuilding;
      const vector = new THREE.Vector3();
      vector.setFromMatrixPosition(building.mesh.matrixWorld);
      vector.y += building.height / 2 + 0.5;

      const projected = vector.project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      this.updateInfoPanelPosition(x, y);

      const hour = this.timeController.getTimeRatio() * 24;
      const hourStr = Math.floor(hour).toString().padStart(2, '0');
      const minuteStr = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
      const timeStr = `${hourStr}:${minuteStr}`;
      const heightStr = building.height.toFixed(1);
      this.infoPanel.textContent = `高度 ${heightStr}m | ${timeStr}`;
    }

    this.renderer.render(this.scene, this.camera);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    new App(container);
  }
});
