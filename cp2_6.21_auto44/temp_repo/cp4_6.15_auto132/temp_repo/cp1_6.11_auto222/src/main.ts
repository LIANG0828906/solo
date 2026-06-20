import * as THREE from 'three';
import { ArmillarySphere, RingInfo } from './armillary';
import { StarField, Mansion } from './stars';
import { PlanetSystem, Planet } from './planets';

class ArmillaryApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  
  private armillary!: ArmillarySphere;
  private starField!: StarField;
  private planetSystem!: PlanetSystem;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraAngleY = Math.PI / 4;
  private cameraAngleX = Math.PI / 6;
  private cameraDistance = 14;
  private minDistance = 3;
  private maxDistance = 20;
  
  private timeSpeed = 1.0;
  private currentTime = 0;
  private clock: THREE.Clock;
  
  private selectedObject: { type: string; data: RingInfo | Mansion | Planet } | null = null;
  private hoveredMansion: Mansion | null = null;
  
  private tooltip: HTMLElement;
  private infoPanel: HTMLElement;
  private infoName: HTMLElement;
  private infoLon: HTMLElement;
  private infoLat: HTMLElement;
  private infoMag: HTMLElement;
  
  private pickableObjects: THREE.Object3D[] = [];

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.tooltip = document.getElementById('tooltip')!;
    this.infoPanel = document.getElementById('info-panel')!;
    this.infoName = document.getElementById('info-name')!;
    this.infoLon = document.getElementById('info-lon')!;
    this.infoLat = document.getElementById('info-lat')!;
    this.infoMag = document.getElementById('info-mag')!;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A2E);
    this.scene.fog = new THREE.Fog(0x0A0A2E, 30, 80);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.container.appendChild(this.renderer.domElement);
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    
    this.setupLighting();
    this.setupArmillary();
    this.setupEventListeners();
    this.setupUIControls();
    
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7);
    this.scene.add(mainLight);
    
    const fillLight = new THREE.DirectionalLight(0x6080ff, 0.4);
    fillLight.position.set(-5, -3, -5);
    this.scene.add(fillLight);
    
    const rimLight = new THREE.PointLight(0xffd700, 0.5, 30);
    rimLight.position.set(0, 0, 0);
    this.scene.add(rimLight);
  }

  private setupArmillary(): void {
    this.armillary = new ArmillarySphere();
    this.scene.add(this.armillary.group);
    
    this.starField = new StarField();
    this.scene.add(this.starField.group);
    
    this.planetSystem = new PlanetSystem(this.armillary.eclipticGroup);
    
    this.armillary.rings.forEach(ring => {
      this.pickableObjects.push(ring.mesh);
    });
    
    this.starField.mansions.forEach(mansion => {
      this.pickableObjects.push(mansion.marker);
    });
    
    this.planetSystem.allCelestials.forEach(celestial => {
      this.pickableObjects.push(celestial.mesh);
    });
    
    const today = new Date();
    this.planetSystem.setDate(today);
    
    const datePicker = document.getElementById('date-picker') as HTMLInputElement;
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    datePicker.value = `${year}-${month}-${day}`;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private setupUIControls(): void {
    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    const speedValue = document.getElementById('speed-value') as HTMLElement;
    
    speedSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.timeSpeed = parseFloat(target.value);
      speedValue.textContent = this.timeSpeed.toFixed(1) + 'x';
    });
    
    const datePicker = document.getElementById('date-picker') as HTMLInputElement;
    datePicker.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const date = new Date(target.value);
      if (!isNaN(date.getTime())) {
        this.planetSystem.setDate(date);
      }
    });
    
    const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    resetBtn.addEventListener('click', () => {
      this.resetCamera();
    });
  }

  private resetCamera(): void {
    this.cameraAngleY = Math.PI / 4;
    this.cameraAngleX = Math.PI / 6;
    this.cameraDistance = 14;
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    const y = this.cameraDistance * Math.sin(this.cameraAngleX);
    const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      
      this.cameraAngleY -= deltaX * 0.005;
      this.cameraAngleX += deltaY * 0.005;
      
      this.cameraAngleX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleX));
      
      this.updateCameraPosition();
      
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.updateHover(event.clientX, event.clientY);
  }

  private onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      const deltaMove = Math.sqrt(
        Math.pow(event.clientX - this.previousMousePosition.x, 2) +
        Math.pow(event.clientY - this.previousMousePosition.y, 2)
      );
      
      if (deltaMove < 5) {
        this.handleClick();
      }
    }
    
    this.isDragging = false;
  }

  private onMouseLeave(): void {
    this.isDragging = false;
    this.hideTooltip();
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomSpeed = 0.005;
    this.cameraDistance += event.deltaY * zoomSpeed * this.cameraDistance * 0.1;
    
    this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
    this.updateCameraPosition();
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isDragging) {
      event.preventDefault();
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.previousMousePosition.x;
      const deltaY = touch.clientY - this.previousMousePosition.y;
      
      this.cameraAngleY -= deltaX * 0.005;
      this.cameraAngleX += deltaY * 0.005;
      
      this.cameraAngleX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleX));
      
      this.updateCameraPosition();
      
      this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private updateHover(clientX: number, clientY: number): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects, false);
    
    let foundMansion: Mansion | null = null;
    
    for (const intersect of intersects) {
      const userData = intersect.object.userData;
      
      if (userData.type === 'mansion') {
        const mansion = this.starField.mansions.find(m => m.name === userData.name);
        if (mansion) {
          foundMansion = mansion;
          this.showTooltip(clientX, clientY, mansion.name);
          break;
        }
      }
    }
    
    if (!foundMansion) {
      this.hideTooltip();
    }
    
    this.hoveredMansion = foundMansion;
  }

  private showTooltip(x: number, y: number, text: string): void {
    this.tooltip.textContent = text;
    this.tooltip.style.left = (x + 15) + 'px';
    this.tooltip.style.top = (y + 15) + 'px';
    this.tooltip.classList.add('visible');
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  private handleClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects, false);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const userData = object.userData;
      
      if (userData.type === 'ring') {
        const ring = this.armillary.rings.find(r => r.type === userData.ringType);
        if (ring) {
          this.selectRing(ring);
          return;
        }
      } else if (userData.type === 'mansion') {
        const mansion = this.starField.mansions.find(m => m.name === userData.name);
        if (mansion) {
          this.selectMansion(mansion);
          return;
        }
      } else if (userData.type === 'celestial') {
        const celestial = this.planetSystem.allCelestials.find(c => c.name === userData.name);
        if (celestial) {
          this.selectPlanet(celestial);
          return;
        }
      }
    }
    
    this.clearSelection();
  }

  private selectRing(ring: RingInfo): void {
    this.clearSelection();
    this.armillary.selectRing(ring);
    this.selectedObject = { type: 'ring', data: ring };
    this.updateInfoPanel(ring.name, 0, 0, 1.0);
  }

  private selectMansion(mansion: Mansion): void {
    this.clearSelection();
    this.starField.selectMansion(mansion);
    this.selectedObject = { type: 'mansion', data: mansion };
    
    const info = this.starField.getMansionInfo(mansion);
    this.updateInfoPanel(mansion.name, info.lon, info.lat, info.mag);
  }

  private selectPlanet(planet: Planet): void {
    this.clearSelection();
    this.planetSystem.selectPlanet(planet);
    this.selectedObject = { type: 'planet', data: planet };
    
    const info = this.planetSystem.getPlanetInfo(planet);
    this.updateInfoPanel(planet.name, info.lon, info.lat, info.mag);
  }

  private clearSelection(): void {
    this.armillary.selectRing(null);
    this.starField.selectMansion(null);
    this.planetSystem.selectPlanet(null);
    this.selectedObject = null;
    this.infoPanel.classList.remove('visible');
  }

  private updateInfoPanel(name: string, lon: number, lat: number, mag: number): void {
    this.infoName.textContent = name;
    this.infoLon.textContent = lon.toFixed(1) + '°';
    this.infoLat.textContent = lat.toFixed(1) + '°';
    this.infoMag.textContent = mag.toFixed(2);
    this.infoPanel.classList.add('visible');
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    this.currentTime += delta;
    
    this.armillary.update(delta, this.timeSpeed);
    this.starField.update(delta, this.timeSpeed, this.currentTime);
    this.planetSystem.update(delta, this.timeSpeed, this.currentTime);
    
    if (this.selectedObject) {
      if (this.selectedObject.type === 'mansion') {
        const mansion = this.selectedObject.data as Mansion;
        const info = this.starField.getMansionInfo(mansion);
        this.infoLon.textContent = info.lon.toFixed(1) + '°';
        this.infoMag.textContent = info.mag.toFixed(2);
      } else if (this.selectedObject.type === 'planet') {
        const planet = this.selectedObject.data as Planet;
        const info = this.planetSystem.getPlanetInfo(planet);
        this.infoLon.textContent = info.lon.toFixed(1) + '°';
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.armillary.dispose();
    this.starField.dispose();
    this.planetSystem.dispose();
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ArmillaryApp();
});
