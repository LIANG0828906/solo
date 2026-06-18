import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { usePlayerStore } from '../stores/playerStore';
import { playStepSound, emitSoundWave } from '../utils/audioEngine';
import { ServerData, TreeNode, RockNode, TreasureNode, ReflectionPoint } from '../types/dataTypes';

const TREASURE_POSITIONS: [number, number][] = [[10, 8], [-6, 12], [3, -5]];
const PLAYER_SPEED = 0.08;
const TREASURE_PROXIMITY = 1.5;
const GOLDEN_COLOR = new THREE.Color(0xffd700);
const STEP_SOUND_COOLDOWN = 0.15;

interface TreeMeshGroup {
  group: THREE.Group;
  crownMaterials: THREE.MeshStandardMaterial[];
  originalColors: THREE.Color[];
  trunkX: number;
  trunkZ: number;
}

interface RockMeshGroup {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  radius: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: number;
  lifetime: number;
  maxLifetime: number;
}

interface TreasureState {
  position: THREE.Vector3;
  triggered: boolean;
  transitionProgress: number;
}

const GameScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneDataRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: THREE.Mesh;
    trees: TreeMeshGroup[];
    rocks: RockMeshGroup[];
    treasures: TreasureState[];
    particles: Particle[];
    keys: Set<string>;
    lastStepPos: THREE.Vector2;
    stepSoundTimer: number;
    clock: THREE.Clock;
    animId: number;
    data: ServerData | null;
    obstacleList: Array<{ x: number; z: number; radius: number }>;
  } | null>(null);

  const { setPosition, incrementStep, updateEchoes, updateSoundIntensity } = usePlayerStore.getState();

  const generateRandomTrees = useCallback((count: number): TreeNode[] => {
    const trees: TreeNode[] = [];
    const speciesList = ['红松', '白桦', '橡树', '枫树', '雪松', '紫杉'];
    const eras = ['百年古木', '五十年壮木', '二十年少木', '千年神木'];
    for (let i = 0; i < count; i++) {
      let x: number, z: number;
      do {
        x = (Math.random() - 0.5) * 40;
        z = (Math.random() - 0.5) * 40;
      } while (Math.abs(x) < 2 && Math.abs(z) < 2);
      trees.push({
        id: i,
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        speciesName: speciesList[i % speciesList.length],
        era: eras[i % eras.length],
      });
    }
    return trees;
  }, []);

  const generateRandomRocks = useCallback((count: number): RockNode[] => {
    const rocks: RockNode[] = [];
    for (let i = 0; i < count; i++) {
      let x: number, z: number;
      do {
        x = (Math.random() - 0.5) * 36;
        z = (Math.random() - 0.5) * 36;
      } while (Math.abs(x) < 2 && Math.abs(z) < 2);
      rocks.push({
        id: i,
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        scaleX: 0.5 + Math.random() * 1.5,
        scaleY: 0.3 + Math.random() * 0.8,
        scaleZ: 0.5 + Math.random() * 1.5,
      });
    }
    return rocks;
  }, []);

  const buildTreasures = useCallback((): TreasureNode[] => {
    const speciesList = ['金叶古榕', '银铃神木', '翡翠灵松'];
    const eras = ['三千年', '一千五百年', '八百年'];
    return TREASURE_POSITIONS.map((pos, i) => ({
      id: i,
      x: pos[0],
      z: pos[1],
      speciesName: speciesList[i],
      era: eras[i],
    }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a0a);
    scene.fog = new THREE.FogExp2(0x0a1a0a, 0.02);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x223322, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x889988, 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    const groundGeom = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const playerGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const player = new THREE.Mesh(playerGeom, playerMat);
    player.position.set(0, 0.4, 0);
    player.castShadow = true;
    scene.add(player);

    const playerLight = new THREE.PointLight(0x00e5ff, 1.5, 8);
    playerLight.position.set(0, 1, 0);
    player.add(playerLight);

    const trees: TreeMeshGroup[] = [];
    const rocks: RockMeshGroup[] = [];
    const obstacleList: Array<{ x: number; z: number; radius: number }> = [];

    const fetchData = async () => {
      let data: ServerData;
      try {
        const res = await fetch('http://localhost:8080/api/data');
        data = await res.json();
      } catch {
        data = {
          trees: generateRandomTrees(20),
          rocks: generateRandomRocks(6),
          treasures: buildTreasures(),
        };
      }
      return data;
    };

    const buildScene = (data: ServerData) => {
      for (const t of data.trees) {
        const group = new THREE.Group();
        group.position.set(t.x, 0, t.z);

        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        group.add(trunk);

        const crown1Geom = new THREE.SphereGeometry(0.8, 12, 12);
        const crown1Mat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
        const crown1 = new THREE.Mesh(crown1Geom, crown1Mat);
        crown1.position.y = 3.5;
        crown1.castShadow = true;
        group.add(crown1);

        const crown2Geom = new THREE.SphereGeometry(0.6, 12, 12);
        const crown2Mat = new THREE.MeshStandardMaterial({ color: 0x388e3c });
        const crown2 = new THREE.Mesh(crown2Geom, crown2Mat);
        crown2.position.y = 4.2;
        crown2.castShadow = true;
        group.add(crown2);

        scene.add(group);

        trees.push({
          group,
          crownMaterials: [crown1Mat, crown2Mat],
          originalColors: [new THREE.Color(0x2e7d32), new THREE.Color(0x388e3c)],
          trunkX: t.x,
          trunkZ: t.z,
        });

        obstacleList.push({ x: t.x, z: t.z, radius: 0.8 });
      }

      for (const r of data.rocks) {
        const geom = new THREE.DodecahedronGeometry(1, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x757575,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(r.x, r.scaleY * 0.5, r.z);
        mesh.scale.set(r.scaleX, r.scaleY, r.scaleZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const approxRadius = Math.max(r.scaleX, r.scaleZ) * 0.8;
        rocks.push({ mesh, x: r.x, z: r.z, radius: approxRadius });
        obstacleList.push({ x: r.x, z: r.z, radius: approxRadius });
      }

      return data;
    };

    const treasureStates: TreasureState[] = TREASURE_POSITIONS.map(
      ([x, z]) =>
        ({
          position: new THREE.Vector3(x, 0, z),
          triggered: false,
          transitionProgress: 0,
        } as TreasureState)
    );

    const particles: Particle[] = [];
    const keys = new Set<string>();
    const lastStepPos = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const createLeafParticles = (x: number, z: number) => {
      const leafColors = [0x8bc34a, 0x4caf50, 0x7cb342, 0x66bb6a];
      for (let i = 0; i < 8; i++) {
        const geom = new THREE.SphereGeometry(0.06, 6, 4);
        geom.scale(1.8, 0.3, 1.0);
        const mat = new THREE.MeshStandardMaterial({
          color: leafColors[i % leafColors.length],
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
          x + (Math.random() - 0.5) * 0.6,
          2.5 + Math.random() * 1.0,
          z + (Math.random() - 0.5) * 0.6
        );
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.5;
        particles.push({
          mesh,
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed * 0.3,
            -2,
            Math.sin(angle) * speed * 0.3
          ),
          angularVelocity: 0.5 * (Math.random() > 0.5 ? 1 : -1),
          lifetime: 0,
          maxLifetime: 2.5 + Math.random() * 1.0,
        });
      }
    };

    const updateParticles = (delta: number) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.lifetime += delta;

        if (p.lifetime >= p.maxLifetime) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.MeshStandardMaterial).dispose();
          particles.splice(i, 1);
          continue;
        }

        p.mesh.position.x += p.velocity.x * delta;
        p.mesh.position.y += p.velocity.y * delta;
        p.mesh.position.z += p.velocity.z * delta;

        p.velocity.x *= 0.98;
        p.velocity.z *= 0.98;

        p.mesh.rotation.x += p.angularVelocity * delta;
        p.mesh.rotation.z += p.angularVelocity * delta * 0.7;

        const fadeRatio = 1 - p.lifetime / p.maxLifetime;
        (p.mesh.material as THREE.MeshStandardMaterial).opacity = fadeRatio;
      }
    };

    const checkCollision = (newX: number, newZ: number): boolean => {
      for (const obs of obstacleList) {
        const dx = newX - obs.x;
        const dz = newZ - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < obs.radius + 0.35) return true;
      }
      if (Math.abs(newX) > 38 || Math.abs(newZ) > 38) return true;
      return false;
    };

    const updateTreasures = (delta: number) => {
      const playerPos = player.position;
      for (const ts of treasureStates) {
        const dist = playerPos.distanceTo(ts.position);
        if (dist < TREASURE_PROXIMITY) {
          if (!ts.triggered) {
            ts.triggered = true;
            ts.transitionProgress = 0;
          }
          if (ts.transitionProgress < 1) {
            ts.transitionProgress = Math.min(1, ts.transitionProgress + delta / 1.5);
          }
        } else {
          if (ts.triggered) {
            ts.transitionProgress = Math.max(0, ts.transitionProgress - delta / 2);
            if (ts.transitionProgress <= 0) ts.triggered = false;
          }
        }
      }

      for (const tree of trees) {
        let maxProximity = 0;
        for (const ts of treasureStates) {
          const dx = tree.trunkX - ts.position.x;
          const dz = tree.trunkZ - ts.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 5) {
            maxProximity = Math.max(maxProximity, ts.transitionProgress);
          }
        }
        for (let i = 0; i < tree.crownMaterials.length; i++) {
          tree.crownMaterials[i].color.copy(tree.originalColors[i]).lerp(GOLDEN_COLOR, maxProximity);
        }
      }
    };

    let stepSoundTimer = 0;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      stepSoundTimer -= delta;

      let moveX = 0;
      let moveZ = 0;
      if (keys.has('w')) moveZ -= 1;
      if (keys.has('s')) moveZ += 1;
      if (keys.has('a')) moveX -= 1;
      if (keys.has('d')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= len;
        moveZ /= len;

        const newX = player.position.x + moveX * PLAYER_SPEED;
        const newZ = player.position.z + moveZ * PLAYER_SPEED;

        if (!checkCollision(newX, newZ)) {
          player.position.x = newX;
          player.position.z = newZ;

          const stepDx = newX - lastStepPos.x;
          const stepDz = newZ - lastStepPos.y;
          const stepDist = Math.sqrt(stepDx * stepDx + stepDz * stepDz);

          if (stepDist >= 0.1) {
            lastStepPos.set(newX, newZ);
            incrementStep();
            createLeafParticles(newX, newZ);

            if (stepSoundTimer <= 0) {
              playStepSound();
              stepSoundTimer = STEP_SOUND_COOLDOWN;

              const reflections = emitSoundWave(newX, newZ, obstacleList);
              const echoInfos = reflections.map((r) => {
                const angle =
                  ((Math.atan2(r.z - newZ, r.x - newX) * 180) / Math.PI + 360) % 360;
                return { angle, intensity: r.intensity };
              });
              updateEchoes(echoInfos);

              const maxIntensity = reflections.length > 0
                ? reflections[0].intensity
                : 0;

              let treasureBoost = 0;
              for (const ts of treasureStates) {
                const dist = Math.sqrt(
                  (newX - ts.position.x) ** 2 + (newZ - ts.position.z) ** 2
                );
                if (dist < TREASURE_PROXIMITY * 3) {
                  const proximity = 1 - dist / (TREASURE_PROXIMITY * 3);
                  treasureBoost = Math.max(treasureBoost, proximity * (0.2 + ts.transitionProgress * 0.6));
                }
              }

              const totalIntensity = maxIntensity * 60 + treasureBoost * 80;
              updateSoundIntensity(Math.min(100, totalIntensity));
            }
          }
        }
      }

      updateParticles(delta);
      updateTreasures(delta);

      camera.position.x += (player.position.x - camera.position.x) * 0.05;
      camera.position.z += (player.position.z + 12 - camera.position.z) * 0.05;
      camera.lookAt(player.position.x, 0, player.position.z);

      setPosition(
        Math.round(player.position.x * 10) / 10,
        Math.round(player.position.z * 10) / 10
      );

      renderer.render(scene, camera);
    };

    const init = async () => {
      const data = await fetchData();
      const builtData = buildScene(data);

      sceneDataRef.current = {
        scene,
        camera,
        renderer,
        player,
        trees,
        rocks,
        treasures: treasureStates,
        particles,
        keys,
        lastStepPos,
        stepSoundTimer,
        clock,
        animId,
        data: builtData,
        obstacleList,
      };

      animate();
    };

    init();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default GameScene;
