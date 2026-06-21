import * as THREE from 'three';

export interface CrystalParams {
  temperature: number;
  supersaturation: number;
  impurityConcentration: number;
}

interface FaceNormal {
  normal: THREE.Vector3;
  distance: number;
  growthRate: number;
  color: THREE.Color;
  defects: number[];
}

export class Crystal {
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public wireframe: THREE.LineSegments;
  public nucleusGroup: THREE.Group;
  public trajectoryLines: THREE.Line[];
  private params: CrystalParams;
  private faceNormals: FaceNormal[] = [];
  private targetFaceNormals: FaceNormal[] = [];
  private startTime: number = 0;
  private elapsed: number = 0;
  private isPaused: boolean = false;
  private pausedAt: number = 0;
  private totalPausedTime: number = 0;
  public readonly TOTAL_DURATION: number = 60000;
  private nucleusAtoms: THREE.Mesh[] = [];
  public onStatsUpdate?: (stats: {
    faceCount: number;
    vertexCount: number;
    progress: number;
  }) => void;

  constructor(params: CrystalParams) {
    this.params = { ...params };
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh();
    this.wireframe = new THREE.LineSegments();
    this.nucleusGroup = new THREE.Group();
    this.trajectoryLines = [];
    this.group.add(this.nucleusGroup);
    this.group.add(this.mesh);
    this.group.add(this.wireframe);
    this.initNucleus();
    this.initFaceNormals();
  }

