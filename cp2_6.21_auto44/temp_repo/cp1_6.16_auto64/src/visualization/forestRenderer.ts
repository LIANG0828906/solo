import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TreeState } from '../ecosystem/ecosystemEngine';
import { getSpeciesById } from '../ecosystem/speciesConfig';
import { EnvironmentController } from './environmentController';

interface TreeMeshGroup {
  id: string;
  group: THREE.Group;
  trunk: THREE.Mesh;
  canopy: THREE.Mesh;
  currentHeight: number;
  currentCanopyRadius: number;
  currentHealth: number;
  speciesId: string;
}

export class ForestRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private environmentController: EnvironmentController;
  private treeMeshes: Map<string, TreeMeshGroup> = new Map();
  private ground: THREE.Mesh;
  private gridHelper: THREE.GridHelper;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onAnimationFrame: ((deltaTime: number) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(80, 80, 80);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.environmentController = new EnvironmentController(this.scene);

    this.ground = this.createGround();
    this.scene.add(this.ground);

    this.gridHelper = new THREE.GridHelper(100, 20, 0x2d5a27, 0x1a3d15);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);

    window.addEventListener('resize', this.handleResize);
  }

  private createGround(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const colors = new Float32Array(geometry.attributes.position.count * 3);

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = geometry.attributes.position.getX(i);
      const y = geometry.attributes.position.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const t = Math.min(1, dist / 70);

      const r = Math.floor(30 + (1 - t) * 20);
      const g = Math.floor(80 + (1 - t) * 50);
      const b = Math.floor(40 + (1 - t) * 20);

      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = g / 255;
      colors[i * 3 + 2] = b / 255;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    return ground;
  }

  private createTreeMesh(tree: TreeState): TreeMeshGroup {
    const group = new THREE.Group();

    const species = getSpeciesById(tree.speciesId);
    if (!species) {
      throw new Error(`Species not found: ${tree.speciesId}`);
    }

    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, tree.height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(species.trunkColor),
      roughness: 0.9,
      metalness: 0.0,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = tree.height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const canopyGeometry = new THREE.SphereGeometry(tree.canopyRadius, 12, 10);
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(species.canopyColor),
      roughness: 0.8,
      metalness: 0.0,
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = tree.height - tree.canopyRadius * 0.3;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    group.add(canopy);

    group.position.set(tree.position.x, 0, tree.position.z);

    return {
      id: tree.id,
      group,
      trunk,
      canopy,
      currentHeight: tree.height,
      currentCanopyRadius: tree.canopyRadius,
      currentHealth: tree.health,
      speciesId: tree.speciesId,
    };
  }

  private getCanopyColor(health: number, baseColor: string): THREE.Color {
    const color = new THREE.Color(baseColor);

    if (health >= 0.8) {
      return color;
    } else if (health >= 0.5) {
      const t = (health - 0.5) / 0.3;
      const yellow = new THREE.Color(0xffeb3b);
      return color.clone().lerp(yellow, 1 - t);
    } else if (health > 0) {
      const t = health / 0.5;
      const brown = new THREE.Color(0x8b4513);
      const yellowGreen = new THREE.Color(0xffeb3b).lerp(color.clone(), 0.3);
      return yellowGreen.lerp(brown, 1 - t);
    } else {
      return new THREE.Color(0x666666);
    }
  }

  updateTrees(trees: TreeState[]): void {
    const currentIds = new Set(this.treeMeshes.keys());
    const newIds = new Set(trees.map((t) => t.id));

    for (const id of currentIds) {
      if (!newIds.has(id)) {
        const meshGroup = this.treeMeshes.get(id);
        if (meshGroup) {
          this.scene.remove(meshGroup.group);
          meshGroup.trunk.geometry.dispose();
          (meshGroup.trunk.material as THREE.Material).dispose();
          meshGroup.canopy.geometry.dispose();
          (meshGroup.canopy.material as THREE.Material).dispose();
          this.treeMeshes.delete(id);
        }
      }
    }

    for (const tree of trees) {
      let meshGroup = this.treeMeshes.get(tree.id);

      if (!meshGroup) {
        meshGroup = this.createTreeMesh(tree);
        this.treeMeshes.set(tree.id, meshGroup);
        this.scene.add(meshGroup.group);
      }

      const species = getSpeciesById(tree.speciesId);
      if (!species) continue;

      if (Math.abs(meshGroup.currentHeight - tree.height) > 0.01) {
        const newHeight = Math.max(0.1, tree.height);
        meshGroup.trunk.scale.y = newHeight / meshGroup.currentHeight;
        meshGroup.trunk.position.y = newHeight / 2;
        meshGroup.currentHeight = newHeight;
      }

      if (Math.abs(meshGroup.currentCanopyRadius - tree.canopyRadius) > 0.01) {
        const newRadius = Math.max(0.1, tree.canopyRadius);
        const scale = newRadius / meshGroup.currentCanopyRadius;
        meshGroup.canopy.scale.setScalar(scale);
        meshGroup.canopy.position.y = tree.height - tree.canopyRadius * 0.3;
        meshGroup.currentCanopyRadius = newRadius;
      }

      if (Math.abs(meshGroup.currentHealth - tree.health) > 0.01) {
        const canopyColor = this.getCanopyColor(tree.health, species.canopyColor);
        (meshGroup.canopy.material as THREE.MeshStandardMaterial).color.copy(canopyColor);
        meshGroup.currentHealth = tree.health;
      }

      if (tree.isDead) {
        meshGroup.group.visible = false;
      }
    }
  }

  setLightIntensity(intensity: number): void {
    this.environmentController.setLightIntensity(intensity);
  }

  startAnimationLoop(callback: (deltaTime: number) => void): void {
    this.onAnimationFrame = callback;
    this.lastTime = performance.now();
    this.animate();
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onAnimationFrame = null;
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.controls.update();
    this.environmentController.update(deltaTime);

    if (this.onAnimationFrame) {
      this.onAnimationFrame(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  dispose(): void {
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.handleResize);

    for (const meshGroup of this.treeMeshes.values()) {
      meshGroup.trunk.geometry.dispose();
      (meshGroup.trunk.material as THREE.Material).dispose();
      meshGroup.canopy.geometry.dispose();
      (meshGroup.canopy.material as THREE.Material).dispose();
    }
    this.treeMeshes.clear();

    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();

    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
