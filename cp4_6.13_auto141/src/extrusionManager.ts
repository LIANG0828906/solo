import * as THREE from 'three';

export interface GeometryInfo {
  vertices: number;
  faces: number;
  volume: number;
  timestamp: Date;
}

interface MaterialTransition {
  startTime: number;
  duration: number;
  startOpacity: number;
  endOpacity: number;
  startRoughness: number;
  endRoughness: number;
  startMetalness: number;
  endMetalness: number;
  startClearcoat: number;
  endClearcoat: number;
}

export class ExtrusionManager {
  private scene: THREE.Scene;
  private currentMesh: THREE.Mesh | null = null;
  private currentEdges: THREE.LineSegments | null = null;
  private currentGroup: THREE.Group | null = null;
  private isSmooth: boolean = false;
  private materialTransition: MaterialTransition | null = null;
  private geometryInfo: GeometryInfo | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public extrude(vertices: THREE.Vector2[], depth: number): void {
    this.clear();

    if (vertices.length < 3) return;

    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].y);
    }
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 12,
      steps: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x88ccee,
      transparent: true,
      opacity: this.isSmooth ? 0.55 : 0.65,
      side: THREE.DoubleSide,
      flatShading: !this.isSmooth,
      roughness: this.isSmooth ? 0.15 : 0.55,
      metalness: this.isSmooth ? 0.25 : 0.05,
      clearcoat: this.isSmooth ? 0.8 : 0.0,
      clearcoatRoughness: this.isSmooth ? 0.1 : 0.5,
      reflectivity: this.isSmooth ? 0.6 : 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const edges = new THREE.EdgesGeometry(geometry, 20);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
      transparent: true,
      opacity: 0.85
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(edgeLines);

    const bbox = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 8 / maxDim;
      group.scale.setScalar(scale);
    }

    this.scene.add(group);
    this.currentMesh = mesh;
    this.currentEdges = edgeLines;
    this.currentGroup = group;
    this.geometryInfo = {
      vertices: geometry.attributes.position.count,
      faces: geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3,
      volume: this.calculateVolume(geometry),
      timestamp: new Date()
    };
  }

  private calculateVolume(geometry: THREE.ExtrudeGeometry): number {
    const position = geometry.attributes.position;
    let volume = 0;

    if (geometry.index) {
      const index = geometry.index;
      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const cross = new THREE.Vector3();

      for (let i = 0; i < index.count; i += 3) {
        v0.fromBufferAttribute(position, index.getX(i));
        v1.fromBufferAttribute(position, index.getX(i + 1));
        v2.fromBufferAttribute(position, index.getX(i + 2));

        cross.crossVectors(
          new THREE.Vector3().subVectors(v1, v0),
          new THREE.Vector3().subVectors(v2, v0)
        );
        volume += cross.dot(v0);
      }
    } else {
      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const cross = new THREE.Vector3();

      for (let i = 0; i < position.count; i += 3) {
        v0.fromBufferAttribute(position, i);
        v1.fromBufferAttribute(position, i + 1);
        v2.fromBufferAttribute(position, i + 2);

        cross.crossVectors(
          new THREE.Vector3().subVectors(v1, v0),
          new THREE.Vector3().subVectors(v2, v0)
        );
        volume += cross.dot(v0);
      }
    }

    return Math.abs(volume / 6);
  }

  public setSmoothShading(smooth: boolean, transitionMs: number = 500): void {
    if (!this.currentMesh) {
      this.isSmooth = smooth;
      return;
    }

    const material = this.currentMesh.material as THREE.MeshPhysicalMaterial;
    const geometry = this.currentMesh.geometry as THREE.ExtrudeGeometry;

    this.materialTransition = {
      startTime: performance.now(),
      duration: transitionMs,
      startOpacity: material.opacity,
      endOpacity: smooth ? 0.55 : 0.65,
      startRoughness: material.roughness,
      endRoughness: smooth ? 0.15 : 0.55,
      startMetalness: material.metalness,
      endMetalness: smooth ? 0.25 : 0.05,
      startClearcoat: material.clearcoat,
      endClearcoat: smooth ? 0.8 : 0.0
    };

    this.isSmooth = smooth;
    material.flatShading = !smooth;
    geometry.computeVertexNormals();
    material.needsUpdate = true;
  }

  public updateTransitions(): void {
    if (!this.materialTransition || !this.currentMesh) return;

    const now = performance.now();
    const progress = Math.min((now - this.materialTransition.startTime) / this.materialTransition.duration, 1);
    const eased = this.easeOutCubic(progress);

    const material = this.currentMesh.material as THREE.MeshPhysicalMaterial;
    const t = this.materialTransition;

    material.opacity = t.startOpacity +