  private initNucleus(): void {
    const nucleusGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const nucleusMat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      shininess: 100,
      specular: 0xffffff
    });
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.1;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      const atom = new THREE.Mesh(nucleusGeo, nucleusMat);
      atom.position.set(x, y, z);
      atom.scale.setScalar(0.15);
      this.nucleusAtoms.push(atom);
      this.nucleusGroup.add(atom);
    }
  }

  private generateBaseNormals(count: number): THREE.Vector3[] {
    const normals: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      normals.push(new THREE.Vector3(x, y, z).normalize());
    }
    return normals;
  }

  private initFaceNormals(): void {
    const baseNormals = this.generateBaseNormals(80);
    this.faceNormals = baseNormals.map((normal, idx) => {
      const hue = 0.55 + (idx / baseNormals.length) * 0.25;
      return {
        normal: normal.clone(),
        distance: 0.3,
        growthRate: this.calcGrowthRate(normal),
        color: new THREE.Color().setHSL(hue, 0.7, 0.65),
        defects: []
      };
    });
    this.targetFaceNormals = this.faceNormals.map(f => ({
      normal: f.normal.clone(),
      distance: f.distance,
      growthRate: f.growthRate,
      color: f.color.clone(),
      defects: []
    }));
  }

  private calcGrowthRate(normal: THREE.Vector3): number {
    const tempFactor = 0.5 + this.params.temperature / 200;
    const anisoFactor = 1 + (this.params.supersaturation - 1) * Math.abs(normal.y) * 2;
    return tempFactor * anisoFactor * (0.8 + Math.random() * 0.4);
  }

  public setParams(params: Partial<CrystalParams>): void {
    this.params = { ...this.params, ...params };
    this.faceNormals.forEach((face, i) => {
      face.growthRate = this.calcGrowthRate(face.normal);
      this.targetFaceNormals[i].growthRate = face.growthRate;
    });
  }

  public start(): void {
    this.startTime = performance.now();
    this.elapsed = 0;
    this.totalPausedTime = 0;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pausedAt = performance.now();
      this.showTrajectories();
    } else {
      this.totalPausedTime += performance.now() - this.pausedAt;
      this.hideTrajectories();
    }
    return this.isPaused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public getProgress(): number {
    return Math.min(1, this.elapsed / this.TOTAL_DURATION);
  }

  private showTrajectories(): void {
    this.hideTrajectories();
    const directions = this.generateBaseNormals(10);
    directions.forEach((dir) => {
      const farPoint = dir.clone().multiplyScalar(5);
      const positions = new Float32Array([
        0, 0, 0, farPoint.x, farPoint.y, farPoint.z
      ]);
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const closestFace = this.findClosestFace(dir);
      const color = closestFace ? closestFace.color.clone() : new THREE.Color(0x88ccff);
      const mat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
      });
      const line = new THREE.Line(lineGeom, mat);
      this.trajectoryLines.push(line);
      this.group.add(line);
    });
  }

  private hideTrajectories(): void {
    this.trajectoryLines.forEach(line => {
      this.group.remove(line);
      (line.geometry as THREE.BufferGeometry).dispose();
      (line.material as THREE.Material).dispose();
    });
    this.trajectoryLines = [];
  }

  private findClosestFace(dir: THREE.Vector3): FaceNormal | null {
    if (this.faceNormals.length === 0) return null;
    let closest = this.faceNormals[0];
    let maxDot = -Infinity;
    this.faceNormals.forEach(face => {
      const dot = face.normal.dot(dir);
      if (dot > maxDot) {
        maxDot = dot;
        closest = face;
      }
    });
    return closest;
  }

  public update(deltaTime: number): void {
    if (this.isPaused) return;
    this.elapsed = performance.now() - this.startTime - this.totalPausedTime;
    const progress = this.getProgress();
    const targetCount = Math.floor(50 + progress * 150);
    const currentCount = this.faceNormals.length;
    if (currentCount < targetCount && Math.random() < 0.05) {
      this.addNewFace();
    }
    this.updateFaceDistances(deltaTime);
    this.updateDefects();
    this.reconstructGeometry();
    this.updateNucleus(progress);
    if (this.onStatsUpdate) {
      const geo = this.mesh.geometry as THREE.BufferGeometry;
      const posAttr = geo.getAttribute('position');
      this.onStatsUpdate({
        faceCount: this.faceNormals.length,
        vertexCount: posAttr ? posAttr.count : 0,
        progress: progress * 100
      });
    }
  }

  private updateFaceDistances(deltaTime: number): void {
    const progress = this.getProgress();
    const maxSize = 4;
    this.faceNormals.forEach((face) => {
      const target = 0.3 + progress * maxSize * (0.7 + Math.random() * 0.3);
      const growthAmount = face.growthRate * deltaTime * 0.001;
      face.distance = Math.min(face.distance + growthAmount, target);
      const tempFactor = this.params.temperature / 100;
      if (tempFactor > 0.5 && Math.random() < tempFactor * 0.02) {
        face.distance = Math.max(0.3, face.distance - Math.random() * 0.05);
      }
    });
  }

  private updateNucleus(progress: number): void {
    this.nucleusAtoms.forEach((atom, i) => {
      atom.scale.setScalar(0.15 * (1 - progress * 0.5));
      const pulse = 1 + Math.sin(performance.now() * 0.002 + i) * 0.1;
      atom.scale.multiplyScalar(pulse);
    });
    this.nucleusGroup.rotation.y += 0.001;
  }

  private addNewFace(): void {
    if (this.faceNormals.length >= 200) return;
    const idx = Math.floor(Math.random() * this.faceNormals.length);
    const baseNormal = this.faceNormals[idx].normal.clone();
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    ).normalize().multiplyScalar(0.2);
    const newNormal = baseNormal.clone().add(offset).normalize();
    const hue = 0.55 + Math.random() * 0.25;
    const newFace: FaceNormal = {
      normal: newNormal,
      distance: this.faceNormals[idx].distance * 0.9,
      growthRate: this.calcGrowthRate(newNormal),
      color: new THREE.Color().setHSL(hue, 0.7, 0.65),
      defects: []
    };
    this.faceNormals.push(newFace);
    this.targetFaceNormals.push({
      normal: newNormal.clone(),
      distance: newFace.distance,
      growthRate: newFace.growthRate,
      color: newFace.color.clone(),
      defects: []
    });
  }

  private updateDefects(): void {
    const impurityLevel = this.params.impurityConcentration;
    this.faceNormals.forEach(face => {
      const expectedDefects = Math.floor(face.distance * 5 * impurityLevel);
      while (face.defects.length < expectedDefects) {
        face.defects.push(Math.random());
      }
    });
  }

  private reconstructGeometry(): void {
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const linePositions: number[] = [];
    const planeNormals: { normal: THREE.Vector3; d: number; color: THREE.Color }[] = [];
    this.faceNormals.forEach(face => {
      planeNormals.push({
        normal: face.normal.clone(),
        d: face.distance,
        color: face.color.clone()
      });
    });
    const uniqueVertices: THREE.Vector3[] = [];
    const vertexColors: THREE.Color[] = [];
    const vertexToIndex = new Map<string, number>();
    for (let i = 0; i < planeNormals.length; i++) {
      for (let j = i + 1; j < planeNormals.length; j++) {
        for (let k = j + 1; k < planeNormals.length; k++) {
          const p1 = planeNormals[i];
          const p2 = planeNormals[j];
          const p3 = planeNormals[k];
          const vertex = this.intersectPlanes(p1.normal, p1.d, p2.normal, p2.d, p3.normal, p3.d);
          if (vertex) {
            const valid = this.isVertexInsideAllPlanes(vertex, planeNormals, i, j, k);
            if (valid) {
              const key = `${vertex.x.toFixed(4)}_${vertex.y.toFixed(4)}_${vertex.z.toFixed(4)}`;
              if (!vertexToIndex.has(key)) {
                vertexToIndex.set(key, uniqueVertices.length);
                uniqueVertices.push(vertex);
                const avgColor = new THREE.Color();
                avgColor.add(p1.color).add(p2.color).add(p3.color).multiplyScalar(1 / 3);
                vertexColors.push(avgColor);
              }
            }
          }
        }
      }
    }
    for (let i = 0; i < planeNormals.length; i++) {
      const faceVertices: { idx: number; angle: number }[] = [];
      uniqueVertices.forEach((v, vi) => {
        const dist = Math.abs(planeNormals[i].normal.dot(v) - planeNormals[i].d);
        if (dist < 0.02) {
          const proj = v.clone().projectOnPlane(planeNormals[i].normal);
          const angle = Math.atan2(proj.y, proj.x);
          faceVertices.push({ idx: vi, angle });
        }
      });
      if (faceVertices.length >= 3) {
        faceVertices.sort((a, b) => a.angle - b.angle);
        const center = new THREE.Vector3();
        faceVertices.forEach(fv => center.add(uniqueVertices[fv.idx]));
        center.divideScalar(faceVertices.length);
        const toCenter = center.clone().negate();
        const edge1 = uniqueVertices[faceVertices[1].idx].clone().sub(uniqueVertices[faceVertices[0].idx]);
        const edge2 = uniqueVertices[faceVertices[2].idx].clone().sub(uniqueVertices[faceVertices[0].idx]);
        const cross = new THREE.Vector3().crossVectors(edge1, edge2);
        const flip = cross.dot(toCenter) < 0 ? 1 : -1;
        for (let fi = 1; fi < faceVertices.length - 1; fi++) {
          const a = faceVertices[0].idx;
          const bIdx = flip > 0 ? fi : faceVertices.length - fi;
          const b = faceVertices[bIdx].idx;
          const c = faceVertices[fi + 1].idx;
          indices.push(a, b, c);
        }
        for (let ei = 0; ei < faceVertices.length; ei++) {
          const next = (ei + 1) % faceVertices.length;
          linePositions.push(
            uniqueVertices[faceVertices[ei].idx].x, uniqueVertices[faceVertices[ei].idx].y, uniqueVertices[faceVertices[ei].idx].z,
            uniqueVertices[faceVertices[next].idx].x, uniqueVertices[faceVertices[next].idx].y, uniqueVertices[faceVertices[next].idx].z
          );
        }
      }
    }
    uniqueVertices.forEach((v, i) => {
      vertices.push(v.x, v.y, v.z);
      const impurity = this.params.impurityConcentration;
      let color = vertexColors[i].clone();
      if (Math.random() < impurity * 0.3) {
        color.lerp(new THREE.Color(0xff8888), 0.5 + Math.random() * 0.5);
      }
      colors.push(color.r, color.g, color.b);
    });
    const geometry = this.mesh.geometry as THREE.BufferGeometry;
    geometry.dispose();
    const newGeo = new THREE.BufferGeometry();
    if (vertices.length > 0) {
      newGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      newGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      newGeo.setIndex(indices);
      newGeo.computeVertexNormals();
    }
    this.mesh.geometry = newGeo;
    if (this.mesh.material) {
      (this.mesh.material as THREE.Material).dispose();
    }
    this.mesh.material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 80,
      specular: 0x444444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    const wireGeo = this.wireframe.geometry as THREE.BufferGeometry;
    wireGeo.dispose();
    const newWireGeo = new THREE.BufferGeometry();
    if (linePositions.length > 0) {
      newWireGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    }
    this.wireframe.geometry = newWireGeo;
    if (this.wireframe.material) {
      (this.wireframe.material as THREE.Material).dispose();
    }
    this.wireframe.material = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6
    });
  }

  private intersectPlanes(
    n1: THREE.Vector3, d1: number,
    n2: THREE.Vector3, d2: number,
    n3: THREE.Vector3, d3: number
  ): THREE.Vector3 | null {
    const det = n1.dot(new THREE.Vector3().crossVectors(n2, n3));
    if (Math.abs(det) < 1e-6) return null;
    const cross23 = new THREE.Vector3().crossVectors(n2, n3);
    const cross31 = new THREE.Vector3().crossVectors(n3, n1);
    const cross12 = new THREE.Vector3().crossVectors(n1, n2);
    const result = new THREE.Vector3();
    result.x = (d1 * cross23.x + d2 * cross31.x + d3 * cross12.x) / det;
    result.y = (d1 * cross23.y + d2 * cross31.y + d3 * cross12.y) / det;
    result.z = (d1 * cross23.z + d2 * cross31.z + d3 * cross12.z) / det;
    return result;
  }

  private isVertexInsideAllPlanes(
    vertex: THREE.Vector3,
    planes: { normal: THREE.Vector3; d: number }[],
    skip1: number, skip2: number, skip3: number
  ): boolean {
    const EPS = 0.001;
    for (let i = 0; i < planes.length; i++) {
      if (i === skip1 || i === skip2 || i === skip3) continue;
      const dist = planes[i].normal.dot(vertex) - planes[i].d;
      if (dist > EPS) return false;
    }
    return true;
  }

  public exportOBJ(): string {
    const geo = this.mesh.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute('position');
    const idx = geo.getIndex();
    if (!pos || !idx) return '';
    let obj = '# Crystal Growth Simulator - OBJ Export\n';
    obj += `# Vertices: ${pos.count}\n`;
    obj += `# Faces: ${idx.count / 3}\n\n`;
    for (let i = 0; i < pos.count; i++) {
      obj += `v ${pos.getX(i).toFixed(4)} ${pos.getY(i).toFixed(4)} ${pos.getZ(i).toFixed(4)}\n`;
    }
    obj += '\n';
    for (let i = 0; i < idx.count; i += 3) {
      obj += `f ${idx.getX(i) + 1} ${idx.getX(i + 1) + 1} ${idx.getX(i + 2) + 1}\n`;
    }
    return obj;
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        (mesh.geometry as THREE.BufferGeometry).dispose();
      }
      if (mesh.material) {
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          (mat as THREE.Material).dispose();
        }
      }
    });
  }
}
