import * as THREE from 'three';

export interface Crease {
  id: number;
  pointA: THREE.Vector2;
  pointB: THREE.Vector2;
  angle: number;
  targetAngle: number;
  foldDirection: 1 | -1;
}

export interface FaceData {
  vertices: number[];
  normals: number[];
  indices: number[];
}

export class PaperScene {
  public readonly paperSize: number = 8;
  public readonly segments: number = 10;
  public readonly maxCreases: number = 8;

  private scene: THREE.Scene;
  private paperMesh!: THREE.Mesh;
  private paperGeometry!: THREE.BufferGeometry;
  private gridHelper!: THREE.GridHelper;
  private creaseLines: THREE.Line[] = [];
  private previewLine!: THREE.Line;
  private highlightMeshes: THREE.Mesh[] = [];

  private creases: Crease[] = [];
  private initialVertices: Float32Array;
  private tempVector: THREE.Vector3 = new THREE.Vector3();
  private tempVector2: THREE.Vector3 = new THREE.Vector3();
  private creaseIdCounter: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createPaper();
    this.createGrid();
    this.createPreviewLine();
    this.initialVertices = new Float32Array(this.paperGeometry.attributes.position.array as Float32Array);
  }

  private createPaper(): void {
    const geometry = new THREE.PlaneGeometry(
      this.paperSize,
      this.paperSize,
      this.segments,
      this.segments
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0xF5E6C8,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92,
      flatShading: false
    });

    this.paperMesh = new THREE.Mesh(geometry, material);
    this.paperMesh.receiveShadow = true;
    this.paperMesh.castShadow = true;
    this.scene.add(this.paperMesh);
    this.paperGeometry = geometry;

    this.paperGeometry.computeVertexNormals();
  }

  private createGrid(): void {
    this.gridHelper = new THREE.GridHelper(
      this.paperSize,
      this.segments,
      0xC0C0C0,
      0xC0C0C0
    );
    this.gridHelper.position.y = 0.01;

    const gridMaterial = this.gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.6;

    this.scene.add(this.gridHelper);
  }

  private createPreviewLine(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0xFF0000,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });

    this.previewLine = new THREE.Line(geometry, material);
    this.previewLine.visible = false;
    this.scene.add(this.previewLine);
  }

  public showPreview(pointA: THREE.Vector2, pointB: THREE.Vector2): void {
    const positions = this.previewLine.geometry.attributes.position.array as Float32Array;
    positions[0] = pointA.x;
    positions[1] = 0.02;
    positions[2] = pointA.y;
    positions[3] = pointB.x;
    positions[4] = 0.02;
    positions[5] = pointB.y;
    this.previewLine.geometry.attributes.position.needsUpdate = true;
    this.previewLine.visible = true;
  }

  public hidePreview(): void {
    this.previewLine.visible = false;
  }

  public addCrease(pointA: THREE.Vector2, pointB: THREE.Vector2): Crease | null {
    if (this.creases.length >= this.maxCreases) {
      return null;
    }

    const crease: Crease = {
      id: this.creaseIdCounter++,
      pointA: pointA.clone(),
      pointB: pointB.clone(),
      angle: 0,
      targetAngle: 0,
      foldDirection: 1
    };

    this.creases.push(crease);
    this.createCreaseVisual(crease);
    this.createHighlightRegions(crease);

    return crease;
  }

  private createCreaseVisual(crease: Crease): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      crease.pointA.x, 0.02, crease.pointA.y,
      crease.pointB.x, 0.02, crease.pointB.y
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineDashedMaterial({
      color: 0x5D4037,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.userData.creaseId = crease.id;
    this.creaseLines.push(line);
    this.scene.add(line);
  }

  private createHighlightRegions(crease: Crease): void {
    const midPoint = new THREE.Vector2(
      (crease.pointA.x + crease.pointB.x) / 2,
      (crease.pointA.y + crease.pointB.y) / 2
    );

    const dir = new THREE.Vector2()
      .subVectors(crease.pointB, crease.pointA)
      .normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);

    const highlightSize = 0.8;

    const lightGeo = new THREE.PlaneGeometry(highlightSize, highlightSize * 0.6);
    lightGeo.rotateX(-Math.PI / 2);
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xFFF3E0,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.set(
      midPoint.x + normal.x * 0.5,
      0.015,
      midPoint.y + normal.y * 0.5
    );
    lightMesh.rotation.y = Math.atan2(dir.y, dir.x);
    this.highlightMeshes.push(lightMesh);
    this.scene.add(lightMesh);

    const shadowGeo = new THREE.PlaneGeometry(highlightSize, highlightSize * 0.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0xBCAAA4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(
      midPoint.x - normal.x * 0.5,
      0.015,
      midPoint.y - normal.y * 0.5
    );
    shadowMesh.rotation.y = Math.atan2(dir.y, dir.x);
    this.highlightMeshes.push(shadowMesh);
    this.scene.add(shadowMesh);
  }

  public getCreases(): Crease[] {
    return this.creases;
  }

  public getCreaseCount(): number {
    return this.creases.length;
  }

  public getPaperMesh(): THREE.Mesh {
    return this.paperMesh;
  }

  public getGeometry(): THREE.BufferGeometry {
    return this.paperGeometry;
  }

  public getInitialVertices(): Float32Array {
    return this.initialVertices;
  }

  public getFaceCount(): number {
    const index = this.paperGeometry.index;
    if (index) {
      return index.count / 3;
    }
    return (this.paperGeometry.attributes.position.count / 3);
  }

  public getFacesData(): FaceData {
    const positionAttr = this.paperGeometry.attributes.position;
    const normalAttr = this.paperGeometry.attributes.normal;
    const indexAttr = this.paperGeometry.index;

    return {
      vertices: Array.from(positionAttr.array as Float32Array),
      normals: Array.from(normalAttr.array as Float32Array),
      indices: indexAttr ? Array.from(indexAttr.array as Uint32Array) : []
    };
  }

  public updateVertexPositions(positions: Float32Array): void {
    const posAttr = this.paperGeometry.attributes.position;
    (posAttr.array as Float32Array).set(positions);
    posAttr.needsUpdate = true;
    this.paperGeometry.computeVertexNormals();
  }

  public reset(): void {
    this.creases = [];
    this.creaseIdCounter = 0;

    this.creaseLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.creaseLines = [];

    this.highlightMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.highlightMeshes = [];

    this.updateVertexPositions(this.initialVertices);
  }

  public pointToFaceLocal(worldPoint: THREE.Vector3): THREE.Vector2 | null {
    const localPoint = this.paperMesh.worldToLocal(worldPoint.clone());
    const halfSize = this.paperSize / 2;

    if (
      localPoint.x >= -halfSize && localPoint.x <= halfSize &&
      localPoint.z >= -halfSize && localPoint.z <= halfSize
    ) {
      return new THREE.Vector2(localPoint.x, localPoint.z);
    }
    return null;
  }

  public updateCreaseVisuals(): void {
    this.creaseLines.forEach((line, index) => {
      const crease = this.creases[index];
      if (!crease) return;

      const positions = line.geometry.attributes.position.array as Float32Array;
      const yOffset = Math.abs(crease.angle) * 0.02;
      positions[1] = 0.02 + yOffset;
      positions[4] = 0.02 + yOffset;
      line.geometry.attributes.position.needsUpdate = true;
    });
  }
}
