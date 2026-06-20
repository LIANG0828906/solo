import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { TrapType, TrapParams, DebugInfo, TrapState } from './trapData';

interface GameCanvasProps {
  trapType: TrapType;
  params: TrapParams;
  onDebugUpdate: (info: DebugInfo) => void;
}

interface TrapObjects {
  group: THREE.Group;
  animate: (time: number, delta: number, duration: number) => TrapState;
  collisionBox: { width: number; height: number; depth: number };
}

function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const g = 40 + Math.random() * 30;
    ctx.fillStyle = `rgba(${g}, ${g}, ${g + 10}, 0.5)`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  for (let y = 0; y < 256; y += 64) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(0, 0, 512, 512);
  const tileSize = 64;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const g = 30 + Math.random() * 20;
      ctx.fillStyle = `rgb(${g}, ${g}, ${g + 8})`;
      ctx.fillRect(col * tileSize + 1, row * tileSize + 1, tileSize - 2, tileSize - 2);
      for (let i = 0; i < 20; i++) {
        const px = col * tileSize + Math.random() * tileSize;
        const py = row * tileSize + Math.random() * tileSize;
        const sg = 25 + Math.random() * 20;
        ctx.fillStyle = `rgba(${sg}, ${sg}, ${sg + 5}, 0.6)`;
        ctx.fillRect(px, py, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createDungeonRoom(scene: THREE.Scene) {
  const floorTex = createFloorTexture();
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallTex = createStoneTexture();
  wallTex.repeat.set(3, 1);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });

  const wallConfigs = [
    { pos: [0, 3, -6], rot: [0, 0, 0], size: [12, 6] },
    { pos: [0, 3, 6], rot: [0, Math.PI, 0], size: [12, 6] },
    { pos: [-6, 3, 0], rot: [0, Math.PI / 2, 0], size: [12, 6] },
    { pos: [6, 3, 0], rot: [0, -Math.PI / 2, 0], size: [12, 6] },
  ];

  wallConfigs.forEach(cfg => {
    const geo = new THREE.PlaneGeometry(cfg.size[0], cfg.size[1]);
    const mesh = new THREE.Mesh(geo, wallMat.clone());
    mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
  });
}

