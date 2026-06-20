import * as THREE from 'three';

export interface StrataLayerConfig {
  name: string;
  color: number;
  thickness: number;
  textureIntensity: number;
  yPosition: number;
}

export interface DisplacementVector {
  direction: THREE.Vector3;
  magnitude: number;
  faultPlaneX: number;
  faultType: 'normal' | 'reverse' | 'strike-slip';
}

const LOD_SEGMENTS = [40, 20, 10, 5];
const LOD_DISTANCE_THRESHOLDS = [20, 40, 60];

export class StrataLayer {
  public mesh: THREE.Mesh;
  public edges: THREE.LineSegments;
  public config: StrataLayerConfig;

  private lodGeometries: THREE.BoxGeometry[] = [];
  private originalPositionsByLOD: Float32Array[] = [];
  private currentLOD: number = 0;
  private baseGeometry: THREE.BoxGeometry;
  private originalPositions: Float32Array;

  private width: number;
  private depth: number;

  private lastDisplacement: DisplacementVector | null = null;
  private lastProgress: number = 0;
  private hasDisplacement: boolean = false;

  constructor(config: StrataLayerConfig, width: number, depth: number) {
    this.config = { ...config };
    this.width = width;
    this.depth = depth;

    this.buildLODGeometries();
    this.switchLOD(0);

    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.85,
      shininess: 20,
      side: THREE.DoubleSide
    });

    this.applyTexture(material, config.textureIntensity);

    this.mesh = new THREE.Mesh(this.baseGeometry, material);
    this.mesh.position.y = config.yPosition;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    const edgeGeometry = new THREE.EdgesGeometry(this.baseGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6
    });
    this.edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    this.edges.position.y = config.yPosition;
  }

  private buildLODGeometries(): void {
    this.lodGeometries.forEach(g => g.dispose());
    this.lodGeometries = [];
    this.originalPositionsByLOD = [];

    for (let i = 0; i < LOD_SEGMENTS.length; i++) {
      const segs = LOD_SEGMENTS[i];
      const geo = new THREE.BoxGeometry(
        this.width,
        this.config.thickness,
        this.depth,
        segs, 1, segs
      );
      this.lodGeometries.push(geo);
      this.originalPositionsByLOD.push(
        new Float32Array(geo.attributes.position.array as Float32Array)
      );
    }
  }

  public updateLOD(cameraDistance: number): void {
    let newLOD = 0;
    for (let i = 0; i < LOD_DISTANCE_THRESHOLDS.length; i++) {
      if (cameraDistance >= LOD_DISTANCE_THRESHOLDS[i]) {
        newLOD = i + 1;
      }
    }
    newLOD = Math.min(newLOD, LOD_SEGMENTS.length - 1);

    if (newLOD !== this.currentLOD) {
      const wasDisplaced = this.hasDisplacement;
      const savedDisp = this.lastDisplacement;
      const savedProg = this.lastProgress;

      this.switchLOD(newLOD);

      if (wasDisplaced && savedDisp) {
        this.lastDisplacement = savedDisp;
        this.lastProgress = savedProg;
        this.hasDisplacement = true;
        this.applyDisplacementToGeometry(savedDisp, savedProg);
      }

      this.updateEdges();
    }
  }

  private switchLOD(lodIndex: number): void {
    this.currentLOD = lodIndex;
    this.baseGeometry = this.lodGeometries[lodIndex];
    this.originalPositions = this.originalPositionsByLOD[lodIndex];

    if (this.mesh) {
      this.mesh.geometry = this.baseGeometry;
    }
  }

  private updateEdges(): void {
    if (!this.edges) return;
    const oldGeo = this.edges.geometry;
    const edgeGeometry = new THREE.EdgesGeometry(this.baseGeometry);
    this.edges.geometry = edgeGeometry;
    oldGeo.dispose();
  }

  private applyTexture(material: THREE.MeshPhongMaterial, intensity: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * intensity * 60;
      const base = 128 + noise;
      data[i] = Math.min(255, base);
      data[i + 1] = Math.min(255, base - 10);
      data[i + 2] = Math.min(255, base - 20);
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    material.bumpMap = texture;
    material.bumpScale = intensity * 0.3;
  }

  public updateThickness(thickness: number): void {
    this.config.thickness = thickness;
    this.buildLODGeometries();
    this.switchLOD(this.currentLOD);
    this.mesh.scale.set(1, 1, 1);
    this.edges.scale.set(1, 1, 1);

    if (this.hasDisplacement && this.lastDisplacement) {
      this.applyDisplacementToGeometry(this.lastDisplacement, this.lastProgress);
    }
    this.updateEdges();
  }

  public updateTextureIntensity(intensity: number): void {
    this.config.textureIntensity = intensity;
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    if (material.bumpMap) {
      material.bumpScale = intensity * 0.3;
    }
  }

  public updateYPosition(y: number): void {
    this.config.yPosition = y;
    this.mesh.position.y = y;
    this.edges.position.y = y;
  }

  public setGlowIntensity(intensity: number): void {
    const edgeMaterial = this.edges.material as THREE.LineBasicMaterial;
    edgeMaterial.opacity = 0.3 + intensity * 0.7;
  }

  public applyDisplacement(displacement: DisplacementVector, progress: number): void {
    this.lastDisplacement = displacement;
    this.lastProgress = progress;
    this.hasDisplacement = true;
    this.applyDisplacementToGeometry(displacement, progress);
    this.updateEdges();
  }

  private applyDisplacementToGeometry(displacement: DisplacementVector, progress: number): void {
    const positionAttr = this.baseGeometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const originalX = this.originalPositions[i];
      const originalY = this.originalPositions[i + 1];
      const originalZ = this.originalPositions[i + 2];

      const halfWidth = this.width / 2;
      const normalizedX = (originalX + halfWidth) / this.width;

      let displacementFactor = 0;

      if (displacement.faultType === 'normal' || displacement.faultType === 'reverse') {
        const faultX = displacement.faultPlaneX;
        if (originalX > faultX) {
          const distance = Math.abs(originalX - faultX);
          const maxDistance = halfWidth - Math.abs(faultX);
          displacementFactor = Math.min(1, distance / Math.max(maxDistance * 0.5, 1));
        }
      } else if (displacement.faultType === 'strike-slip') {
        const faultX = displacement.faultPlaneX;
        const distance = Math.abs(originalX - faultX);
        if (originalX > faultX) {
          displacementFactor = Math.min(1, distance / 5) * 1;
        } else {
          displacementFactor = -Math.min(1, distance / 5) * 1;
        }
      }

      const easedProgress = this.easeInOutCubic(progress);
      const totalDisplacement = displacementFactor * easedProgress;

      positions[i] = this.originalPositions[i] + displacement.direction.x * displacement.magnitude * totalDisplacement;
      positions[i + 1] = this.originalPositions[i + 1] + displacement.direction.y * displacement.magnitude * totalDisplacement;
      positions[i + 2] = this.originalPositions[i + 2] + displacement.direction.z * displacement.magnitude * totalDisplacement;
    }

    positionAttr.needsUpdate = true;
    this.baseGeometry.computeVertexNormals();
  }

  public resetDisplacement(): void {
    const positionAttr = this.baseGeometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;
    positions.set(this.originalPositions);

    positionAttr.needsUpdate = true;
    this.baseGeometry.computeVertexNormals();

    this.lastDisplacement = null;
    this.lastProgress = 0;
    this.hasDisplacement = false;

    this.updateEdges();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public dispose(): void {
    this.lodGeometries.forEach(g => g.dispose());
    (this.mesh.material as THREE.Material).dispose();
    this.edges.geometry.dispose();
    (this.edges.material as THREE.Material).dispose();
  }
}

