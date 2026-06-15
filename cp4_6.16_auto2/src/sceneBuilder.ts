import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import modelData from './modelData.json';

export interface BuildingInfo {
  id: string;
  name: string;
  type: string;
  tag: string;
  floors: number;
  icon: string;
  description: string;
  modelUrl: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: number;
  fallbackStyle: string;
}

export interface BuildingEntry {
  mesh: THREE.Object3D;
  info: BuildingInfo;
  clickableMeshes: THREE.Mesh[];
}

export type ProgressCallback = (loaded: number, total: number, stage: string) => void;

export class SceneBuilder {
  private scene: THREE.Scene;
  private buildings: BuildingEntry[] = [];
  private loader: GLTFLoader;
  private manager: THREE.LoadingManager;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.manager = new THREE.LoadingManager();
    this.loader = new GLTFLoader(this.manager);
  }

  getBuildings(): BuildingEntry[] {
    return this.buildings;
  }

  async build(onProgress?: ProgressCallback): Promise<void> {
    const total = modelData.length + 3;
    let loaded = 0;

    const report = (stage: string) => {
      loaded++;
      onProgress?.(loaded, total, stage);
    };

    this.setupGround();
    report('地面与网格');

    this.setupLighting();
    report('灯光与阴影');

    this.setupEnvironment();
    report('环境与天空');

    for (let i = 0; i < modelData.length; i++) {
      const info = modelData[i] as BuildingInfo;
      await this.loadBuilding(info, (p) => {
        const currentLoaded = loaded + (p / modelData.length);
        onProgress?.(currentLoaded, total, `加载 ${info.name}`);
      });
      report(info.name);
    }
  }

  private setupGround(): void {
    const groundGeo = new THREE.PlaneGeometry(400, 400, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b2a,
      roughness: 0.92,
      metalness: 0.04,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);

    const grid = new THREE.GridHelper(400, 80, 0x1a3a52, 0x12263a);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    grid.position.y = 0.02;
    this.scene.add(grid);

    this.setupPlayground();
    this.setupPathways();
  }

  private setupPlayground(): void {
    const trackGeo = new THREE.RingGeometry(22, 28, 64);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x5c2a0d,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(-45, 0.03, 30);
    track.receiveShadow = true;
    this.scene.add(track);

    const fieldGeo = new THREE.CircleGeometry(21, 64);
    const fieldMat = new THREE.MeshStandardMaterial({
      color: 0x1f4a27,
      roughness: 0.95,
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.position.set(-45, 0.04, 30);
    field.receiveShadow = true;
    this.scene.add(field);

    const centerMarkGeo = new THREE.RingGeometry(1.8, 2.2, 32);
    const centerMarkMat = new THREE.MeshBasicMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const centerMark = new THREE.Mesh(centerMarkGeo, centerMarkMat);
    centerMark.rotation.x = -Math.PI / 2;
    centerMark.position.set(-45, 0.05, 30);
    this.scene.add(centerMark);
  }

  private setupPathways(): void {
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x1a3344,
      roughness: 0.88,
    });

    const paths: { w: number; h: number; x: number; z: number; rot: number }[] = [
      { w: 140, h: 6, x: 0, z: 0, rot: 0 },
      { w: 120, h: 6, x: 0, z: 0, rot: Math.PI / 2 },
      { w: 80, h: 4, x: -30, z: 5, rot: 0 },
      { w: 70, h: 4, x: 25, z: 10, rot: Math.PI / 3 },
    ];

    for (const p of paths) {
      const geo = new THREE.PlaneGeometry(p.w, p.h);
      const mesh = new THREE.Mesh(geo, pathMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = p.rot;
      mesh.position.set(p.x, 0.05, p.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x88aacc, 0.45);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x80deea, 0x0d1b2a, 0.35);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.25);
    sun.position.set(55, 85, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4dd0e1, 0.25);
    fill.position.set(-40, 30, -50);
    this.scene.add(fill);

    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.0045);
  }

  private setupEnvironment(): void {
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a1628) },
        bottomColor: { value: new THREE.Color(0x1a2a4a) },
        offset: { value: 33 },
        exponent: { value: 0.7 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 350 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.7 + 40;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe0f7fa,
      size: 0.9,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    this.setupTrees();
    this.setupLampPosts();
  }

  private setupTrees(): void {
    const positions = [
      [-60, -10], [-55, -30], [-15, -45], [5, -50], [55, -35],
      [65, 0], [55, 55], [15, 60], [-20, 55], [-60, 50],
      [-35, -5], [-5, 12], [30, 45], [-50, 15], [-35, 45],
      [40, -40], [10, -35], [-10, -15], [20, 5], [-45, -40],
    ];

    for (const [x, z] of positions) {
      const tree = this.createTree();
      tree.position.set(x, 0, z);
      const s = 0.85 + Math.random() * 0.5;
      tree.scale.setScalar(s);
      this.scene.add(tree);
    }
  }

  private createTree(): THREE.Group {
    const group = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.2, 7);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x2a1810,
      roughness: 0.95,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliageColors = [0x0a3a22, 0x0d4a2a, 0x123a1e];
    for (let i = 0; i < 3; i++) {
      const radius = 2.8 - i * 0.55;
      const height = 2.4 - i * 0.35;
      const coneGeo = new THREE.ConeGeometry(radius, height, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: foliageColors[i % foliageColors.length],
        roughness: 0.88,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 3.6 + i * 1.35;
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);
    }

    return group;
  }

  private setupLampPosts(): void {
    const positions = [
      [-55, 0], [-25, 0], [10, 0], [45, 0],
      [0, -35], [0, -5], [0, 30],
    ];

    for (const [x, z] of positions) {
      const lamp = this.createLampPost();
      lamp.position.set(x, 0, z);
      this.scene.add(lamp);
    }
  }

  private createLampPost(): THREE.Group {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 5.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      metalness: 0.7,
      roughness: 0.4,
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.75;
    pole.castShadow = true;
    group.add(pole);

    const armGeo = new THREE.BoxGeometry(1.4, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.7, 5.3, 0);
    group.add(arm);

    const fixtureGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0x4dd0e1,
      emissiveIntensity: 1.2,
    });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(1.4, 5.2, 0);
    group.add(fixture);

    const pl = new THREE.PointLight(0x4dd0e1, 0.35, 18, 2);
    pl.position.set(1.4, 5, 0);
    group.add(pl);

    return group;
  }

  private async loadBuilding(info: BuildingInfo, onProgress?: (p: number) => void): Promise<void> {
    return new Promise((resolve) => {
      this.loader.load(
        info.modelUrl,
        (gltf) => {
          const group = gltf.scene;
          this.processLoadedModel(group, info);
          onProgress?.(1);
          resolve();
        },
        (xhr) => {
          if (xhr.total) {
            onProgress?.(xhr.loaded / xhr.total * 0.95);
          }
        },
        () => {
          const fallback = this.createFallbackBuilding(info);
          this.scene.add(fallback);
          const clickable = this.collectClickableMeshes(fallback, info.id);
          this.buildings.push({ mesh: fallback, info, clickableMeshes: clickable });
          onProgress?.(1);
          resolve();
        }
      );
    });
  }

  private processLoadedModel(group: THREE.Group, info: BuildingInfo): void {
    group.position.set(info.position.x, info.position.y, info.position.z);
    group.scale.setScalar(info.scale);
    group.rotation.y = info.rotation;

    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.buildingId = info.id;
      }
    });

    this.scene.add(group);
    const clickable = this.collectClickableMeshes(group, info.id);
    this.buildings.push({ mesh: group, info, clickableMeshes: clickable });
  }

  private collectClickableMeshes(root: THREE.Object3D, buildingId: string): THREE.Mesh[] {
    const result: THREE.Mesh[] = [];
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.userData.buildingId = buildingId;
        result.push(m);
      }
    });
    return result;
  }

  private createFallbackBuilding(info: BuildingInfo): THREE.Group {
    const group = new THREE.Group();
    group.position.set(info.position.x, info.position.y, info.position.z);
    group.rotation.y = info.rotation;
    group.scale.setScalar(info.scale);

    const style = info.fallbackStyle;
    let building: THREE.Group;

    switch (style) {
      case 'modern':
        building = this.createModernBuilding(info);
        break;
      case 'classic':
        building = this.createClassicBuilding(info);
        break;
      case 'tech':
        building = this.createTechBuilding(info);
        break;
      case 'sport':
        building = this.createSportBuilding(info);
        break;
      default:
        building = this.createModernBuilding(info);
    }

    group.add(building);
    this.setupClickableTag(group, info);
    return group;
  }

  private createModernBuilding(info: BuildingInfo): THREE.Group {
    const group = new THREE.Group();
    const floors = info.floors;
    const floorH = 3.6;
    const width = 18;
    const depth = 11;

    const baseGeo = new THREE.BoxGeometry(width + 2, 1.2, depth + 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.75,
      metalness: 0.25,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.buildingId = info.id;
    group.add(base);

    for (let f = 0; f < floors; f++) {
      const floorGeo = new THREE.BoxGeometry(width, floorH - 0.3, depth);
      const floorMat = new THREE.MeshStandardMaterial({
        color: f === 0 ? 0x1f3548 : 0x25415a,
        roughness: 0.55,
        metalness: 0.35,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = 1.2 + f * floorH + floorH / 2 - 0.15;
      floor.castShadow = true;
      floor.receiveShadow = true;
      floor.userData.buildingId = info.id;
      group.add(floor);

      this.addWindows(floor, width, floorH, depth, f, info.id, 'modern');
    }

    const roofGeo = new THREE.BoxGeometry(width - 2, 0.6, depth - 2);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x142233,
      roughness: 0.8,
      metalness: 0.3,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.2 + floors * floorH + 0.3;
    roof.castShadow = true;
    roof.userData.buildingId = info.id;
    group.add(roof);

    const entrance = this.createEntrance(info.id);
    entrance.position.set(0, 0, depth / 2 + 0.6);
    group.add(entrance);

    return group;
  }

  private createClassicBuilding(info: BuildingInfo): THREE.Group {
    const group = new THREE.Group();
    const floors = info.floors;
    const floorH = 3.9;
    const width = 20;
    const depth = 14;

    const steps = new THREE.Group();
    for (let s = 0; s < 4; s++) {
      const stepGeo = new THREE.BoxGeometry(width + 4 - s * 0.8, 0.28, 1.4);
      const stepMat = new THREE.MeshStandardMaterial({
        color: 0x2a3a4a,
        roughness: 0.85,
      });
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.y = 0.14 + s * 0.28;
      step.position.z = depth / 2 + 0.8 + s * 0.5;
      step.castShadow = true;
      step.receiveShadow = true;
      step.userData.buildingId = info.id;
      steps.add(step);
    }
    group.add(steps);

    const columns = new THREE.Group();
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      roughness: 0.7,
      metalness: 0.15,
    });
    const colCount = 6;
    for (let c = 0; c < colCount; c++) {
      const colGeo = new THREE.CylinderGeometry(0.45, 0.55, floors * floorH, 12);
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(-width / 2 + 1.5 + (c * (width - 3)) / (colCount - 1), 1.2 + (floors * floorH) / 2, depth / 2 + 0.2);
      col.castShadow = true;
      col.receiveShadow = true;
      col.userData.buildingId = info.id;
      columns.add(col);
    }
    group.add(columns);

    for (let f = 0; f < floors; f++) {
      const floorGeo = new THREE.BoxGeometry(width, floorH - 0.25, depth);
      const floorMat = new THREE.MeshStandardMaterial({
        color: f % 2 === 0 ? 0x253545 : 0x2a4055,
        roughness: 0.65,
        metalness: 0.2,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = 1.2 + f * floorH + floorH / 2 - 0.125;
      floor.castShadow = true;
      floor.receiveShadow = true;
      floor.userData.buildingId = info.id;
      group.add(floor);

      this.addWindows(floor, width, floorH, depth, f, info.id, 'classic');
    }

    const entGeo = new THREE.BoxGeometry(width + 0.5, 1.1, depth + 0.5);
    const entMat = new THREE.MeshStandardMaterial({
      color: 0x1e2f3f,
      roughness: 0.8,
    });
    const entablature = new THREE.Mesh(entGeo, entMat);
    entablature.position.y = 1.2 + floors * floorH + 0.55;
    entablature.castShadow = true;
    entablature.userData.buildingId = info.id;
    group.add(entablature);

    const pedimentGeo = new THREE.ConeGeometry(width * 0.75, 4.5, 4);
    const pedimentMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.75,
    });
    const pediment = new THREE.Mesh(pedimentGeo, pedimentMat);
    pediment.position.y = 1.2 + floors * floorH + 1.1 + 2.25;
    pediment.rotation.y = Math.PI / 4;
    pediment.castShadow = true;
    pediment.userData.buildingId = info.id;
    group.add(pediment);

    return group;
  }

  private createTechBuilding(info: BuildingInfo): THREE.Group {
    const group = new THREE.Group();
    const floors = info.floors;
    const floorH = 3.7;
    const width = 16;
    const depth = 16;

    const podiumGeo = new THREE.BoxGeometry(width + 6, 1.8, depth + 6);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x122436,
      roughness: 0.7,
      metalness: 0.4,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = 0.9;
    podium.castShadow = true;
    podium.receiveShadow = true;
    podium.userData.buildingId = info.id;
    group.add(podium);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x2a5568,
      roughness: 0.15,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85,
      emissive: 0x0a3a4a,
      emissiveIntensity: 0.15,
    });

    for (let f = 0; f < floors; f++) {
      const coreGeo = new THREE.BoxGeometry(width * 0.55, floorH - 0.2, depth * 0.55);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x1a3045,
        roughness: 0.5,
        metalness: 0.55,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 1.8 + f * floorH + floorH / 2 - 0.1;
      core.castShadow = true;
      core.receiveShadow = true;
      core.userData.buildingId = info.id;
      group.add(core);

      const frameGeo = new THREE.BoxGeometry(width, floorH - 0.3, depth);
      const frame = new THREE.Mesh(frameGeo, glassMat);
      frame.position.y = 1.8 + f * floorH + floorH / 2 - 0.15;
      frame.castShadow = true;
      frame.receiveShadow = true;
      frame.userData.buildingId = info.id;
      group.add(frame);

      const slabGeo = new THREE.BoxGeometry(width + 0.4, 0.3, depth + 0.4);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x0f2030,
        roughness: 0.6,
        metalness: 0.5,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = 1.8 + (f + 1) * floorH - 0.15;
      slab.castShadow = true;
      slab.userData.buildingId = info.id;
      group.add(slab);
    }

    const helipadGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32);
    const helipadMat = new THREE.MeshStandardMaterial({
      color: 0x1a3040,
      roughness: 0.8,
    });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.y = 1.8 + floors * floorH + 0.25;
    helipad.userData.buildingId = info.id;
    group.add(helipad);

    const hGeo = new THREE.BoxGeometry(5, 0.08, 0.25);
    const vGeo = new THREE.BoxGeometry(0.25, 0.08, 5);
    const hvMat = new THREE.MeshStandardMaterial({
      color: 0x4dd0e1,
      emissive: 0x4dd0e1,
      emissiveIntensity: 0.6,
    });
    const hMark = new THREE.Mesh(hGeo, hvMat);
    hMark.position.y = 1.8 + floors * floorH + 0.4;
    hMark.userData.buildingId = info.id;
    group.add(hMark);
    const vMark = new THREE.Mesh(vGeo, hvMat);
    vMark.position.y = 1.8 + floors * floorH + 0.4;
    vMark.userData.buildingId = info.id;
    group.add(vMark);

    const antennaGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x80deea,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x4dd0e1,
      emissiveIntensity: 0.3,
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, 1.8 + floors * floorH + 2.8, 0);
    antenna.userData.buildingId = info.id;
    group.add(antenna);

    const entrance = this.createEntrance(info.id);
    entrance.position.set(0, 1.8, depth / 2 + 3.3);
    group.add(entrance);

    return group;
  }

  private createSportBuilding(info: BuildingInfo): THREE.Group {
    const group = new THREE.Group();
    const width = 34;
    const depth = 24;

    const baseGeo = new THREE.BoxGeometry(width + 2, 0.8, depth + 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.buildingId = info.id;
    group.add(base);

    const wallH = 7.5;
    const wallGeo = new THREE.BoxGeometry(width, wallH, depth);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x203545,
      roughness: 0.6,
      metalness: 0.3,
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 0.8 + wallH / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    walls.userData.buildingId = info.id;
    group.add(walls);

    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x0f3040,
      roughness: 0.35,
      metalness: 0.6,
      emissive: 0x1a5565,
      emissiveIntensity: 0.1,
    });
    for (let s = 0; s < 4; s++) {
      const bandGeo = new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.8 + 1.8 + s * 1.6;
      band.userData.buildingId = info.id;
      group.add(band);
    }

    this.addWindows(walls, width, wallH, depth, 0, info.id, 'sport');

    const roofGeo = new THREE.SphereGeometry(width * 0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2a4558,
      roughness: 0.4,
      metalness: 0.55,
      side: THREE.DoubleSide,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.8 + wallH + 0.5;
    roof.castShadow = true;
    roof.userData.buildingId = info.id;
    group.add(roof);

    const ringGeo = new THREE.TorusGeometry(width * 0.52, 0.35, 10, 60);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1a3545,
      roughness: 0.5,
      metalness: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.8 + wallH + 0.5;
    ring.rotation.x = Math.PI / 2;
    ring.userData.buildingId = info.id;
    group.add(ring);

    const entranceGeo = new THREE.BoxGeometry(8, 4.5, 2.5);
    const entranceMat = new THREE.MeshStandardMaterial({
      color: 0x0d2030,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.6,
    });
    const entrance = new THREE.Mesh(entranceGeo, entranceMat);
    entrance.position.set(0, 0.8 + 2.25, depth / 2 + 1.2);
    entrance.userData.buildingId = info.id;
    group.add(entrance);

    const canopyGeo = new THREE.BoxGeometry(12, 0.3, 5);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x1a3040,
      roughness: 0.6,
      metalness: 0.4,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.8 + 5, depth / 2 + 2.5);
    canopy.castShadow = true;
    canopy.userData.buildingId = info.id;
    group.add(canopy);

    for (let s = 0; s < 2; s++) {
      const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 5, 8);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x2a4055,
        metalness: 0.7,
        roughness: 0.35,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(s === 0 ? -4.5 : 4.5, 0.8 + 2.5, depth / 2 + 4.5);
      pillar.castShadow = true;
      pillar.userData.buildingId = info.id;
      group.add(pillar);
    }

    return group;
  }

  private addWindows(
    parent: THREE.Mesh,
    width: number,
    floorH: number,
    depth: number,
    floorIdx: number,
    buildingId: string,
    style: string
  ): void {
    const group = parent.parent;
    if (!group) return;

    const y = parent.position.y;
    const winH = style === 'sport' ? 1.6 : 2.0;
    const winW = style === 'classic' ? 1.3 : 1.6;
    const winD = 0.12;

    const winMat = new THREE.MeshStandardMaterial({
      color: 0x5599aa,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75,
      emissive: 0x4dd0e1,
      emissiveIntensity: Math.random() > 0.45 ? 0.2 + Math.random() * 0.3 : 0.03,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      metalness: 0.65,
      roughness: 0.4,
    });

    const placeWindows = (
      count: number,
      axis: 'x' | 'z',
      sign: number,
      span: number
    ) => {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : -1 + (2 * i) / (count - 1);
        const offset = t * (span / 2 - winW / 2 - 0.4);

        const frameGeo = new THREE.BoxGeometry(
          axis === 'x' ? winW + 0.18 : winD + 0.18,
          winH + 0.2,
          axis === 'x' ? winD + 0.18 : winW + 0.18
        );
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.userData.buildingId = buildingId;

        const paneGeo = new THREE.BoxGeometry(
          axis === 'x' ? winW : winD,
          winH,
          axis === 'x' ? winD : winW
        );
        const pane = new THREE.Mesh(paneGeo, winMat.clone());
        (pane.material as THREE.MeshStandardMaterial).emissiveIntensity =
          Math.random() > 0.4 ? 0.18 + Math.random() * 0.28 : 0.04;
        pane.userData.buildingId = buildingId;

        if (axis === 'x') {
          frame.position.set(offset, y, sign * (depth / 2 + 0.01));
          pane.position.set(offset, y, sign * (depth / 2 + 0.07));
        } else {
          frame.position.set(sign * (width / 2 + 0.01), y, offset);
          pane.position.set(sign * (width / 2 + 0.07), y, offset);
        }

        group.add(frame);
        group.add(pane);
      }
    };

    const frontCount = style === 'sport' ? 7 : style === 'classic' ? 6 : 6;
    const sideCount = style === 'sport' ? 5 : style === 'classic' ? 4 : 4;
    placeWindows(frontCount, 'x', 1, width);
    placeWindows(frontCount, 'x', -1, width);
    placeWindows(sideCount, 'z', 1, depth);
    placeWindows(sideCount, 'z', -1, depth);
  }

  private createEntrance(buildingId: string): THREE.Group {
    const group = new THREE.Group();

    const doorGeo = new THREE.BoxGeometry(3.2, 3.4, 0.18);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a3545,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7,
      emissive: 0x4dd0e1,
      emissiveIntensity: 0.12,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.y = 1.7;
    door.userData.buildingId = buildingId;
    group.add(door);

    const frameGeo = new THREE.BoxGeometry(3.6, 3.8, 0.25);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f2535,
      metalness: 0.8,
      roughness: 0.35,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.9;
    frame.position.z = -0.1;
    frame.userData.buildingId = buildingId;
    group.add(frame);

    const topLightGeo = new THREE.BoxGeometry(2.6, 0.15, 0.1);
    const topLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x80deea,
      emissiveIntensity: 1.0,
    });
    const topLight = new THREE.Mesh(topLightGeo, topLightMat);
    topLight.position.y = 3.5;
    topLight.userData.buildingId = buildingId;
    group.add(topLight);

    return group;
  }

  private setupClickableTag(group: THREE.Group, info: BuildingInfo): void {
    const clickable: THREE.Mesh[] = [];
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        if (!m.userData.buildingId) {
          m.userData.buildingId = info.id;
        }
        clickable.push(m);
      }
    });
    this.buildings.push({ mesh: group, info, clickableMeshes: clickable });
  }
}
