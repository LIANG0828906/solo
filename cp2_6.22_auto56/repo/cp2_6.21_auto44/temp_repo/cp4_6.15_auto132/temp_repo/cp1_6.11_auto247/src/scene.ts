import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly controls: OrbitControls;
  public readonly container: HTMLElement;

  private _frameId: number = 0;
  private _lastTime: number = 0;
  private _fpsCounter: HTMLElement | null;
  private _fpsFrames: number = 0;
  private _fpsLastUpdate: number = 0;

  private _onUpdateCallbacks: Array<(dt: number) => void> = [];

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4A4A4A);
    this.scene.fog = new THREE.Fog(0x4A4A4A, 600, 1400);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      5000
    );
    this.camera.position.set(0, 220, 340);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 150;
    this.controls.maxDistance = 800;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 0, 0);

    this._fpsCounter = document.getElementById('fps-counter');

    this._buildWorkshop();
    this._setupLights();

    window.addEventListener('resize', this._onResize.bind(this));
  }

  public onUpdate(cb: (dt: number) => void): void {
    this._onUpdateCallbacks.push(cb);
  }

  public start(): void {
    this._lastTime = performance.now();
    this._fpsLastUpdate = this._lastTime;
    this._animate();
  }

  public stop(): void {
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = 0;
    }
    window.removeEventListener('resize', this._onResize.bind(this));
    this.renderer.dispose();
  }

  private _animate(): void {
    this._frameId = requestAnimationFrame(this._animate.bind(this));
    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    this.controls.update();

    for (const cb of this._onUpdateCallbacks) {
      cb(dt);
    }

    this.renderer.render(this.scene, this.camera);

    this._fpsFrames++;
    if (now - this._fpsLastUpdate >= 500) {
      const fps = Math.round((this._fpsFrames * 1000) / (now - this._fpsLastUpdate));
      if (this._fpsCounter) {
        this._fpsCounter.textContent = `FPS: ${fps}`;
      }
      this._fpsFrames = 0;
      this._fpsLastUpdate = now;
    }
  }

  private _onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private _setupLights(): void {
    const ambient = new THREE.AmbientLight(0x4a3a2a, 0.55);
    this.scene.add(ambient);

    const keyLight = new THREE.SpotLight(0xffcc88, 2.2, 0, Math.PI / 5, 0.4, 1.2);
    keyLight.position.set(0, 360, 120);
    keyLight.target.position.set(0, 0, 0);
    this.scene.add(keyLight);
    this.scene.add(keyLight.target);

    const rimLight = new THREE.DirectionalLight(0xffaa66, 0.5);
    rimLight.position.set(-200, 180, -160);
    this.scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xff7733, 0.8, 300, 2);
    fillLight.position.set(220, 120, 80);
    this.scene.add(fillLight);
  }

  private _buildWorkshop(): void {
    const floorGeom = new THREE.PlaneGeometry(1200, 1200, 1, 1);
    const floorMat = new THREE.MeshLambertMaterial({
      color: 0x6b5236,
      flatShading: true
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    this.scene.add(floor);

    const pitRadius = 150;
    const pitGeom = new THREE.CylinderGeometry(pitRadius, pitRadius * 0.85, 60, 48, 1, true);
    const pitMat = new THREE.MeshLambertMaterial({
      color: 0x5a3a1a,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const pit = new THREE.Mesh(pitGeom, pitMat);
    pit.position.y = -30;
    this.scene.add(pit);

    const pitBottomGeom = new THREE.CircleGeometry(pitRadius * 0.85, 48);
    const pitBottomMat = new THREE.MeshLambertMaterial({ color: 0x4a2a10 });
    const pitBottom = new THREE.Mesh(pitBottomGeom, pitBottomMat);
    pitBottom.rotation.x = -Math.PI / 2;
    pitBottom.position.y = -59.9;
    this.scene.add(pitBottom);

    this._buildWalls();
    this._buildRoof();
    this._buildFurnace();
    this._buildPitMold(pitRadius);
  }

  private _buildWalls(): void {
    const wallMat = new THREE.MeshLambertMaterial({
      color: 0xA08050,
      flatShading: true
    });
    const wallHeight = 250;
    const wallThickness = 16;
    const sideLen = 700;

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(sideLen, wallHeight, wallThickness),
      wallMat
    );
    backWall.position.set(0, wallHeight / 2, -sideLen / 2);
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, sideLen),
      wallMat
    );
    leftWall.position.set(-sideLen / 2, wallHeight / 2, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, sideLen),
      wallMat
    );
    rightWall.position.set(sideLen / 2, wallHeight / 2, 0);
    this.scene.add(rightWall);
  }

  private _buildRoof(): void {
    const roofMat = new THREE.MeshLambertMaterial({
      color: 0x808080,
      flatShading: true
    });
    const roofGeom = new THREE.ConeGeometry(540, 160, 4);
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 250 + 80;
    roof.rotation.y = Math.PI / 4;
    this.scene.add(roof);
  }

  private _buildFurnace(): void {
    const furnaceGroup = new THREE.Group();
    furnaceGroup.position.set(260, 0, 120);

    const baseGeom = new THREE.CylinderGeometry(55, 70, 40, 24);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    furnaceGroup.add(new THREE.Mesh(baseGeom, baseMat));

    const bodyGeom = new THREE.CylinderGeometry(42, 55, 130, 24);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 85;
    furnaceGroup.add(body);

    const chimneyGeom = new THREE.CylinderGeometry(26, 38, 90, 20);
    const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1a });
    const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
    chimney.position.y = 195;
    furnaceGroup.add(chimney);

    const openingGeom = new THREE.PlaneGeometry(34, 40);
    const openingMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const opening = new THREE.Mesh(openingGeom, openingMat);
    opening.position.set(0, 70, 54);
    furnaceGroup.add(opening);

    const glowLight = new THREE.PointLight(0xff5522, 1.6, 260, 2);
    glowLight.position.set(0, 170, 0);
    furnaceGroup.add(glowLight);

    furnaceGroup.userData.furnaceTopPos = new THREE.Vector3(260, 290, 120);
    furnaceGroup.userData.furnaceGlow = glowLight;

    this.scene.add(furnaceGroup);
    this.scene.userData.furnaceGroup = furnaceGroup;
  }

  private _buildPitMold(pitRadius: number): void {
    const moldGroup = new THREE.Group();
    moldGroup.position.y = -5;

    const outerGeom = new THREE.CylinderGeometry(pitRadius * 0.55, pitRadius * 0.65, 55, 28);
    const outerMat = new THREE.MeshLambertMaterial({ color: 0x7a4a1a });
    const outer = new THREE.Mesh(outerGeom, outerMat);
    outer.position.y = 27;
    moldGroup.add(outer);

    this.scene.add(moldGroup);
    this.scene.userData.moldBase = moldGroup;
  }
}
