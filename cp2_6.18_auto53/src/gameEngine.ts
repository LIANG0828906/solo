import * as THREE from 'three';
import { AudioPlayer, BeatNote, SongInfo } from './audioAnalyzer';

export interface PlayerState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  energy: number;
  isFever: boolean;
  feverTimer: number;
}

export interface ActiveNote {
  id: number;
  beat: BeatNote;
  mesh: THREE.Group;
  spawned: boolean;
  hit: boolean;
  missed: boolean;
}

export interface ParticleItem {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface JudgeFeedback {
  grade: 'perfect' | 'good' | 'miss';
  position: THREE.Vector3;
  playerIndex: number;
}

export interface SwipeResult {
  direction: 'up' | 'down' | 'left' | 'right' | null;
  angleDeg: number;
  magnitude: number;
}

export type GameMode = 'single' | 'dual';

const NOTE_SPEED = 12;
const NOTE_SPAWN_Z = -60;
const JUDGE_Z = 0;
const PERFECT_WINDOW = 0.05;
const GOOD_WINDOW = 0.1;
const MAX_PARTICLES = 200;
const FEVER_DURATION = 5;
const FEVER_ENERGY = 100;
const ENERGY_PER_HIT = 1;
const MAX_MISS_DISTANCE = 5;

const P1_COLOR = 0x1e90ff;
const P2_COLOR = 0xff6347;

const DIRECTION_ANGLES: Record<string, number> = {
  up: 90,
  right: 0,
  down: 270,
  left: 180,
};

export class GameEngine {
  private scenes: THREE.Scene[] = [];
  private cameras: THREE.PerspectiveCamera[] = [];
  private playerStates: PlayerState[] = [];
  private activeNotes: Map<number, ActiveNote[]> = new Map();
  private particles: ParticleItem[] = [];
  private audioPlayer: AudioPlayer;
  private song: SongInfo | null = null;
  private mode: GameMode = 'single';
  private nextNoteId = 0;
  private noteSpawnedSet: Set<number> = new Set();
  private clock: THREE.Clock;
  private gridMeshes: THREE.LineSegments[] = [];
  private judgeRings: THREE.Mesh[] = [];
  private feverOverlays: THREE.Mesh[] = [];
  private lastBeatCheck = 0;
  private lanePositions = [-1.5, -0.5, 0.5, 1.5];

  onJudge: ((feedback: JudgeFeedback) => void) | null = null;
  onComboMilestone: ((playerIndex: number) => void) | null = null;
  onFeverStart: ((playerIndex: number) => void) | null = null;
  onFeverEnd: ((playerIndex: number) => void) | null = null;
  onGameEnd: (() => void) | null = null;
  onStateUpdate: ((states: PlayerState[]) => void) | null = null;
  onBeatDetected: ((playerIndex: number) => void) | null = null;

  constructor(audioPlayer: AudioPlayer) {
    this.audioPlayer = audioPlayer;
    this.clock = new THREE.Clock(false);
  }

  init(mode: GameMode, renderer: THREE.WebGLRenderer): void {
    this.mode = mode;
    const playerCount = mode === 'dual' ? 2 : 1;
    this.scenes = [];
    this.cameras = [];
    this.playerStates = [];
    this.activeNotes.clear();
    this.noteSpawnedSet.clear();
    this.particles = [];
    this.nextNoteId = 0;
    this.gridMeshes = [];
    this.judgeRings = [];
    this.feverOverlays = [];
    this.lastBeatCheck = 0;

    for (let i = 0; i < playerCount; i++) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.FogExp2(0x000000, 0.012);

      const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(0, 10, 5);
      scene.add(dirLight);

      const pointLight = new THREE.PointLight(i === 0 ? P1_COLOR : P2_COLOR, 1, 30);
      pointLight.position.set(0, 5, 0);
      scene.add(pointLight);

      const grid = this.createGrid(i === 0 ? P1_COLOR : P2_COLOR);
      scene.add(grid);
      this.gridMeshes.push(grid);

      const ring = this.createJudgeRing(i === 0 ? P1_COLOR : P2_COLOR);
      scene.add(ring);
      this.judgeRings.push(ring);

      const feverOverlay = this.createFeverOverlay();
      feverOverlay.visible = false;
      scene.add(feverOverlay);
      this.feverOverlays.push(feverOverlay);

      const camera = new THREE.PerspectiveCamera(
        60,
        (renderer.domElement.width / (mode === 'dual' ? 2 : 1)) / renderer.domElement.height,
        0.1,
        200
      );
      camera.position.set(0, 6, 8);
      camera.lookAt(0, 1, -20);

      this.scenes.push(scene);
      this.cameras.push(camera);
      this.playerStates.push({
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectCount: 0,
        goodCount: 0,
        missCount: 0,
        energy: 0,
        isFever: false,
        feverTimer: 0,
      });
      this.activeNotes.set(i, []);
    }
  }

