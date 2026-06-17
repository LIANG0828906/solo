import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EventBus, CountryEnergyData, YearlyData } from './EventBus';

interface ScatterPoint {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  data: CountryEnergyData;
  baseScale: number;
  targetPosition: THREE.Vector3;
  targetScale: number;
  currentPosition: THREE.Vector3;
  currentScale: number;
  isAnimating: boolean;
  animStartTime: number;
  startPosition: THREE.Vector3;
  startScale: number;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const ANIM_DURATION = 800;
const MIN_RADIUS = 0.15;
const MAX_RADIUS = 0.6;
const Y_RANGE: [number, number] = [-1, 3];

export class SceneManager {
  private eventBus: EventBus;
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private scatterPoints: ScatterPoint[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedPoint: ScatterPoint | null = null;
  private hoveredPoint: ScatterPoint | null = null;
  private clock: THREE.Clock;
  private countryData: CountryEnergyData[] = [];
  private currentYear: number = 2020;
  private minConsumption: number = 0;
  private maxConsumption: number = 0;
  private animationId: number = 0;

  constructor(container: HTMLElement) {
    this.eventBus = EventBus.getInstance();
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 8, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0B0C10, 1);
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;
    this.controls.target.set(0, 0.5, 0);

    this.setupScene();
    this.bindEvents();
    this.subscribeEvents();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x0B0C10);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x45A29E, 0.5, 30);
    pointLight1.position.set(-5, 5, -5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x66FCF1, 0.3, 30);
    pointLight2.position.set(5, 3, 5);
    this.scene.add(pointLight2);

