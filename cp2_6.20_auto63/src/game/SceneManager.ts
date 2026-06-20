import * as THREE from 'three';
import type { EnergyNode, Fragment } from '@/store/useGameStore';

export interface PlatformData {
  position: [number, number, number];
  scale: [number, number, number];
}

export interface NodeObject {
  id: string;
  data: EnergyNode;
  mesh: THREE.Group;
  light: THREE.PointLight;
}

export interface FragmentObject {
  id: string;
  data: Fragment;
  mesh: THREE.Group;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | null = null;
  private lights: THREE.Light[] = [];
  private platforms: PlatformData[] = [];
  private nodeObjects: Map<string, NodeObject> = new Map();
  private fragmentObjects: Map<string, FragmentObject> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.025);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

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

  public addNode(nodeData: EnergyNode): NodeObject {
    const group = new THREE.Group();
    group.position.set(...nodeData.position);

    const light = new THREE.PointLight(
      new THREE.Color(nodeData.acceptElement),
      nodeData.isLit ? 1.5 : 0.4,
      10
    );
    group.add(light);

    this.scene.add(group);

    const nodeObj: NodeObject = {
      id: nodeData.id,
      data: { ...nodeData },
      mesh: group,
      light,
    };
    this.nodeObjects.set(nodeData.id, nodeObj);

    return nodeObj;
  }

  public addFragment(fragmentData: Fragment): FragmentObject {
    const group = new THREE.Group();
    group.position.set(...fragmentData.position);

    this.scene.add(group);

    const fragObj: FragmentObject = {
      id: fragmentData.id,
      data: { ...fragmentData },
      mesh: group,
    };
    this.fragmentObjects.set(fragmentData.id, fragObj);

    return fragObj;
  }

  public getNode(id: string): NodeObject | undefined {
    return this.nodeObjects.get(id);
  }

  public getFragment(id: string): FragmentObject | undefined {
    return this.fragmentObjects.get(id);
  }

  public getAllNodes(): NodeObject[] {
    return Array.from(this.nodeObjects.values());
  }

  public getAllFragments(): FragmentObject[] {
    return Array.from(this.fragmentObjects.values());
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

  public getPlatforms(): PlatformData[] {
    return this.platforms;
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
  ): { node: NodeObject | null; distance: number; isMatch: boolean } {
    let nearest: NodeObject | null = null;
    let minDist = Infinity;

    for (const nodeObj of this.nodeObjects.values()) {
      if (nodeObj.data.isLit) continue;

      const dx = position[0] - nodeObj.data.position[0];
      const dy = position[1] - nodeObj.data.position[1];
      const dz = position[2] - nodeObj.data.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minDist) {
        minDist = dist;
        nearest = nodeObj;
      }
    }

    const isMatch =
      nearest !== null &&
      minDist < 2.0 &&
      fragment.elementColor === nearest.data.acceptElement &&
      fragment.matchedNodeId === nearest.data.id;

    return { node: nearest, distance: minDist, isMatch };
  }

  public updateNodePosition(nodeId: string, position: [number, number, number]) {
    const nodeObj = this.nodeObjects.get(nodeId);
    if (nodeObj) {
      nodeObj.data.position = position;
      nodeObj.mesh.position.set(...position);
    }
  }

  public updateFragmentPosition(fragmentId: string, position: [number, number, number]) {
    const fragObj = this.fragmentObjects.get(fragmentId);
    if (fragObj) {
      fragObj.data.position = position;
      fragObj.mesh.position.set(...position);
    }
  }

  public lightUpNode(nodeId: string) {
    const nodeObj = this.nodeObjects.get(nodeId);
    if (nodeObj) {
      nodeObj.data.isLit = true;
      nodeObj.light.intensity = 1.8;
      nodeObj.light.distance = 15;
    }
  }

  public setNodeError(nodeId: string, isError: boolean) {
    const nodeObj = this.nodeObjects.get(nodeId);
    if (nodeObj) {
      nodeObj.data.isError = isError;
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

    this.nodeObjects.forEach((obj) => {
      this.scene.remove(obj.mesh);
    });
    this.nodeObjects.clear();

    this.fragmentObjects.forEach((obj) => {
      this.scene.remove(obj.mesh);
    });
    this.fragmentObjects.clear();

    this.platforms = [];
  }
}
