import * as THREE from 'three';
import { PlateData } from './data';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class TectonicPlate {
  data: PlateData;
  mesh: THREE.Mesh;
  border: THREE.LineSegments;
  trailLine: THREE.Line;
  glowMesh?: THREE.Mesh;
  isHighlighted: boolean;
  currentTime: number;
  targetTime: number;
  transitionFromTime: number;
  isTransitioning: boolean;
  transitionStartTime: number;
  transitionDuration: number;
  transitionFromPos: THREE.Vector3;
  transitionFromRot: THREE.Euler;
  transitionToPos: THREE.Vector3;
  transitionToRot: THREE.Euler;
  trailFadeTimer: number;
  trailOpacity: number;
  centerPoint: THREE.Vector3;
  driftDirection: THREE.Vector3;

  constructor(data: PlateData, scene: THREE.Scene) {
    this.data = data;
    this.isHighlighted = false;
    this.currentTime = -200;
    this.targetTime = -200;
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 5000;
    this.transitionFromPos = new THREE.Vector3();
    this.transitionFromRot = new THREE.Euler();
    this.transitionToPos = new THREE.Vector3();
    this.transitionToRot = new THREE.Euler();
    this.trailFadeTimer = 0;
    this.trailOpacity = 0;
    this.centerPoint = new THREE.Vector3();
    this.driftDirection = new THREE.Vector3();
    this.transitionFromTime = -200;

    this.mesh = this.createPlateMesh();
    this.border = this.createBorder();
    this.trailLine = this.createTrailLine();
    this.createGlowMesh();

    scene.add(this.mesh);
    scene.add(this.border);
    scene.add(this.trailLine);

    this.setInitialPosition(this.currentTime);
  }

  private createPlateMesh(): THREE.Mesh {
    const geometry = this.createPlateGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: this.data.color,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      shininess: 10,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.plate = this;
    mesh.userData.isPlate = true;
    return mesh;
  }

  private createPlateGeometry(): THREE.BufferGeometry {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const EARTH_RADIUS = 5.01;

    const centerLat = this.data.outlinePoints.reduce((sum, p) => sum + p[0], 0) / this.data.outlinePoints.length;
    const centerLon = this.data.outlinePoints.reduce((sum, p) => sum + p[1], 0) / this.data.outlinePoints.length;
    const centerVec = latLonToVector3(centerLat, centerLon, EARTH_RADIUS).normalize();

    const boundaryVecs: THREE.Vector3[] = [];
    for (const [lat, lon] of this.data.outlinePoints) {
      boundaryVecs.push(latLonToVector3(lat, lon, EARTH_RADIUS));
    }

    for (let i = 0; i < boundaryVecs.length; i++) {
      const v1 = boundaryVecs[i];
      const v2 = boundaryVecs[(i + 1) % boundaryVecs.length];
      const vMid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS);
      const centerScaled = centerVec.clone().multiplyScalar(EARTH_RADIUS);

      const idx1 = positions.length / 3;
      positions.push(centerScaled.x, centerScaled.y, centerScaled.z);
      normals.push(centerVec.x, centerVec.y, centerVec.z);

      const idx2 = positions.length / 3;
      positions.push(v1.x, v1.y, v1.z);
      normals.push(v1.clone().normalize().x, v1.clone().normalize().y, v1.clone().normalize().z);

      const idx3 = positions.length / 3;
      positions.push(vMid.x, vMid.y, vMid.z);
      normals.push(vMid.clone().normalize().x, vMid.clone().normalize().y, vMid.clone().normalize().z);

      const idx4 = positions.length / 3;
      positions.push(v2.x, v2.y, v2.z);
      normals.push(v2.clone().normalize().x, v2.clone().normalize().y, v2.clone().normalize().z);

      indices.push(idx1, idx2, idx3);
      indices.push(idx1, idx3, idx4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    return geometry;
  }

  private createBorder(): THREE.LineSegments {
    const points: THREE.Vector3[] = [];
    const EARTH_RADIUS = 5.02;

    for (const [lat, lon] of this.data.outlinePoints) {
      points.push(latLonToVector3(lat, lon, EARTH_RADIUS));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xB0C4DE,
      transparent: true,
      opacity: 0.9,
      linewidth: 1,
    });
    const line = new THREE.LineLoop(geometry, material);
    return line as unknown as THREE.LineSegments;
  }

  private createTrailLine(): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineDashedMaterial({
      color: 0x7F8C8D,
      dashSize: 0.1,
      gapSize: 0.1,
      transparent: true,
      opacity: 0,
    });

    const line = new THREE.Line(geometry, material);
    return line;
  }

  private createGlowMesh(): void {
    const positions = (this.mesh.geometry as THREE.BufferGeometry).attributes.position;
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', positions.clone());
    glowGeometry.setIndex((this.mesh.geometry as THREE.BufferGeometry).index?.clone() || null);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xF39C12,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowMesh.scale.setScalar(1.01);
    this.mesh.add(this.glowMesh);
  }

  private getPositionAtTime(time: number): [number, number, number] {
    const points = this.data.pathPoints;

    if (time <= points[0].time) {
      return points[0].position;
    }
    if (time >= points[points.length - 1].time) {
      return points[points.length - 1].position;
    }

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const t = (time - points[i].time) / (points[i + 1].time - points[i].time);
        const easedT = easeInOutCubic(t);
        return lerpVector3(points[i].position, points[i + 1].position, easedT);
      }
    }

    return points[0].position;
  }

  private getRotationAtTime(time: number): [number, number, number] {
    const points = this.data.pathPoints;

    if (time <= points[0].time) {
      return points[0].rotation;
    }
    if (time >= points[points.length - 1].time) {
      return points[points.length - 1].rotation;
    }

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const t = (time - points[i].time) / (points[i + 1].time - points[i].time);
        const easedT = easeInOutCubic(t);
        return lerpVector3(points[i].rotation, points[i + 1].rotation, easedT);
      }
    }

    return points[0].rotation;
  }

  private setInitialPosition(time: number): void {
    const pos = this.getPositionAtTime(time);
    const rot = this.getRotationAtTime(time);

    this.mesh.position.set(pos[0], pos[1], pos[2]);
    this.mesh.rotation.set(rot[0], rot[1], rot[2]);
    this.border.position.copy(this.mesh.position);
    this.border.rotation.copy(this.mesh.rotation);

    this.centerPoint.copy(this.mesh.position);
    this.updateDriftDirection(time);
  }

  updatePosition(targetTime: number, duration: number = 5000): void {
    if (Math.abs(targetTime - this.currentTime) < 0.1) return;

    this.transitionFromPos.copy(this.mesh.position);
    this.transitionFromRot.copy(this.mesh.rotation);

    const toPos = this.getPositionAtTime(targetTime);
    const toRot = this.getRotationAtTime(targetTime);
    this.transitionToPos.set(toPos[0], toPos[1], toPos[2]);
    this.transitionToRot.set(toRot[0], toRot[1], toRot[2]);

    this.transitionFromTime = this.currentTime;
    this.targetTime = targetTime;
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;

    this.updateTrailLine();
    this.showTrail();
  }

  private updateDriftDirection(time: number): void {
    const futureTime = Math.min(time + 10, 0);
    const futurePos = this.getPositionAtTime(futureTime);
    const currentPos = this.getPositionAtTime(time);

    this.driftDirection.set(
      futurePos[0] - currentPos[0],
      futurePos[1] - currentPos[1],
      futurePos[2] - currentPos[2]
    ).normalize();
  }

  update(deltaTime: number, cameraDistance: number): void {
    const now = performance.now();

    if (this.isTransitioning) {
      const elapsed = now - this.transitionStartTime;
      const t = Math.min(elapsed / this.transitionDuration, 1);
      const easedT = easeInOutCubic(t);

      const newPos = new THREE.Vector3().lerpVectors(
        this.transitionFromPos,
        this.transitionToPos,
        easedT
      );
      const newRot = new THREE.Euler(
        lerp(this.transitionFromRot.x, this.transitionToRot.x, easedT),
        lerp(this.transitionFromRot.y, this.transitionToRot.y, easedT),
        lerp(this.transitionFromRot.z, this.transitionToRot.z, easedT)
      );

      this.mesh.position.copy(newPos);
      this.mesh.rotation.copy(newRot);
      this.border.position.copy(newPos);
      this.border.rotation.copy(newRot);
      this.centerPoint.copy(newPos);
      this.currentTime = lerp(this.transitionFromTime, this.targetTime, easedT);

      this.pulseGlow(now);

      if (t >= 1) {
        this.isTransitioning = false;
        this.currentTime = this.targetTime;
        if (this.glowMesh) {
          (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    }

    this.updateBorderLineWidth(cameraDistance);
    this.updateTrailFade(deltaTime);
  }

  private updateBorderLineWidth(cameraDistance: number): void {
    const baseScale = 1;
    const adaptiveScale = baseScale * (cameraDistance / 20);
    this.border.scale.setScalar(Math.max(1, adaptiveScale));
  }

  pulseGlow(time: number): void {
    if (!this.glowMesh) return;

    const pulsePeriod = 800;
    const pulsePhase = (time % pulsePeriod) / pulsePeriod;
    const pulseIntensity = Math.sin(pulsePhase * Math.PI * 2) * 0.5 + 0.5;

    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = pulseIntensity * 0.4;
    this.glowMesh.scale.setScalar(1.01 + pulseIntensity * 0.01);
  }

  toggleHighlight(active: boolean): void {
    this.isHighlighted = active;
    const material = this.mesh.material as THREE.MeshPhongMaterial;

    if (active) {
      material.color.setHex(0xF1C40F);
      material.opacity = 0.4;
      material.transparent = true;
    } else {
      material.color.set(this.data.color);
      material.opacity = 1.0;
    }
  }

  showInfoCard(camera: THREE.Camera, screenWidth: number, screenHeight: number): void {
    const card = document.getElementById('info-card');
    if (!card) return;

    const projected = this.centerPoint.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * screenWidth;
    const y = (-projected.y * 0.5 + 0.5) * screenHeight;

    document.getElementById('plate-name')!.textContent = this.data.name;
    document.getElementById('plate-area')!.textContent = `${this.data.area} 百万 km²`;
    document.getElementById('plate-speed')!.textContent = `${this.data.driftSpeed} 厘米/年`;

    const directionArrow = document.getElementById('direction-arrow')!;
    const angle = Math.atan2(this.driftDirection.x, this.driftDirection.z) * (180 / Math.PI);
    directionArrow.style.transform = `rotate(${angle}deg)`;

    let cardX = x + 20;
    let cardY = y - 50;

    if (cardX + 240 > screenWidth) cardX = x - 260;
    if (cardY < 0) cardY = 20;
    if (cardY + 200 > screenHeight) cardY = screenHeight - 220;

    card.style.left = `${cardX}px`;
    card.style.top = `${cardY}px`;
    card.classList.add('visible');
  }

  hideInfoCard(): void {
    const card = document.getElementById('info-card');
    if (card) {
      card.classList.remove('visible');
    }
  }

  updateTrailLine(): void {
    const positions = this.trailLine.geometry.attributes.position.array as Float32Array;

    const currentPos = this.mesh.position;
    const targetPos = this.getPositionAtTime(0);

    positions[0] = currentPos.x;
    positions[1] = currentPos.y;
    positions[2] = currentPos.z;
    positions[3] = targetPos[0];
    positions[4] = targetPos[1];
    positions[5] = targetPos[2];

    this.trailLine.geometry.attributes.position.needsUpdate = true;
    this.trailLine.computeLineDistances();
  }

  showTrail(): void {
    (this.trailLine.material as THREE.LineDashedMaterial).opacity = 0.3;
    this.trailFadeTimer = 3000;
    this.trailOpacity = 0.3;
  }

  private updateTrailFade(deltaTime: number): void {
    if (this.isTransitioning) {
      this.trailFadeTimer = 3000;
      (this.trailLine.material as THREE.LineDashedMaterial).opacity = 0.3;
      return;
    }

    if (this.trailFadeTimer > 0) {
      this.trailFadeTimer -= deltaTime;
      if (this.trailFadeTimer <= 0) {
        const fadeDuration = 1000;
        const fadeElapsed = Math.abs(this.trailFadeTimer);
        const fadeT = Math.min(fadeElapsed / fadeDuration, 1);
        this.trailOpacity = 0.3 * (1 - fadeT);
        (this.trailLine.material as THREE.LineDashedMaterial).opacity = this.trailOpacity;
      }
    }
  }

  getDriftDirectionAngle(): number {
    return Math.atan2(this.driftDirection.x, this.driftDirection.z) * (180 / Math.PI);
  }
}
