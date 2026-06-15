import * as THREE from 'three';
import { BeatAnalyzer } from '../audio/BeatAnalyzer';
import { Player } from './Player';
import { ObstacleManager } from './ObstacleManager';
import type { IGameState, ISongConfig, IBeatData } from '../types';
import {
  SONGS,
  SCROLL_SPEED,
  COMBO_FEVER_THRESHOLD,
  MAX_PARTICLES,
  LANE_POSITIONS,
} from '../types';

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private player: Player;
  private obstacleManager: ObstacleManager;
  private beatAnalyzer: BeatAnalyzer;
  private state: IGameState;
  private clock: THREE.Clock;
  private songConfig: ISongConfig | null = null;
  private gridMesh: THREE.Mesh | null = null;
  private sideParticles: THREE.Points | null = null;
  private feverRing: THREE.Mesh | null = null;
  private environmentObjects: THREE.Object3D[] = [];
  private onStateChange?: (state: IGameState) => void;
  private onGameOver?: () => void;

  private groundMaterial: THREE.MeshStandardMaterial | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a1a, 15, 60);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 4, 6);
    this.camera.lookAt(0, 1, -10);

    this.player = new Player();
    this.obstacleManager = new ObstacleManager(this.scene);
    this.beatAnalyzer = new BeatAnalyzer();
    this.clock = new THREE.Clock(false);

    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hp: 100,
      maxHp: 100,
      isRunning: false,
      isGameOver: false,
      isComboFever: false,
      currentBeatIndex: -1,
      difficulty: 'normal',
    };

    this.setupLighting();
    this.setupEnvironment();
    this.setupResize();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x1a1a3e, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0xbf40ff, 2, 20);
    purpleLight.position.set(-5, 3, -5);
    this.scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x00e5ff, 2, 20);
    cyanLight.position.set(5, 3, -10);
    this.scene.add(cyanLight);
  }

  private setupEnvironment(): void {
    const groundGeo = new THREE.PlaneGeometry(10, 120, 20, 120);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: 0x1a0a2e,
      emissiveIntensity: 0.3,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, this.groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -50);
    this.scene.add(ground);
    this.gridMesh = ground;

    const laneLineMat = new THREE.MeshBasicMaterial({
      color: 0xbf40ff,
      transparent: true,
      opacity: 0.3,
    });
    for (let i = 0; i < 4; i++) {
      const x = -3.75 + i * 2.5;
      const lineGeo = new THREE.BoxGeometry(0.03, 0.01, 120);
      const line = new THREE.Mesh(lineGeo, laneLineMat.clone());
      line.position.set(x, 0.01, -50);
      this.scene.add(line);
      this.environmentObjects.push(line);
    }

    this.createSideParticles();
    this.scene.add(this.player.group);
  }

  private createSideParticles(): void {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const pColor1 = new THREE.Color(0xbf40ff);
    const pColor2 = new THREE.Color(0x00e5ff);

    for (let i = 0; i < count; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      positions[i * 3] = side * (4 + Math.random() * 3);
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = -Math.random() * 60;

      const t = Math.random();
      const c = pColor1.clone().lerp(pColor2, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sideParticles = new THREE.Points(geo, mat);
    this.scene.add(this.sideParticles);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setCallbacks(onStateChange: (state: IGameState) => void, onGameOver: () => void): void {
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  async startSong(songId: string, difficulty: 'normal' | 'hard'): Promise<void> {
    const song = SONGS.find(s => s.id === songId);
    if (!song) return;

    this.songConfig = song;
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hp: 100,
      maxHp: 100,
      isRunning: true,
      isGameOver: false,
      isComboFever: false,
      currentBeatIndex: -1,
      difficulty,
    };

    this.player.reset();
    this.obstacleManager.reset();

    const beats = await this.beatAnalyzer.analyzeSong(song);
    this.obstacleManager.setBeats(beats, difficulty);

    this.beatAnalyzer.playProceduralMusic(song, () => {
      this.gameWin();
    });

    this.clock = new THREE.Clock(true);
    this.state.isRunning = true;
  }

  private gameWin(): void {
    this.state.isRunning = false;
    this.onStateChange?.({ ...this.state });
  }

  handleInput(action: string): void {
    if (this.state.isGameOver || !this.state.isRunning) return;

    switch (action) {
      case 'jump':
        this.player.jump();
        break;
      case 'slide':
        this.player.slide();
        break;
      case 'left':
        this.player.moveLeft();
        break;
      case 'right':
        this.player.moveRight();
        break;
    }
  }

  update(): void {
    if (!this.state.isRunning || this.state.isGameOver) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const currentTime = this.beatAnalyzer.getCurrentTime();
    const speed = SCROLL_SPEED;

    this.player.update(delta, this.scene);

    const passedBeats = this.obstacleManager.update(currentTime, delta, speed);

    for (const beat of passedBeats) {
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const multiplier = this.state.isComboFever ? 2 : 1;
      this.state.score += Math.floor(beat.intensity * 100 * multiplier);

      if (this.state.combo >= COMBO_FEVER_THRESHOLD && !this.state.isComboFever) {
        this.state.isComboFever = true;
        this.createFeverRing();
      }
    }

    const playerHitbox = this.player.getHitbox();
    const collision = this.obstacleManager.checkCollision(playerHitbox);

    if (collision && !this.player.isDead) {
      this.player.explode(this.scene);
      this.state.hp = 0;
      this.state.isGameOver = true;
      this.state.isRunning = false;
      this.beatAnalyzer.stop();
      this.removeFeverRing();
      setTimeout(() => {
        this.onGameOver?.();
      }, 1500);
    }

    this.updateEnvironment(delta, currentTime);

    if (this.feverRing) {
      this.feverRing.rotation.y += delta * 3;
      this.feverRing.rotation.x += delta * 1.5;
      if (this.player.group.visible !== false) {
        this.feverRing.position.copy(this.player.group.position);
        this.feverRing.position.y += 1.5;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.onStateChange?.({ ...this.state });
  }

  private updateEnvironment(delta: number, currentTime: number): void {
    if (this.gridMesh) {
      const pulse = this.obstacleManager.getGridPulseIntensity();
      if (this.groundMaterial) {
        this.groundMaterial.emissiveIntensity = 0.3 + pulse * 0.8;
        this.groundMaterial.opacity = 0.6 + pulse * 0.2;
      }
    }

    if (this.sideParticles) {
      const positions = this.sideParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += SCROLL_SPEED * delta;
        if (positions[i + 2] > 10) {
          positions[i + 2] = -60 + Math.random() * 10;
          positions[i + 1] = Math.random() * 8;
        }
      }
      this.sideParticles.geometry.attributes.position.needsUpdate = true;

      const pulse = this.obstacleManager.getGridPulseIntensity();
      (this.sideParticles.material as THREE.PointsMaterial).opacity = 0.6 + pulse * 0.3;
    }

    if (this.state.isComboFever && this.scene.background) {
      const t = Date.now() * 0.002;
      const r = 0.04 + Math.sin(t) * 0.03;
      const g = 0.02 + Math.sin(t * 1.3) * 0.02;
      const b = 0.08 + Math.sin(t * 0.7) * 0.04;
      this.scene.background = new THREE.Color(r, g, b);
    }
  }

  private createFeverRing(): void {
    const geo = new THREE.TorusGeometry(1.5, 0.05, 8, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.feverRing = new THREE.Mesh(geo, mat);
    this.feverRing.position.copy(this.player.group.position);
    this.feverRing.position.y += 1.5;
    this.scene.add(this.feverRing);
  }

  private removeFeverRing(): void {
    if (this.feverRing) {
      this.scene.remove(this.feverRing);
      this.feverRing = null;
    }
  }

  getState(): IGameState {
    return { ...this.state };
  }

  reset(): void {
    this.beatAnalyzer.stop();
    this.obstacleManager.reset();
    this.player.reset();
    this.removeFeverRing();
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hp: 100,
      maxHp: 100,
      isRunning: false,
      isGameOver: false,
      isComboFever: false,
      currentBeatIndex: -1,
      difficulty: 'normal',
    };
    this.scene.background = null;
  }

  dispose(): void {
    this.beatAnalyzer.dispose();
    this.renderer.dispose();
  }
}
