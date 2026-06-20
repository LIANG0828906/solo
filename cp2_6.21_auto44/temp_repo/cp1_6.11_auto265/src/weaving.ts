import * as THREE from 'three';

export type PatternType = 'herringbone' | 'meander' | 'cross' | 'diamond';

export interface WeaveLine {
  id: string;
  type: 'warp' | 'weft';
  points: THREE.Vector3[];
  color: string;
  lineWidth: number;
  mesh: THREE.Mesh | THREE.Line;
  opacity: number;
  originalPoints: THREE.Vector3[];
}

export interface IntersectionPoint {
  id: string;
  position: THREE.Vector3;
  warpId: string;
  weftId: string;
  warpOver: boolean;
}

const WARP_COLOR = '#B8860B';
const WEFT_COLOR = '#D2B48C';
const WARP_OFFSET = 0.5;
const WEFT_OFFSET = -0.2;

export class WeavingEngine {
  private scene: THREE.Scene;
  private radius: number;
  private pattern: PatternType = 'cross';
  private warpCount: number = 16;
  private weftDensity: number = 1.0;
  private previewMode: boolean = true;

  private weaveLines: Map<string, WeaveLine> = new Map();
  private intersections: Map<string, IntersectionPoint> = new Map();
  private intersectionMeshes: Map<string, THREE.Mesh> = new Map();
  private helperSphere: THREE.Mesh | null = null;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private tempVector: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, radius: number = 200) {
    this.scene = scene;
    this.radius = radius;
    this.createHelperSphere();
    this.generatePattern();
  }

  private createHelperSphere(): void {
    if (this.helperSphere) {
      this.scene.remove(this.helperSphere);
      this.helperSphere.geometry.dispose();
      (this.helperSphere.material as THREE.Material).dispose();
    }
    const geometry = new THREE.SphereGeometry(this.radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      wireframe: true
    });
    this.helperSphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.helperSphere);
  }

  private mapToHemisphere(u: number, v: number, radius: number): THREE.Vector3 {
    const theta = u * Math.PI * 2;
    const phi = v * Math.PI / 2;
    const sinPhi = Math.sin(phi);
    return new THREE.Vector3(
      radius * sinPhi * Math.cos(theta),
      radius * Math.cos(phi),
      radius * sinPhi * Math.sin(theta)
    );
  }

  private clearAll(): void {
    this.weaveLines.forEach(line => {
      this.scene.remove(line.mesh);
      if (line.mesh instanceof THREE.Mesh) {
        line.mesh.geometry.dispose();
        (line.mesh.material as THREE.Material).dispose();
      } else if (line.mesh instanceof THREE.Line) {
        line.mesh.geometry.dispose();
        (line.mesh.material as THREE.Material).dispose();
      }
    });
    this.weaveLines.clear();

    this.intersectionMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.intersectionMeshes.clear();
    this.intersections.clear();
  }

  private generateId(prefix: string, index: number): string {
    return `${prefix}_${index}`;
  }

  private calculateLineWidth(): number {
    const baseWidth = 3;
    const complexityFactor = Math.min(1, (this.warpCount - 8) / 16);
    return baseWidth - complexityFactor * 2;
  }

  private createTubeMesh(points: THREE.Vector3[], color: string, radius: number): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubularSegments = Math.max(32, points.length * 2);
    const radialSegments = 8;
    const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geometry, material);
  }

  private createWeaveLine(
    id: string,
    type: 'warp' | 'weft',
    points: THREE.Vector3[],
    color: string
  ): WeaveLine {
    const lineWidth = this.calculateLineWidth();
    const tubeRadius = lineWidth * 0.15;

    const offsetPoints = points.map(p => {
      const offset = this.previewMode ? (type === 'warp' ? WARP_OFFSET : WEFT_OFFSET) : 0;
      const normal = p.clone().normalize();
      return p.clone().add(normal.multiplyScalar(offset));
    });

    const mesh = this.createTubeMesh(offsetPoints, color, tubeRadius);
    this.scene.add(mesh);

    const originalPoints = points.map(p => p.clone());

    return {
      id,
      type,
      points: offsetPoints,
      color,
      lineWidth,
      mesh,
      opacity: 1,
      originalPoints
    };
  }

  private createIntersectionHitpoint(position: THREE.Vector3, id: string): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.userData.intersectionId = id;
    this.scene.add(mesh);
    return mesh;
  }

  private generateHerringbone(): void {
    const warpPoints: Map<string, THREE.Vector3[]> = new Map();
    const weftPoints: Map<string, THREE.Vector3[]> = new Map();

    for (let i = 0; i < this.warpCount; i++) {
      const u = i / this.warpCount;
      const points: THREE.Vector3[] = [];
      const segmentCount = 64;

      for (let j = 0; j <= segmentCount; j++) {
        const v = j / segmentCount;
        const phaseShift = Math.sin(u * Math.PI * 4) * 0.03;
        const uOffset = u + phaseShift * Math.sin(v * Math.PI * 2);
        points.push(this.mapToHemisphere(uOffset, v, this.radius));
      }
      warpPoints.set(this.generateId('warp', i), points);
    }

    const weftCount = Math.floor(this.warpCount * this.weftDensity);
    for (let i = 0; i < weftCount; i++) {
      const v = (i + 1) / (weftCount + 1);
      const points: THREE.Vector3[] = [];
      const segmentCount = 128;
      const phase = i % 2 === 0 ? 0 : Math.PI;

      for (let j = 0; j <= segmentCount; j++) {
        const u = j / segmentCount;
        const vOffset = v + Math.sin(u * Math.PI * 4 + phase) * 0.02;
        points.push(this.mapToHemisphere(u, Math.max(0.01, Math.min(0.99, vOffset)), this.radius));
      }
      weftPoints.set(this.generateId('weft', i), points);
    }

    this.createLinesFromMaps(warpPoints, weftPoints);
    this.computeIntersections(warpPoints, weftPoints, 'herringbone');
  }

  private generateMeander(): void {
    const warpPoints: Map<string, THREE.Vector3[]> = new Map();
    const weftPoints: Map<string, THREE.Vector3[]> = new Map();

    const stepSize = 1 / this.warpCount;
    for (let i = 0; i < this.warpCount; i++) {
      const baseU = i / this.warpCount;
      const points: THREE.Vector3[] = [];
      const segmentCount = 64;

      const groupIndex = Math.floor(i / 4);
      const indexInGroup = i % 4;

      for (let j = 0; j <= segmentCount; j++) {
        const v = j / segmentCount;
        let u = baseU;

        if (indexInGroup === 0) {
          u = baseU + stepSize * 0.5 * Math.sin(v * Math.PI * 2);
        } else if (indexInGroup === 1) {
          u = baseU + stepSize * 0.3 * Math.sin(v * Math.PI * 4);
        } else if (indexInGroup === 2) {
          u = baseU - stepSize * 0.3 * Math.sin(v * Math.PI * 4);
        } else {
          u = baseU - stepSize * 0.5 * Math.sin(v * Math.PI * 2);
        }

        u = (u + 1) % 1;
        points.push(this.mapToHemisphere(u, v, this.radius));
      }
      warpPoints.set(this.generateId('warp', i), points);
    }

    const weftCount = Math.floor(this.warpCount * this.weftDensity);
    for (let i = 0; i < weftCount; i++) {
      const baseV = (i + 1) / (weftCount + 1);
      const points: THREE.Vector3[] = [];
      const segmentCount = 128;

      const groupIndex = Math.floor(i / 4);
      const indexInGroup = i % 4;

      for (let j = 0; j <= segmentCount; j++) {
        const u = j / segmentCount;
        let v = baseV;

        if (indexInGroup === 0) {
          v = baseV + stepSize * 0.4 * Math.sin(u * Math.PI * 2);
        } else if (indexInGroup === 1) {
          v = baseV + stepSize * 0.25 * Math.sin(u * Math.PI * 4);
        } else if (indexInGroup === 2) {
          v = baseV - stepSize * 0.25 * Math.sin(u * Math.PI * 4);
        } else {
          v = baseV - stepSize * 0.4 * Math.sin(u * Math.PI * 2);
        }

        v = Math.max(0.02, Math.min(0.98, v));
        points.push(this.mapToHemisphere(u, v, this.radius));
      }
      weftPoints.set(this.generateId('weft', i), points);
    }

    this.createLinesFromMaps(warpPoints, weftPoints);
    this.computeIntersections(warpPoints, weftPoints, 'meander');
  }

  private generateCross(): void {
    const warpPoints: Map<string, THREE.Vector3[]> = new Map();
    const weftPoints: Map<string, THREE.Vector3[]> = new Map();

    for (let i = 0; i < this.warpCount; i++) {
      const u = i / this.warpCount;
      const points: THREE.Vector3[] = [];
      const segmentCount = 64;

      for (let j = 0; j <= segmentCount; j++) {
        const v = j / segmentCount;
        points.push(this.mapToHemisphere(u, v, this.radius));
      }
      warpPoints.set(this.generateId('warp', i), points);
    }

    const weftCount = Math.floor(this.warpCount * this.weftDensity);
    for (let i = 0; i < weftCount; i++) {
      const v = (i + 1) / (weftCount + 1);
      const points: THREE.Vector3[] = [];
      const segmentCount = 128;

      for (let j = 0; j <= segmentCount; j++) {
        const u = j / segmentCount;
        points.push(this.mapToHemisphere(u, v, this.radius));
      }
      weftPoints.set(this.generateId('weft', i), points);
    }

    this.createLinesFromMaps(warpPoints, weftPoints);
    this.computeIntersections(warpPoints, weftPoints, 'cross');
  }

  private generateDiamond(): void {
    const warpPoints: Map<string, THREE.Vector3[]> = new Map();
    const weftPoints: Map<string, THREE.Vector3[]> = new Map();

    const diagonalCount = this.warpCount;
    for (let i = 0; i < diagonalCount; i++) {
      const offset = (i - diagonalCount / 2) / diagonalCount;
      const points: THREE.Vector3[] = [];
      const segmentCount = 96;

      for (let j = 0; j <= segmentCount; j++) {
        const t = j / segmentCount;
        const u = t + offset * (1 - t);
        const v = t * 0.9 + 0.05;
        if (u >= 0 && u <= 1) {
          points.push(this.mapToHemisphere(u, v, this.radius));
        }
      }

      if (points.length > 2) {
        warpPoints.set(this.generateId('warp', i), points);
      }
    }

    for (let i = 0; i < diagonalCount; i++) {
      const offset = (i - diagonalCount / 2) / diagonalCount;
      const points: THREE.Vector3[] = [];
      const segmentCount = 96;

      for (let j = 0; j <= segmentCount; j++) {
        const t = j / segmentCount;
        const u = 1 - t + offset * (1 - t);
        const v = t * 0.9 + 0.05;
        if (u >= 0 && u <= 1) {
          points.push(this.mapToHemisphere(u, v, this.radius));
        }
      }

      if (points.length > 2) {
        weftPoints.set(this.generateId('weft', i), points);
      }
    }

    this.createLinesFromMaps(warpPoints, weftPoints);
    this.computeIntersections(warpPoints, weftPoints, 'diamond');
  }

  private createLinesFromMaps(
    warpPoints: Map<string, THREE.Vector3[]>,
    weftPoints: Map<string, THREE.Vector3[]>
  ): void {
    warpPoints.forEach((points, id) => {
      const line = this.createWeaveLine(id, 'warp', points, WARP_COLOR);
      this.weaveLines.set(id, line);
    });

    weftPoints.forEach((points, id) => {
      const line = this.createWeaveLine(id, 'weft', points, WEFT_COLOR);
      this.weaveLines.set(id, line);
    });
  }

  private findClosestPointOnLine(
    target: THREE.Vector3,
    linePoints: THREE.Vector3[]
  ): { point: THREE.Vector3; index: number; dist: number } | null {
    if (linePoints.length < 2) return null;

    let closestDist = Infinity;
    let closestPoint = linePoints[0];
    let closestIndex = 0;

    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];

      const lineVec = p2.clone().sub(p1);
      const pointVec = target.clone().sub(p1);
      const lineLenSq = lineVec.lengthSq();

      if (lineLenSq === 0) continue;

      let t = pointVec.dot(lineVec) / lineLenSq;
      t = Math.max(0, Math.min(1, t));

      const projection = p1.clone().add(lineVec.multiplyScalar(t));
      const dist = target.distanceTo(projection);

      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = projection;
        closestIndex = i;
      }
    }

    return { point: closestPoint, index: closestIndex, dist: closestDist };
  }

  private computeIntersections(
    warpPoints: Map<string, THREE.Vector3[]>,
    weftPoints: Map<string, THREE.Vector3[]>,
    pattern: PatternType
  ): void {
    const threshold = this.radius * 0.03;

    warpPoints.forEach((warpPts, warpId) => {
      weftPoints.forEach((weftPts, weftId) => {
        for (const wp of warpPts) {
          const result = this.findClosestPointOnLine(wp, weftPts);
          if (result && result.dist < threshold) {
            const midPoint = wp.clone().add(result.point).multiplyScalar(0.5);
            const id = `${warpId}_${weftId}`;

            if (!this.intersections.has(id)) {
              let warpOver = true;

              switch (pattern) {
                case 'herringbone':
                  const warpIndex = parseInt(warpId.split('_')[1]);
                  const weftIndex = parseInt(weftId.split('_')[1]);
                  warpOver = (warpIndex + weftIndex) % 2 === 0;
                  break;
                case 'meander':
                  const wIdx = parseInt(warpId.split('_')[1]);
                  const fIdx = parseInt(weftId.split('_')[1]);
                  warpOver = Math.floor(wIdx / 4) % 2 === Math.floor(fIdx / 4) % 2;
                  break;
                case 'cross':
                  const wi = parseInt(warpId.split('_')[1]);
                  const fi = parseInt(weftId.split('_')[1]);
                  warpOver = (wi + fi) % 2 === 0;
                  break;
                case 'diamond':
                  const wD = parseInt(warpId.split('_')[1]);
                  const fD = parseInt(weftId.split('_')[1]);
                  const radialDist = Math.sqrt(midPoint.x ** 2 + midPoint.z ** 2);
                  warpOver = (wD + fD + Math.floor(radialDist / 20)) % 2 === 0;
                  break;
              }

              const intersection: IntersectionPoint = {
                id,
                position: midPoint,
                warpId,
                weftId,
                warpOver
              };

              this.intersections.set(id, intersection);
              const hitMesh = this.createIntersectionHitpoint(midPoint, id);
              this.intersectionMeshes.set(id, hitMesh);
            }
            break;
          }
        }
      });
    });
  }

  private generatePattern(): void {
    this.clearAll();

    switch (this.pattern) {
      case 'herringbone':
        this.generateHerringbone();
        break;
      case 'meander':
        this.generateMeander();
        break;
      case 'cross':
        this.generateCross();
        break;
      case 'diamond':
        this.generateDiamond();
        break;
    }
  }

  public setPattern(pattern: PatternType): void {
    this.pattern = pattern;
    this.generatePattern();
  }

  public setWarpCount(count: number): void {
    const clamped = Math.max(8, Math.min(24, Math.round(count / 2) * 2));
    if (clamped !== this.warpCount) {
      this.warpCount = clamped;
      this.generatePattern();
    }
  }

  public setWeftDensity(density: number): void {
    const clamped = Math.max(0.5, Math.min(2.0, Math.round(density * 10) / 10));
    if (Math.abs(clamped - this.weftDensity) > 0.01) {
      this.weftDensity = clamped;
      this.generatePattern();
    }
  }

  public toggleOverlap(intersectionId: string): boolean | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    intersection.warpOver = !intersection.warpOver;

    const warpLine = this.weaveLines.get(intersection.warpId);
    const weftLine = this.weaveLines.get(intersection.weftId);

    if (warpLine && weftLine && this.previewMode) {
      const normal = intersection.position.clone().normalize();
      const warpOffset = intersection.warpOver ? WARP_OFFSET : WEFT_OFFSET;
      const weftOffset = intersection.warpOver ? WEFT_OFFSET : WARP_OFFSET;

      this.updateLineAtPoint(warpLine, intersection.position, normal, warpOffset);
      this.updateLineAtPoint(weftLine, intersection.position, normal, weftOffset);
    }

    return intersection.warpOver;
  }

  private updateLineAtPoint(
    line: WeaveLine,
    targetPos: THREE.Vector3,
    normal: THREE.Vector3,
    offset: number
  ): void {
    const result = this.findClosestPointOnLine(targetPos, line.points);
    if (!result) return;

    const influenceRadius = this.radius * 0.08;
    const offsetVector = normal.clone().multiplyScalar(offset);

    for (let i = 0; i < line.points.length; i++) {
      const point = line.points[i];
      const dist = point.distanceTo(targetPos);

      if (dist < influenceRadius) {
        const falloff = 1 - dist / influenceRadius;
        const basePos = line.originalPoints[i].clone();
        const baseNormal = basePos.clone().normalize();
        const baseOffset = baseNormal.multiplyScalar(
          this.previewMode ? (line.type === 'warp' ? WARP_OFFSET : WEFT_OFFSET) : 0
        );

        const targetPoint = basePos.clone().add(baseOffset);
        const adjustedPoint = targetPoint.clone().lerp(
          targetPos.clone().add(offsetVector),
          falloff * 0.8
        );
        point.copy(adjustedPoint);
      }
    }

    this.rebuildLineMesh(line);
  }

  private rebuildLineMesh(line: WeaveLine): void {
    this.scene.remove(line.mesh);
    if (line.mesh instanceof THREE.Mesh) {
      line.mesh.geometry.dispose();
      (line.mesh.material as THREE.Material).dispose();
    } else if (line.mesh instanceof THREE.Line) {
      line.mesh.geometry.dispose();
      (line.mesh.material as THREE.Material).dispose();
    }

    const tubeRadius = line.lineWidth * 0.15;
    line.mesh = this.createTubeMesh(line.points, line.color, tubeRadius);
    this.scene.add(line.mesh);
  }

  public getIntersectionAt(
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    threshold: number = 5
  ): IntersectionPoint | null {
    const hitMeshes = Array.from(this.intersectionMeshes.values());

    this.raycaster.setFromCamera(worldPos, camera);
    const intersects = this.raycaster.intersectObjects(hitMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const id = hit.object.userData.intersectionId as string;
      return this.intersections.get(id) || null;
    }

    return null;
  }

  public tighten(): void {
    const originalPreview = this.previewMode;
    this.previewMode = false;

    this.weaveLines.forEach(line => {
      for (let i = 0; i < line.points.length; i++) {
        const basePos = line.originalPoints[i].clone();
        line.points[i].copy(basePos);
      }
      this.rebuildLineMesh(line);
    });

    this.previewMode = originalPreview;
  }

  public applyJumpPattern(center: THREE.Vector3, radius: number): void {
    const affectedLines: WeaveLine[] = [];

    this.weaveLines.forEach(line => {
      for (const point of line.points) {
        if (point.distanceTo(center) < radius) {
          affectedLines.push(line);
          break;
        }
      }
    });

    const shuffled = affectedLines.sort(() => Math.random() - 0.5);
    const skipCount = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
    const toSkip = shuffled.slice(0, skipCount);

    toSkip.forEach(line => {
      line.opacity = 0;
      if (line.mesh instanceof THREE.Mesh) {
        const material = line.mesh.material as THREE.MeshStandardMaterial;
        material.transparent = true;
        material.opacity = 0;
      }

      setTimeout(() => {
        line.opacity = 1;
        if (line.mesh instanceof THREE.Mesh) {
          const material = line.mesh.material as THREE.MeshStandardMaterial;
          material.opacity = 1;
          material.transparent = false;
        }
      }, 300);
    });
  }

  public finishEdge(): void {
    const edgeThreshold = this.radius * 0.95;

    this.weaveLines.forEach(line => {
      for (let i = 0; i < line.points.length; i++) {
        const point = line.points[i];
        const dist = Math.sqrt(point.x ** 2 + point.z ** 2);

        if (dist > edgeThreshold * 0.8) {
          const t = (dist - edgeThreshold * 0.8) / (edgeThreshold * 0.2);
          const clampedT = Math.max(0, Math.min(1, t));

          const shrinkFactor = 1 - clampedT * 0.3;
          point.x *= shrinkFactor;
          point.z *= shrinkFactor;

          const bendAmount = clampedT * 15;
          point.y -= bendAmount;

          line.originalPoints[i].copy(point.clone());
        }
      }
      this.rebuildLineMesh(line);
    });
  }

  public getWeaveLines(): WeaveLine[] {
    return Array.from(this.weaveLines.values());
  }

  public getIntersections(): IntersectionPoint[] {
    return Array.from(this.intersections.values());
  }

  public dispose(): void {
    this.clearAll();

    if (this.helperSphere) {
      this.scene.remove(this.helperSphere);
      this.helperSphere.geometry.dispose();
      (this.helperSphere.material as THREE.Material).dispose();
      this.helperSphere = null;
    }
  }
}
