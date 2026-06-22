import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PlayerInfo, KillEvent, RenderConfig } from './types';

const COLORS = {
  RED: 0xff3333,
  BLUE: 0x3377ff,
  GROUND: 0x2a2a35,
  GRID: 0x4a4a5a,
  GOLD: 0xffd700,
  HEATMAP: 0xff2222,
};

const MAX_TRAILS_PER_TEAM = 200;
const MAX_HEATMAP_MARKERS = 50;
const PLAYER_SPHERE_RADIUS = 0.3;
const GLOW_INTENSITY = 1.5;

interface PlayerObject {
  mesh: THREE.Mesh;
  glow: THREE.PointLight;
  trail: THREE.Mesh[];
  lastPosition: THREE.Vector3;
  isVisible: boolean;
  respawnTimer: number;
}

interface ShockwaveEffect {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}

interface HeatmapMarker {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private players: Map<string, PlayerObject> = new Map();
  private shockwaves: ShockwaveEffect[] = [];
  private heatmapMarkers: HeatmapMarker[] = [];
  private redTrails: THREE.Mesh[] = [];
  private blueTrails: THREE.Mesh[] = [];
  private renderConfig: RenderConfig;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 3;
    this.controls.minDistance = 7.5;
    this.controls.maxDistance = 30;
    this.controls.target.set(0, 0, 0);

    this.renderConfig = {
      showRedTeam: true,
      showBlueTeam: true,
      heatmapEnabled: false,
      currentTime: 0,
      isPlaying: false,
    };

