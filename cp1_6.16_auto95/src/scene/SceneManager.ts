import * as THREE from 'three';
import { AccordionModel } from './AccordionModel';
import { ParticleSystem } from './ParticleSystem';
import { AudioEngine } from '../interaction/AudioEngine';
import { PlayerModule } from '../interaction/PlayerModule';
import { useAppStore } from '../store/AppState';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private clock = new THREE.Clock();
  private accordion: AccordionModel;
  private particleSystem: ParticleSystem;
  private audioEngine: AudioEngine;
  private player: PlayerModule;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private prevHovered: THREE.Mesh | null = null;
  private prevHoveredNote: number | null = null;
  private isDragging = false;
  private draggedNote: number | null = null;
  private cameraAngle = 0;
  private cameraRadius = 10;
  private cameraHeight = 3;
  private targetCameraAngle = 0;
  private frameCount = 0;
  private fpsTimer = 0;
  private noteVisualMap = new Map<THREE.Object3D, number>();
  private spotLight!: THREE.SpotLight;
  private ambientGlow: THREE.Mesh | null = null;

  constructor(container: HTMLElement, audioEngine: AudioEngine, player: PlayerModule) {
    this.container = container;
    this.audioEngine = audioEngine;
    this.player = player;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3e2723);
    this.scene.fog = new THREE.FogExp2(0x3e2723, 0.055);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.accordion = new AccordionModel();
    this.scene.add(this.accordion.group);

    this.particleSystem = new ParticleSystem(audioEngine, this.accordion);
    this.scene.add(this.particleSystem.getGroup());

    this.setupLights();
    this.setupGround();
    this.setupBackground();
    this.buildNoteVisualMap();
    this.bindInteractionEvents();
    window.addEventListener('resize', this.handleResize);
  }

  private buildNoteVisualMap() {
    const meshes = this.accordion.getAllKeyMeshes();
    const allKeys = this.accordion['keys'] as any[];
    allKeys.forEach((k) => {
      this.noteVisualMap.set(k.mesh, k.noteIndex);
    });
    void meshes;
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x8b6f47, 0.45);
    this.scene.add(ambient);

    this.spotLight = new THREE.SpotLight(0xffcc66, 3.5, 25, Math.PI / 5, 0.4, 1.2);
    this.spotLight.position.set(0, 8, 4);
    this.spotLight.target = this.accordion.group;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 1;
    this.spotLight.shadow.camera.far = 30;
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    const spotLeft = new THREE.SpotLight(0xff8844, 1.5, 20, Math.PI / 4.5, 0.5, 1);
    spotLeft.position.set(-5, 5, 3);
    spotLeft.target = this.accordion.group;
    this.scene.add(spotLeft);

    const spotRight = new THREE.SpotLight(0xffaa44, 1.5, 20, Math.PI / 4.5, 0.5, 1);
    spotRight.position.set(5, 5, 3);
    spotRight.target = this.accordion.group;
    this.scene.add(spotRight);

    const fill = new THREE.DirectionalLight(0x66aaff, 0.25);
    fill.position.set(0, 3, -5);
    this.scene.add(fill);

    const rimLight = new THREE.PointLight(0xffdd99, 1.2, 15);
    rimLight.position.set(0, 2, -3);
    this.scene.add(rimLight);
  }

  private setupGround() {
    const groundGeo = new THREE.CircleGeometry(20, 64);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d')!;
    const grad = gctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, '#5d4037');
    grad.addColorStop(0.5, '#4e342e');
    grad.addColorStop(1, '#3e2723');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 200; i++) {
      gctx.strokeStyle = `rgba(${25 + Math.random() * 20}, ${18 + Math.random() * 15}, ${12 + Math.random() * 10}, ${0.08 + Math.random() * 0.12})`;
      gctx.lineWidth = 1 + Math.random() * 2;
      gctx.beginPath();
      const y = Math.random() * 512;
      gctx.moveTo(0, y);
      for (let x = 0; x < 512; x += 10) {
        gctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 4);
      }
      gctx.stroke();
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.6;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const spotCanvas = document.createElement('canvas');
    spotCanvas.width = 256;
    spotCanvas.height = 256;
    const sctx = spotCanvas.getContext('2d')!;
    const sgrad = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sgrad.addColorStop(0, 'rgba(255, 200, 100, 0.35)');
    sgrad.addColorStop(0.5, 'rgba(255, 160, 60, 0.15)');
    sgrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 256, 256);
    const spotTex = new THREE.CanvasTexture(spotCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: spotTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.ambientGlow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), glowMat);
    this.ambientGlow.rotation.x = -Math.PI / 2;
    this.ambientGlow.position.y = -2.59;
    this.scene.add(this.ambientGlow);
  }

  private setupBackground() {
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 200;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 25 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5 + 0.2;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) * 0.6 + 2;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const warm = Math.random();
      starCol[i * 3] = 0.8 + warm * 0.2;
      starCol[i * 3 + 1] = 0.6 + warm * 0.15;
      starCol[i * 3 + 2] = 0.4 + warm * 0.1;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(stars);
  }

  private updateCameraPosition() {
    this.cameraAngle += (this.targetCameraAngle - this.cameraAngle) * 0.05;
    const x = Math.sin(this.cameraAngle) * this.cameraRadius;
    const z = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 0, 0);
  }

  private handleResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private bindInteractionEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.targetCameraAngle = (e.clientX / window.innerWidth - 0.5) * 0.3;
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.handleClick(e);
    });

    canvas.addEventListener('pointerup', () => {
      this.isDragging = false;
      if (this.draggedNote !== null) {
        this.player.handleKeyPressEnd(this.draggedNote);
        this.draggedNote = null;
      }
    });

    canvas.addEventListener('pointerleave', () => {
      this.isDragging = false;
      if (this.draggedNote !== null) {
        this.player.handleKeyPressEnd(this.draggedNote);
        this.draggedNote = null;
      }
      if (this.prevHoveredNote !== null) {
        this.player.handleKeyHover(null);
        this.prevHoveredNote = null;
      }
    });
  }

  private handleClick(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const keys = this.accordion.getAllKeyMeshes();
    const hits = this.raycaster.intersectObjects(keys, false);

    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object;
      let noteIndex: number | undefined;
      while (obj) {
        noteIndex = this.noteVisualMap.get(obj);
        if (noteIndex !== undefined) break;
        obj = obj.parent;
      }
      if (noteIndex !== undefined) {
        this.draggedNote = noteIndex;
        this.player.handleKeyPressStart(noteIndex);
      }
    }
  }

  private updateHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const keys = this.accordion.getAllKeyMeshes();
    const hits = this.raycaster.intersectObjects(keys, false);

    let hoveredNote: number | null = null;
    let hoveredMesh: THREE.Mesh | null = null;

    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj) {
        const idx = this.noteVisualMap.get(obj);
        if (idx !== undefined) {
          hoveredNote = idx;
          hoveredMesh = obj as THREE.Mesh;
          break;
        }
        obj = obj.parent;
      }
    }

    if (hoveredNote !== this.prevHoveredNote) {
      this.player.handleKeyHover(hoveredNote);
      this.prevHoveredNote = hoveredNote;
      this.prevHovered = hoveredMesh;
    }

    if (this.isDragging && this.draggedNote !== null) {
      if (hoveredNote !== null && hoveredNote !== this.draggedNote) {
        this.player.handleKeyPressEnd(this.draggedNote);
        this.draggedNote = hoveredNote;
        this.player.handleKeyPressStart(hoveredNote);
      }
    }
  }

  start() {
    this.animate();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const state = useAppStore.getState();

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      const fps = this.frameCount / this.fpsTimer;
      useAppStore.getState().addFpsSample(fps);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.updateCameraPosition();
    this.updateHover();
    state.updateBellows(dt);
    this.accordion.updateBellowsFolds(state.bellowsExpansion);
    this.accordion.updateKeyStates(this.player.getHoveredKey());

    if (state.playMode === 'auto') {
      const progress = this.player.getCurrentMelodyProgress();
      this.accordion.updateMelodyPathProgress(progress);
    }

    this.particleSystem.update(dt);

    const amp = this.audioEngine.getAverageAmplitude();
    if (this.spotLight) {
      this.spotLight.intensity = 3.2 + amp * 2.5;
      this.spotLight.color.setHSL(0.08, 0.8, 0.55 + amp * 0.15);
    }
    if (this.ambientGlow) {
      const glowMat = this.ambientGlow.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.7 + amp * 0.6;
      this.ambientGlow.scale.setScalar(1 + amp * 0.3);
    }

    this.renderer.render(this.scene, this.camera);
  };

  getAccordion(): AccordionModel {
    return this.accordion;
  }

  getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  setMelodyPath(points: { x: number; y: number; z: number }[]) {
    this.accordion.setMelodyPath(points);
  }

  clearMelodyPath() {
    this.accordion.clearMelodyPath();
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