  private createGrid(tintColor: number): THREE.LineSegments {
    const material = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.3,
    });
    const points: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 2) {
      points.push(new THREE.Vector3(x, 0, -60));
      points.push(new THREE.Vector3(x, 0, 5));
    }
    for (let z = -60; z <= 5; z += 4) {
      points.push(new THREE.Vector3(-6, 0, z));
      points.push(new THREE.Vector3(6, 0, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const grid = new THREE.LineSegments(geometry, material);

    const tintMat = new THREE.LineBasicMaterial({
      color: tintColor,
      transparent: true,
      opacity: 0.12,
    });
    const tintPoints: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 2) {
      tintPoints.push(new THREE.Vector3(x, 0.01, -60));
      tintPoints.push(new THREE.Vector3(x, 0.01, 5));
    }
    const tintGeo = new THREE.BufferGeometry().setFromPoints(tintPoints);
    const tintLines = new THREE.LineSegments(tintGeo, tintMat);
    grid.add(tintLines);

    return grid;
  }

  private createJudgeRing(color: number): THREE.Mesh {
    const geometry = new THREE.RingGeometry(3.5, 4.0, 64);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.position.z = JUDGE_Z;

    const innerGeo = new THREE.RingGeometry(2.8, 3.0, 64);
    const innerMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.06;
    innerRing.position.z = JUDGE_Z;
    ring.add(innerRing);

    return ring;
  }

  private createFeverOverlay(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -30);
    return mesh;
  }

  static analyzeSwipe(dx: number, dy: number, minDist: number = 20): SwipeResult {
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude < minDist) {
      return { direction: null, angleDeg: 0, magnitude };
    }

    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * 180 / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    let bestDir: 'up' | 'down' | 'left' | 'right' | null = null;
    let bestDelta = Infinity;

    for (const [dir, targetAngle] of Object.entries(DIRECTION_ANGLES)) {
      let delta = Math.abs(angleDeg - targetAngle);
      if (delta > 180) delta = 360 - delta;
      if (delta < bestDelta) {
        bestDelta = delta;
        bestDir = dir as any;
      }
    }

    if (bestDelta > 45) {
      return { direction: null, angleDeg, magnitude };
    }

    return { direction: bestDir, angleDeg, magnitude };
  }

  startGame(song: SongInfo): void {
    this.song = song;
    this.clock.start();
    this.noteSpawnedSet.clear();
    this.nextNoteId = 0;
    this.audioPlayer.playSong(song);
    this.audioPlayer.registerBeatCallback(() => {
      const p = this.audioPlayer.getCurrentTime();
      this.lastBeatCheck = p;
    });
  }

  stopGame(): void {
    this.clock.stop();
    this.audioPlayer.stop();
    this.clearAllNotes();
    this.clearParticles();
  }

  update(delta: number): void {
    if (!this.song || this.clock.running === false) return;

    const currentTime = this.audioPlayer.getCurrentTime();

    if (currentTime >= this.song.duration) {
      this.onGameEnd?.();
      return;
    }

    this.spawnNotes(currentTime);
    this.moveNotes(delta);
    this.checkMissedNotes();
    this.updateFever(delta);
    this.updateParticles(delta);
    this.detectBeats(currentTime);

    const playerCount = this.mode === 'dual' ? 2 : 1;
    for (let i = 0; i < playerCount; i++) {
      if (this.feverOverlays[i]) {
        const feverOverlay = this.feverOverlays[i];
        const feverState = this.playerStates[i];
        feverOverlay.visible = feverState.isFever;
        if (feverState.isFever) {
          const mat = feverOverlay.material as THREE.MeshBasicMaterial;
          const hue = ((currentTime * 120) % 360);
          mat.color.setHSL(hue / 360, 0.8, 0.5);
          mat.opacity = 0.08 + Math.sin(currentTime * 8) * 0.04;
          feverOverlay.rotation.z = currentTime * 0.5;
        }
      }
    }

    this.onStateUpdate?.(this.playerStates);
  }

  private spawnNotes(currentTime: number): void {
    if (!this.song) return;
    const upcoming = this.audioPlayer.getUpcomingBeats(currentTime, 2.0);
    const playerCount = this.mode === 'dual' ? 2 : 1;
    const travelTime = Math.abs(NOTE_SPAWN_Z) / NOTE_SPEED;

    for (const beat of upcoming) {
      const spawnKey = Math.floor(beat.time * 1000) * 10000 +
        Math.floor((beat.lane + 3) * 10) +
        (beat.direction === 'up' ? 0 : beat.direction === 'down' ? 1 : beat.direction === 'left' ? 2 : 3);

      if (this.noteSpawnedSet.has(spawnKey)) continue;

      const spawnTime = beat.time - travelTime;
      if (currentTime >= spawnTime) {
        this.noteSpawnedSet.add(spawnKey);
        for (let pi = 0; pi < playerCount; pi++) {
          this.createNoteMesh(beat, pi, currentTime);
        }
      }
    }
  }

  private createNoteMesh(beat: BeatNote, playerIndex: number, currentTime: number): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const group = new THREE.Group();

    const noteColor = beat.color === 'red' ? 0xff4444 : 0x4488ff;
    const boxGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const boxMat = new THREE.MeshPhongMaterial({
      color: noteColor,
      emissive: noteColor,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.92,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    group.add(edges);

    const arrowGeo = new THREE.ConeGeometry(0.22, 0.55, 12);
    const arrowMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);

    if (beat.direction === 'up') {
      arrow.position.y = 0.9;
      arrow.rotation.z = 0;
    } else if (beat.direction === 'down') {
      arrow.position.y = -0.9;
      arrow.rotation.z = Math.PI;
    } else if (beat.direction === 'left') {
      arrow.position.x = -0.9;
      arrow.rotation.z = Math.PI / 2;
    } else {
      arrow.position.x = 0.9;
      arrow.rotation.z = -Math.PI / 2;
    }
    group.add(arrow);

    const glowGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: noteColor,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    const travelTime = Math.abs(NOTE_SPAWN_Z) / NOTE_SPEED;
    const remainingTravel = beat.time - currentTime;
    const progress = 1 - (remainingTravel / travelTime);
    const z = NOTE_SPAWN_Z + Math.abs(NOTE_SPAWN_Z) * Math.min(1, Math.max(0, progress));

    group.position.set(beat.lane * 2, 1.5, z);
    scene.add(group);

    const noteId = this.nextNoteId++;
    const notes = this.activeNotes.get(playerIndex) || [];
    notes.push({
      id: noteId,
      beat,
      mesh: group,
      spawned: true,
      hit: false,
      missed: false,
    });
    this.activeNotes.set(playerIndex, notes);
  }

  private moveNotes(delta: number): void {
    const playerCount = this.mode === 'dual' ? 2 : 1;
    for (let pi = 0; pi < playerCount; pi++) {
      const notes = this.activeNotes.get(pi) || [];
      for (const note of notes) {
        if (note.hit || note.missed) continue;
        note.mesh.position.z += NOTE_SPEED * delta;

        const dist = Math.abs(note.mesh.position.z - JUDGE_Z);
        if (dist < 2) {
          const scale = 1 + (1 - dist / 2) * 0.3;
          note.mesh.scale.set(scale, scale, scale);
        } else {
          note.mesh.scale.set(1, 1, 1);
        }

        note.mesh.rotation.y += delta * 0.5;
      }
    }
  }

  private checkMissedNotes(): void {
    const playerCount = this.mode === 'dual' ? 2 : 1;
    for (let pi = 0; pi < playerCount; pi++) {
      const notes = this.activeNotes.get(pi) || [];
      for (const note of notes) {
        if (note.hit || note.missed) continue;
        if (note.mesh.position.z > JUDGE_Z + MAX_MISS_DISTANCE) {
          this.triggerMiss(note, pi);
        }
      }
    }
  }

  handleInput(playerIndex: number, direction: string): void {
    if (playerIndex >= this.scenes.length) return;

    const state = this.playerStates[playerIndex];
    if (!state) return;

    const notes = this.activeNotes.get(playerIndex) || [];

    let bestNote: ActiveNote | null = null;
    let bestDelta = Infinity;

    for (const note of notes) {
      if (note.hit || note.missed) continue;

      const zDelta = Math.abs(note.mesh.position.z - JUDGE_Z);
      const timeDelta = zDelta / NOTE_SPEED;

      if (timeDelta > GOOD_WINDOW && !state.isFever) continue;
      if (timeDelta < bestDelta) {
        bestDelta = timeDelta;
        bestNote = note;
      }
    }

    if (!bestNote) return;

    const isFeverActive = state.isFever;

    let angleOk = true;
    if (!isFeverActive) {
      const noteDir = bestNote.beat.direction;
      angleOk = (direction === noteDir);
    }

    if (!angleOk) return;

    if (!isFeverActive && bestDelta > GOOD_WINDOW) return;

    bestNote.hit = true;

    let grade: 'perfect' | 'good' | 'miss';
    if (isFeverActive) {
      grade = 'perfect';
    } else if (bestDelta <= PERFECT_WINDOW) {
      grade = 'perfect';
    } else {
      grade = 'good';
    }

    this.applyHit(state, bestNote, grade, playerIndex);
  }

  handleSwipe(playerIndex: number, dx: number, dy: number, minDist: number = 20): boolean {
    if (playerIndex >= this.scenes.length) return false;

    const state = this.playerStates[playerIndex];
    if (!state) return false;

    const swipe = GameEngine.analyzeSwipe(dx, dy, minDist);
    if (!swipe.direction) return false;

    const notes = this.activeNotes.get(playerIndex) || [];

    let bestNote: ActiveNote | null = null;
    let bestDelta = Infinity;
    let bestAngle = Infinity;

    for (const note of notes) {
      if (note.hit || note.missed) continue;

      const zDelta = Math.abs(note.mesh.position.z - JUDGE_Z);
      const timeDelta = zDelta / NOTE_SPEED;
      if (timeDelta > GOOD_WINDOW && !state.isFever) continue;

      const targetAngle = DIRECTION_ANGLES[note.beat.direction];
      let angleDiff = Math.abs(swipe.angleDeg - targetAngle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      if (timeDelta < bestDelta) {
        bestDelta = timeDelta;
        bestAngle = angleDiff;
        bestNote = note;
      }
    }

    if (!bestNote) return false;

    const isFeverActive = state.isFever;

    let angleMatchOk = angleDiffMatch(swipe.angleDeg, bestNote.beat.direction, 45);

    if (isFeverActive) {
      if (swipe.magnitude >= minDist) {
        angleMatchOk = true;
      }
    }

    if (!angleMatchOk) return false;
    if (!isFeverActive && bestDelta > GOOD_WINDOW) return false;

    bestNote.hit = true;

    let grade: 'perfect' | 'good' | 'miss';
    if (isFeverActive) {
      grade = 'perfect';
    } else if (bestDelta <= PERFECT_WINDOW) {
      grade = 'perfect';
    } else {
      grade = 'good';
    }

    this.applyHit(state, bestNote, grade, playerIndex);
    return true;
  }

  private applyHit(state: PlayerState, note: ActiveNote, grade: 'perfect' | 'good', playerIndex: number): void {
    let scoreGain = grade === 'perfect' ? 300 : 150;
    if (state.isFever) {
      scoreGain *= 2;
    }

    state.score += scoreGain;
    state.combo++;

    if (state.combo > state.maxCombo) {
      state.maxCombo = state.combo;
    }

    if (grade === 'perfect') {
      state.perfectCount++;
    } else {
      state.goodCount++;
    }

    if (!state.isFever) {
      state.energy = Math.min(FEVER_ENERGY, state.energy + ENERGY_PER_HIT);
      if (state.combo % 10 === 0) {
        state.energy = Math.min(FEVER_ENERGY, state.energy + 10);
      }
    }

    if (!state.isFever && state.energy >= FEVER_ENERGY && state.combo >= 50) {
      this.enterFever(playerIndex);
    }

    if (state.combo > 0 && state.combo % 10 === 0) {
      this.onComboMilestone?.(playerIndex);
      this.audioPlayer.playComboSound();
    }

    this.spawnHitParticles(note, grade, playerIndex);
    this.removeNoteMesh(note, playerIndex);

    this.onJudge?.({
      grade,
      position: note.mesh.position.clone(),
      playerIndex,
    });

    this.audioPlayer.playHitSound(grade);
  }

  private triggerMiss(note: ActiveNote, playerIndex: number): void {
    note.missed = true;
    const state = this.playerStates[playerIndex];
    state.combo = 0;
    state.missCount++;
    state.energy = Math.max(0, state.energy - 5);

    this.removeNoteMesh(note, playerIndex);

    this.onJudge?.({
      grade: 'miss',
      position: new THREE.Vector3(note.beat.lane * 2, 1.5, JUDGE_Z),
      playerIndex,
    });

    this.audioPlayer.playHitSound('miss');
  }

  private enterFever(playerIndex: number): void {
    const state = this.playerStates[playerIndex];
    state.isFever = true;
    state.feverTimer = FEVER_DURATION;
    state.energy = FEVER_ENERGY;
    this.onFeverStart?.(playerIndex);
  }

  private exitFever(playerIndex: number): void {
    const state = this.playerStates[playerIndex];
    state.isFever = false;
    state.feverTimer = 0;
    state.energy = 0;
    state.combo = 0;
    this.onFeverEnd?.(playerIndex);
  }

  private updateFever(delta: number): void {
    for (let i = 0; i < this.playerStates.length; i++) {
      const state = this.playerStates[i];
      if (state.isFever) {
        state.feverTimer -= delta;
        state.energy = Math.max(0, (state.feverTimer / FEVER_DURATION) * FEVER_ENERGY);
        if (state.feverTimer <= 0) {
          this.exitFever(i);
        }
      }
    }
  }

  private spawnHitParticles(note: ActiveNote, grade: 'perfect' | 'good' | 'miss', playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const count = grade === 'perfect' ? 24 : grade === 'good' ? 12 : 6;
    const baseColor = grade === 'perfect' ? 0xffd700 : grade === 'good' ? 0xffffff : 0xff3366;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        const old = this.particles.shift()!;
        old.mesh.parent?.remove(old.mesh);
        (old.mesh.material as THREE.Material).dispose();
        old.mesh.geometry.dispose();
      }

      const size = 0.08 + Math.random() * 0.15;
      const geo = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(note.mesh.position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 8
      );

      scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
      });
    }
  }

  spawnBeatParticles(playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x88ff00];

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 15; i++) {
        if (this.particles.length >= MAX_PARTICLES) {
          const old = this.particles.shift()!;
          old.mesh.parent?.remove(old.mesh);
          (old.mesh.material as THREE.Material).dispose();
          old.mesh.geometry.dispose();
        }

        const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 4, 4);
        const mat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(side * 5.5, 0.3 + Math.random() * 0.4, JUDGE_Z);

        const angle = (i / 15) * Math.PI - Math.PI / 2;
        const speed = 2 + Math.random() * 2;
        const velocity = new THREE.Vector3(
          Math.cos(angle) * speed * side,
          Math.sin(angle) * speed + 1,
          (Math.random() - 0.5) * 2
        );

        scene.add(mesh);
        this.particles.push({
          mesh,
          velocity,
          life: 0.8,
          maxLife: 0.8,
        });
      }
    }

    this.onBeatDetected?.(playerIndex);
  }

  private updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        p.mesh.parent?.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 8 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const progress = 1 - p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - progress;

      const scale = 1 - progress * 0.6;
      p.mesh.scale.setScalar(scale);
    }
  }

  private detectBeats(currentTime: number): void {
    const isBeat = this.audioPlayer.detectBeat();
    if (isBeat) {
      const playerCount = this.mode === 'dual' ? 2 : 1;
      for (let i = 0; i < playerCount; i++) {
        this.spawnBeatParticles(i);
      }
    }
  }

  private removeNoteMesh(note: ActiveNote, playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (scene && note.mesh.parent === scene) {
      scene.remove(note.mesh);
    }
    note.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });
  }

  private clearAllNotes(): void {
    for (const [pi, notes] of this.activeNotes) {
      for (const note of notes) {
        this.removeNoteMesh(note, pi);
      }
      notes.length = 0;
    }
  }

  private clearParticles(): void {
    for (const p of this.particles) {
      p.mesh.parent?.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
      p.mesh.geometry.dispose();
    }
    this.particles = [];
  }

  getPlayerStates(): PlayerState[] {
    return this.playerStates;
  }

  getScene(index: number): THREE.Scene | undefined {
    return this.scenes[index];
  }

  getCamera(index: number): THREE.PerspectiveCamera | undefined {
    return this.cameras[index];
  }

  getMode(): GameMode {
    return this.mode;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  getActiveNotesForPlayer(playerIndex: number): ActiveNote[] {
    return this.activeNotes.get(playerIndex) || [];
  }
}

function angleDiffMatch(swipeAngle: number, targetDir: string, maxDiff: number): boolean {
  const targetAngle = DIRECTION_ANGLES[targetDir];
  if (targetAngle === undefined) return false;
  let delta = Math.abs(swipeAngle - targetAngle);
  if (delta > 180) delta = 360 - delta;
  return delta <= maxDiff;
}
