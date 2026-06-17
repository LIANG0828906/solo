import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SolarCalculator } from './modules/solar/SolarCalculator';
import { ShadowRenderer } from './modules/render/ShadowRenderer';
import { BuildingLoader } from './modules/loader/BuildingLoader';
import { UIController } from './modules/ui/UIController';
import { ChartModule } from './modules/chart/ChartModule';
import { useStore } from './store';

class SunlightSimulator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private solarCalculator: SolarCalculator;
  private shadowRenderer: ShadowRenderer;
  private buildingLoader: BuildingLoader;
  private uiController: UIController;
  private chartModule: ChartModule;

  private buildingGroup: THREE.Group | null = null;
  private sunLight: THREE.DirectionalLight;
  private sunHelper: THREE.Mesh | null = null;
  private currentSunDirection: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private targetSunDirection: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private lerpProgress = 1;
  private lerpStartDirection: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private isEditing = false;
  private dragPlane: THREE.Plane = new THREE.Plane();
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private selectedControlPoint: THREE.Mesh | null = null;
  private guideLine: THREE.Line | null = null;
  private guideLineGeometry: THREE.BufferGeometry | null = null;

  constructor() {
    const container = document.getElementById('app')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1628);
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.003);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(40, 30, 40);
    this.camera.lookAt(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 10, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minPolarAngle = 0;
    this.controls.update();

    this.solarCalculator = new SolarCalculator();
    this.shadowRenderer = new ShadowRenderer();
    this.buildingLoader = new BuildingLoader();

    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.scene.add(this.sunLight);

    this.setupScene();
    this.shadowRenderer.createGroundGrid(this.scene);
    this.createSunHelper();

    this.uiController = new UIController(container);
    this.chartModule = new ChartModule(container);

    this.setupCallbacks();
    this.setupDragHandlers();

    this.updateSunPosition();
    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupScene(): void {
    const ambientLight = new THREE.AmbientLight(0x334466, 0.5);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x6b5b95, 0x0a1628, 0.3);
    this.scene.add(hemisphereLight);

    this.createSkyGradient();
    this.createHorizonGlow();
    this.createGroundPlane();
  }

  private createSkyGradient(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0A1628');
    gradient.addColorStop(0.6, '#12233d');
    gradient.addColorStop(1, '#1A2744');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private createHorizonGlow(): void {
    const glowGeo = new THREE.RingGeometry(80, 200, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x6b5b95,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    this.scene.add(glow);
  }

  private createGroundPlane(): void {
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x0d1a2a,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createSunHelper(): void {
    const sunGeo = new THREE.SphereGeometry(2, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.8,
    });
    this.sunHelper = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunHelper);
  }

  private setupCallbacks(): void {
    this.uiController.setCallbacks({
      onDateChange: () => this.updateSunPosition(),
      onTimeChange: () => this.updateSunPosition(),
      onLatChange: () => this.updateSunPosition(),
      onLngChange: () => this.updateSunPosition(),
      onLoadBuilding: () => this.loadBuilding(),
      onTopView: () => this.switchTopView(),
      onPersonView: () => this.switchPersonView(),
      onEditToggle: (edit) => this.toggleEditMode(edit),
    });
  }

  private updateSunPosition(): void {
    const store = useStore.getState();
    const solarPos = this.solarCalculator.calculate(
      store.dayOfYear,
      store.hour,
      store.latitude,
      store.longitude
    );

    const dir = new THREE.Vector3();
    const altitude = solarPos.altitude;
    const azimuth = solarPos.azimuth;
    dir.x = Math.cos(altitude) * Math.sin(azimuth);
    dir.y = Math.sin(altitude);
    dir.z = Math.cos(altitude) * Math.cos(azimuth);

    this.lerpStartDirection.copy(this.currentSunDirection);
    this.targetSunDirection.copy(dir);
    this.lerpProgress = 0;

    const profile = this.solarCalculator.calculateDayProfile(
      store.dayOfYear,
      store.latitude,
      store.longitude
    );
    this.chartModule.update(profile, store.hour);

    this.updateShadowInfo(solarPos.altitude);
  }

  private updateShadowInfo(altitude: number): void {
    if (!this.buildingGroup) return;
    const area = this.shadowRenderer.getShadowArea();
    const intensity = altitude > 0 ? Math.sin(altitude) : 0;
    this.uiController.updateShadowInfo(area, intensity);
  }

  private loadBuilding(): void {
    if (this.buildingGroup) {
      this.scene.remove(this.buildingGroup);
    }
    this.buildingGroup = this.buildingLoader.load();
    this.scene.add(this.buildingGroup);
    useStore.getState().setBuildingLoaded(true);

    if (this.targetSunDirection.y > 0) {
      this.shadowRenderer.update(this.buildingGroup, this.currentSunDirection, this.scene);
    }
  }

  private switchTopView(): void {
    const targetPos = new THREE.Vector3(0, 50, 0.01);
    this.animateCamera(targetPos, new THREE.Vector3(0, 0, 0));
  }

  private switchPersonView(): void {
    const targetPos = new THREE.Vector3(25, 1.7, 25);
    this.animateCamera(targetPos, new THREE.Vector3(0, 5, 0));
  }

  private animateCamera(targetPosition: THREE.Vector3, targetLookAt: THREE.Vector3): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const duration = 800;
    const startTime = performance.now();

    const animateCam = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, targetPosition, eased);
      this.controls.target.lerpVectors(startTarget, targetLookAt, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateCam);
      }
    };
    animateCam();
  }

  private toggleEditMode(edit: boolean): void {
    this.isEditing = edit;
    this.buildingLoader.setControlPointsVisible(edit);
    this.controls.enabled = !edit;
  }

  private setupDragHandlers(): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.isEditing || !this.buildingGroup) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(
        this.buildingLoader.getControlPoints().map((cp) => cp.mesh)
      );

      if (intersects.length > 0) {
        this.selectedControlPoint = intersects[0].object as THREE.Mesh;
        this.dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()),
          this.selectedControlPoint.position
        );
        const planeIntersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
        if (planeIntersect) {
          this.dragOffset.copy(this.selectedControlPoint.position).sub(planeIntersect);
        }
        this.createGuideLine(this.selectedControlPoint.position);
        canvas.style.cursor = 'grabbing';
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.isEditing || !this.buildingGroup) {
        if (this.isEditing) {
          mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouse, this.camera);
          const cps = this.buildingLoader.getControlPoints().map((cp) => cp.mesh);
          const intersects = raycaster.intersectObjects(cps);
          canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
        }
        return;
      }

      if (this.selectedControlPoint) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        const planeIntersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
        if (planeIntersect) {
          this.selectedControlPoint.position.copy(planeIntersect.add(this.dragOffset));
          this.updateGuideLine(this.selectedControlPoint.position);
        }
      }
    });

    const onPointerUp = () => {
      if (this.selectedControlPoint) {
        this.selectedControlPoint = null;
        this.removeGuideLine();
        canvas.style.cursor = 'default';
        if (this.buildingGroup && this.targetSunDirection.y > 0) {
          this.shadowRenderer.update(this.buildingGroup, this.currentSunDirection, this.scene);
          this.updateShadowInfo(Math.asin(this.currentSunDirection.y));
        }
      }
    };

    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
  }

  private createGuideLine(position: THREE.Vector3): void {
    this.removeGuideLine();
    this.guideLineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      position.x, 0, position.z,
      position.x, position.y, position.z,
    ]);
    this.guideLineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.5,
    });
    this.guideLine = new THREE.Line(this.guideLineGeometry, material);
    this.scene.add(this.guideLine);
  }

  private updateGuideLine(position: THREE.Vector3): void {
    if (!this.guideLine || !this.guideLineGeometry) return;
    const positions = this.guideLineGeometry.attributes.position as THREE.BufferAttribute;
    positions.setXYZ(0, position.x, 0, position.z);
    positions.setXYZ(1, position.x, position.y, position.z);
    positions.needsUpdate = true;
  }

  private removeGuideLine(): void {
    if (this.guideLine) {
      this.scene.remove(this.guideLine);
      this.guideLine.geometry.dispose();
      (this.guideLine.material as THREE.Material).dispose();
      this.guideLine = null;
      this.guideLineGeometry = null;
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    if (this.lerpProgress < 1) {
      this.lerpProgress = Math.min(this.lerpProgress + 0.016, 1);
      this.currentSunDirection.lerpVectors(
        this.lerpStartDirection,
        this.targetSunDirection,
        this.lerpProgress
      );
    } else {
      this.currentSunDirection.copy(this.targetSunDirection);
    }

    const sunDistance = 80;
    const sunPosition = this.currentSunDirection.clone().multiplyScalar(sunDistance);
    this.sunLight.position.copy(sunPosition);
    this.sunLight.intensity = Math.max(0, this.currentSunDirection.y) * 2;

    if (this.sunHelper) {
      this.sunHelper.position.copy(sunPosition);
      const mat = this.sunHelper.material as THREE.MeshBasicMaterial;
      mat.opacity = this.currentSunDirection.y > 0 ? 0.8 : 0.1;
    }

    if (this.buildingGroup && this.lerpProgress >= 1) {
      this.shadowRenderer.update(this.buildingGroup, this.currentSunDirection, this.scene);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new SunlightSimulator();
