import * as THREE from 'three';
import { generateMaze, getWallPositions, getPathPositions, MazeData } from './maze';
import { createPlayer, updatePlayer, addHaloToPlayer, checkExitReached, Player } from './player';
import {
  createCrystals,
  updateCrystals,
  createParticleBurst,
  updateParticleBursts,
  CrystalData,
  ParticleBurst,
} from './crystal';
import { SoundManager } from './sound';
import { initHUD, resizeHUD, drawHUD, HUDState } from './ui';

class Game {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private maze!: MazeData;
  private player!: Player;
  private crystals: CrystalData[] = [];
  private particleBursts: ParticleBurst[] = [];
  private sound = new SoundManager();
  private keys = new Set<string>();
  private clock = new THREE.Clock();
  private gameStartTime = 0;
  private gameDuration = 180;
  private isGameOver = false;
  private isVictory = false;
  private elapsedTime = 0;
  private isNearView = true;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredCrystal: CrystalData | null = null;
  private hudCanvas!: HTMLCanvasElement;
  private wallMeshes: THREE.InstancedMesh | null = null;
  private wallOriginalPositions: { x: number; z: number }[] = [];
  private victoryAnimStartTime = -1;
  private wallParticles: THREE.Points | null = null;
  private entranceBeam!: THREE.Group;
  private exitBeam!: THREE.Group;
  private portalMesh: THREE.Group | null = null;
  private hiddenAreaUnlocked = false;

  constructor() {
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.generateMazeWorld();
    this.initPlayer();
    this.initCrystals();
    this.initBeams();
    this.initHUD();
    this.initEventListeners();
    this.gameStartTime = performance.now() / 1000;
    this.animate();
  }

  private initRenderer(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1a);
    this.scene.fog = new THREE.FogExp2(0x0f0f1a, 0.06);
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    if (!this.player) return;

