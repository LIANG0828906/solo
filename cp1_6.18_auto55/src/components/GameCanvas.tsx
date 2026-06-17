import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainColor, CELL_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../modules/terrainGenerator';
import { UnitType, TerrainType, GamePhase } from '../types';

const COLOR_SELECTED = 0x00e5ff;
const COLOR_COMMANDER = 0x00e5ff;
const COLOR_SCOUT = 0x6bcb77;
const COLOR_ENEMY = 0xff6b6b;
const COLOR_EXTRACTION = 0xffffff;

const UNIT_NAMES: Record<UnitType, string> = {
  [UnitType.COMMANDER]: '指挥官',
  [UnitType.SCOUT]: '侦察兵',
};

const TERRAIN_NAMES: Record<TerrainType, string> = {
  [TerrainType.OPEN]: '开阔地',
  [TerrainType.TREE]: '树木',
  [TerrainType.HIGHLAND]: '高地',
  [TerrainType.RUIN]: '废墟',
};

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshesRef = useRef<THREE.Mesh[][]>([]);
  const unitMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const enemyMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const indicatorRingRef = useRef<THREE.Mesh | null>(null);
  const extractionMeshRef = useRef<THREE.Mesh | null>(null);
  const fogMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const flashOverlayRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const initGame = useGameStore((s) => s.initGame);
  const gameLoop = useGameStore((s) => s.gameLoop);

  useEffect(() => {
    initGame();

    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 400, 800);
    sceneRef.current = scene;

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    camera.position.set(0, 400, 400);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 400, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -600;
    directionalLight.shadow.camera.right = 600;
    directionalLight.shadow.camera.top = 600;
    directionalLight.shadow.camera.bottom = -600;
    scene.add(directionalLight);

    buildTerrain(scene);

    const flashGeometry = new THREE.PlaneGeometry(3000, 3000);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    const flashOverlay = new THREE.Mesh(flashGeometry, flashMaterial);
    flashOverlay.position.z = 200;
    scene.add(flashOverlay);
    flashOverlayRef.current = flashOverlay;

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    renderer.domElement.id = 'game-canvas';
    const { initInputHandlers } = require('../modules/unitController');
    initInputHandlers(renderer.domElement);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      gameLoop(deltaTime, currentTime);
      updateScene(deltaTime);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      const { cleanupInputHandlers } = require('../modules/unitController');
      cleanupInputHandlers(renderer?.domElement ?? null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildTerrain = (scene: THREE.Scene) => {
    const state = useGameStore.getState();
    if (!state.mapData) return;

    const grid: THREE.Mesh[][] = [];
    const mapOffsetX = -(MAP_WIDTH * CELL_SIZE) / 2;
    const mapOffsetY = -(MAP_HEIGHT * CELL_SIZE) / 2;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const cell = state.mapData.grid[y][x];
        const color = getTerrainColor(cell.type);
        const height = cell.height;

        const geometry = new THREE.BoxGeometry(CELL_SIZE - 1, Math.max(2, height), CELL_SIZE - 1);
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.8,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          mapOffsetX + x * CELL_SIZE + CELL_SIZE / 2,
          height / 2,
          mapOffsetY + y * CELL_SIZE + CELL_SIZE / 2
        );
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.userData = { gridX: x, gridY: y, terrainType: cell.type };
        scene.add(mesh);
        grid[y][x] = mesh;
      }
    }
    terrainMeshesRef.current = grid;

    const extractionGeom = new THREE.CylinderGeometry(40, 40, 1, 32);
    const extractionMat = new THREE.MeshBasicMaterial({
      color: COLOR_EXTRACTION,
      transparent: true,
      opacity: 0.7,
    });
    const extractionMesh = new THREE.Mesh(extractionGeom, extractionMat);
    extractionMesh.position.set(
      mapOffsetX + state.mapData.extractionPoint.x,
      1,
      mapOffsetY + state.mapData.extractionPoint.y
    );
    scene.add(extractionMesh);
    extractionMeshRef.current = extractionMesh;

    const fogGeometry = new THREE.PlaneGeometry(MAP_WIDTH * CELL_SIZE, MAP_HEIGHT * CELL_SIZE);
    const fogMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const fogMesh = new THREE.Mesh(fogGeometry, fogMaterial);
    fogMesh.rotation.x = -Math.PI / 2;
    fogMesh.position.set(0, 60, 0);
    scene.add(fogMesh);
    fogMeshRef.current = fogMesh;

    const ringGeom = new THREE.RingGeometry(24, 28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLOR_SELECTED,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 2;
    scene.add(ring);
    indicatorRingRef.current = ring;
  };

  const createUnitMesh = (unit: { id: string; type: UnitType }): THREE.Group => {
    const group = new THREE.Group();
    const isCommander = unit.type === UnitType.COMMANDER;
    const baseColor = isCommander ? COLOR_COMMANDER : COLOR_SCOUT;
    const size = isCommander ? 14 : 10;

    const bodyGeom = new THREE.CylinderGeometry(size * 0.6, size * 0.8, size * 1.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.3,
      roughness: 0.5,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = size * 0.75;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.SphereGeometry(size * 0.4, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.5,
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = size * 1.8;
    head.castShadow = true;
    group.add(head);

    return group;
  };

  const createEnemyMesh = (): THREE.Group => {
    const group = new THREE.Group();

    const bodyGeom = new THREE.ConeGeometry(10, 20, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: COLOR_ENEMY,
      emissive: COLOR_ENEMY,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 10;
    body.castShadow = true;
    group.add(body);

    return group;
  };

  const updateScene = (deltaTime: number) => {
    const state = useGameStore.getState();
    if (!state.mapData || !cameraRef.current) return;

    const mapOffsetX = -(MAP_WIDTH * CELL_SIZE) / 2;
    const mapOffsetY = -(MAP_HEIGHT * CELL_SIZE) / 2;

    state.units.forEach((unit) => {
      let mesh = unitMeshesRef.current.get(unit.id);
      if (!mesh) {
        mesh = createUnitMesh(unit);
        sceneRef.current?.add(mesh);
        unitMeshesRef.current.set(unit.id, mesh);
      }
      mesh.position.set(
        mapOffsetX + unit.position.x,
        0,
        mapOffsetY + unit.position.y
      );
      mesh.rotation.y = unit.facing;

      const selectedRing = indicatorRingRef.current;
      if (selectedRing && unit.id === state.selectedUnitId) {
        selectedRing.visible = true;
        selectedRing.position.set(
          mapOffsetX + unit.position.x,
          2,
          mapOffsetY + unit.position.y
        );
        selectedRing.rotation.z += deltaTime * 2;
      }
    });

    state.enemies.forEach((enemy) => {
      let mesh = enemyMeshesRef.current.get(enemy.id);
      if (!mesh) {
        mesh = createEnemyMesh();
        sceneRef.current?.add(mesh);
        enemyMeshesRef.current.set(enemy.id, mesh);
      }
      mesh.position.set(
        mapOffsetX + enemy.position.x,
        0,
        mapOffsetY + enemy.position.y
      );
    });

    if (state.selectedUnitId) {
      const selectedUnit = state.units.find((u) => u.id === state.selectedUnitId);
      if (selectedUnit) {
        const targetX = mapOffsetX + selectedUnit.position.x;
        const targetZ = mapOffsetY + selectedUnit.position.y;
        cameraTargetRef.current.x += (targetX - cameraTargetRef.current.x) * 0.08;
        cameraTargetRef.current.z += (targetZ - cameraTargetRef.current.z) * 0.08;
      }
    }

    const cam = cameraRef.current;
    const offset = 350;
    const height = 350;
    cam.position.x = cameraTargetRef.current.x;
    cam.position.z = cameraTargetRef.current.z + offset;
    cam.position.y = height;
    cam.lookAt(cameraTargetRef.current);

    if (extractionMeshRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
      (extractionMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.5;
      extractionMeshRef.current.scale.setScalar(1 + pulse * 0.15);
    }

    if (fogMeshRef.current && state.fogState.texture) {
      const tex = new THREE.CanvasTexture(state.fogState.texture);
      tex.needsUpdate = true;
      (fogMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    }

    if (flashOverlayRef.current) {
      const mat = flashOverlayRef.current.material as THREE.MeshBasicMaterial;
      if (state.flashEffect) {
        mat.opacity = 0.5;
      } else {
        mat.opacity = Math.max(0, mat.opacity - deltaTime * 4);
      }
      if (cam) {
        flashOverlayRef.current.position.set(
          cam.position.x,
          cam.position.y - 50,
          cam.position.z - 100
        );
        flashOverlayRef.current.lookAt(cam.position);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: 'linear-gradient(to bottom, #0A0A0A 0%, #1A1A2E 100%)' }}
    />
  );
}