    this.setupLighting();
    this.setupGround();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    this.scene.add(directionalLight);
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(45, 45);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.GROUND,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(45, 45, COLORS.GRID, COLORS.GRID);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    const borderGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(40, 0.1, 40));
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x666677 });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.y = 0.02;
    this.scene.add(border);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public initPlayers(players: PlayerInfo[]): void {
    players.forEach((player) => {
      const color = player.teamId === 'red' ? COLORS.RED : COLORS.BLUE;

      const sphereGeometry = new THREE.SphereGeometry(PLAYER_SPHERE_RADIUS, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: GLOW_INTENSITY,
        metalness: 0.5,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      mesh.castShadow = true;
      mesh.position.set(player.spawnPoint.x, PLAYER_SPHERE_RADIUS, player.spawnPoint.y);

      const glow = new THREE.PointLight(color, 1, 3);
      glow.position.copy(mesh.position);

      this.scene.add(mesh);
      this.scene.add(glow);

      this.players.set(player.id, {
        mesh,
        glow,
        trail: [],
        lastPosition: mesh.position.clone(),
        isVisible: true,
        respawnTimer: 0,
      });
    });
  }

  public updatePlayerPosition(playerId: string, x: number, y: number, _timestamp: number): void {
    const player = this.players.get(playerId);
    if (!player || !player.isVisible) return;

    const newPos = new THREE.Vector3(x, PLAYER_SPHERE_RADIUS, y);
    const distance = player.lastPosition.distanceTo(newPos);

    if (distance > 0.1) {
      this.addTrailSegment(player, player.lastPosition, newPos);
      player.lastPosition.copy(newPos);
    }

    player.mesh.position.copy(newPos);
    player.glow.position.copy(newPos);
  }

  private addTrailSegment(player: PlayerObject, start: THREE.Vector3, end: THREE.Vector3): void {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    if (length < 0.1) return;

    const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
    const playerData = this.getPlayerDataByMesh(player.mesh);
    const color = playerData?.teamId === 'red' ? COLORS.RED : COLORS.BLUE;

    const cylinderMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
    });

    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.copy(start).add(end).multiplyScalar(0.5);
    cylinder.position.y = 0.02;
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    this.scene.add(cylinder);

    const trails = playerData?.teamId === 'red' ? this.redTrails : this.blueTrails;
    trails.push(cylinder);

    if (trails.length > MAX_TRAILS_PER_TEAM) {
      const oldTrail = trails.shift();
      if (oldTrail) {
        this.scene.remove(oldTrail);
        oldTrail.geometry.dispose();
        (oldTrail.material as THREE.Material).dispose();
      }
    }
  }

  private getPlayerDataByMesh(mesh: THREE.Mesh): { teamId: 'red' | 'blue'; id: string } | null {
    for (const [id, player] of this.players) {
      if (player.mesh === mesh) {
        const teamId = id.startsWith('r') ? 'red' : 'blue';
        return { teamId, id };
      }
    }
    return null;
  }

  public showKillEffect(event: KillEvent): void {
    this.createShockwave(event.x, event.y);
    this.hidePlayerTemporarily(event.victimId);
    this.addHeatmapMarker(event.x, event.y);
  }

  private createShockwave(x: number, y: number): void {
    const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.GOLD,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.1, y);
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      startTime: performance.now(),
      duration: 1500,
    });
  }

  private hidePlayerTemporarily(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.isVisible = false;
    player.mesh.visible = false;
    player.glow.visible = false;
    player.respawnTimer = 500;
  }

  private addHeatmapMarker(x: number, y: number): void {
    if (!this.renderConfig.heatmapEnabled) return;

    const circleGeometry = new THREE.CircleGeometry(1.5, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.HEATMAP,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(x, 0.05, y);
    this.scene.add(circle);

    this.heatmapMarkers.push({
      mesh: circle,
      startTime: performance.now(),
      duration: 5000,
    });

    if (this.heatmapMarkers.length > MAX_HEATMAP_MARKERS) {
      const oldest = this.heatmapMarkers.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
        (oldest.mesh.material as THREE.Material).dispose();
      }
    }
  }

  private updateShockwaves(currentTime: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const shockwave = this.shockwaves[i];
      const elapsed = currentTime - shockwave.startTime;
      const progress = Math.min(elapsed / shockwave.duration, 1);

      const scale = 1 + progress * 4;
      shockwave.mesh.scale.setScalar(scale);
      (shockwave.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;

      if (progress >= 1) {
        this.scene.remove(shockwave.mesh);
        shockwave.mesh.geometry.dispose();
        (shockwave.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private updateHeatmapMarkers(currentTime: number): void {
    for (let i = this.heatmapMarkers.length - 1; i >= 0; i--) {
      const marker = this.heatmapMarkers[i];
      const elapsed = currentTime - marker.startTime;
      const progress = Math.min(elapsed / marker.duration, 1);

      (marker.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - progress);

      if (progress >= 1) {
        this.scene.remove(marker.mesh);
        marker.mesh.geometry.dispose();
        (marker.mesh.material as THREE.Material).dispose();
        this.heatmapMarkers.splice(i, 1);
      }
    }
  }

  private updatePlayerGlow(currentTime: number): void {
    const glowIntensity = 1 + Math.sin(currentTime * 0.004) * 0.5;
    this.players.forEach((player) => {
      if (player.isVisible) {
        (player.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          glowIntensity * GLOW_INTENSITY;
        player.glow.intensity = glowIntensity;
      }

      if (!player.isVisible && player.respawnTimer > 0) {
        player.respawnTimer -= 16;
        if (player.respawnTimer <= 0) {
          player.isVisible = true;
          player.mesh.visible = true;
          player.glow.visible = true;
        }
      }
    });
  }

  public setTeamVisibility(showRed: boolean, showBlue: boolean): void {
    this.renderConfig.showRedTeam = showRed;
    this.renderConfig.showBlueTeam = showBlue;

    this.players.forEach((player, id) => {
      const isRed = id.startsWith('r');
      const shouldShow = (isRed && showRed) || (!isRed && showBlue);
      if (player.isVisible) {
        player.mesh.visible = shouldShow;
        player.glow.visible = shouldShow;
      }
    });

    this.redTrails.forEach((trail) => {
      trail.visible = showRed;
    });
    this.blueTrails.forEach((trail) => {
      trail.visible = showBlue;
    });
  }

  public setHeatmapEnabled(enabled: boolean): void {
    this.renderConfig.heatmapEnabled = enabled;
    if (!enabled) {
      this.heatmapMarkers.forEach((marker) => {
        this.scene.remove(marker.mesh);
        marker.mesh.geometry.dispose();
        (marker.mesh.material as THREE.Material).dispose();
      });
      this.heatmapMarkers = [];
    }
  }

  public clearTrails(): void {
    [...this.redTrails, ...this.blueTrails].forEach((trail) => {
      this.scene.remove(trail);
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
    });
    this.redTrails = [];
    this.blueTrails = [];

    this.players.forEach((player) => {
      player.trail = [];
      player.lastPosition = player.mesh.position.clone();
    });
  }

  public resetPlayers(players: PlayerInfo[]): void {
    this.players.forEach((player) => {
      this.scene.remove(player.mesh);
      this.scene.remove(player.glow);
      player.mesh.geometry.dispose();
      (player.mesh.material as THREE.Material).dispose();
    });
    this.players.clear();
    this.clearTrails();
    this.initPlayers(players);
  }

  public startAnimationLoop(onStatsUpdate?: (stats: { fps: number }) => void): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      const fps = 1000 / deltaTime;
      this.lastTime = currentTime;

      this.controls.update();
      this.updateShockwaves(currentTime);
      this.updateHeatmapMarkers(currentTime);
      this.updatePlayerGlow(currentTime);

      this.renderer.render(this.scene, this.camera);

      onStatsUpdate?.({ fps });
    };

    animate();
  }

  public stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public dispose(): void {
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    this.players.forEach((player) => {
      player.mesh.geometry.dispose();
      (player.mesh.material as THREE.Material).dispose();
      this.scene.remove(player.mesh);
      this.scene.remove(player.glow);
    });

    [...this.redTrails, ...this.blueTrails].forEach((trail) => {
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
      this.scene.remove(trail);
    });

    this.shockwaves.forEach((sw) => {
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
      this.scene.remove(sw.mesh);
    });

    this.heatmapMarkers.forEach((hm) => {
      hm.mesh.geometry.dispose();
      (hm.mesh.material as THREE.Material).dispose();
      this.scene.remove(hm.mesh);
    });

    this.renderer.dispose();
  }
}
