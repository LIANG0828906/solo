import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { dataManager, MetricType, WeatherDataPoint, CityInfo } from './dataManager';

export interface PointUserData {
  data: WeatherDataPoint;
  metric: MetricType;
  baseScale: number;
  isHovered: boolean;
  isHighlighted: boolean;
}

const AXIS_X_RANGE = 8;
const AXIS_Y_RANGE = 10;
const AXIS_Z_RANGE = 10;
const SPHERE_RADIUS = 0.06;
const SPHERE_DETAIL = 12;

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

function getMetricColor(metric: MetricType, value: number): THREE.Color {
  const range = dataManager.getMetricRange(metric);
  const t = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  switch (metric) {
    case 'temperature': {
      const cold = new THREE.Color('#0000ff');
      const hot = new THREE.Color('#ff0000');
      return lerpColor(cold, hot, t);
    }
    case 'humidity': {
      const low = new THREE.Color('#e0f7fa');
      const high = new THREE.Color('#006064');
      return lerpColor(low, high, t);
    }
    case 'precipitation': {
      const low = new THREE.Color('#ffffff');
      const high = new THREE.Color('#000080');
      return lerpColor(low, high, t);
    }
  }
}

function mapDayToX(dayIndex: number, totalDays: number): number {
  return (dayIndex / (totalDays - 1)) * AXIS_X_RANGE - AXIS_X_RANGE / 2;
}

function mapValueToY(metric: MetricType, value: number): number {
  const range = dataManager.getMetricRange(metric);
  const t = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  return t * AXIS_Y_RANGE - AXIS_Y_RANGE / 2;
}

function mapCityToZ(cityIndex: number, totalCities: number): number {
  return (cityIndex / Math.max(1, totalCities - 1)) * AXIS_Z_RANGE - AXIS_Z_RANGE / 2;
}

export class ScatterCube {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private pointsGroup: THREE.Group;
  private axesGroup: THREE.Group;
  private activeMetric: MetricType = 'temperature';
  private activeCityIndices: Set<number> = new Set();
  private pointsMap: Map<string, THREE.Mesh> = new Map();
  private currentSliceDay: number = -1;
  private hoveredPoint: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private baseSphereGeometry: THREE.SphereGeometry;
  private cities: CityInfo[];
  private totalDays: number;
  private hoverLabel: CSS2DObject | null = null;
  private hoverLabelDiv: HTMLDivElement | null = null;
  public onPointHover: ((point: THREE.Mesh | null, data: WeatherDataPoint | null) => void) | null = null;
  public onPointClick: ((cityIndex: number) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.baseSphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, SPHERE_DETAIL, SPHERE_DETAIL);
    this.cities = dataManager.getCities();
    this.totalDays = dataManager.getTotalDays();

    this.group = new THREE.Group();
    this.group.name = 'scatterCube';
    this.scene.add(this.group);

    this.pointsGroup = new THREE.Group();
    this.pointsGroup.name = 'points';
    this.group.add(this.pointsGroup);

    this.axesGroup = new THREE.Group();
    this.axesGroup.name = 'axes';
    this.group.add(this.axesGroup);