    if (this.isNearView) {
      const offset = new THREE.Vector3(0, 8, 6);
      const targetPos = this.player.position.clone().add(offset);
      this.camera.position.lerp(targetPos, 0.05);
      const lookTarget = this.player.position.clone();
      lookTarget.y = 0;
      this.camera.lookAt(lookTarget);
    } else {
      const center = new THREE.Vector3(
        this.maze.cols / 2 - 0.5,
        0,
        this.maze.rows / 2 - 0.5
      );
      this.camera.position.lerp(
        new THREE.Vector3(center.x, 18, center.z + 10),
        0.05
      );
      this.camera.lookAt(center);
    }
  }

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0x222244, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x4466aa, 0.4);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
  }

  private generateMazeWorld(): void {
    this.maze = generateMaze(10, 10);

    const groundGeometry = new THREE.PlaneGeometry(this.maze.cols + 2, this.maze.rows + 2);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      shininess: 10,
      specular: 0x111122,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(
      (this.maze.cols - 1) / 2,
      -0.01,
      (this.maze.rows - 1) / 2
    );
    this.scene.add(ground);

    this.createWalls();
  }

  private createWalls(): void {
    const wallPositions = getWallPositions(this.maze);
    this.wallOriginalPositions = wallPositions;

    const wallGeometry = new THREE.BoxGeometry(0.95, 1.2, 0.95);

    const wallMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color() },
        uColor2: { value: new THREE.Color() },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          float t = (vPosition.y + 0.6) / 1.2;
          vec3 baseColor = mix(uColor1, uColor2, t);
          float breath = 0.7 + 0.3 * sin(uTime * 2.094);
          float sparkle = 0.05 * fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
          vec3 color = baseColor * breath + vec3(sparkle);
          float alpha = 0.6 + 0.1 * sin(uTime * 2.094);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.wallMeshes = new THREE.InstancedMesh(wallGeometry, wallMaterial, wallPositions.length);

    const dummy = new THREE.Object3D();
    const colorPalettes = [
      [0xff6699, 0x9933ff],
      [0x33ff99, 0x3399ff],
      [0xff9933, 0xff3399],
      [0x66ffcc, 0x3366ff],
      [0xff6633, 0xcc33ff],
      [0x33ccff, 0x6633ff],
    ];

    for (let i = 0; i < wallPositions.length; i++) {
      const pos = wallPositions[i];
      dummy.position.set(pos.x, 0.6, pos.z);
      dummy.updateMatrix();
      this.wallMeshes.setMatrixAt(i, dummy.matrix);

      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
      const color = new THREE.Color(palette[0]);
      this.wallMeshes.setColorAt(i, color);
    }

    this.wallMeshes.instanceMatrix.needsUpdate = true;
    this.scene.add(this.wallMeshes);
  }

  private initPlayer(): void {
    this.player = createPlayer(this.maze);
    this.scene.add(this.player.mesh);
  }

  private initCrystals(): void {
    const pathPositions = getPathPositions(this.maze);
    this.crystals = createCrystals(pathPositions);
    for (const crystal of this.crystals) {
      this.scene.add(crystal.mesh);
    }
  }

  private initBeams(): void {
    this.entranceBeam = this.createBeam(0x33ff88, this.maze.entrance.x, this.maze.entrance.z);
    this.scene.add(this.entranceBeam);

    this.exitBeam = this.createBeam(0xffcc33, this.maze.exit.x, this.maze.exit.z);
    this.scene.add(this.exitBeam);
  }

  private createBeam(color: number, x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 2;
    group.add(beam);

    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.15;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      velocities.push(Math.random() * 0.5 + 0.3);
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    group.add(particles);

    const light = new THREE.PointLight(color, 1.0, 5);
    light.position.y = 1.5;
    group.add(light);

    (group as any)._beamVelocities = velocities;
    (group as any)._beamParticles = particles;

    return group;
  }

  private updateBeams(time: number): void {
    [this.entranceBeam, this.exitBeam].forEach((beam) => {
      const particles = (beam as any)._beamParticles as THREE.Points;
      const velocities = (beam as any)._beamVelocities as number[];

      if (!particles || !velocities) return;

      const positions = particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < velocities.length; i++) {
        positions.array[i * 3 + 1] += velocities[i] * 0.016;
        if (positions.array[i * 3 + 1] > 4) {
          positions.array[i * 3 + 1] = 0;
        }
      }
      positions.needsUpdate = true;

      beam.rotation.y = time * 0.5;
    });
  }

  private initHUD(): void {
    this.hudCanvas = document.getElementById('hud-canvas') as HTMLCanvasElement;
    initHUD(this.hudCanvas);
  }

  private initEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'v' || e.key === 'V') {
        this.isNearView = !this.isNearView;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', (e) => {
      if (this.isGameOver) {
        this.restart();
        return;
      }
      this.handleClick(e);
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      resizeHUD(this.hudCanvas);
    });
  }

  private handleClick(e: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    for (const crystal of this.crystals) {
      if (crystal.collected) continue;

      const meshes: THREE.Object3D[] = [];
      crystal.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        this.collectCrystal(crystal);
        break;
      }
    }
  }

  private collectCrystal(crystal: CrystalData): void {
    crystal.collected = true;
    this.player.collectedCrystals++;
    this.sound.playCollect();

    const burst = createParticleBurst(crystal.position, this.getCrystalColor(crystal.type));
    this.scene.add(burst.particles);
    this.particleBursts.push(burst);

    this.scene.remove(crystal.mesh);

    if (this.player.collectedCrystals >= this.player.totalCrystals) {
      this.player.hasUnlockedHiddenArea = true;
      this.hiddenAreaUnlocked = true;
      addHaloToPlayer(this.player, this.scene);
      this.createPortal();
    }
  }

  private getCrystalColor(type: string): number {
    const map: Record<string, number> = {
      red: 0xff3355,
      blue: 0x3388ff,
      green: 0x33ff88,
      purple: 0xaa44ff,
      gold: 0xffcc33,
    };
    return map[type] || 0xffffff;
  }

  private createPortal(): void {
    const group = new THREE.Group();

    const pathPositions = getPathPositions(this.maze);
    let portalPos = pathPositions[Math.floor(pathPositions.length / 2)];

    const deadEnds = pathPositions.filter((p) => {
      const neighbors = [
        { x: p.x + 1, z: p.z },
        { x: p.x - 1, z: p.z },
        { x: p.x, z: p.z + 1 },
        { x: p.x, z: p.z - 1 },
      ];
      const openNeighbors = neighbors.filter(
        (n) =>
          n.x >= 0 &&
          n.x < this.maze.cols &&
          n.z >= 0 &&
          n.z < this.maze.rows &&
          this.maze.grid[n.z][n.x] === 0
      );
      return openNeighbors.length === 1;
    });

    if (deadEnds.length > 0) {
      portalPos = deadEnds[Math.floor(Math.random() * deadEnds.length)];
    }

    group.position.set(portalPos.x, 0.8, portalPos.z);

    const ringGeom = new THREE.TorusGeometry(0.4, 0.06, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8844ff,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    const discGeom = new THREE.CircleGeometry(0.35, 32);
    const discMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv2;
        void main() {
          vUv2 = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv2;
        void main() {
          float dist = length(vUv2 - 0.5) * 2.0;
          float ripple = sin(dist * 10.0 - uTime * 3.0) * 0.5 + 0.5;
          float alpha = (1.0 - dist) * 0.6 * ripple;
          vec3 color = mix(vec3(0.3, 0.1, 0.8), vec3(0.6, 0.2, 1.0), ripple);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeom, discMat);
    group.add(disc);

    const portalLight = new THREE.PointLight(0x8844ff, 1.5, 4);
    group.add(portalLight);

    this.scene.add(group);
    this.portalMesh = group;
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    let foundHover = false;
    for (const crystal of this.crystals) {
      if (crystal.collected) continue;

      const meshes: THREE.Object3D[] = [];
      crystal.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        crystal.hovered = true;
        this.hoveredCrystal = crystal;
        foundHover = true;
      } else {
        crystal.hovered = false;
      }
    }

    if (!foundHover) {
      this.hoveredCrystal = null;
    }
  }

  private triggerVictory(): void {
    if (this.isGameOver) return;
    this.isVictory = true;
    this.isGameOver = true;
    this.victoryAnimStartTime = performance.now() / 1000;
    this.sound.playVictory();
  }

  private triggerTimeUp(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
  }

  private animateVictory(time: number): void {
    if (this.victoryAnimStartTime < 0) return;

    const elapsed = time - this.victoryAnimStartTime;

    if (elapsed < 2.0) {
      const progress = elapsed / 2.0;
      this.isNearView = false;

      if (this.wallMeshes) {
        const material = this.wallMeshes.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = time;

        const wallMat = this.wallMeshes.material as THREE.ShaderMaterial;
        wallMat.uniforms.uColor1.value = new THREE.Color(0xffffff);
        wallMat.uniforms.uColor2.value = new THREE.Color(0xffffff);

        const newOpacity = Math.max(0.0, 0.6 * (1.0 - progress));
        wallMat.fragmentShader = wallMat.fragmentShader.replace(
          /float alpha = 0\.6 \+ 0\.1 \* sin\(uTime \* 2\.094\);/,
          `float alpha = ${newOpacity.toFixed(4)};`
        );
        wallMat.needsUpdate = true;
      }

      this.createVictoryFireworks(time);
    }
  }

  private fireworksCreated = false;
  private createVictoryFireworks(time: number): void {
    if (this.fireworksCreated) return;
    this.fireworksCreated = true;

    const colors = [0xff3355, 0x3388ff, 0x33ff88, 0xaa44ff, 0xffcc33];
    for (let i = 0; i < 5; i++) {
      const pos = new THREE.Vector3(
        Math.random() * this.maze.cols,
        2 + Math.random() * 3,
        Math.random() * this.maze.rows
      );
      const burst = createParticleBurst(pos, colors[i]);
      burst.startTime = time + i * 0.3;
      burst.duration = 1.5;
      this.scene.add(burst.particles);
      this.particleBursts.push(burst);
    }
  }

  private restart(): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    this.isGameOver = false;
    this.isVictory = false;
    this.elapsedTime = 0;
    this.hiddenAreaUnlocked = false;
    this.fireworksCreated = false;
    this.victoryAnimStartTime = -1;
    this.particleBursts = [];
    this.hoveredCrystal = null;
    this.isNearView = true;
    this.keys.clear();
    this.portalMesh = null;
    this.wallMeshes = null;

    this.initLights();
    this.generateMazeWorld();
    this.initPlayer();
    this.initCrystals();
    this.initBeams();

    this.gameStartTime = performance.now() / 1000;
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = performance.now() / 1000;

    if (!this.isGameOver) {
      updatePlayer(this.player, this.keys, this.maze, delta, this.sound);

      this.checkHover();

      if (checkExitReached(this.player, this.maze.exit)) {
        this.triggerVictory();
      }

      this.elapsedTime = time - this.gameStartTime;
      const timeRemaining = this.gameDuration - this.elapsedTime;
      if (timeRemaining <= 0) {
        this.triggerTimeUp();
      }
    } else if (this.isVictory) {
      this.animateVictory(time);
    }

    updateCrystals(this.crystals, time);
    updateParticleBursts(this.particleBursts, time);
    this.updateBeams(time);

    if (this.portalMesh) {
      const ring = this.portalMesh.children[0] as THREE.Mesh;
      ring.rotation.z = time * 2;
      const disc = this.portalMesh.children[1] as THREE.Mesh;
      const discMat = disc.material as THREE.ShaderMaterial;
      discMat.uniforms.uTime.value = time;
    }

    if (this.wallMeshes) {
      const wallMat = this.wallMeshes.material as THREE.ShaderMaterial;
      wallMat.uniforms.uTime.value = time;
    }

    this.updateCameraPosition();

    this.particleBursts = this.particleBursts.filter((b) => b.alive);

    this.renderer.render(this.scene, this.camera);

    const hudState: HUDState = {
      collectedCrystals: this.player.collectedCrystals,
      totalCrystals: this.player.totalCrystals,
      timeRemaining: Math.max(0, this.gameDuration - this.elapsedTime),
      isGameOver: this.isGameOver,
      hasUnlockedHiddenArea: this.player.hasUnlockedHiddenArea,
      elapsedTime: this.elapsedTime,
      isVictory: this.isVictory,
    };
    drawHUD(this.hudCanvas, hudState);
  }
}

new Game();