export class StrataManager {
  public layers: StrataLayer[] = [];
  public group: THREE.Group;
  private width: number;
  private depth: number;

  constructor(width: number = 30, depth: number = 30) {
    this.width = width;
    this.depth = depth;
    this.group = new THREE.Group();
    this.createDefaultLayers();
  }

  private createDefaultLayers(): void {
    const layerConfigs: StrataLayerConfig[] = [
      { name: '沉积层', color: 0x8B4513, thickness: 2, textureIntensity: 0.5, yPosition: 1 },
      { name: '花岗岩层', color: 0x696969, thickness: 3, textureIntensity: 0.7, yPosition: -1.5 },
      { name: '变质岩层', color: 0x2F4F2F, thickness: 4, textureIntensity: 0.9, yPosition: -5 }
    ];

    layerConfigs.forEach(config => {
      const layer = new StrataLayer(config, this.width, this.depth);
      this.layers.push(layer);
      this.group.add(layer.mesh);
      this.group.add(layer.edges);
    });
  }

  public updateLayerParam(index: number, param: 'thickness' | 'texture', value: number): void {
    if (index < 0 || index >= this.layers.length) return;

    const layer = this.layers[index];
    if (param === 'thickness') {
      layer.updateThickness(value);
      this.recalculatePositions();
    } else if (param === 'texture') {
      layer.updateTextureIntensity(value);
    }
  }

  private recalculatePositions(): void {
    let currentY = this.layers[0].config.thickness / 2;
    this.layers[0].updateYPosition(currentY);

    for (let i = 1; i < this.layers.length; i++) {
      const prevLayer = this.layers[i - 1];
      const currentLayer = this.layers[i];
      currentY -= prevLayer.config.thickness / 2 + currentLayer.config.thickness / 2;
      currentLayer.updateYPosition(currentY);
    }
  }

  public updateLOD(cameraDistance: number): void {
    this.layers.forEach(layer => layer.updateLOD(cameraDistance));
  }

  public setGlowIntensity(intensity: number): void {
    this.layers.forEach(layer => layer.setGlowIntensity(intensity));
  }

  public applyDisplacement(displacement: DisplacementVector, progress: number): void {
    this.layers.forEach(layer => {
      layer.applyDisplacement(displacement, progress);
    });
  }

  public resetDisplacement(): void {
    this.layers.forEach(layer => layer.resetDisplacement());
  }

  public dispose(): void {
    this.layers.forEach(layer => layer.dispose());
  }
}