    this.cities.forEach((c) => this.activeCityIndices.add(c.index));
    this.createHoverLabel();
    this.createAxes();
    this.rebuild();
  }

  private createHoverLabel(): void {
    const div = document.createElement('div');
    div.style.width = '120px';
    div.style.height = '60px';
    div.style.backgroundColor = '#1e293b';
    div.style.color = '#ffffff';
    div.style.borderRadius = '4px';
    div.style.padding = '6px 8px';
    div.style.fontSize = '11px';
    div.style.lineHeight = '1.6';
    div.style.pointerEvents = 'none';
    div.style.display = 'none';
    div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
    div.style.fontFamily = "'Microsoft YaHei','PingFang SC',sans-serif";
    div.style.overflow = 'hidden';
    div.style.whiteSpace = 'nowrap';
    div.style.textOverflow = 'ellipsis';
    div.style.border = '1px solid rgba(255,255,255,0.15)';

    this.hoverLabelDiv = div;
    this.hoverLabel = new CSS2DObject(div);
    this.hoverLabel.name = 'hoverLabel';
    this.group.add(this.hoverLabel);
  }

  private showHoverLabel(point: THREE.Mesh, data: WeatherDataPoint): void {
    if (!this.hoverLabelDiv || !this.hoverLabel) return;

    const metric = this.activeMetric;
    const value = data[metric];
    const unit = dataManager.getMetricUnit(metric);
    const metricLabel = dataManager.getMetricLabel(metric);

    this.hoverLabelDiv.innerHTML =
      '<div style="font-weight:600;color:#3b82f6;font-size:12px;">' + data.city + '</div>' +
      '<div style="color:#94a3b8;font-size:10px;">' + data.date + '</div>' +
      '<div style="margin-top:2px;">' + metricLabel + ': <span style="font-weight:500;">' + value + unit + '</span></div>';
    this.hoverLabelDiv.style.display = 'block';

    this.hoverLabel.position.set(point.position.x, point.position.y + 0.7, point.position.z);
  }

  private hideHoverLabel(): void {
    if (this.hoverLabelDiv) {
      this.hoverLabelDiv.style.display = 'none';
    }
  }

  private createAxes(): void {
    while (this.axesGroup.children.length > 0) {
      const child = this.axesGroup.children[0];
      this.axesGroup.remove(child);
    }

    const halfX = AXIS_X_RANGE / 2;
    const halfY = AXIS_Y_RANGE / 2;
    const halfZ = AXIS_Z_RANGE / 2;
    const origin = new THREE.Vector3(-halfX, -halfY, -halfZ);

    const xEnd = new THREE.Vector3(halfX, -halfY, -halfZ);
    const yEnd = new THREE.Vector3(-halfX, halfY, -halfZ);
    const zEnd = new THREE.Vector3(-halfX, -halfY, halfZ);

    this.axesGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, xEnd]),
      new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 })
    ));
    this.axesGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, yEnd]),
      new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.8 })
    ));
    this.axesGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, zEnd]),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 })
    ));

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const gridMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.25 });
      const x1 = new THREE.Vector3(-halfX + t * AXIS_X_RANGE, -halfY, -halfZ);
      const x2 = new THREE.Vector3(-halfX + t * AXIS_X_RANGE, -halfY, halfZ);
      this.axesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([x1, x2]), gridMat));
      const z1 = new THREE.Vector3(-halfX, -halfY, -halfZ + t * AXIS_Z_RANGE);
      const z2 = new THREE.Vector3(halfX, -halfY, -halfZ + t * AXIS_Z_RANGE);
      this.axesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([z1, z2]), gridMat));
    }

    const borderMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 });
    const corners: THREE.Vector3[][] = [
      [new THREE.Vector3(-halfX, -halfY, -halfZ), new THREE.Vector3(halfX, -halfY, -halfZ)],
      [new THREE.Vector3(halfX, -halfY, -halfZ), new THREE.Vector3(halfX, -halfY, halfZ)],
      [new THREE.Vector3(halfX, -halfY, halfZ), new THREE.Vector3(-halfX, -halfY, halfZ)],
      [new THREE.Vector3(-halfX, -halfY, halfZ), new THREE.Vector3(-halfX, -halfY, -halfZ)],
      [new THREE.Vector3(-halfX, halfY, -halfZ), new THREE.Vector3(halfX, halfY, -halfZ)],
      [new THREE.Vector3(halfX, halfY, -halfZ), new THREE.Vector3(halfX, halfY, halfZ)],
      [new THREE.Vector3(halfX, halfY, halfZ), new THREE.Vector3(-halfX, halfY, halfZ)],
      [new THREE.Vector3(-halfX, halfY, halfZ), new THREE.Vector3(-halfX, halfY, -halfZ)],
      [new THREE.Vector3(-halfX, -halfY, -halfZ), new THREE.Vector3(-halfX, halfY, -halfZ)],
      [new THREE.Vector3(halfX, -halfY, -halfZ), new THREE.Vector3(halfX, halfY, -halfZ)],
      [new THREE.Vector3(halfX, -halfY, halfZ), new THREE.Vector3(halfX, halfY, halfZ)],
      [new THREE.Vector3(-halfX, -halfY, halfZ), new THREE.Vector3(-halfX, halfY, halfZ)],
    ];
    corners.forEach(([a, b]) => {
      this.axesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), borderMat));
    });
  }

  private clearPoints(): void {
    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0] as THREE.Mesh;
      this.pointsGroup.remove(child);
      if (child.material && (child.material as THREE.Material).dispose) {
        (child.material as THREE.Material).dispose();
      }
    }
    this.pointsMap.clear();
  }

  public rebuild(): void {
    this.clearPoints();

    const filteredData = dataManager.query({
      cityIndices: Array.from(this.activeCityIndices),
    });

    for (const data of filteredData) {
      const value = data[this.activeMetric];
      const x = mapDayToX(data.dayIndex, this.totalDays);
      const y = mapValueToY(this.activeMetric, value);
      const z = mapCityToZ(data.cityIndex, this.cities.length);

      const color = getMetricColor(this.activeMetric, value);
      const material = new THREE.MeshStandardMaterial({
        color: color.clone(),
        metalness: 0.2,
        roughness: 0.5,
        emissive: color.clone(),
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(this.baseSphereGeometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const userData: PointUserData = {
        data,
        metric: this.activeMetric,
        baseScale: 1,
        isHovered: false,
        isHighlighted: data.dayIndex === this.currentSliceDay,
      };
      mesh.userData = userData;

      const key = `${data.cityIndex}-${data.dayIndex}`;
      this.pointsMap.set(key, mesh);
      this.pointsGroup.add(mesh);
    }

    this.updateSliceHighlight(this.currentSliceDay);
  }

  public setMetric(metric: MetricType): void {
    if (this.activeMetric === metric) return;
    this.activeMetric = metric;
    this.rebuild();
  }

  public setActiveCities(cityIndices: number[]): void {
    this.activeCityIndices = new Set(cityIndices);
    this.rebuild();
  }

  public updateSliceHighlight(dayIndex: number): void {
    this.currentSliceDay = dayIndex;
    this.pointsMap.forEach((mesh) => {
      const userData = mesh.userData as PointUserData;
      userData.isHighlighted = userData.data.dayIndex === dayIndex;
      this.applyPointVisualState(mesh);
    });
  }

  public getMetric(): MetricType {
    return this.activeMetric;
  }

  private applyPointVisualState(mesh: THREE.Mesh): void {
    const userData = mesh.userData as PointUserData;
    const mat = mesh.material as THREE.MeshStandardMaterial;

    if (userData.isHovered) {
      mesh.scale.setScalar(1.5);
      mat.color.set('#ffd700');
      mat.emissive.set('#ffd700');
      mat.emissiveIntensity = 0.8;
      mat.opacity = 1;
    } else if (userData.isHighlighted) {
      mesh.scale.setScalar(2);
      mat.color.set('#ffd700');
      mat.emissive.set('#ffd700');
      mat.emissiveIntensity = 0.9;
      mat.opacity = 1;
    } else {
      mesh.scale.setScalar(userData.baseScale);
      const color = getMetricColor(userData.metric, userData.data[userData.metric]);
      mat.color.copy(color);
      mat.emissive.copy(color);
      mat.emissiveIntensity = 0.15;
      mat.opacity = 0.9;
    }
    mat.needsUpdate = true;
  }

  public handleRaycast(camera: THREE.Camera, mouse: THREE.Vector2): void {
    this.raycaster.setFromCamera(mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.pointsGroup.children, false);

    if (intersects.length > 0) {
      const point = intersects[0].object as THREE.Mesh;
      if (this.hoveredPoint !== point) {
        if (this.hoveredPoint) {
          const prevData = this.hoveredPoint.userData as PointUserData;
          prevData.isHovered = false;
          this.applyPointVisualState(this.hoveredPoint);
        }
        this.hoveredPoint = point;
        const userData = point.userData as PointUserData;
        userData.isHovered = true;
        this.applyPointVisualState(point);
        this.showHoverLabel(point, userData.data);
      }
      if (this.onPointHover) {
        this.onPointHover(point, (point.userData as PointUserData).data);
      }
    } else {
      if (this.hoveredPoint) {
        const prevData = this.hoveredPoint.userData as PointUserData;
        prevData.isHovered = false;
        this.applyPointVisualState(this.hoveredPoint);
        this.hoveredPoint = null;
        this.hideHoverLabel();
        if (this.onPointHover) {
          this.onPointHover(null, null);
        }
      }
    }
  }

  public handleClick(camera: THREE.Camera, mouse: THREE.Vector2): void {
    this.raycaster.setFromCamera(mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.pointsGroup.children, false);
    if (intersects.length > 0) {
      const point = intersects[0].object as THREE.Mesh;
      const userData = point.userData as PointUserData;
      if (this.onPointClick) {
        this.onPointClick(userData.data.cityIndex);
      }
    }
  }

  public blinkCity(cityIndex: number): void {
    const BLINK_INTERVAL = 200;
    const TOTAL_DURATION = BLINK_INTERVAL * 3;

    const cityMeshes: THREE.Mesh[] = [];
    this.pointsMap.forEach((mesh) => {
      const userData = mesh.userData as PointUserData;
      if (userData.data.cityIndex === cityIndex) {
        cityMeshes.push(mesh);
      }
    });

    if (cityMeshes.length === 0) return;

    const startTime = Date.now();

    const animateBlink = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= TOTAL_DURATION) {
        cityMeshes.forEach((mesh) => {
          this.applyPointVisualState(mesh);
        });
        return;
      }

      const phase = Math.floor(elapsed / BLINK_INTERVAL);
      const isOn = phase === 0 || phase === 2;

      cityMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (isOn) {
          mat.color.set('#ffd700');
          mat.emissive.set('#ffd700');
          mat.emissiveIntensity = 1.0;
          mesh.scale.setScalar(1.8);
          mat.opacity = 1;
        } else {
          const userData = mesh.userData as PointUserData;
          const color = getMetricColor(userData.metric, userData.data[userData.metric]);
          mat.color.copy(color);
          mat.emissive.copy(color);
          mat.emissiveIntensity = 0.15;
          mesh.scale.setScalar(userData.baseScale);
          mat.opacity = 0.9;
        }
        mat.needsUpdate = true;
      });

      requestAnimationFrame(animateBlink);
    };
    animateBlink();
  }

  public update(_delta: number): void {
  }

  public getBoundingBox(): { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } {
    return {
      minX: -AXIS_X_RANGE / 2,
      maxX: AXIS_X_RANGE / 2,
      minY: -AXIS_Y_RANGE / 2,
      maxY: AXIS_Y_RANGE / 2,
      minZ: -AXIS_Z_RANGE / 2,
      maxZ: AXIS_Z_RANGE / 2,
    };
  }

  public static mapDayToWorldX(dayIndex: number, totalDays: number): number {
    return mapDayToX(dayIndex, totalDays);
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose(): void {
    this.clearPoints();
    this.baseSphereGeometry.dispose();
    this.scene.remove(this.group);
  }
}