function createTriggerRadiusCircle(triggerRadius: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(triggerRadius - 0.05, triggerRadius, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xe94560,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

function createTriggerRadiusFill(triggerRadius: number): THREE.Mesh {
  const geo = new THREE.CircleGeometry(triggerRadius, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xe94560,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  return mesh;
}

function createSpikeTrap(): TrapObjects {
  const group = new THREE.Group();
  const spikes: THREE.Mesh[] = [];
  const positions: [number, number][] = [
    [0, 0], [-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5], [-0.4, -0.4], [0.4, 0.4],
  ];

  positions.forEach(([x, z]) => {
    const geo = new THREE.ConeGeometry(0.08, 0.6, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.6, roughness: 0.3 });
    const spike = new THREE.Mesh(geo, mat);
    spike.position.set(x, -0.3, z);
    spike.castShadow = true;
    group.add(spike);
    spikes.push(spike);
  });

  const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.1, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.4, roughness: 0.5 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const animate = (time: number, _delta: number, duration: number): TrapState => {
    const period = duration;
    const t = (time % period) / period;
    let spikeY: number;
    let state: TrapState;

    if (t < 0.4) {
      const p = t / 0.4;
      spikeY = -0.3 + 0.6 * easeOutCubic(p);
      state = 'triggered';
    } else if (t < 0.6) {
      spikeY = 0.3;
      state = 'triggered';
    } else {
      const p = (t - 0.6) / 0.4;
      spikeY = 0.3 - 0.6 * easeInCubic(p);
      state = 'cooldown';
    }

    if (t < 0.05) state = 'standby';

    spikes.forEach((spike, i) => {
      spike.position.y = spikeY;
      const mat = spike.material as THREE.MeshStandardMaterial;
      if (state === 'triggered') {
        const flicker = 0.5 + 0.5 * Math.sin(time * 15 + i);
        mat.emissive.setRGB(flicker * 0.8, 0, 0);
        mat.emissiveIntensity = flicker;
      } else {
        mat.emissive.setRGB(0, 0, 0);
        mat.emissiveIntensity = 0;
      }
    });

    return state;
  };

  return {
    group,
    animate,
    collisionBox: { width: 1.6, height: 0.9, depth: 1.6 },
  };
}

function createBoulderTrap(): TrapObjects {
  const group = new THREE.Group();

  const boulderGeo = new THREE.SphereGeometry(0.5, 12, 12);
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.3, roughness: 0.7 });
  const boulder = new THREE.Mesh(boulderGeo, boulderMat);
  boulder.castShadow = true;
  group.add(boulder);

  const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 4, 6);
  const chainMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.2 });
  const chain = new THREE.Mesh(chainGeo, chainMat);
  chain.position.y = 2.5;
  group.add(chain);

  const ceilingMountGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
  const ceilingMount = new THREE.Mesh(ceilingMountGeo, chainMat);
  ceilingMount.position.y = 4.55;
  group.add(ceilingMount);

  const impactGeo = new THREE.RingGeometry(0.3, 0.8, 32);
  const impactMat = new THREE.MeshBasicMaterial({ color: 0xe94560, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const impact = new THREE.Mesh(impactGeo, impactMat);
  impact.rotation.x = -Math.PI / 2;
  impact.position.y = 0.05;
  group.add(impact);

  const animate = (time: number, _delta: number, duration: number): TrapState => {
    const period = duration;
    const t = (time % period) / period;
    let state: TrapState;

    if (t < 0.3) {
      boulder.position.y = 4 - 3.5 * easeInCubic(t / 0.3);
      state = 'triggered';
    } else if (t < 0.5) {
      const bounceT = (t - 0.3) / 0.2;
      boulder.position.y = 0.5 + 0.3 * Math.sin(bounceT * Math.PI);
      state = 'triggered';
    } else {
      const riseT = (t - 0.5) / 0.5;
      boulder.position.y = 0.5 + 3.5 * easeInOutCubic(riseT);
      state = riseT < 0.3 ? 'cooldown' : 'standby';
    }

    if (t < 0.05) state = 'standby';

    impactMat.opacity = (t > 0.28 && t < 0.6) ? 0.3 * (1 - (t - 0.28) / 0.32) : 0;

    const boulderMat2 = boulder.material as THREE.MeshStandardMaterial;
    if (state === 'triggered') {
      const flicker = 0.3 + 0.3 * Math.sin(time * 10);
      boulderMat2.emissive.setRGB(flicker, flicker * 0.2, 0);
    } else {
      boulderMat2.emissive.setRGB(0, 0, 0);
    }

    return state;
  };

  return {
    group,
    animate,
    collisionBox: { width: 1.2, height: 1.0, depth: 1.2 },
  };
}

function createPoisonTrap(): TrapObjects {
  const group = new THREE.Group();

  const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, metalness: 0.2, roughness: 0.6 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.075;
  base.castShadow = true;
  group.add(base);

  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < 20; i++) {
    const size = 0.05 + Math.random() * 0.08;
    const pGeo = new THREE.SphereGeometry(size, 8, 8);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.6,
      emissive: 0x22aa22,
      emissiveIntensity: 0.5,
    });
    const particle = new THREE.Mesh(pGeo, pMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 1.0;
    particle.position.set(Math.cos(angle) * radius, 0.2 + Math.random() * 1.5, Math.sin(angle) * radius);
    particle.userData = { angle, baseRadius: radius, speed: 0.3 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2 };
    group.add(particle);
    particles.push(particle);
  }

  const animate = (time: number, _delta: number, duration: number): TrapState => {
    const period = duration;
    const t = (time % period) / period;

    const spreadFactor = t < 0.3 ? easeOutCubic(t / 0.3) : t < 0.6 ? 1 : 1 - easeInCubic((t - 0.6) / 0.4);
    const state: TrapState = t < 0.05 ? 'standby' : t < 0.6 ? 'triggered' : 'cooldown';

    particles.forEach(p => {
      const ud = p.userData;
      const r = ud.baseRadius * spreadFactor;
      const a = ud.angle + time * ud.speed;
      p.position.x = Math.cos(a) * r;
      p.position.z = Math.sin(a) * r;
      p.position.y = 0.2 + (0.5 + 0.5 * Math.sin(time * 2 + ud.phase)) * 1.5 * spreadFactor;
      const mat = p.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.3 + 0.4 * spreadFactor;
    });

    return state;
  };

  return {
    group,
    animate,
    collisionBox: { width: 2.0, height: 1.5, depth: 2.0 },
  };
}

