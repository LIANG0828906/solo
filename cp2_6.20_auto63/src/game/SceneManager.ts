import * as THREE from 'three';
import type { EnergyNode, Fragment } from '@/store/useGameStore';

export interface PlatformData {
  position: [number, number, number];
  scale: [number, number, number];
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | null = null;
  private lights: THREE.Light[] = [];
  private platforms: PlatformData[] = [];
  private nodes: EnergyNode[] = [];
  private fragments: Fragment[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private dragPlane: THREE.Plane;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.025);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.setupLights();
    this.setupPlatforms();
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x404080, 0.25);
    this.scene.add(ambient);
    this.lights.push(ambient);

    const dirLight = new THREE.DirectionalLight(0x6677ff, 0.4);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
    this.lights.push(dirLight);

    const purpleLight = new THREE.PointLight(0x8844ff, 0.6, 30);
    purpleLight.position.set(-5, 3, -3);
    this.scene.add(purpleLight);
    this.lights.push(purpleLight);

    const cyanLight = new THREE.PointLight(0x00ddff, 0.5, 25);
    cyanLight.position.set(5, 2, 3);
    this.scene.add(cyanLight);
    this.lights.push(cyanLight);
  }

  private setupPlatforms() {
    this.platforms = [
      { position: [-6, -0.5, -2], scale: [2.8, 0.6, 2.8] },
      { position: [6, -0.5, -2], scale: [2.8, 0.6, 2.8] },
      { position: [-4, -0.5, 5], scale: [2.8, 0.6, 2.8] },
      { position: [4, -0.5, 5], scale: [2.8, 0.6, 2.8] },
    ];
  }

  public setRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  public updateSize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  public setNodes(nodes: EnergyNode[]) {
    this.nodes = nodes;
    this.nodes.forEach((node) => {
      const pointLight = new THREE.PointLight(
        new THREE.Color(node.acceptElement),
        node.isLit ? 1.5 : 0.4,
        10
      );
      pointLight.position.set(...node.position);
      pointLight.name = `node-light-${node.id}`;
      const existing = this.scene.getObjectByName(pointLight.name);
      if (existing) this.scene.remove(existing);
      this.scene.add(pointLight);
    });
  }

  public setFragments(fragments: Fragment[]) {
    this.fragments = fragments;
  }

  public getPlatforms(): PlatformData[] {
    return this.platforms;
  }

  public getNodes(): EnergyNode[] {
    return this.nodes;
  }

  public getFragments(): Fragment[] {
    return this.fragments;
  }

  public screenToWorld(
    clientX: number,
    clientY: number,
    domRect: DOMRect,
    targetY: number = 1
  ): [number, number, number] {
    this.mouse.x = ((clientX - domRect.left) / domRect.width) * 2 - 1;
    this.mouse.y = -((clientY - domRect.top) / domRect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const planeNormal = new THREE.Vector3();
    this.camera.getWorldDirection(planeNormal);
    planeNormal.negate();
    const planePoint = new THREE.Vector3(0, targetY, 0);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);

    if (!intersection) return [0, targetY, 0];
    return [intersection.x, targetY, intersection.z];
  }

  public findNearestNode(
    position: [number, number, number],
    fragment: Fragment
  ): { node: EnergyNode | null; distance: number; isMatch: boolean } {
    let nearest: EnergyNode | null = null;
    let minDist = Infinity;

    for (const node of this.nodes) {
      if (node.isLit) continue;
      const dx = position[0] - node.position[0];
      const dy = position[1] - node.position[1];
      const dz = position[2] - node.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    const isMatch =
      nearest !== null &&
      minDist < 2.0 &&
      fragment.elementColor === nearest.acceptElement &&
      fragment.matchedNodeId === nearest.id;

    return { node: nearest, distance: minDist, isMatch };
  }

  public updateNodeLight(nodeId: string, isLit: boolean) {
    const light = this.scene.getObjectByName(`node-light-${nodeId}`) as THREE.PointLight;
    if (light) {
      light.intensity = isLit ? 1.8 : 0.4;
      light.distance = isLit ? 15 : 10;
    }
  }

  public getCamera() {
    return this.camera;
  }

  public getScene() {
    return this.scene;
  }

  public dispose() {
    this.lights.forEach((l) => {
      this.scene.remove(l);
    });
    this.lights = [];
    this.platforms = [];
    this.nodes = [];
    this.fragments = [];
  }
}
