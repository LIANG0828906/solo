import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  centerOffset: THREE.Vector3;
  normalizedScale: number;
}

type ProgressCallback = (progress: LoadProgress) => void;

class ModelLoaderSingleton {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    try {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    } catch (e) {
      console.warn('DRACO loader not available, compressed models may fail to load:', e);
    }
  }

  private async simulateProgress(
    durationMs: number,
    onProgress: ProgressCallback
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const tick = () => {
        const elapsed = performance.now() - startTime;
        const rawProgress = Math.min(elapsed / durationMs, 0.95);
        const eased = 1 - Math.pow(1 - rawProgress, 3);
        onProgress({
          loaded: eased,
          total: 1,
          percentage: Math.round(eased * 100),
        });
        if (rawProgress < 0.95) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  private computeBounds(group: THREE.Group): {
    box: THREE.Box3;
    sphere: THREE.Sphere;
    center: THREE.Vector3;
    scale: number;
  } {
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const normalizedScale = maxDim > 0 ? 10 / maxDim : 1;

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    sphere.radius *= normalizedScale;

    return {
      box,
      sphere,
      center,
      scale: normalizedScale,
    };
  }

  private applyEdgeHighlight(group: THREE.Group, edgeColor: string): void {
    const edgeColorHex = new THREE.Color(edgeColor);

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;

        try {
          const edges = new THREE.EdgesGeometry(geometry, 30);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: edgeColorHex,
            transparent: true,
            opacity: 0.6,
            linewidth: 1,
          });
          const lineSegments = new THREE.LineSegments(edges, lineMaterial);
          lineSegments.name = `__edge_${mesh.name || mesh.uuid}`;
          mesh.add(lineSegments);
        } catch (e) {
          // Skip edge creation for incompatible geometries
        }
      }
    });
  }

  async loadFromArrayBuffer(
    buffer: ArrayBuffer,
    fileName: string,
    edgeColor: string,
    onProgress?: ProgressCallback
  ): Promise<LoadedModel> {
    const minAnimDuration = 2000;
    let loadComplete = false;
    let simulatedProgress = 0;

    const progressPromise = this.simulateProgress(minAnimDuration, (p) => {
      simulatedProgress = p.percentage;
      if (!loadComplete && onProgress) {
        onProgress(p);
      }
    });

    const loadPromise = new Promise<LoadedModel>((resolve, reject) => {
      this.gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const group = gltf.scene || new THREE.Group();
          const bounds = this.computeBounds(group);

          group.position.sub(bounds.center);
          group.scale.setScalar(bounds.scale);

          this.applyEdgeHighlight(group, edgeColor);

          resolve({
            scene: group,
            animations: gltf.animations || [],
            boundingBox: bounds.box,
            boundingSphere: bounds.sphere,
            centerOffset: bounds.center,
            normalizedScale: bounds.scale,
          });
        },
        (error) => {
          reject(new Error(`Failed to parse GLTF model ${fileName}: ${error.message || error}`));
        }
      );
    });

    const [, model] = await Promise.all([progressPromise, loadPromise]);
    loadComplete = true;

    if (onProgress && simulatedProgress < 100) {
      await new Promise<void>((r) => {
        const start = simulatedProgress;
        const startTime = performance.now();
        const duration = 300;
        const tick = () => {
          const t = Math.min((performance.now() - startTime) / duration, 1);
          const pct = Math.round(start + (100 - start) * t);
          onProgress!({ loaded: pct / 100, total: 1, percentage: pct });
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            r();
          }
        };
        tick();
      });
    }

    return model;
  }

  async loadFromFile(
    file: File,
    edgeColor: string,
    onProgress?: ProgressCallback
  ): Promise<LoadedModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const model = await this.loadFromArrayBuffer(buffer, file.name, edgeColor, onProgress);
          resolve(model);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  generateDemoModel(
    variant: 'complete' | 'damaged',
    edgeColor: string,
    onProgress?: ProgressCallback
  ): Promise<LoadedModel> {
    const group = new THREE.Group();
    group.name = variant === 'complete' ? 'Site_Complete_AD100' : 'Site_Damaged_AD500';

    const stoneMat = (variant: 'complete' | 'damaged') => {
      const color = variant === 'complete' ? 0xc4a57b : 0x8a7354;
      return new THREE.MeshStandardMaterial({
        color,
        roughness: variant === 'complete' ? 0.75 : 0.9,
        metalness: 0.05,
      });
    };

    const mainBase = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.2, 10),
      stoneMat(variant)
    );
    mainBase.name = 'Base_Platform';
    mainBase.position.y = 0.6;
    mainBase.receiveShadow = true;
    group.add(mainBase);

    const wallMaterial = stoneMat(variant);
    const wallHeight = variant === 'complete' ? 5 : 3.2;
    const wallThickness = 0.6;

    const wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(12, wallHeight, wallThickness),
      wallMaterial
    );
    wallNorth.name = 'Wall_North_Main';
    wallNorth.position.set(0, 0.6 + wallHeight / 2, -5 + wallThickness / 2);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    if (variant === 'damaged') {
      wallNorth.geometry.translate(0, -0.4, 0);
    }
    group.add(wallNorth);

    const wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(12, wallHeight, wallThickness),
      wallMaterial
    );
    wallSouth.name = 'Gate_South_Main';
    wallSouth.position.set(0, 0.6 + wallHeight / 2, 5 - wallThickness / 2);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    if (variant === 'damaged') {
      wallSouth.geometry.scale(1, 0.7, 1);
      wallSouth.position.y -= wallHeight * 0.15;
    }
    group.add(wallSouth);

    const wallEastHeight = variant === 'complete' ? wallHeight : wallHeight * 0.6;
    const wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallEastHeight, 10 - wallThickness * 2),
      wallMaterial
    );
    wallEast.name = 'Column_East_Structure';
    wallEast.position.set(6 - wallThickness / 2, 0.6 + wallEastHeight / 2, 0);
    wallEast.castShadow = true;
    group.add(wallEast);

    const wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 10 - wallThickness * 2),
      wallMaterial
    );
    wallWest.name = 'Temple_West_Base';
    wallWest.position.set(-6 + wallThickness / 2, 0.6 + wallHeight / 2, 0);
    wallWest.castShadow = true;
    if (variant === 'damaged') {
      wallWest.geometry.scale(1, 0.8, 1);
    }
    group.add(wallWest);

    if (variant === 'complete') {
      const domeGroup = new THREE.Group();
      domeGroup.name = 'Dome_Main_Central';
      const domeRadius = 3;
      const domeGeo = new THREE.SphereGeometry(domeRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xd4b896,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = wallHeight + 0.6;
      dome.castShadow = true;
      domeGroup.add(dome);

      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(domeRadius, domeRadius * 0.95, 1.5, 32),
        stoneMat('complete')
      );
      drum.position.y = wallHeight + 0.6 - 0.75;
      drum.castShadow = true;
      domeGroup.add(drum);

      group.add(domeGroup);
    }

    const columnCount = variant === 'complete' ? 6 : 4;
    const columnHeight = variant === 'complete' ? 4 : 2.5;
    const columnMat = new THREE.MeshStandardMaterial({
      color: variant === 'complete' ? 0xe8dcc4 : 0x9a8568,
      roughness: 0.7,
    });

    for (let i = 0; i < columnCount; i++) {
      const col = new THREE.Group();
      col.name = `Column_East_${i + 1}`;
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, columnHeight, 16),
        columnMat
      );
      shaft.position.y = columnHeight / 2 + 1.2;
      shaft.castShadow = true;

      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.25, 0.7),
        columnMat
      );
      capital.position.y = columnHeight + 1.2 + 0.125;

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 0.8),
        columnMat
      );
      base.position.y = 1.2 + 0.15;

      col.add(base, shaft, capital);
      const spacing = (10 - 2) / (columnCount - 1 || 1);
      col.position.set(6 - 0.8, 0, -4 + i * spacing);
      group.add(col);
    }

    if (variant === 'complete') {
      const templeGroup = new THREE.Group();
      templeGroup.name = 'Temple_West_Sanctuary';

      const templeBase = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.4, 4),
        stoneMat('complete')
      );
      templeBase.position.y = 1.2 + 0.2;
      templeGroup.add(templeBase);

      const cella = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.5, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xb59e7f, roughness: 0.8 })
      );
      cella.position.y = 1.2 + 0.4 + 1.25;
      templeGroup.add(cella);

      const pediment = new THREE.Mesh(
        new THREE.ConeGeometry(2, 1, 4),
        stoneMat('complete')
      );
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.3, 1, 1.8);
      pediment.position.y = 1.2 + 0.4 + 2.5 + 0.5;
      templeGroup.add(pediment);

      templeGroup.position.set(-6 + 1.8, 0, 0);
      group.add(templeGroup);
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({
        color: variant === 'complete' ? 0x6b8e4e : 0x5a4a38,
        roughness: 1,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'Ground_Plane';
    group.add(ground);

    const bounds = (() => {
      const box = new THREE.Box3().setFromObject(group);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 10 / maxDim : 1;
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      sphere.radius *= scale;
      return { box, sphere, center, scale };
    })();

    group.position.sub(bounds.center);
    group.scale.setScalar(bounds.scale);

    return new Promise(async (resolve) => {
      if (onProgress) {
        await this.simulateProgress(2000, onProgress);
      }
      this.applyEdgeHighlight(group, edgeColor);
      resolve({
        scene: group,
        animations: [],
        boundingBox: bounds.box,
        boundingSphere: bounds.sphere,
        centerOffset: bounds.center,
        normalizedScale: bounds.scale,
      });
    });
  }
}

export const ModelLoader = new ModelLoaderSingleton();
export default ModelLoader;