    this.createGroundGrid();
    this.createAxes();
  }

  private createGroundGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x2C2E3A, 0x2C2E3A);
    gridHelper.position.y = -1.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.5;
    this.scene.add(gridHelper);
  }

  private createAxes(): void {
    const axisLength = 10;
    const axisOpacity = 0.6;

    const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(axisLength, -1.5, 0),
    ]);
    const xAxisMat = new THREE.LineBasicMaterial({ color: 0x45A29E, transparent: true, opacity: axisOpacity });
    this.scene.add(new THREE.Line(xAxisGeo, xAxisMat));

    const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, axisLength - 1.5, 0),
    ]);
    const yAxisMat = new THREE.LineBasicMaterial({ color: 0x66FCF1, transparent: true, opacity: axisOpacity });
    this.scene.add(new THREE.Line(yAxisGeo, yAxisMat));

    const zAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, -1.5, axisLength),
    ]);
    const zAxisMat = new THREE.LineBasicMaterial({ color: 0xC5C6C7, transparent: true, opacity: axisOpacity });
    this.scene.add(new THREE.Line(zAxisGeo, zAxisMat));

    this.addAxisLabel('可再生能源占比 (%)', new THREE.Vector3(axisLength + 0.3, -1.5, 0));
    this.addAxisLabel('总能源消耗 (对数)', new THREE.Vector3(0, axisLength - 1.5 + 0.5, 0));
    this.addAxisLabel('化石燃料占比 (%)', new THREE.Vector3(0, -1.5, axisLength + 0.3));
  }

  private addAxisLabel(text: string, position: THREE.Vector3): void {
    const div = document.createElement('div');
    div.className = 'axis-label';
    div.textContent = text;
    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.scene.add(label);
  }

  private subscribeEvents(): void {
    this.eventBus.on('data-loaded', (data) => {
      this.countryData = data;
      this.computeConsumptionRange();
      this.createScatterPoints();
      this.updatePositionsForYear(this.currentYear, false);
    });

    this.eventBus.on('year-changed', (year) => {
      this.currentYear = year;
      this.updatePositionsForYear(year, true);
    });
  }

  private computeConsumptionRange(): void {
    let min = Infinity;
    let max = -Infinity;
    for (const country of this.countryData) {
      for (const yearData of country.yearlyData) {
        if (yearData.totalConsumption < min) min = yearData.totalConsumption;
        if (yearData.totalConsumption > max) max = yearData.totalConsumption;
      }
    }
    this.minConsumption = min;
    this.maxConsumption = max;
  }

  private createScatterPoints(): void {
    this.scatterPoints.forEach((sp) => {
      this.scene.remove(sp.mesh);
      this.scene.remove(sp.glowMesh);
    });
    this.scatterPoints = [];

    for (const country of this.countryData) {
      const primaryColor = this.getEnergyColor(country.primaryEnergy);

      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: 0.15,
        shininess: 80,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.country = country;
      mesh.userData.isScatter = true;

      const glowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x45A29E,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.visible = false;
      mesh.add(glowMesh);

      const scatterPoint: ScatterPoint = {
        mesh,
        glowMesh,
        data: country,
        baseScale: 0.3,
        targetPosition: new THREE.Vector3(),
        targetScale: 0.3,
        currentPosition: new THREE.Vector3(),
        currentScale: 0.3,
        isAnimating: false,
        animStartTime: 0,
        startPosition: new THREE.Vector3(),
        startScale: 0.3,
      };

      this.scene.add(mesh);
      this.scatterPoints.push(scatterPoint);
    }
  }

  private getEnergyColor(type: 'renewable' | 'fossil' | 'nuclear'): number {
    switch (type) {
      case 'renewable': return 0x45A29E;
      case 'fossil': return 0xC5C6C7;
      case 'nuclear': return 0x66FCF1;
    }
  }

  private interpolateYearlyData(country: CountryEnergyData, targetYear: number): YearlyData | null {
    const data = country.yearlyData;
    if (data.length === 0) return null;

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].year === targetYear) return data[i];
      if (data[i + 1].year === targetYear) return data[i + 1];
      if (data[i].year < targetYear && data[i + 1].year > targetYear) {
        const t = (targetYear - data[i].year) / (data[i + 1].year - data[i].year);
        return {
          year: targetYear,
          renewable: data[i].renewable + (data[i + 1].renewable - data[i].renewable) * t,
          fossil: data[i].fossil + (data[i + 1].fossil - data[i].fossil) * t,
          nuclear: data[i].nuclear + (data[i + 1].nuclear - data[i].nuclear) * t,
          totalConsumption: data[i].totalConsumption + (data[i + 1].totalConsumption - data[i].totalConsumption) * t,
        };
      }
    }
    return targetYear <= data[0].year ? data[0] : data[data.length - 1];
  }

  private updatePositionsForYear(year: number, animate: boolean): void {
    const startTime = performance.now();

    for (const sp of this.scatterPoints) {
      const yearData = this.interpolateYearlyData(sp.data, year);
      if (!yearData) continue;

      const x = (yearData.renewable / 100) * 10;
      const logConsumption = Math.log(yearData.totalConsumption);
      const logMin = Math.log(this.minConsumption);
      const logMax = Math.log(this.maxConsumption);
      const y = ((logConsumption - logMin) / (logMax - logMin)) * (Y_RANGE[1] - Y_RANGE[0]) + Y_RANGE[0];
      const z = (yearData.fossil / 100) * 10;

      const normalizedConsumption = (yearData.totalConsumption - this.minConsumption) / (this.maxConsumption - this.minConsumption);
      const radius = MIN_RADIUS + normalizedConsumption * (MAX_RADIUS - MIN_RADIUS);

      const targetPos = new THREE.Vector3(x, y, z);

      if (animate) {
        sp.startPosition.copy(sp.currentPosition);
        sp.startScale = sp.currentScale;
        sp.targetPosition.copy(targetPos);
        sp.targetScale = radius;
        sp.isAnimating = true;
        sp.animStartTime = performance.now();
      } else {
        sp.currentPosition.copy(targetPos);
        sp.currentScale = radius;
        sp.targetPosition.copy(targetPos);
        sp.targetScale = radius;
        sp.mesh.position.copy(targetPos);
        sp.mesh.scale.setScalar(radius);
        sp.baseScale = radius;
      }

      this.mixColor(sp.mesh, yearData);
    }

    if (this.selectedPoint) {
      const yearData = this.interpolateYearlyData(this.selectedPoint.data, year);
      if (yearData) {
        this.eventBus.emit('country-selected', {
          ...this.selectedPoint.data,
          yearlyData: [yearData],
        });
      }
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 40) {
      console.warn(`Year update took ${elapsed.toFixed(1)}ms, target <50ms`);
    }
  }

  private mixColor(mesh: THREE.Mesh, yearData: YearlyData): void {
    const mat = mesh.material as THREE.MeshPhongMaterial;
    const rCol = new THREE.Color(0x45A29E);
    const fCol = new THREE.Color(0xC5C6C7);
    const nCol = new THREE.Color(0x66FCF1);
    const mixed = new THREE.Color();
    mixed.setRGB(0, 0, 0);
    mixed.r += (rCol.r * yearData.renewable + fCol.r * yearData.fossil + nCol.r * yearData.nuclear) / 100;
    mixed.g += (rCol.g * yearData.renewable + fCol.g * yearData.fossil + nCol.g * yearData.nuclear) / 100;
    mixed.b += (rCol.b * yearData.renewable + fCol.b * yearData.fossil + nCol.b * yearData.nuclear) / 100;
    mat.color.copy(mixed);
    mat.emissive.copy(mixed);
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('click', this.onClick);
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
  };

  private updateMouse(event: MouseEvent | PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerMove = (event: PointerEvent): void => {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.scatterPoints.map((sp) => sp.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (this.hoveredPoint && (!intersects.length || intersects[0].object !== this.hoveredPoint.mesh)) {
      if (this.hoveredPoint !== this.selectedPoint) {
        const target = this.hoveredPoint.isAnimating ? this.hoveredPoint.targetScale : this.hoveredPoint.baseScale;
        this.hoveredPoint.mesh.scale.setScalar(target);
        const mat = this.hoveredPoint.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = 0.15;
      }
      this.hoveredPoint = null;
      document.body.style.cursor = 'default';
    }

    if (intersects.length > 0) {
      const point = this.scatterPoints.find((sp) => sp.mesh === intersects[0].object);
      if (point && point !== this.hoveredPoint && point !== this.selectedPoint) {
        this.hoveredPoint = point;
        const target = point.isAnimating ? point.targetScale : point.baseScale;
        point.mesh.scale.setScalar(target * 1.1);
        const mat = point.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = 0.35;
        document.body.style.cursor = 'pointer';
      } else if (point) {
        document.body.style.cursor = 'pointer';
      }
    }
  };

  private onClick = (event: MouseEvent): void => {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.scatterPoints.map((sp) => sp.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const point = this.scatterPoints.find((sp) => sp.mesh === intersects[0].object);
      if (point) {
        this.selectPoint(point);
        return;
      }
    }
    this.deselectPoint();
  };

  private selectPoint(point: ScatterPoint): void {
    if (this.selectedPoint) {
      this.selectedPoint.glowMesh.visible = false;
      (this.selectedPoint.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      const s = this.selectedPoint.isAnimating ? this.selectedPoint.targetScale : this.selectedPoint.baseScale;
      this.selectedPoint.mesh.scale.setScalar(s);
    }

    this.selectedPoint = point;
    point.glowMesh.visible = true;
    (point.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
    const base = point.isAnimating ? point.targetScale : point.baseScale;
    point.mesh.scale.setScalar(base * 1.3);

    const yearData = this.interpolateYearlyData(point.data, this.currentYear);
    if (yearData) {
      this.eventBus.emit('country-selected', {
        ...point.data,
        yearlyData: [yearData],
      });
    }
  }

  private deselectPoint(): void {
    if (this.selectedPoint) {
      this.selectedPoint.glowMesh.visible = false;
      (this.selectedPoint.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      const s = this.selectedPoint.isAnimating ? this.selectedPoint.targetScale : this.selectedPoint.baseScale;
      this.selectedPoint.mesh.scale.setScalar(s);
      this.selectedPoint = null;
    }
    this.eventBus.emit('country-selected', null);
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = this.clock.getDelta();

      for (const sp of this.scatterPoints) {
        if (sp.isAnimating) {
          const t = Math.min((now - sp.animStartTime) / ANIM_DURATION, 1);
          const ease = easeOutCubic(t);
          sp.currentPosition.lerpVectors(sp.startPosition, sp.targetPosition, ease);
          sp.currentScale = sp.startScale + (sp.targetScale - sp.startScale) * ease;
          sp.mesh.position.copy(sp.currentPosition);
          if (sp !== this.selectedPoint && sp !== this.hoveredPoint) {
            sp.mesh.scale.setScalar(sp.currentScale);
          } else if (sp === this.hoveredPoint && sp !== this.selectedPoint) {
            sp.mesh.scale.setScalar(sp.currentScale * 1.1);
          } else if (sp === this.selectedPoint) {
            sp.mesh.scale.setScalar(sp.currentScale * 1.3);
          }
          sp.baseScale = sp.currentScale;
          if (t >= 1) {
            sp.isAnimating = false;
            sp.currentPosition.copy(sp.targetPosition);
            sp.currentScale = sp.targetScale;
            sp.baseScale = sp.targetScale;
          }
        }

        if (sp.glowMesh.visible) {
          const pulse = 0.5 + Math.sin(now * 0.003) * 0.1;
          (sp.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * pulse + 0.1;
        }
      }

      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    animate();
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.controls.dispose();
    this.renderer.dispose();
  }

  public getSelectedCountry(): CountryEnergyData | null {
    return this.selectedPoint ? this.selectedPoint.data : null;
  }

  public getCurrentYear(): number {
    return this.currentYear;
  }
}
