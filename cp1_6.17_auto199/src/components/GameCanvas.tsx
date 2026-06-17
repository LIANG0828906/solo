import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../engine/StateSync';
import { mazeGenerator, MazeData, WallSegment, EnergyBall } from '../engine/MazeGenerator';
import { physicsEngine, InterferenceParticle, TrailParticle, Shockwave } from '../engine/PhysicsEngine';

interface GameCanvasProps {
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  const objectsRef = useRef<{
    walls: THREE.LineSegments[];
    energyBalls: Map<number, { mesh: THREE.Mesh; ring: THREE.Mesh }>;
    player: THREE.Mesh | null;
    playerGlow: THREE.Mesh | null;
    trail: THREE.Points | null;
    interferences: Map<number, THREE.Mesh>;
    shockwaves: Map<number, THREE.Mesh>;
    nebula: THREE.Points | null;
    entry: THREE.Mesh | null;
    exit: THREE.Mesh | null;
    wallBreath: number;
    cameraAngle: { theta: number; phi: number; distance: number };
    isDragging: boolean;
    lastMouse: { x: number; y: number };
  }>({
    walls: [],
    energyBalls: new Map(),
    player: null,
    playerGlow: null,
    trail: null,
    interferences: new Map(),
    shockwaves: new Map(),
    nebula: null,
    entry: null,
    exit: null,
    wallBreath: 0,
    cameraAngle: { theta: 0, phi: Math.PI / 4, distance: 10 },
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
  });

