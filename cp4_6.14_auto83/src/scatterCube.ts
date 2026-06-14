import * as THREE from 'three';
import { dataManager, MetricType, WeatherDataPoint, CityInfo } from './dataManager';

export interface PointUserData {
  data: WeatherDataPoint;
  metric: MetricType;
  baseScale: number;
  isHovered: boolean;
  isHighlighted: boolean;
  isBlinking: boolean;
}

const AXIS_X_RANGE = 8;
const AXIS_Y_RANGE = 10;
const AXIS_Z_RANGE = 10;
const SPHERE_RADIUS = 0.06;
const SPHERE_DETAIL = 16;

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
  private labelsGroup: THREE.Group;
  private activeMetric: MetricType = 'temperature';
  private activeCityIndices: Set<number> = new Set();
  private pointsMap: Map<string, THREE.Mesh> = new Map();
  private currentSliceDay: number = -1;
  private hoveredPoint: THREE.Mesh | null = null;
  private blinkingCities: Set<number> = new Set();
  private raycaster: THREE.Raycaster;
  private baseSphereGeometry: THREE.SphereGeometry;
  private cities: CityInfo[];
  private totalDays: number;
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

    this.labelsGroup = new THREE.Group();
    this.labelsGroup.name = 'labels';
    this.group.add(this.labelsGroup);

    this.cities.forEach((c) => this.activeCityIndices.add(c.index));
    this.createAxes();
    this.rebuild();
  }

  private createAxes(): void {
    while (this.axesGroup.children.length > 0) {
      const child = this.axesGroup.children[0];
      this.axesGroup.remove(child);
    }
    while (this.labelsGroup.children.length > 0) {
      const child = this.labelsGroup.children[0];
      this.labelsGroup.remove(child);
    }

    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.6 });
    const halfX = AXIS_X_RANGE / 2;
    const halfY = AXIS_Y_RANGE / 2;
    const halfZ = AXIS_Z_RANGE / 2;
    const origin = new THREE.Vector3(-halfX, -halfY, -halfZ);

    const xEnd = new THREE.Vector3(halfX, -halfY, -halfZ);
    const yEnd = new THREE.Vector3(-halfX, halfY, -halfZ);
    const zEnd = new THREE.Vector3(-halfX, -halfY, halfZ);

    const xAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, xEnd]),
      new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 })
    );
    const yAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, yEnd]),
      new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.8 })
    );
    const zAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, zEnd]),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 })
    );
    this.axesGroup.add(xAxis, yAxis, zAxis);

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
        color: color,
        metalness: 0.2,
        roughness: 0.5,
        emissive: color,
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
        isBlinking: false,
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

    let targetScale = userData.baseScale;
    let targetEmissiveIntensity = 0.15;
    let opacity = 0.9;

    if (userData.isHovered) {
      targetScale = 1.5;
      targetEmissiveIntensity = 0.8;
      mat.color.set('#ffd700');
      mat.emissive.set('#ffd700');
    } else if (userData.isHighlighted) {
      targetScale = 2;
      targetEmissiveIntensity = 0.9;
      mat.color.set('#ffd700');
      mat.emissive.set('#ffd700');
      opacity = 1;
    } else {
      targetScale = userData.baseScale;
      const color = getMetricColor(userData.metric, userData.data[userData.metric]);
      mat.color.copy(color);
      mat.emissive.copy(color);
    }

    if (userData.isBlinking) {
      const blinkIntensity = 0.6 + Math.sin(Date.now() / 50) * 0.4;
      targetEmissiveIntensity = blinkIntensity;
      targetScale = 1.8;
      mat.color.set('#ffffff');
      mat.emissive.set('#ffffff');
    }

    mesh.scale.setScalar(targetScale);
    mat.emissiveIntensity = targetEmissiveIntensity;
    mat.opacity = opacity;
    mat.needsUpdate = true;
  }

  public handleRaycast(camera: THREE.Camera, mouse: THREE.Vector2): void {
    this.raycaster.setFromCamera(mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.pointsGroup.children, false);

    if (intersects.length > 0) {
      const point = intersects[0].object as THREE.Mesh;
      if (this.hoveredPoint !== point) {
        if (this.hoveredPoint) {
          (this.hoveredPoint.userData as PointUserData).isHovered = false;
          this.applyPointVisualState(this.hoveredPoint);
        }
        this.hoveredPoint = point;
        (point.userData as PointUserData).isHovered = true;
        this.applyPointVisualState(point);
      }
      if (this.onPointHover) {
        this.onPointHover(point, (point.userData as PointUserData).data);
      }
    } else {
      if (this.hoveredPoint) {
        (this.hoveredPoint.userData as PointUserData).isHovered = false;
        this.applyPointVisualState(this.hoveredPoint);
        this.hoveredPoint = null;
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
    this.blinkingCities.add(cityIndex);
    const startTime = Date.now();
    const duration = 800;

    this.pointsMap.forEach((mesh) => {
      const userData = mesh.userData as PointUserData;
      if (userData.data.cityIndex === cityIndex) {
        userData.isBlinking = true;
      }
    });

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        this.blinkingCities.delete(cityIndex);
        this.pointsMap.forEach((mesh) => {
          const userData = mesh.userData as PointUserData;
          if (userData.data.cityIndex === cityIndex) {
            userData.isBlinking = false;
            this.applyPointVisualState(mesh);
          }
        });
        return;
      }
      this.pointsMap.forEach((mesh) => {
        const userData = mesh.userData as PointUserData;
        if (userData.data.cityIndex === cityIndex) {
          this.applyPointVisualState(mesh);
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
  }

  public update(delta: number): void {
    if (this.blinkingCities.size > 0) {
      this.pointsMap.forEach((mesh) => {
        const userData = mesh.userData as PointUserData;
        if (userData.isBlinking) {
          this.applyPointVisualState(mesh);
        }
      });
    }
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
