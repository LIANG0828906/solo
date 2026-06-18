import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  private defaultCameraPos = new THREE.Vector3(0, 20, 35);
  private defaultCameraTarget = new THREE.Vector3(0, 0, 0);

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A1A);
    this.scene.fog = new THREE.FogExp2(0x0A0A1A, 0.008);

    const w = 800;
    const h = 600;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.target.copy(this.defaultCameraTarget);

    this.addLights();
    this.addBoundary();
    this.addStars();
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0x2a2040, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    const hemi = new THREE.HemisphereLight(0x6C5CE7, 0x1A0A2E, 0.3);
    this.scene.add(hemi);
  }

  private addBoundary(): void {
    const size = 30;
    const geo = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: 0x6C5CE7,
      transparent: true,
      opacity: 0.2,
    });
    const lines = new THREE.LineSegments(edges, mat);
    this.scene.add(lines);
    geo.dispose();
  }

  private addStars(): void {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
  }

  resetView(): void {
    this.camera.position.copy(this.defaultCameraPos);
    this.controls.target.copy(this.defaultCameraTarget);
    this.controls.update();
  }

  update(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