  const level = useGameStore((s) => s.level);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const playerRadius = useGameStore((s) => s.playerRadius);
  const isPowered = useGameStore((s) => s.isPowered);
  const shake = useGameStore((s) => s.shake);
  const flashRed = useGameStore((s) => s.flashRed);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0E14);
    scene.fog = new THREE.Fog(0x0B0E14, 15, 30);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x00E5FF, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x448AFF, 1, 30);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    createNebula(scene);
    updateCameraPosition();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      renderer.dispose();
    };
  }, [width, height]);

  const createNebula = (scene: THREE.Scene) => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 5;
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x2A2A4A),
        new THREE.Color(0x4A4A8A),
        t
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.02 + Math.random() * 0.03;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const nebula = new THREE.Points(geo, mat);
    nebula.name = 'nebula';
    scene.add(nebula);
    objectsRef.current.nebula = nebula;
  };

  const updateCameraPosition = () => {
    const cam = objectsRef.current.cameraAngle;
    const camera = cameraRef.current;
    if (!camera) return;

    let shakeX = 0;
    let shakeY = 0;
    if (shake) {
      const elapsed = performance.now() - shake.startTime;
      if (elapsed < shake.duration) {
        shakeX = (Math.random() - 0.5) * shake.amplitude * 0.1;
        shakeY = (Math.random() - 0.5) * shake.amplitude * 0.1;
      }
    }

    camera.position.x = cam.distance * Math.sin(cam.phi) * Math.cos(cam.theta) + shakeX;
    camera.position.y = cam.distance * Math.cos(cam.phi) + shakeY;
    camera.position.z = cam.distance * Math.sin(cam.phi) * Math.sin(cam.theta);
    camera.lookAt(shakeX, 0, shakeY);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const onMouseDown = (e: MouseEvent) => {
      objectsRef.current.isDragging = true;
      objectsRef.current.lastMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!objectsRef.current.isDragging) return;
      const dx = e.clientX - objectsRef.current.lastMouse.x;
      const dy = e.clientY - objectsRef.current.lastMouse.y;
      objectsRef.current.cameraAngle.theta -= dx * 0.005;
      objectsRef.current.cameraAngle.phi = Math.max(
        0.2,
        Math.min(Math.PI / 2.1, objectsRef.current.cameraAngle.phi - dy * 0.005)
      );
      objectsRef.current.lastMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      objectsRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      objectsRef.current.cameraAngle.distance = Math.max(
        5,
        Math.min(25, objectsRef.current.cameraAngle.distance + e.deltaY * 0.01)
      );
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    objectsRef.current.walls.forEach((w) => scene.remove(w));
    objectsRef.current.walls = [];
    objectsRef.current.energyBalls.forEach(({ mesh, ring }) => {
      scene.remove(mesh);
      scene.remove(ring);
    });
    objectsRef.current.energyBalls.clear();
    if (objectsRef.current.player) {
      scene.remove(objectsRef.current.player);
      objectsRef.current.player = null;
    }
    if (objectsRef.current.playerGlow) {
      scene.remove(objectsRef.current.playerGlow);
      objectsRef.current.playerGlow = null;
    }
    if (objectsRef.current.trail) {
      scene.remove(objectsRef.current.trail);
      objectsRef.current.trail = null;
    }
    objectsRef.current.interferences.forEach((m) => scene.remove(m));
    objectsRef.current.interferences.clear();
    objectsRef.current.shockwaves.forEach((m) => scene.remove(m));
    objectsRef.current.shockwaves.clear();
    if (objectsRef.current.entry) {
      scene.remove(objectsRef.current.entry);
      objectsRef.current.entry = null;
    }
    if (objectsRef.current.exit) {
      scene.remove(objectsRef.current.exit);
      objectsRef.current.exit = null;
    }

    if (!isPlaying) return;

    const maze = mazeGenerator.getMaze();
    if (!maze) return;

    buildMaze(scene, maze);
    buildPlayer(scene);
    buildEnergyBalls(scene, maze);
    buildTrail(scene);
    buildEntryExit(scene, maze.size);
  }, [isPlaying, level]);

  const buildMaze = (scene: THREE.Scene, maze: MazeData) => {
    maze.walls.forEach((seg, idx) => {
      const points = [
        new THREE.Vector3(seg.x1, 0.5, seg.z1),
        new THREE.Vector3(seg.x2, 0.5, seg.z2),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Line(geo, mat);
      line.name = `wall_${idx}`;
      scene.add(line);
      objectsRef.current.walls.push(line);
    });

    const groundGeo = new THREE.PlaneGeometry(maze.size + 1, maze.size + 1);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x0A0A14,
      transparent: true,
      opacity: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);
  };

  const buildPlayer = (scene: THREE.Scene) => {
    const playerGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const playerMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x88ccff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.95,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(physicsEngine.getPlayer().x, 0.3, physicsEngine.getPlayer().z);
    scene.add(player);
    objectsRef.current.player = player;

    const glowGeo = new THREE.RingGeometry(0.5, 1, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(player.position.x, 0.02, player.position.z);
    scene.add(glow);
    objectsRef.current.playerGlow = glow;
  };

  const buildEnergyBalls = (scene: THREE.Scene, maze: MazeData) => {
    maze.energyBalls.forEach((ball) => {
      if (ball.collected) return;

      const ballGeo = new THREE.SphereGeometry(0.5, 24, 24);
      const ballMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(ball.color),
        emissive: new THREE.Color(ball.color),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(ballGeo, ballMat);
      mesh.position.set(ball.x, 0.5, ball.z);
      scene.add(mesh);

      const ringGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ball.color),
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ball.x, 0.5, ball.z);
      scene.add(ring);

      objectsRef.current.energyBalls.set(ball.id, { mesh, ring });
    });
  };

  const buildTrail = (scene: THREE.Scene) => {
    const maxTrail = 40;
    const positions = new Float32Array(maxTrail * 3);
    const colors = new Float32Array(maxTrail * 3);
    const sizes = new Float32Array(maxTrail);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const trail = new THREE.Points(geo, mat);
    scene.add(trail);
    objectsRef.current.trail = trail;
  };

  const buildEntryExit = (scene: THREE.Scene, size: number) => {
    const offset = -(size - 1) / 2;

    const entryGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 32);
    const entryMat = new THREE.MeshBasicMaterial({
      color: 0x00E676,
      transparent: true,
      opacity: 0.7,
    });
    const entry = new THREE.Mesh(entryGeo, entryMat);
    entry.rotation.x = -Math.PI / 2;
    entry.position.set(offset, 0.05, offset);
    scene.add(entry);
    objectsRef.current.entry = entry;

    const exitGeo = new THREE.TorusGeometry(0.6, 0.08, 12, 48);
    const exitMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.9,
    });
    const exit = new THREE.Mesh(exitGeo, exitMat);
    exit.rotation.x = -Math.PI / 2;
    exit.position.set(-offset, 0.05, -offset);
    scene.add(exit);
    objectsRef.current.exit = exit;
  };

  useEffect(() => {
    physicsEngine.setOnUpdate(() => {
      forceUpdate((v) => v + 1);
    });

    const renderLoop = () => {
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!scene || !renderer || !camera) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const now = performance.now();
      objectsRef.current.wallBreath += 0.003;

      if (objectsRef.current.nebula) {
        objectsRef.current.nebula.rotation.y += 0.005;
      }

      objectsRef.current.walls.forEach((line) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = 0.6 + 0.4 * Math.sin(objectsRef.current.wallBreath * (Math.PI * 2 / 3));
      });

      const maze = mazeGenerator.getMaze();
      if (maze && isPlaying) {
        updatePlayer();
        updateEnergyBalls(maze.energyBalls);
        updateTrail();
        updateInterferences();
        updateShockwaves();

        if (objectsRef.current.exit) {
          objectsRef.current.exit.rotation.z += 0.02;
          const s = 1 + Math.sin(now * 0.005) * 0.1;
          objectsRef.current.exit.scale.set(s, s, s);
        }
        if (objectsRef.current.entry) {
          objectsRef.current.entry.rotation.z += 0.01;
        }
      }

      updateCameraPosition();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(renderLoop);
    };

    rafRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, playerRadius, isPowered, shake]);

  const updatePlayer = () => {
    const player = objectsRef.current.player;
    const playerGlow = objectsRef.current.playerGlow;
    if (!player) return;

    const p = physicsEngine.getPlayer();
    player.position.set(p.x, 0.3, p.z);

    const t = performance.now() * 0.001 / 0.4;
    const pulseRadius = p.baseRadius + Math.sin(t * Math.PI * 2) * 0.05;
    player.scale.setScalar(pulseRadius / 0.3);

    const glowMat = playerGlow?.material as THREE.MeshBasicMaterial | undefined;
    if (playerGlow && glowMat) {
      playerGlow.position.set(p.x, 0.02, p.z);
      if (p.isPowered) {
        glowMat.opacity = 0.5 + Math.sin(performance.now() * 0.004) * 0.2;
        const hue = (performance.now() * 0.000562) % 1;
        glowMat.color.setHSL(hue, 1, 0.6);
        const s = 1 + Math.sin(performance.now() * 0.01) * 0.1;
        playerGlow.scale.setScalar(s);
      } else {
        glowMat.opacity = 0;
      }
    }
  };

  const updateEnergyBalls = (balls: EnergyBall[]) => {
    const now = performance.now();
    balls.forEach((ball) => {
      const entry = objectsRef.current.energyBalls.get(ball.id);
      if (!entry) return;
      if (ball.collected) {
        if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
        if (entry.ring.parent) entry.ring.parent.remove(entry.ring);
        objectsRef.current.energyBalls.delete(ball.id);
        return;
      }
      entry.mesh.position.y = 0.5 + Math.sin(now * 0.003 + ball.id) * 0.1;
      entry.ring.rotation.z = now * 0.002 + ball.id;
      entry.ring.rotation.x = Math.PI / 2 + Math.sin(now * 0.002 + ball.id) * 0.3;
    });
  };

  const updateTrail = () => {
    const trailPoints = physicsEngine.getTrailParticles();
    const trail = objectsRef.current.trail;
    if (!trail) return;

    const positions = trail.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = trail.geometry.getAttribute('color') as THREE.BufferAttribute;
    const array = positions.array as Float32Array;
    const colorArr = colors.array as Float32Array;

    for (let i = 0; i < trailPoints.length; i++) {
      const p = trailPoints[i];
      array[i * 3] = p.x;
      array[i * 3 + 1] = 0.3 + p.y;
      array[i * 3 + 2] = p.z;
      const alpha = p.life / p.maxLife;
      colorArr[i * 3] = 1 * alpha;
      colorArr[i * 3 + 1] = 1 * alpha;
      colorArr[i * 3 + 2] = 1 * alpha;
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    trail.geometry.setDrawRange(0, trailPoints.length);
  };

  const updateInterferences = () => {
    const particles = physicsEngine.getInterferenceParticles();
    const scene = sceneRef.current;
    if (!scene) return;

    const active = new Set<number>();
    particles.forEach((p, idx) => {
      active.add(idx);
      let mesh = objectsRef.current.interferences.get(idx);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(0.35, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: p.opacity,
        });
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objectsRef.current.interferences.set(idx, mesh);
      }
      mesh.position.set(p.x, 0.3, p.z);
      mesh.scale.setScalar(p.size / 0.35);
      (mesh.material as THREE.MeshBasicMaterial).opacity = p.opacity;
    });

    objectsRef.current.interferences.forEach((mesh, idx) => {
      if (!active.has(idx)) {
        scene.remove(mesh);
        objectsRef.current.interferences.delete(idx);
      }
    });
  };

  const updateShockwaves = () => {
    const waves = physicsEngine.getShockwaves();
    const scene = sceneRef.current;
    if (!scene) return;

    const active = new Set<number>();
    waves.forEach((w, idx) => {
      active.add(idx);
      let mesh = objectsRef.current.shockwaves.get(idx);
      if (!mesh) {
        const geo = new THREE.RingGeometry(0, 0.1, 64);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(w.color),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(w.x, 0.05, w.z);
        scene.add(mesh);
        objectsRef.current.shockwaves.set(idx, mesh);
      }
      const t = 1 - w.life / w.maxLife;
      const r = w.maxRadius * t;
      const innerR = Math.max(0, r - 0.15);
      const newGeo = new THREE.RingGeometry(innerR, r, 64);
      mesh.geometry.dispose();
      mesh.geometry = newGeo;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
    });

    objectsRef.current.shockwaves.forEach((mesh, idx) => {
      if (!active.has(idx)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        objectsRef.current.shockwaves.delete(idx);
      }
    });
  };

  const flashStyle = useMemo(() => {
    if (!flashRed) return {};
    const elapsed = performance.now() - flashRed.startTime;
    if (elapsed >= flashRed.duration * 1000) return {};
    const t = elapsed / 1000;
    const blink = Math.sin(t * Math.PI * 2 * 10) > 0 ? 0.3 : 0;
    return {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      boxShadow: `inset 0 0 60px 30px rgba(255,0,0,${blink})`,
      zIndex: 10,
    } as React.CSSProperties;
  }, [flashRed, performance.now()]);

  useEffect(() => {
    if (!flashRed) return;
    const interval = setInterval(() => forceUpdate((v) => v + 1), 50);
    return () => clearInterval(interval);
  }, [flashRed]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        cursor: objectsRef.current.isDragging ? 'grabbing' : 'grab',
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} />
      {flashStyle && <div style={flashStyle} />}
    </div>
  );
};
