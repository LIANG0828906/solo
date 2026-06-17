import * as THREE from 'three';

export class ShadowRenderer {
  private shadowMeshes: THREE.Mesh[] = [];
  private groundGrid: THREE.Group | null = null;
  private shadowArea: number = 0;
  private gridCellSize = 10;
  private gridCount = 20;
  private gridMaterials: THREE.MeshBasicMaterial[] = [];

  createGroundGrid(scene: THREE.Scene): void {
    if (this.groundGrid) {
      scene.remove(this.groundGrid);
    }
    this.groundGrid = new THREE.Group();
    this.groundGrid.name = 'groundGrid';
    this.gridMaterials = [];

    const totalSize = this.gridCellSize * this.gridCount;
    const halfSize = totalSize / 2;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2a3b5c, linewidth: 1 });

    for (let i = 0; i <= this.gridCount; i++) {
      const pos = -halfSize + i * this.gridCellSize;
      const points1 = [new THREE.Vector3(pos, 0.01, -halfSize), new THREE.Vector3(pos, 0.01, halfSize)];
      const points2 = [new THREE.Vector3(-halfSize, 0.01, pos), new THREE.Vector3(halfSize, 0.01, pos)];
      const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
      const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
      this.groundGrid.add(new THREE.Line(geo1, lineMat));
      this.groundGrid.add(new THREE.Line(geo2, lineMat));
    }

    for (let x = 0; x < this.gridCount; x++) {
      for (let z = 0; z < this.gridCount; z++) {
        const cellGeo = new THREE.PlaneGeometry(this.gridCellSize, this.gridCellSize);
        const cellMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const cell = new THREE.Mesh(cellGeo, cellMat);
        cell.rotation.x = -Math.PI / 2;
        cell.position.set(
          -halfSize + (x + 0.5) * this.gridCellSize,
          0.02,
          -halfSize + (z + 0.5) * this.gridCellSize
        );
        cell.userData = { gridX: x, gridZ: z, isShadowCell: true };
        this.groundGrid.add(cell);
        this.gridMaterials.push(cellMat);
      }
    }

    scene.add(this.groundGrid);
  }

  update(buildingGroup: THREE.Group, sunDirection: THREE.Vector3, scene: THREE.Scene): void {
    this.clearShadowMeshes(scene);

    const sunPos = sunDirection.clone().normalize();
    if (sunPos.y <= 0) {
      this.resetGridOpacity();
      this.shadowArea = 0;
      return;
    }

    const shadowProjection = new THREE.Matrix4();
    const lightPos = sunPos.clone().multiplyScalar(100);
    shadowProjection.makeShadow(lightPos, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));

    const boxes = this.extractBuildingBoxes(buildingGroup);
    const shadowPolygons: THREE.Vector2[][] = [];

    for (const box of boxes) {
      const corners = this.getBoxCorners(box);
      const projectedCorners: THREE.Vector2[] = [];
      for (const corner of corners) {
        const projected = corner.clone().applyMatrix4(shadowProjection);
        projectedCorners.push(new THREE.Vector2(projected.x, projected.z));
      }
      const hull = this.convexHull(projectedCorners);
      if (hull.length >= 3) {
        shadowPolygons.push(hull);
      }
    }

    for (const polygon of shadowPolygons) {
      const shape = new THREE.Shape();
      shape.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i].x, polygon[i].y);
      }
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.015;
      scene.add(mesh);
      this.shadowMeshes.push(mesh);
    }

    this.computeShadowGridCoverage(shadowPolygons);
  }

  private extractBuildingBoxes(group: THREE.Group): THREE.Box3[] {
    const boxes: THREE.Box3[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.isControlPoint && !child.userData.isShadowCell && !child.userData.isRoofCenter) {
        const box = new THREE.Box3().setFromObject(child);
        boxes.push(box);
      }
    });
    return boxes;
  }

  private getBoxCorners(box: THREE.Box3): THREE.Vector3[] {
    const min = box.min;
    const max = box.max;
    return [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
      new THREE.Vector3(min.x, max.y, max.z),
    ];
  }

  private projectPoint(point: THREE.Vector3, sunDir: THREE.Vector3): THREE.Vector2 {
    if (sunDir.y <= 0) return new THREE.Vector2(point.x, point.z);
    const t = -point.y / sunDir.y;
    const projected = point.clone().add(sunDir.clone().multiplyScalar(t));
    return new THREE.Vector2(projected.x, projected.z);
  }

  private convexHull(points: THREE.Vector2[]): THREE.Vector2[] {
    if (points.length < 3) return points;
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: THREE.Vector2[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
        lower.pop();
      lower.push(p);
    }
    const upper: THREE.Vector2[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
        upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  private computeShadowGridCoverage(shadowPolygons: THREE.Vector2[][]): void {
    const totalSize = this.gridCellSize * this.gridCount;
    const halfSize = totalSize / 2;
    let coveredCount = 0;

    for (let x = 0; x < this.gridCount; x++) {
      for (let z = 0; z < this.gridCount; z++) {
        const cx = -halfSize + (x + 0.5) * this.gridCellSize;
        const cz = -halfSize + (z + 0.5) * this.gridCellSize;
        const isCovered = shadowPolygons.some((poly) => this.pointInPolygon(cx, cz, poly));
        const idx = x * this.gridCount + z;
        if (idx < this.gridMaterials.length) {
          this.gridMaterials[idx].opacity = isCovered ? 0.2 : 0;
        }
        if (isCovered) coveredCount++;
      }
    }

    this.shadowArea = coveredCount * this.gridCellSize * this.gridCellSize;
  }

  private pointInPolygon(px: number, pz: number, polygon: THREE.Vector2[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, zi = polygon[i].y;
      const xj = polygon[j].x, zj = polygon[j].y;
      if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  private clearShadowMeshes(scene: THREE.Scene): void {
    for (const mesh of this.shadowMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.shadowMeshes = [];
  }

  private resetGridOpacity(): void {
    for (const mat of this.gridMaterials) {
      mat.opacity = 0;
    }
  }

  getShadowArea(): number {
    return this.shadowArea;
  }

  getShadowRatio(): number {
    const totalArea = this.gridCellSize * this.gridCellSize * this.gridCount * this.gridCount;
    return totalArea > 0 ? this.shadowArea / totalArea : 0;
  }
}
