import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EventBus, StatsData } from '../bus/EventBus';

interface GravitySource {
  id: number;
  mass: number;
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  label: CSS2DObject | null;
  group: THREE.Group;
  isRemoving: boolean;
  removeTime: number;
  pulsePhase: number;
}

interface DustParticle {
  id: number;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  trail: THREE.Vector3[];
  trailLine: THREE.Line;
  alive: boolean;
  absorbed: boolean;
  absorbTime: number;
  respawning: boolean;
  respawnTime: number;
  respawnStart: THREE.Vector3;
  respawnEnd: THREE.Vector3;
}

const G = 0.5;
const SCENE_SIZE = 300;
const PARTICLE_COUNT = 500;
const MAX_PARTICLES_FPS_LIMIT = 1000;
const TRAIL_LENGTH = 30;
const ABSORB_DISTANCE = 2;

const PARTICLE_COLORS = [0x88ccff, 0xcc88ff, 0xffcc88];

export class GravityScene {
  private container: HTMLElement;
  private bus: EventBus;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private gravity