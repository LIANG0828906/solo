import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { TerrainModel, FaultType } from './terrainModel';
import { FaultAnimator } from './faultController';
import { UIPanel } from './uiPanel';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private fxaaPass: ShaderPass;

  private terrain: TerrainModel;
  private faultAnimator: FaultAnimator;
  private uiPanel: UIPanel;

  private clock: THREE.Clock;
  private lastTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 0;
  private currentFPS = 0;

  constructor() {
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.composer = this.createPostProcessing();
    this.bloomPass = this.createBloomPass();
    this.fxaaPass = this.createFXAAPass();
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.fxaaPass);

    this.setupLighting();
    this.setupGround();

    this.terrain = new TerrainModel(30, 5000);
    this.scene.add(this.terrain.group);

    this.faultAnimator = new FaultAnimator(this.terrain);
    this.faultAnimator.initSliceView(document.getElementById('slice-canvas') as HTMLCanvasElement);

    this.uiPanel = new UIPanel({
      onFaultSelect: (type: FaultType) => this.handleFaultSelect(type),
      onDipChange: (v: number) => this.faultAnimator.setDipAngle(v),
      onDisplacementChange: (v: number) => this.faultAnimator.setDisplacement(v),
      onSlipSpeedChange: (v: number) => this.faultAnimator.setSlipSpeed(v)
    });

    this.bindWindowEvents();
    this.start();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a120a);
    scene.fog = new THREE.Fog(0x1a120a, 18, 40);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(8, 5, 10);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0, 0);
    return controls;
  }

  private createPostProcessing(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);
    return composer;
  }

  private createBloomPass(): UnrealBloomPass {
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,
      0.4,
      0.85
    );
    return bloom;
  }

  private createFXAAPass(): ShaderPass {
    const pass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    pass.material.uniforms['resolution'].value.set(
      1 / (window.innerWidth * pixelRatio),
      1 / (window.innerHeight * pixelRatio)
    );
    return pass;
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x5a4a30, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xe8c88a, 0x3a2d1e, 0.35);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe0b0, 1.1);
    keyLight.position.set(6, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb09070, 0.45);
    fillLight.position.set(-5, 4, -6);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffaa66, 0.6, 30);
    rimLight.position.set(-3, 2, 6);
    this.scene.add(rimLight);
  }

  private setupGround(): void {
    const groundGeo = new THREE.CircleGeometry(25, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a1e12,
      roughness: 0.95,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(20, 20, 0x4a3a25, 0x352a1a);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    gridHelper.position.y = -3.19;
    this.scene.add(gridHelper);
  }

  private handleFaultSelect(type: FaultType): void {
    this.faultAnimator.triggerFault(type);
  }

  private bindWindowEvents(): void {
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (window.innerWidth * pixelRatio),
      1 / (window.innerHeight * pixelRatio)
    );
    this.bloomPass.resolution.set(window.innerWidth, window.innerHeight);
  }

  private updateFPS(dt: number): void {
    this.frameCount++;
    this.fpsUpdateInterval += dt;
    if (this.fpsUpdateInterval >= 0.5) {
      this.currentFPS = this.frameCount / this.fpsUpdateInterval;
      this.uiPanel.updateFPS(this.currentFPS);
      this.frameCount = 0;
      this.fpsUpdateInterval = 0;
    }
  }

  private start(): void {
    this.lastTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);

      const now = performance.now();
      let dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      dt = Math.min(dt, 0.05);

      this.updateFPS(dt);

      this.controls.update();
      this.terrain.update(dt);
      this.faultAnimator.update(dt);
      this.faultAnimator.updateSliceView();
      this.uiPanel.update(dt);

      this.composer.render();
    };
    animate();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
