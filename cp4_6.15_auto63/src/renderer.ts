import * as THREE from 'three';
import { state, CELL_SIZE, MAZE_SIZE, TOTAL_BADGES } from './state';
import { events } from './events';

const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.15;
const PLAYER_EYE_HEIGHT = 1.6;

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class MazeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private walls: THREE.Mesh[] = [];
  private wallEdges: { mesh: THREE.LineSegments; cellX: number; cellZ: number; side: string }[] = [];
  private badges: { mesh: THREE.Group; badgeId: number; collected: boolean }[] = [];
  private particles: Particle[] = [];
  private floor!: THREE.Mesh;
  private exitRing!: THREE.Mesh;
  private exitRingScale = 0;
  private bobOffset = 0;
  private bobSpeed = 8;
  private bobAmount = 0.04;
  private transitionProgress = 0;
  private transitionTarget = 0;
  private transitionMode: 'none' | 'out' | 'in' = 'none';
  private collisionCells: Set<string> = new Set();
  private cornerLights: THREE.PointLight[] = [];
  private badgePanel: HTMLElement;
  private badgeIcons: HTMLElement[] = [];
  private exitButton: HTMLElement;
  private resultPanel: HTMLElement;
  private fadeOverlay: HTMLElement;
  private startHint: HTMLElement;
  private collectedCount = 0;
  private audioContext: AudioContext | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1f);
    this.scene.fog = new THREE.Fog(0x0a0a1f, 8, 25);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(
      CELL_SIZE / 2,
      PLAYER_EYE_HEIGHT,
      CELL_SIZE / 2
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.badgePanel = document.getElementById('badge-icons')!;
    this.exitButton = document.getElementById('exit-button')!;
    this.resultPanel = document.getElementById('result-panel')!;
    this.fadeOverlay = document.getElementById('fade-overlay')!;
    this.startHint = document.getElementById('start-hint')!;

    this.setupLights();
    this.createFloor();
    this.createMaze();
    this.createBadges();
    this.createExitRing();
    this.setupBadgeUI();
    this.setupEventListeners();
    this.setupResize();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0x8866cc, 0x222244, 0.4);
    this.scene.add(hemisphere);

    const directional = new THREE.DirectionalLight(0xffffff, 0.3);
    directional.position.set(10, 20, 10);
    this.scene.add(directional);
  }

  private createFloor(): void {
    const size = MAZE_SIZE * CELL_SIZE;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.9,
      metalness: 0.1
    });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(size / 2, 0, size / 2);
    this.scene.add(this.floor);

    const gridHelper = new THREE.GridHelper(size, MAZE_SIZE, 0x444466, 0x333355);
    gridHelper.position.set(size / 2, 0.01, size / 2);
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);
  }

  private createMaze(): void {
    const gameState = state.getState();
    const maze = gameState.maze;

    for (let z = 0; z < MAZE_SIZE; z++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        const cell = maze[z][x];
        const baseX = x * CELL_SIZE;
        const baseZ = z * CELL_SIZE;

        const colorMix = (x + z) / (MAZE_SIZE * 2);
        const wallColor = this.lerpColor(0xff00aa, 0x3344ff, colorMix);

        if (cell.walls.north) {
          this.createWall(
            baseX + CELL_SIZE / 2,
            baseZ,
            CELL_SIZE,
            WALL_THICKNESS,
            wallColor,
            x,
            z,
            'north'
          );
        }
        if (cell.walls.south) {
          this.createWall(
            baseX + CELL_SIZE / 2,
            baseZ + CELL_SIZE,
            CELL_SIZE,
            WALL_THICKNESS,
            wallColor,
            x,
            z,
            'south'
          );
        }
        if (cell.walls.west) {
          this.createWall(
            baseX,
            baseZ + CELL_SIZE / 2,
            WALL_THICKNESS,
            CELL_SIZE,
            wallColor,
            x,
            z,
            'west'
          );
        }
        if (cell.walls.east) {
          this.createWall(
            baseX + CELL_SIZE,
            baseZ + CELL_SIZE / 2,
            WALL_THICKNESS,
            CELL_SIZE,
            wallColor,
            x,
            z,
            'east'
          );
        }

        const isCorner = this.isCorner(cell);
        if (isCorner) {
          this.createCornerLight(baseX + CELL_SIZE / 2, baseZ + CELL_SIZE / 2);
        }
      }
    }
  }

  private isCorner(cell: { walls: { north: boolean; south: boolean; east: boolean; west: boolean } }): boolean {
    const openSides = [
      !cell.walls.north,
      !cell.walls.south,
      !cell.walls.east,
      !cell.walls.west
    ].filter(Boolean).length;
    return openSides === 2 && (
      (!cell.walls.north && !cell.walls.east) ||
      (!cell.walls.east && !cell.walls.south) ||
      (!cell.walls.south && !cell.walls.west) ||
      (!cell.walls.west && !cell.walls.north)
    );
  }

  private createWall(
    x: number,
    z: number,
    width: number,
    depth: number,
    color: number,
    cellX: number,
    cellZ: number,
    side: string
  ): void {
    const geometry = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 0.5,
      ior: 1.3
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, WALL_HEIGHT / 2, z);
    this.scene.add(wall);
    this.walls.push(wall);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    edgeLines.position.copy(wall.position);
    this.scene.add(edgeLines);
    this.wallEdges.push({ mesh: edgeLines, cellX, cellZ, side });
  }

  private createCornerLight(x: number, z: number): void {
    const light = new THREE.PointLight(0xffaa55, 0.3, 3, 2);
    light.position.set(x, WALL_HEIGHT - 0.3, z);
    this.scene.add(light);
    this.cornerLights.push(light);

    const bulbGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({
      color: 0xffcc88,
      transparent: true,
      opacity: 0.9
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.copy(light.position);
    this.scene.add(bulb);
  }

  private createBadges(): void {
    const gameState = state.getState();

    for (const badge of gameState.badges) {
      const group = new THREE.Group();

      const mainGeo = new THREE.TorusGeometry(0.25, 0.08, 8, 16);
      const mainMat = new THREE.MeshStandardMaterial({
        color: 0xffcc33,
        emissive: 0xff8800,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.3
      });
      const torus = new THREE.Mesh(mainGeo, mainMat);
      torus.rotation.x = Math.PI / 2;
      group.add(torus);

      const innerGeo = new THREE.CircleGeometry(0.18, 16);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.2
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = 0.01;
      group.add(inner);

      const glowGeo = new THREE.RingGeometry(0.3, 0.4, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.1;
      group.add(glow);

      group.position.set(
        badge.cellX * CELL_SIZE + CELL_SIZE / 2,
        0.8,
        badge.cellZ * CELL_SIZE + CELL_SIZE / 2
      );

      this.scene.add(group);
      this.badges.push({ mesh: group, badgeId: badge.id, collected: false });
    }
  }

  private createExitRing(): void {
    const gameState = state.getState();
    const exitX = gameState.exitCell.x * CELL_SIZE + CELL_SIZE / 2;
    const exitZ = gameState.exitCell.z * CELL_SIZE + CELL_SIZE / 2;

    const ringGeo = new THREE.RingGeometry(0.1, 0.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    this.exitRing = new THREE.Mesh(ringGeo, ringMat);
    this.exitRing.rotation.x = -Math.PI / 2;
    this.exitRing.position.set(exitX, 0.02, exitZ);
    this.scene.add(this.exitRing);
  }

  private setupBadgeUI(): void {
    this.badgePanel.innerHTML = '';
    for (let i = 0; i < TOTAL_BADGES; i++) {
      const icon = document.createElement('div');
      icon.className = 'badge-icon';
      this.badgePanel.appendChild(icon);
      this.badgeIcons.push(icon);
    }
  }

  private setupEventListeners(): void {
    events.on('badgeCollected', (badge: any) => {
      this.onBadgeCollected(badge);
    });

    events.on('exitProximityChanged', (nearExit: boolean) => {
      this.onExitProximityChanged(nearExit);
    });

    events.on('gameWon', (data: any) => {
      this.onGameWon(data);
    });

    events.on('gameReset', () => {
      this.resetScene();
    });

    this.exitButton.addEventListener('click', () => {
      state.winGame();
    });

    const replayBtn = document.getElementById('replay-btn')!;
    replayBtn.addEventListener('click', () => {
      this.resetGame();
    });
  }

  private onBadgeCollected(badge: any): void {
    this.collectedCount++;
    if (this.badgeIcons[badge.id]) {
      this.badgeIcons[badge.id].classList.add('collected');
    }

    const badgeObj = this.badges.find((b) => b.badgeId === badge.id);
    if (badgeObj) {
      badgeObj.collected = true;
      this.spawnCollectParticles(badgeObj.mesh.position);
      this.playCollectSound();
    }
  }

  private spawnCollectParticles(position: THREE.Vector3): void {
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.SphereGeometry(0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffcc33,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const angle = (i / 10) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 2 + 1,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 1,
        maxLife: 1
      });

      this.scene.add(mesh);
    }
  }

  private playCollectSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
    }
  }

  private onExitProximityChanged(nearExit: boolean): void {
    if (nearExit) {
      this.exitButton.classList.add('visible');
      this.exitRingScale = 0;
    } else {
      this.exitButton.classList.remove('visible');
    }
  }

  private onGameWon(data: { time: number; badges: number; steps: number }): void {
    this.showResultPanel(data);
  }

  private showResultPanel(data: { time: number; badges: number; steps: number }): void {
    this.fadeOverlay.classList.add('visible');

    setTimeout(() => {
      this.resultPanel.classList.add('visible');
      this.animateStat('stat-time', data.time, 1);
      this.animateStat('stat-badges', data.badges, 0);
      this.animateStat('stat-steps', data.steps, 0);
    }, 500);
  }

  private animateStat(id: string, targetValue: number, decimals: number): void {
    const element = document.getElementById(id)!;
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeProgress;

      element.textContent = currentValue.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  private resetGame(): void {
    this.resultPanel.classList.remove('visible');
    this.transitionMode = 'out';
    this.transitionTarget = 1;
    this.transitionProgress = 0;

    setTimeout(() => {
      state.resetGame();
    }, 500);
  }

  private resetScene(): void {
    for (const wall of this.walls) {
      this.scene.remove(wall);
      wall.geometry.dispose();
      (wall.material as THREE.Material).dispose();
    }
    this.walls = [];

    for (const edge of this.wallEdges) {
      this.scene.remove(edge.mesh);
      edge.mesh.geometry.dispose();
      (edge.mesh.material as THREE.Material).dispose();
    }
    this.wallEdges = [];

    for (const badge of this.badges) {
      this.scene.remove(badge.mesh);
      badge.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.badges = [];

    for (const light of this.cornerLights) {
      this.scene.remove(light);
    }
    this.cornerLights = [];

    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];

    this.scene.remove(this.exitRing);
    this.exitRing.geometry.dispose();
    (this.exitRing.material as THREE.Material).dispose();

    this.collectedCount = 0;
    this.collisionCells.clear();

    this.createMaze();
    this.createBadges();
    this.createExitRing();
    this.setupBadgeUI();

    this.fadeOverlay.classList.remove('visible');
    this.exitButton.classList.remove('visible');

    const gameState = state.getState();
    this.camera.position.set(
      gameState.player.x,
      PLAYER_EYE_HEIGHT,
      gameState.player.z
    );

    this.transitionMode = 'in';
    this.transitionTarget = 0;
    this.transitionProgress = 1;
  }

  private playTransitionIn(): void {
    this.transitionProgress = 1;
    this.transitionMode = 'in';
    this.transitionTarget = 0;
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  update(deltaTime: number, yaw: number, pitch: number, isMoving: boolean, collided: boolean): void {
    const gameState = state.getState();

    this.camera.position.x = gameState.player.x;
    this.camera.position.z = gameState.player.z;

    if (isMoving) {
      this.bobOffset += deltaTime * this.bobSpeed;
      const bob = Math.sin(this.bobOffset) * this.bobAmount;
      this.camera.position.y = PLAYER_EYE_HEIGHT + bob;
    } else {
      this.bobOffset *= 0.95;
      const bob = Math.sin(this.bobOffset) * this.bobAmount;
      this.camera.position.y = PLAYER_EYE_HEIGHT + bob;
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = yaw;
    this.camera.rotation.x = pitch;

    this.updateBadges(deltaTime);
    this.updateParticles(deltaTime);
    this.updateExitRing(deltaTime, gameState.nearExit);
    this.updateCollisionGlow(deltaTime);
    this.updateTransition(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }

  private updateBadges(deltaTime: number): void {
    const playerPos = new THREE.Vector2(
      state.getState().player.x,
      state.getState().player.z
    );

    for (const badge of this.badges) {
      if (badge.collected) {
        badge.mesh.visible = false;
        continue;
      }

      badge.mesh.rotation.y += deltaTime * 1.5;
      badge.mesh.position.y = 0.8 + Math.sin(performance.now() * 0.002 + badge.badgeId) * 0.1;

      const badgePos = new THREE.Vector2(
        badge.mesh.position.x,
        badge.mesh.position.z
      );
      const dist = playerPos.distanceTo(badgePos);

      if (dist < 1.5) {
        const scale = Math.max(0.1, 1 - (1.5 - dist) / 1.5);
        badge.mesh.scale.setScalar(scale);

        const dir = new THREE.Vector2(
          playerPos.x - badgePos.x,
          playerPos.y - badgePos.y
        ).normalize();
        badge.mesh.position.x += dir.x * deltaTime * 3;
        badge.mesh.position.z += dir.y * deltaTime * 3;
      } else {
        badge.mesh.scale.setScalar(1);
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      p.velocity.y -= 3 * deltaTime;
      p.life -= deltaTime;

      const opacity = Math.max(0, p.life / p.maxLife);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      p.mesh.scale.setScalar(opacity);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateExitRing(deltaTime: number, nearExit: boolean): void {
    if (nearExit) {
      this.exitRingScale += deltaTime * 2;
      if (this.exitRingScale > 3) {
        this.exitRingScale = 0;
      }

      const ringMat = this.exitRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.6 * (1 - this.exitRingScale / 3);

      this.exitRing.scale.setScalar(this.exitRingScale);

      const pulseSize = 0.5 + Math.sin(performance.now() * 0.003) * 0.2;
      (this.exitRing.geometry as THREE.RingGeometry).dispose();
      this.exitRing.geometry = new THREE.RingGeometry(
        this.exitRingScale * 0.3,
        this.exitRingScale * 0.5,
        32
      );
    } else {
      const ringMat = this.exitRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0;
    }
  }

  setCollisionCells(cells: { x: number; z: number }[]): void {
    this.collisionCells.clear();
    for (const cell of cells) {
      this.collisionCells.add(`${cell.x},${cell.z}`);
    }
  }

  private updateCollisionGlow(deltaTime: number): void {
    for (const edge of this.wallEdges) {
      const cellKey = `${edge.cellX},${edge.cellZ}`;
      const mat = edge.mesh.material as THREE.LineBasicMaterial;

      if (this.collisionCells.has(cellKey)) {
        mat.opacity = Math.min(1, mat.opacity + deltaTime * 5);
      } else {
        mat.opacity = Math.max(0, mat.opacity - deltaTime * 2);
      }
    }
  }

  private updateTransition(deltaTime: number): void {
    if (this.transitionMode === 'none') return;

    const speed = 1.5;
    if (this.transitionMode === 'out') {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime * speed);
      if (this.transitionProgress >= 1) {
        this.transitionMode = 'none';
      }
    } else if (this.transitionMode === 'in') {
      this.transitionProgress = Math.max(0, this.transitionProgress - deltaTime * speed);
      if (this.transitionProgress <= 0) {
        this.transitionMode = 'none';
        this.startHint.style.opacity = '1';
        setTimeout(() => {
          this.startHint.style.transition = 'opacity 1s';
          this.startHint.style.opacity = '0';
        }, 3000);
      }
    }

    this.applyTransitionEffect();
  }

  private applyTransitionEffect(): void {
    const progress = this.transitionProgress;
    if (progress <= 0) {
      this.scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Group) {
          child.visible = true;
        }
      });
      return;
    }

    const numTiles = 8;
    const centerX = MAZE_SIZE * CELL_SIZE / 2;
    const centerZ = MAZE_SIZE * CELL_SIZE / 2;

    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child !== this.floor && child !== this.exitRing) {
        const dx = child.position.x - centerX;
        const dz = child.position.z - centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const maxDist = MAZE_SIZE * CELL_SIZE * 0.7;
        const threshold = progress * maxDist;

        const tileX = Math.floor((child.position.x / CELL_SIZE + 0.5) * numTiles / MAZE_SIZE);
        const tileZ = Math.floor((child.position.z / CELL_SIZE + 0.5) * numTiles / MAZE_SIZE);
        const checkerboard = (tileX + tileZ) % 2 === 0;

        child.visible = dist < threshold || !checkerboard;
      }
    });
  }

  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 255;
    const g1 = (color1 >> 8) & 255;
    const b1 = color1 & 255;
    const r2 = (color2 >> 16) & 255;
    const g2 = (color2 >> 8) & 255;
    const b2 = color2 & 255;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  dispose(): void {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
