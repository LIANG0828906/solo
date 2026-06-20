import * as THREE from 'three';
import { CuttingPieceData, LEATHER_BOUNDS } from '@/types';

export class LeatherViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private leatherPlane: THREE.Plane;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 3, 5);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.leatherPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  initRenderer(container: HTMLElement): THREE.WebGLRenderer {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);
    return this.renderer;
  }

  setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    this.scene.add(directional);

    const fill = new THREE.DirectionalLight(0xd2b48c, 0.2);
    fill.position.set(-3, 5, -5);
    this.scene.add(fill);
  }

  getWorldPositionFromMouse(
    clientX: number,
    clientY: number,
    containerRect: DOMRect
  ): { x: number; y: number } | null {
    this.mouse.x = ((clientX - containerRect.left) / containerRect.width) * 2 - 1;
    this.mouse.y = -((clientY - containerRect.top) / containerRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersectPoint = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.leatherPlane, intersectPoint);
    if (!hit) return null;

    return { x: intersectPoint.x, y: intersectPoint.z };
  }

  isPositionInBounds(x: number, y: number, padding: number = 0): boolean {
    const hw = LEATHER_BOUNDS.width / 2 - padding;
    const hh = LEATHER_BOUNDS.height / 2 - padding;
    return Math.abs(x) <= hw && Math.abs(y) <= hh;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  updateCameraAspect(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

export function getShapeGeometry(shape: string, width: number, height: number): THREE.ShapeGeometry {
  const shapeObj = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;

  switch (shape) {
    case 'circle': {
      const segments = 32;
      shapeObj.moveTo(hw, 0);
      for (let i = 1; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        shapeObj.lineTo(Math.cos(angle) * hw, Math.sin(angle) * hh);
      }
      break;
    }
    case 'triangle': {
      shapeObj.moveTo(0, hh);
      shapeObj.lineTo(-hw, -hh);
      shapeObj.lineTo(hw, -hh);
      shapeObj.closePath();
      break;
    }
    case 'hexagon': {
      const r = Math.min(hw, hh);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shapeObj.moveTo(x, y);
        else shapeObj.lineTo(x, y);
      }
      shapeObj.closePath();
      break;
    }
    case 'pentagon': {
      const r = Math.min(hw, hh);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shapeObj.moveTo(x, y);
        else shapeObj.lineTo(x, y);
      }
      shapeObj.closePath();
      break;
    }
    case 'irregular': {
      const points: Array<[number, number]> = [
        [0.4 * hw, hh],
        [-0.3 * hw, 0.8 * hh],
        [-hw, 0.2 * hh],
        [-0.7 * hw, -0.6 * hh],
        [-0.1 * hw, -hh],
        [0.6 * hw, -0.7 * hh],
        [hw, 0.1 * hh],
        [0.8 * hw, 0.6 * hh],
      ];
      shapeObj.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        shapeObj.lineTo(points[i][0], points[i][1]);
      }
      shapeObj.closePath();
      break;
    }
    default: {
      shapeObj.moveTo(-hw, -hh);
      shapeObj.lineTo(hw, -hh);
      shapeObj.lineTo(hw, hh);
      shapeObj.lineTo(-hw, hh);
      shapeObj.closePath();
    }
  }

  return new THREE.ShapeGeometry(shapeObj);
}

export function getShapeOutlinePoints(shape: string, width: number, height: number): Array<[number, number]> {
  const hw = width / 2;
  const hh = height / 2;
  const points: Array<[number, number]> = [];

  switch (shape) {
    case 'circle': {
      const segments = 48;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push([Math.cos(angle) * hw, Math.sin(angle) * hh]);
      }
      break;
    }
    case 'triangle': {
      points.push([0, hh], [-hw, -hh], [hw, -hh], [0, hh]);
      break;
    }
    case 'hexagon': {
      const r = Math.min(hw, hh);
      for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      break;
    }
    case 'pentagon': {
      const r = Math.min(hw, hh);
      for (let i = 0; i <= 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      break;
    }
    case 'irregular': {
      const raw: Array<[number, number]> = [
        [0.4 * hw, hh], [-0.3 * hw, 0.8 * hh], [-hw, 0.2 * hh],
        [-0.7 * hw, -0.6 * hh], [-0.1 * hw, -hh], [0.6 * hw, -0.7 * hh],
        [hw, 0.1 * hh], [0.8 * hw, 0.6 * hh], [0.4 * hw, hh],
      ];
      return raw;
    }
    default: {
      points.push([-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]);
    }
  }
  return points;
}
