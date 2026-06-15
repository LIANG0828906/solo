import * as THREE from 'three';
import { PlateData, PlateInfo } from './types';
import {
  latLngToVector3,
  bezier3,
  generateIrregularPolygon,
  createPlateGeometry,
  createEdgeGeometry,
  seededRandom
} from './utils';

export class Plate {
  private data: PlateData;
  private earthRadius: number;
  private mesh: THREE.Mesh | null = null;
  private edgeLine: THREE.Line | null = null;
  private edgeMaterial: THREE.LineBasicMaterial | null = null;
  private plateMaterial: THREE.MeshStandardMaterial | null = null;
  private surfacePoints: THREE.Vector3[] = [];
  private currentPosition: THREE.Vector3;
  private basePoints: THREE.Vector3[] = [];
  private cities: THREE.Points | null = null;
  private cityMaterial: THREE.PointsMaterial | null = null;
  private time: number = 0;

  constructor(data: PlateData, earthRadius: number) {
    this.data = data;
    this.earthRadius = earthRadius;
    this.currentPosition = latLngToVector3(data.startLat, data.startLng, earthRadius);
  }

  public create(): THREE.Group {
    const group = new THREE.Group();
    group.userData.plateId = this.data.id;
    group.userData.plate = this;

    const startPos = latLngToVector3(this.data.startLat, this.data.startLng, this.earthRadius);
    this.basePoints = generateIrregularPolygon(
      startPos,
      this.data.size,
      12,
      this.data.irregularity,
      this.data.id * 100
    );

    this.surfacePoints = [...this.basePoints];

    const geometry = createPlateGeometry(this.surfacePoints, this.earthRadius, this.data.baseElevation * 0.001);
    this.plateMaterial = new THREE.MeshStandardMaterial({
      color: this.data.color,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geometry, this.plateMaterial);
    this.mesh.userData.plateId = this.data.id;
    this.mesh.userData.plate = this;
    group.add(this.mesh);

    const edgeGeometry = createEdgeGeometry(this.surfacePoints, this.earthRadius, this.data.baseElevation * 0.001);
    this.edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      linewidth: 1
    });

    this.edgeLine = new THREE.Line(edgeGeometry, this.edgeMaterial);
    group.add(this.edgeLine);

    this.createCities(group);

    return group;
  }

  private createCities(group: THREE.Group): void {
    const cityCount = Math.floor(3 + seededRandom(this.data.id * 7) * 5);
    const positions: number[] = [];
    const phases: number[] = [];

    for (let i = 0; i < cityCount; i++) {
      const idx = Math.floor(seededRandom(this.data.id * 13 + i) * this.basePoints.length);
      const basePoint = this.basePoints[idx];
      const nextPoint = this.basePoints[(idx + 1) % this.basePoints.length];
      const t = seededRandom(this.data.id * 17 + i);
      
      const pos = new THREE.Vector3().lerpVectors(basePoint, nextPoint, t);
      const n = pos.clone().normalize();
      const elevated = n.multiplyScalar(this.earthRadius + this.data.baseElevation * 0.001 * 0.8 + 0.001);
      
      positions.push(elevated.x, elevated.y, elevated.z);
      phases.push(seededRandom(this.data.id * 19 + i) * Math.PI * 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

    this.cityMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    this.cities = new THREE.Points(geometry, this.cityMaterial);
    this.cities.userData.isCity = true;
    group.add(this.cities);
  }

  public update(progress: number, deltaTime: number): void {
    this.time += deltaTime;

    const lat = bezier3(
      progress,
      this.data.startLat,
      this.data.cp1Lat,
      this.data.cp2Lat,
      this.data.endLat
    );
    const lng = bezier3(
      progress,
      this.data.startLng,
      this.data.cp1Lng,
      this.data.cp2Lng,
      this.data.endLng
    );

    const newCenter = latLngToVector3(lat, lng, this.earthRadius);
    const rotation = progress * this.data.rotationSpeed;

    const oldNormal = this.currentPosition.clone().normalize();
    const newNormal = newCenter.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(oldNormal, newNormal);
    
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(newNormal, rotation);
    const finalQuat = rotationQuat.multiply(quaternion);

    this.surfacePoints = this.basePoints.map(p => {
      const v = p.clone();
      v.applyQuaternion(finalQuat);
      return v;
    });

    this.currentPosition.copy(newCenter);

    this.updateGeometry();
    this.updateCityAnimation();
  }

  private updateGeometry(): void {
    if (!this.mesh || !this.edgeLine) return;

    const geometry = createPlateGeometry(this.surfacePoints, this.earthRadius, this.data.baseElevation * 0.001);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;

    const edgeGeometry = createEdgeGeometry(this.surfacePoints, this.earthRadius, this.data.baseElevation * 0.001);
    this.edgeLine.geometry.dispose();
    this.edgeLine.geometry = edgeGeometry;

    this.updateCityPositions();
  }

  private updateCityPositions(): void {
    if (!this.cities) return;

    const positions = this.cities.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / count) * this.basePoints.length);
      const basePoint = this.basePoints[idx];
      const nextPoint = this.basePoints[(idx + 1) % this.basePoints.length];
      const t = (i / count) * this.basePoints.length - idx;
      
      const pos = new THREE.Vector3().lerpVectors(basePoint, nextPoint, t);
      const oldNormal = this.currentPosition.clone().normalize();
      const newNormal = this.currentPosition.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(oldNormal, newNormal);
      const rotated = pos.clone().applyQuaternion(quaternion);
      
      const n = rotated.clone().normalize();
      const elevated = n.multiplyScalar(this.earthRadius + this.data.baseElevation * 0.001 * 0.8 + 0.001);
      
      positions.setXYZ(i, elevated.x, elevated.y, elevated.z);
    }
    positions.needsUpdate = true;
  }

  private updateCityAnimation(): void {
    if (!this.cityMaterial) return;
    const phase = this.time * Math.PI;
    const opacity = 0.5 + Math.sin(phase) * 0.3;
    this.cityMaterial.opacity = Math.max(0.5, Math.min(0.8, opacity));
  }

  public highlight(active: boolean): void {
    if (!this.edgeMaterial) return;

    if (active) {
      this.edgeMaterial.color.setHex(0xFFD700);
      this.edgeMaterial.opacity = 0.6;
    } else {
      this.edgeMaterial.color.setHex(0xFFFFFF);
      this.edgeMaterial.opacity = 0.3;
    }
  }

  public getInfo(): PlateInfo {
    const speedVal = (this.data.baseSpeed + Math.sin(this.time * 0.5) * 0.5).toFixed(1);
    const elevVal = this.data.baseElevation.toFixed(0);
    const elevSign = this.data.baseElevation >= 0 ? '+' : '';
    return {
      name: this.data.name,
      speed: `${speedVal} cm/年`,
      elevation: `平均${elevSign}${elevVal}m`
    };
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  public dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.plateMaterial) this.plateMaterial.dispose();
    }
    if (this.edgeLine) {
      this.edgeLine.geometry.dispose();
      if (this.edgeMaterial) this.edgeMaterial.dispose();
    }
    if (this.cities) {
      this.cities.geometry.dispose();
      if (this.cityMaterial) this.cityMaterial.dispose();
    }
  }
}
