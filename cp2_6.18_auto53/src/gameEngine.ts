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

export type GameMode = 'single' | 'dual';

const NOTE_SPEED = 12;
const NOTE_SPAWN_Z = -60;
const JUDGE_Z = 0;
const PERFECT_WINDOW = 0.05;
const GOOD_WINDOW = 0.1;
const MAX_PARTICLES = 200;
const FEVER_DURATION = 5;
const FEVER_COMBO = 100;

const P1_COLOR = 0x1e90ff;
const P2_COLOR = 0xff6347;

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
  private judgePlaneZ = JUDGE_Z;
  private clock: THREE.Clock;
  private gridMeshes: THREE.LineSegments[] = [];
  private judgeRings: THREE.Mesh[] = [];
  private directionMap: Record<string, THREE.Vector3> = {
    up: new THREE.Vector3(0, 1, 0),
    down: new THREE.Vector3(0, -1, 0),
    left: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(1, 0, 0),
  };

  onJudge: ((feedback: JudgeFeedback) => void) | null = null;
  onComboMilestone: ((playerIndex: number) => void) | null = null;
  onFeverStart: ((playerIndex: number) => void) | null = null;
  onFeverEnd: ((playerIndex: number) => void) | null = null;
  onGameEnd: (() => void) | null = null;
  onStateUpdate: ((states: PlayerState[]) => void) | null = null;

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

    for (let i = 0; i < playerCount; i++) {
      const scene = new THREE.Scene();
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
      opacity: 0.08,
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
    const geometry = new THREE.RingGeometry(3, 3.3, 64);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.position.z = JUDGE_Z;
    return ring;
  }

  startGame(song: SongInfo): void {
    this.song = song;
    this.clock.start();
    this.audioPlayer.playSong(song);
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
    this.checkMissedNotes(currentTime);
    this.updateFever(delta);
    this.updateParticles(delta);
    this.onStateUpdate?.(this.playerStates);
  }

  private spawnNotes(currentTime: number): void {
    if (!this.song) return;
    const upcoming = this.audioPlayer.getUpcomingBeats(currentTime, 2.0);
    const playerCount = this.mode === 'dual' ? 2 : 1;

    for (const beat of upcoming) {
      if (this.noteSpawnedSet.has(Math.floor(beat.time * 1000) * 10 + beat.lane)) continue;

      const spawnTime = beat.time - (Math.abs(NOTE_SPAWN_Z) / NOTE_SPEED);
      if (currentTime >= spawnTime) {
        const key = Math.floor(beat.time * 1000) * 10 + beat.lane;
        this.noteSpawnedSet.add(key);

        for (let pi = 0; pi < playerCount; pi++) {
          this.createNoteMesh(beat, pi);
        }
      }
    }
  }

  private createNoteMesh(beat: BeatNote, playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const group = new THREE.Group();

    const noteColor = beat.color === 'red' ? 0xff4444 : 0x4488ff;
    const boxGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const boxMat = new THREE.MeshPhongMaterial({
      color: noteColor,
      emissive: noteColor,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    const arrowDir = this.directionMap[beat.direction];
    const arrowGeo = new THREE.ConeGeometry(0.25, 0.6, 8);
    const arrowMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);

    if (beat.direction === 'up') {
      arrow.position.y = 0.8;
      arrow.rotation.z = 0;
    } else if (beat.direction === 'down') {
      arrow.position.y = -0.8;
      arrow.rotation.z = Math.PI;
    } else if (beat.direction === 'left') {
      arrow.position.x = -0.8;
      arrow.rotation.z = Math.PI / 2;
    } else {
      arrow.position.x = 0.8;
      arrow.rotation.z = -Math.PI / 2;
    }
    group.add(arrow);

    const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: noteColor,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    const travelTime = Math.abs(NOTE_SPAWN_Z) / NOTE_SPEED;
    const z = NOTE_SPAWN_Z + (beat.time - travelTime - this.audioPlayer.getCurrentTime()) * NOTE_SPEED;
    group.position.set(beat.lane * 2, 1.5, z < NOTE_SPAWN_Z ? NOTE_SPAWN_Z : z);
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
          const scale = 1 + (1 - dist / 2) * 0.2;
          note.mesh.scale.set(scale, scale, scale);
        }
      }
    }
  }

  private checkMissedNotes(currentTime: number): void {
    const playerCount = this.mode === 'dual' ? 2 : 1;
    for (let pi = 0; pi < playerCount; pi++) {
      const notes = this.activeNotes.get(pi) || [];
      for (const note of notes) {
        if (note.hit || note.missed) continue;
        if (note.mesh.position.z > JUDGE_Z + 3) {
          note.missed = true;
          const state = this.playerStates[pi];
          state.combo = 0;
          state.missCount++;
          state.energy = Math.max(0, state.energy - 5);

          this.removeNoteMesh(note, pi);

          this.onJudge?.({
            grade: 'miss',
            position: new THREE.Vector3(note.beat.lane * 2, 1.5, JUDGE_Z),
            playerIndex: pi,
          });
        }
      }
    }
  }

  handleInput(playerIndex: number, direction: string): void {
    if (playerIndex >= this.scenes.length) return;
    const notes = this.activeNotes.get(playerIndex) || [];
    const state = this.playerStates[playerIndex];

    let bestNote: ActiveNote | null = null;
    let bestDelta = Infinity;

    for (const note of notes) {
      if (note.hit || note.missed) continue;
      if (note.beat.direction !== direction) continue;

      const zDelta = Math.abs(note.mesh.position.z - JUDGE_Z);
      const timeDelta = zDelta / NOTE_SPEED;

      if (timeDelta < bestDelta) {
        bestDelta = timeDelta;
        bestNote = note;
      }
    }

    if (!bestNote) return;

    const isFever = state.isFever;
    let grade: 'perfect' | 'good' | 'miss';

    if (isFever || bestDelta <= PERFECT_WINDOW) {
      grade = 'perfect';
    } else if (bestDelta <= GOOD_WINDOW) {
      grade = 'good';
    } else {
      return;
    }

    bestNote.hit = true;

    let scoreGain = grade === 'perfect' ? 300 : 150;
    if (state.isFever) scoreGain *= 2;
    state.score += scoreGain;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    if (grade === 'perfect') state.perfectCount++;
    else state.goodCount++;

    state.energy = Math.min(100, state.energy + 2);

    if (state.combo > 0 && state.combo % 10 === 0) {
      this.onComboMilestone?.(playerIndex);
      this.audioPlayer.playComboSound();
    }

    if (state.combo >= FEVER_COMBO && !state.isFever) {
      state.isFever = true;
      state.feverTimer = FEVER_DURATION;
      this.onFeverStart?.(playerIndex);
    }

    this.spawnHitParticles(bestNote, grade, playerIndex);
    this.removeNoteMesh(bestNote, playerIndex);

    this.onJudge?.({
      grade,
      position: bestNote.mesh.position.clone(),
      playerIndex,
    });

    this.audioPlayer.playHitSound(grade);
  }

  private updateFever(delta: number): void {
    for (let i = 0; i < this.playerStates.length; i++) {
      const state = this.playerStates[i];
      if (state.isFever) {
        state.feverTimer -= delta;
        if (state.feverTimer <= 0) {
          state.isFever = false;
          state.feverTimer = 0;
          state.combo = 0;
          state.energy = 0;
          this.onFeverEnd?.(i);
        }
      }
    }
  }

  private spawnHitParticles(note: ActiveNote, grade: 'perfect' | 'good' | 'miss', playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const count = grade === 'perfect' ? 20 : grade === 'good' ? 10 : 5;
    const baseColor = grade === 'perfect' ? 0xffd700 : grade === 'good' ? 0xffffff : 0xff3366;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        const old = this.particles.shift()!;
        old.mesh.parent?.remove(old.mesh);
        old.mesh.geometry.dispose();
      }

      const size = 0.08 + Math.random() * 0.12;
      const geo = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(note.mesh.position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 6
      );

      scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
      });
    }
  }

  spawnBeatParticles(playerIndex: number, position: THREE.Vector3): void {
    const scene = this.scenes[playerIndex];
    if (!scene) return;

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    for (let i = 0; i < 30; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        const old = this.particles.shift()!;
        old.mesh.parent?.remove(old.mesh);
        old.mesh.geometry.dispose();
      }

      const geo = new THREE.SphereGeometry(0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const angle = (i / 30) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 3 + 1,
        Math.sin(angle) * speed
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

  private updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        p.mesh.parent?.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 6 * delta;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

      const progress = 1 - p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - progress;

      const scale = 1 - progress * 0.5;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private removeNoteMesh(note: ActiveNote, playerIndex: number): void {
    const scene = this.scenes[playerIndex];
    if (scene && note.mesh.parent === scene) {
      scene.remove(note.mesh);
      note.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
    }
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
}
