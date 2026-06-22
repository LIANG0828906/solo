import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager';
import type { GraphEngine } from '../core/GraphEngine';
import type { StarFace, StarNode } from '../types';

export class FaceRenderer {
  private sceneManager: SceneManager;
  private graph: GraphEngine;
  private container: THREE.Group;

  private faceObjects: Map<string, { mesh: THREE.Mesh; halo: THREE.Line; haloMesh: THREE.Mesh }> = new Map();

  private needRebuild: boolean = true;
  private _tmpVec = new THREE.Vector3();

  constructor(sceneManager: SceneManager, graph: GraphEngine) {
    this.sceneManager = sceneManager;
    this.graph = graph;
    this.container = new THREE.Group();
    this.sceneManager.addObject(this.container);

    this.graph.onUpdate(() => {
      this.needRebuild = true;
    });

    this.sceneManager.onFrame(this.update.bind(this));
  }

  public rebuild(): void {
    this.needRebuild = true;
  }

  private clearAll(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }
    this.faceObjects.clear();
  }

  private projectTo2D(points: THREE.Vector3[]): { points2D: THREE.Vector2[]; basisU: THREE.Vector3; basisV: THREE.Vector3; origin: THREE.Vector3; normal: THREE.Vector3 } {
    const n = points.length;

    let centroid = new THREE.Vector3();
    for (const p of points) centroid.add(p);
    centroid.multiplyScalar(1 / n);

    let normal = new THREE.Vector3();
    if (n >= 3) {
      for (let i = 0; i < n; i++) {
        const curr = points[i].clone().sub(centroid);
        const next = points[(i + 1) % n].clone().sub(centroid);
        normal.add(this._tmpVec.copy(curr).cross(next));
      }
      if (normal.lengthSq() < 0.0001) {
        normal.set(0, 0, 1);
      }
      normal.normalize();
    } else {
      normal.set(0, 0, 1);
    }

    let basisU = new THREE.Vector3(1, 0, 0);
    if (Math.abs(basisU.dot(normal)) > 0.9) {
      basisU.set(0, 1, 0);
    }
    basisU.sub(normal.clone().multiplyScalar(basisU.dot(normal))).normalize();
    const basisV = new THREE.Vector3().copy(normal).cross(basisU).normalize();

    const points2D: THREE.Vector2[] = [];
    for (const p of points) {
      const rel = p.clone().sub(centroid);
      points2D.push(new THREE.Vector2(rel.dot(basisU), rel.dot(basisV)));
    }

    return { points2D, basisU, basisV, origin: centroid, normal };
  }

  private buildFace(face: StarFace, glowIntensity: number): void {
    const nodePositions: THREE.Vector3[] = [];
    for (const id of face.nodeIds) {
      const node = this.graph.nodes.get(id) as StarNode;
      if (node) nodePositions.push(node.position.clone());
    }
    if (nodePositions.length < 3) return;

    const proj = this.projectTo2D(nodePositions);

    let area = 0;
    const n = proj.points2D.length;
    for (let i = 0; i < n; i++) {
      const a = proj.points2D[i];
      const b = proj.points2D[(i + 1) % n];
      area += a.x * b.y - b.x * a.y;
    }
    if (area < 0) {
      proj.points2D.reverse();
    }

    const shape = new THREE.Shape();
    shape.moveTo(proj.points2D[0].x, proj.points2D[0].y);
    for (let i = 1; i < proj.points2D.length; i++) {
      shape.lineTo(proj.points2D[i].x, proj.points2D[i].y);
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.computeVertexNormals();

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const worldPos = proj.origin.clone()
        .add(proj.basisU.clone().multiplyScalar(x))
        .add(proj.basisV.clone().multiplyScalar(y))
        .add(proj.normal.clone().multiplyScalar(z));
      positions.setXYZ(i, worldPos.x, worldPos.y, worldPos.z);
    }
    geometry.computeVertexNormals();
    positions.needsUpdate = true;

    const avgColor = face.avgColor.clone().lerp(new THREE.Color('#8B5CF6'), 0.3);
    const material = new THREE.MeshBasicMaterial({
      color: avgColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const haloPoints: THREE.Vector3[] = [];
    for (let r = 0; r <= 1; r += 0.15) {
      for (let i = 0; i <= nodePositions.length; i++) {
        const idx = i % nodePositions.length;
        haloPoints.push(nodePositions[idx].clone());
      }
    }
    const linePositions = new Float32Array(haloPoints.length * 3);
    const lineColors = new Float32Array(haloPoints.length * 3);
    const segCount = nodePositions.length + 1;
    for (let ri = 0; ri < haloPoints.length; ri++) {
      const segIdx = ri % segCount;
      const ringIdx = Math.floor(ri / segCount);
      const ringT = ringIdx / ((haloPoints.length / segCount) - 1);
      const fadeOut = Math.sin(ringT * Math.PI);
      linePositions[ri * 3] = haloPoints[ri].x;
      linePositions[ri * 3 + 1] = haloPoints[ri].y;
      linePositions[ri * 3 + 2] = haloPoints[ri].z;
      lineColors[ri * 3] = avgColor.r * (0.5 + 0.5 * fadeOut);
      lineColors[ri * 3 + 1] = avgColor.g * (0.5 + 0.5 * fadeOut);
      lineColors[ri * 3 + 2] = avgColor.b * (0.5 + 0.5 * fadeOut);
    }
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6 * glowIntensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Line(lineGeom, lineMat);

    const haloTubePts: THREE.Vector3[] = [];
    for (let i = 0; i <= nodePositions.length * 8; i++) {
      const t = i / (nodePositions.length * 8);
      const scaledT = t * nodePositions.length;
      const i0 = Math.floor(scaledT) % nodePositions.length;
      const i1 = (i0 + 1) % nodePositions.length;
      const localT = scaledT - Math.floor(scaledT);
      const smoothT = localT * localT * (3 - 2 * localT);
      const p = nodePositions[i0].clone().lerp(nodePositions[i1], smoothT);
      const outward = p.clone().sub(proj.origin).normalize();
      p.add(outward.multiplyScalar(0.15));
      haloTubePts.push(p);
    }
    const haloCurve = new THREE.CatmullRomCurve3(haloTubePts, true, 'catmullrom', 0.2);
    const haloTubeGeom = new THREE.TubeGeometry(haloCurve, nodePositions.length * 12, 0.04, 6, true);
    const haloTubeMat = new THREE.MeshBasicMaterial({
      color: avgColor,
      transparent: true,
      opacity: 0.35 * glowIntensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloTubeGeom, haloTubeMat);

    this.container.add(mesh);
    this.container.add(halo);
    this.container.add(haloMesh);
    this.faceObjects.set(face.id, { mesh, halo, haloMesh });
  }

  private doRebuild(): void {
    this.clearAll();
    const glowIntensity = this.graph.config.glowIntensity;
    for (const face of this.graph.faces) {
      this.buildFace(face, glowIntensity);
    }
    this.needRebuild = false;
  }

  private needRebuildByPosition(): boolean {
    if (this.graph.faces.length !== this.faceObjects.size) return true;
    for (const face of this.graph.faces) {
      if (!this.faceObjects.has(face.id)) return true;
      for (const id of face.nodeIds) {
        const node = this.graph.nodes.get(id);
        const obj = this.faceObjects.get(face.id);
        if (!node || !obj) continue;
        const mesh = obj.mesh;
        if (mesh.position.lengthSq() === 0) continue;
      }
    }
    return false;
  }

  private update(_time: number, _delta: number): void {
    const glowIntensity = this.graph.config.glowIntensity;

    if (this.needRebuild || this.needRebuildByPosition()) {
      this.doRebuild();
    }

    for (const [faceId, face] of this.faceObjects) {
      const original = this.graph.faces.find((f) => f.id === faceId);
      if (!original) continue;

      const avgColor = original.avgColor.clone().lerp(new THREE.Color('#8B5CF6'), 0.3);

      const meshMat = face.mesh.material as THREE.MeshBasicMaterial;
      meshMat.color.copy(avgColor);
      meshMat.opacity = 0.15;

      const haloMat = face.halo.material as THREE.LineBasicMaterial;
      haloMat.opacity = 0.6 * glowIntensity;

      const haloMeshMat = face.haloMesh.material as THREE.MeshBasicMaterial;
      haloMeshMat.color.copy(avgColor);
      haloMeshMat.opacity = 0.35 * glowIntensity;

      const positions = face.halo.geometry.attributes.position as THREE.BufferAttribute;
      const colors = face.halo.geometry.attributes.color as THREE.BufferAttribute;
      const nodePositions: THREE.Vector3[] = [];
      for (const id of original.nodeIds) {
        const node = this.graph.nodes.get(id) as StarNode;
        if (node) nodePositions.push(node.position.clone());
      }
      if (nodePositions.length >= 3) {
        let centroid = new THREE.Vector3();
        for (const p of nodePositions) centroid.add(p);
        centroid.multiplyScalar(1 / nodePositions.length);
        const segCount = nodePositions.length + 1;
        const ringCount = positions.count / segCount;
        for (let ri = 0; ri < ringCount; ri++) {
          const ringT = ri / (ringCount - 1);
          const fadeOut = Math.sin(ringT * Math.PI);
          const expandAmount = ringT * 1.0;
          for (let si = 0; si < segCount; si++) {
            const idx = si % nodePositions.length;
            const base = nodePositions[idx].clone();
            const outward = base.clone().sub(centroid).normalize();
            const pos = base.add(outward.multiplyScalar(expandAmount));
            const flatIdx = ri * segCount + si;
            if (flatIdx < positions.count) {
              positions.setXYZ(flatIdx, pos.x, pos.y, pos.z);
              colors.setXYZ(
                flatIdx,
                avgColor.r * (0.5 + 0.5 * fadeOut),
                avgColor.g * (0.5 + 0.5 * fadeOut),
                avgColor.b * (0.5 + 0.5 * fadeOut)
              );
            }
          }
        }
        positions.needsUpdate = true;
        colors.needsUpdate = true;

        const ringGeom = face.haloMesh.geometry as THREE.BufferGeometry;
        const ringPos = ringGeom.attributes.position as THREE.BufferAttribute;
        const haloTubePts: THREE.Vector3[] = [];
        for (let i = 0; i <= nodePositions.length * 8; i++) {
          const t = i / (nodePositions.length * 8);
          const scaledT = t * nodePositions.length;
          const i0 = Math.floor(scaledT) % nodePositions.length;
          const i1 = (i0 + 1) % nodePositions.length;
          const localT = scaledT - Math.floor(scaledT);
          const smoothT = localT * localT * (3 - 2 * localT);
          const p = nodePositions[i0].clone().lerp(nodePositions[i1], smoothT);
          const outward = p.clone().sub(centroid).normalize();
          p.add(outward.multiplyScalar(0.15));
          haloTubePts.push(p);
        }
        for (let i = 0; i < haloTubePts.length && i < ringPos.count; i++) {
          ringPos.setXYZ(i, haloTubePts[i].x, haloTubePts[i].y, haloTubePts[i].z);
        }
        ringPos.needsUpdate = true;
        ringGeom.computeVertexNormals();
      }
    }
  }
}
