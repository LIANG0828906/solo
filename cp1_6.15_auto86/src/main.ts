import * as THREE from 'three';
import { CONFIG, GameState, RaceRanking, eventEmitter } from './types';
import { Circuit } from './Circuit';
import { PlayerShip } from './PlayerShip';
import { AIShip } from './AIShip';
import { Physics } from './Physics';
import { GameUI } from './GameUI';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  private circuit: Circuit;
  private playerShip: PlayerShip;
  private aiShips: AIShip[] = [];
  private physics: Physics;
  private gameUI: GameUI;
  
  private gameState: GameState = 'intro';
  private introTimer: number = 0;
  private countdownTimer: number = CONFIG.COUNTDOWN_TIME;
  private raceTime: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  
  private lastPlayerProgress: number = 0;
  private lastAIProgresses: number[] = [];
  
  private introCameraAngle: number = 0;
  private introCameraHeight: number = 80;
  private raceFinished: boolean = false;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0f0a);
    this.scene.fog = new THREE.Fog(0x1a0f0a, 100, 400);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.scene.userData.camera = this.camera;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.setupLighting();
    
    this.circuit = new Circuit(this.scene);
    this.circuit.generate();
    
    this.playerShip = new PlayerShip(this.scene);
    this.physics = new Physics(this.scene);
    this.gameUI = new GameUI();
    
    const trackCurve = this.circuit.getTrackCurve();
    for (let i = 0; i < CONFIG.AI_COUNT; i++) {
      this.aiShips.push(new AIShip(this.scene, i, trackCurve));
      this.lastAIProgresses.push(0);
    }
    
    this.spawnShips();
    
    window.addEventListener('resize', () => this.onResize());
    
    eventEmitter.on('restart', () => this.restart());
    
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    this.scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3E2723, 0.3);
    this.scene.add(hemisphereLight);
  }

  private spawnShips(): void {
    const startPos = this.circuit.getStartLinePosition();
    const startDir = this.circuit.getStartLineDirection();
    
    this.playerShip.spawn(startPos, startDir);
    
    const tangent = startDir.clone();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    const laneOffsets = [-5, 0, 5];
    this.aiShips.forEach((ai, index) => {
      const offsetPos = startPos.clone().add(normal.clone().multiplyScalar(laneOffsets[index]));
      ai.spawn(offsetPos, startDir, laneOffsets[index] * 0.5);
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.frameCount++;
    
    this.update(dt);
    this.render();
  }

  private update(dt: number): void {
    this.circuit.update(dt);
    
    switch (this.gameState) {
      case 'intro':
        this.updateIntro(dt);
        break;
      case 'countdown':
        this.updateCountdown(dt);
        break;
      case 'racing':
        this.updateRacing(dt);
        break;
      case 'finished':
        this.updateFinished(dt);
        break;
    }
  }

  private updateIntro(dt: number): void {
    this.introTimer += dt;
    this.introCameraAngle += dt * 0.5;
    
    const radius = CONFIG.TRACK_PERIMETER / (2 * Math.PI) + 30;
    const targetX = Math.cos(this.introCameraAngle) * radius;
    const targetZ = Math.sin(this.introCameraAngle) * radius;
    
    this.introCameraHeight = THREE.MathUtils.lerp(this.introCameraHeight, 30, dt * 0.5);
    
    const targetPos = new THREE.Vector3(targetX, this.introCameraHeight, targetZ);
    this.camera.position.lerp(targetPos, dt * 2);
    
    const lookAtPoint = this.circuit.getStartLinePosition();
    lookAtPoint.y = 0;
    this.camera.lookAt(lookAtPoint);
    
    if (this.introTimer >= CONFIG.INTRO_DURATION) {
      this.gameState = 'countdown';
      this.countdownTimer = CONFIG.COUNTDOWN_TIME;
      eventEmitter.emit('countdownTick', { count: Math.ceil(this.countdownTimer) });
    }
  }

  private updateCountdown(dt: number): void {
    this.countdownTimer -= dt;
    
    const currentCount = Math.ceil(this.countdownTimer);
    if (currentCount !== Math.ceil(this.countdownTimer + dt) && currentCount > 0) {
      eventEmitter.emit('countdownTick', { count: currentCount });
    }
    
    this.updateCameraFollow(dt * 0.5);
    
    if (this.countdownTimer <= 0) {
      this.gameState = 'racing';
      eventEmitter.emit('countdownTick', { count: 0 });
      this.raceTime = 0;
    }
  }

  private updateRacing(dt: number): void {
    this.raceTime += dt;
    
    const playerPos = this.playerShip.getPosition();
    const isOnTrack = this.circuit.isOnTrack(playerPos);
    const trackHeight = this.circuit.getTrackHeightAt(playerPos);
    
    this.playerShip.update(dt, isOnTrack, trackHeight);
    
    const playerSpeed = this.playerShip.getSpeed();
    const obstacles = this.circuit.getObstacles();
    
    this.aiShips.forEach((ai) => {
      const aiPos = ai.getPosition();
      const aiOnTrack = this.circuit.isOnTrack(aiPos);
      const aiTrackHeight = this.circuit.getTrackHeightAt(aiPos);
      ai.update(dt, playerPos, playerSpeed, aiOnTrack, aiTrackHeight, obstacles);
    });
    
    this.checkCollisions();
    this.checkEnergyCollections();
    this.updateProgress();
    this.checkLapCompletions();
    this.updateCameraFollow(dt);
    this.updateHUD();
    
    if (!this.raceFinished && this.playerShip.getState().lap >= CONFIG.TOTAL_LAPS) {
      this.finishRace();
    }
  }

  private updateFinished(dt: number): void {
    this.updateCameraFollow(dt);
    
    const playerPos = this.playerShip.getPosition();
    const isOnTrack = this.circuit.isOnTrack(playerPos);
    const trackHeight = this.circuit.getTrackHeightAt(playerPos);
    this.playerShip.update(dt, isOnTrack, trackHeight);
    
    const playerSpeed = this.playerShip.getSpeed();
    const obstacles = this.circuit.getObstacles();
    
    this.aiShips.forEach((ai) => {
      const aiPos = ai.getPosition();
      const aiOnTrack = this.circuit.isOnTrack(aiPos);
      const aiTrackHeight = this.circuit.getTrackHeightAt(aiPos);
      ai.update(dt, playerPos, playerSpeed, aiOnTrack, aiTrackHeight, obstacles);
    });
  }

  private checkCollisions(): void {
    const obstacles = this.circuit.getObstacles();
    
    const playerCollision = this.physics.checkShipObstacleCollision(this.playerShip, obstacles);
    if (playerCollision.collided) {
      this.playerShip.applyCollision(playerCollision.normal, playerCollision.impactSpeed);
    }
    
    this.aiShips.forEach(ai => {
      const aiCollision = this.physics.checkShipObstacleCollision(ai, obstacles);
      if (aiCollision.collided) {
        ai.applyCollision(aiCollision.normal, aiCollision.impactSpeed);
      }
    });
  }

  private checkEnergyCollections(): void {
    const energyRings = this.circuit.getEnergyRings();
    
    const playerRing = this.physics.checkEnergyRingCollection(this.playerShip, energyRings);
    if (playerRing) {
      this.playerShip.collectEnergy();
      this.physics.collectEnergyRing(playerRing, this.playerShip.getPosition());
    }
    
    this.aiShips.forEach(ai => {
      const aiRing = this.physics.checkEnergyRingCollection(ai, energyRings);
      if (aiRing) {
        ai.collectEnergy();
        aiRing.collected = true;
        aiRing.mesh.visible = false;
      }
    });
  }

  private updateProgress(): void {
    const playerPos = this.playerShip.getPosition();
    const playerProgress = this.circuit.getProgressOnTrack(playerPos);
    this.playerShip.setProgress(playerProgress);
    this.playerShip.setTotalTime(this.raceTime);
    
    this.aiShips.forEach((ai) => {
      const aiPos = ai.getPosition();
      const aiProgress = this.circuit.getProgressOnTrack(aiPos);
      ai.setProgress(aiProgress);
      ai.setTotalTime(this.raceTime);
    });
  }

  private checkLapCompletions(): void {
    const playerState = this.playerShip.getState();
    if (this.physics.checkLapCompletion(playerState.progress, this.lastPlayerProgress)) {
      const newLap = playerState.lap + 1;
      this.playerShip.setLap(newLap);
      eventEmitter.emit('lapComplete', { lap: newLap });
      
      if (newLap >= CONFIG.TOTAL_LAPS) {
        this.finishRace();
      }
    }
    this.lastPlayerProgress = playerState.progress;
    
    this.aiShips.forEach((ai, index) => {
      const aiState = ai.getState();
      if (this.physics.checkLapCompletion(aiState.progress, this.lastAIProgresses[index])) {
        ai.setLap(aiState.lap + 1);
      }
      this.lastAIProgresses[index] = aiState.progress;
    });
  }

  private finishRace(): void {
    if (this.raceFinished) return;
    this.raceFinished = true;
    this.gameState = 'finished';
    
    const ranking = this.getCurrentRanking();
    const playerWon = ranking[0].isPlayer;
    
    eventEmitter.emit('raceComplete', { ranking, playerWon });
  }

  private getCurrentRanking(): RaceRanking[] {
    const playerState = this.playerShip.getState();
    const aiStates = this.aiShips.map(ai => ({
      name: ai.getName(),
      lap: ai.getState().lap,
      progress: ai.getState().progress,
      totalTime: ai.getState().totalTime,
      isPlayer: false,
      color: ai.getColor(),
    }));
    
    return this.physics.calculateRanking(playerState, aiStates);
  }

  private updateCameraFollow(dt: number): void {
    const shipPos = this.playerShip.getPosition();
    const shipRotation = this.playerShip.getRotation();
    
    const cameraDistance = 12;
    const cameraHeight = 6;
    
    const backDir = new THREE.Vector3(
      Math.sin(shipRotation.y),
      0,
      Math.cos(shipRotation.y)
    );
    
    const targetPos = new THREE.Vector3(
      shipPos.x + backDir.x * cameraDistance,
      shipPos.y + cameraHeight,
      shipPos.z + backDir.z * cameraDistance
    );
    
    this.camera.position.lerp(targetPos, dt * 3);
    
    const lookAtPos = shipPos.clone();
    lookAtPos.y += 2;
    this.camera.lookAt(lookAtPos);
  }

  private updateHUD(): void {
    const playerState = this.playerShip.getState();
    const ranking = this.getCurrentRanking();
    
    this.gameUI.updateHUD({
      speed: playerState.speed,
      energy: playerState.energy,
      lap: Math.min(playerState.lap + 1, CONFIG.TOTAL_LAPS),
      totalLaps: CONFIG.TOTAL_LAPS,
      time: this.raceTime,
      ranking,
    });
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private restart(): void {
    this.gameState = 'intro';
    this.introTimer = 0;
    this.countdownTimer = CONFIG.COUNTDOWN_TIME;
    this.raceTime = 0;
    this.raceFinished = false;
    this.lastPlayerProgress = 0;
    this.lastAIProgresses = this.lastAIProgresses.map(() => 0);
    this.introCameraAngle = 0;
    this.introCameraHeight = 80;
    
    this.playerShip.reset();
    this.aiShips.forEach(ai => ai.reset());
    
    this.circuit.resetEnergyRings();
    
    const trackCurve = this.circuit.getTrackCurve();
    this.aiShips.forEach(ai => ai.setTrackCurve(trackCurve));
    
    this.spawnShips();
    this.gameUI.reset();
  }

  dispose(): void {
    this.physics.dispose();
    this.gameUI.dispose();
    this.playerShip.removeFromScene();
    this.aiShips.forEach(ai => ai.removeFromScene());
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