function createBladeTrap(): TrapObjects {
  const group = new THREE.Group();

  const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.7, roughness: 0.3 });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 0.75;
  pillar.castShadow = true;
  group.add(pillar);

  const armGroup = new THREE.Group();
  armGroup.position.y = 1.2;
  group.add(armGroup);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const bladeGeo = new THREE.BoxGeometry(1.0, 0.05, 0.15);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xaaaacc, metalness: 0.9, roughness: 0.1 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
    blade.rotation.y = -angle;
    blade.castShadow = true;
    armGroup.add(blade);
  }

  const hubGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.8, roughness: 0.2 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.y = 1.2;
  hub.castShadow = true;
  group.add(hub);

  const animate = (time: number, _delta: number, duration: number): TrapState => {
    const speed = 1.0 / Math.max(0.5, duration * 0.5);
    armGroup.rotation.y = time * speed * Math.PI * 2;

    const t = (time % duration) / duration;
    const state: TrapState = t < 0.05 ? 'standby' : t < 0.7 ? 'triggered' : 'cooldown';

    const hubMat2 = hub.material as THREE.MeshStandardMaterial;
    if (state === 'triggered') {
      const flicker = 0.3 + 0.3 * Math.sin(time * 12);
      hubMat2.emissive.setRGB(flicker, 0, 0);
    } else {
      hubMat2.emissive.setRGB(0, 0, 0);
    }

    return state;
  };

  return {
    group,
    animate,
    collisionBox: { width: 2.2, height: 0.15, depth: 2.2 },
  };
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t: number): number { return t * t * t; }
function easeInOutCubic(t: number): number { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

const TRAP_FACTORIES: Record<TrapType, () => TrapObjects> = {
  spike: createSpikeTrap,
  boulder: createBoulderTrap,
  poison: createPoisonTrap,
  blade: createBladeTrap,
};

export default function GameCanvas({ trapType, params, onDebugUpdate }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trapRef = useRef<TrapObjects | null>(null);
  const triggerRingRef = useRef<THREE.Mesh | null>(null);
  const triggerFillRef = useRef<THREE.Mesh | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const animFrameRef = useRef(0);
  const fadeRef = useRef({ alpha: 0, targetAlpha: 1 });

  const onDebugUpdateRef = useRef(onDebugUpdate);
  onDebugUpdateRef.current = onDebugUpdate;

  const updateTrap = useCallback((type: TrapType) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (trapRef.current) {
      scene.remove(trapRef.current.group);
      trapRef.current.group.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
      });
    }

    const trap = TRAP_FACTORIES[type]();
    scene.add(trap.group);
    trapRef.current = trap;
    fadeRef.current = { alpha: 0, targetAlpha: 1 };
  }, []);

  const updateTriggerRadius = useCallback((radius: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (triggerRingRef.current) {
      scene.remove(triggerRingRef.current);
      triggerRingRef.current.geometry.dispose();
      (triggerRingRef.current.material as THREE.Material).dispose();
    }
    if (triggerFillRef.current) {
      scene.remove(triggerFillRef.current);
      triggerFillRef.current.geometry.dispose();
      (triggerFillRef.current.material as THREE.Material).dispose();
    }

    const ring = createTriggerRadiusCircle(radius);
    const fill = createTriggerRadiusFill(radius);
    scene.add(ring);
    scene.add(fill);
    triggerRingRef.current = ring;
    triggerFillRef.current = fill;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(5, 6, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
    scene.add(ambientLight);

    const torchLight1 = new THREE.PointLight(0xff8844, 2, 12, 2);
    torchLight1.position.set(-4, 4, -4);
    torchLight1.castShadow = true;
    torchLight1.shadow.mapSize.set(512, 512);
    scene.add(torchLight1);

    const torchLight2 = new THREE.PointLight(0xff6633, 1.5, 10, 2);
    torchLight2.position.set(4, 3, 4);
    scene.add(torchLight2);

    const topLight = new THREE.PointLight(0x4444ff, 0.5, 8, 2);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    createDungeonRoom(scene);

    updateTrap(trapType);
    updateTriggerRadius(params.triggerRadius);

    clockRef.current.start();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      const torchFlicker = 0.8 + 0.2 * Math.sin(elapsed * 8) * Math.sin(elapsed * 3.7);
      torchLight1.intensity = 2 * torchFlicker;
      torchLight2.intensity = 1.5 * (1.2 - torchFlicker * 0.4);

      const trap = trapRef.current;
      let state: TrapState = 'standby';
      if (trap) {
        state = trap.animate(elapsed, delta, params.duration);

        const fade = fadeRef.current;
        if (fade.alpha < fade.targetAlpha) {
          fade.alpha = Math.min(fade.alpha + delta * 2.0, fade.targetAlpha);
        }
        trap.group.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            const mat = obj.material as THREE.MeshStandardMaterial;
            if (mat.transparent !== undefined) {
              mat.transparent = true;
              mat.opacity = fade.alpha;
            }
          }
        });
      }

      onDebugUpdateRef.current({
        collisionBox: {
          x: 0,
          y: trap ? (trap.collisionBox.height / 2) : 0,
          z: 0,
          width: trap ? trap.collisionBox.width : 0,
          height: trap ? trap.collisionBox.height : 0,
          depth: trap ? trap.collisionBox.depth : 0,
        },
        damageRange: params.triggerRadius,
        state,
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateTrap(trapType);
  }, [trapType, updateTrap]);

  useEffect(() => {
    updateTriggerRadius(params.triggerRadius);
  }, [params.triggerRadius, updateTriggerRadius]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
}
