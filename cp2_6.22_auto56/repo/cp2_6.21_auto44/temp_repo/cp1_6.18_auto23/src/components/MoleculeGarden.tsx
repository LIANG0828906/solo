import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { SeedParams, SEED_RANGES } from '@/types';
import { useStore } from '@store/stateManager';
import { generateSpiralPosition, getFluxColor, lerp, clamp, randomRange } from '@/utils/moleculeUtils';

interface MoleculeGardenProps {
  seed: SeedParams;
  isTransitioning: boolean;
}

interface PlantNode {
  id: number;
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  baseSize: number;
  currentSize: number;
  targetSize: number;
  baseColor: THREE.Color;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  scattered: boolean;
  scatterVelocity: THREE.Vector3;
  scatterTime: number;
  hovered: boolean;
  pulsePhase: number;
  stemProgress: number;
}

const MoleculeGarden: React.FC<MoleculeGardenProps> = ({ seed, isTransitioning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);
  const nodesRef = useRef<PlantNode[]>([]);
  const linesRef = useRef<THREE.LineSegments[]>([]);
  const stemRef = useRef<THREE.Mesh | null>(null);
  const plantGroupRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const mouseWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const bendTargetRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const bendCurrentRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const hoveredNodeIdRef = useRef<number>(-1);
  const seedRef = useRef<SeedParams>(seed);
  const transitionProgressRef = useRef<number>(1);
  const previousSeedRef = useRef<SeedParams>({ ...seed });
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const fpsCounterRef = useRef<{ frames: number; lastTime: number; value: number }>({
    frames: 0,
    lastTime: 0,
    value: 60,
  });

  const TOTAL_NODES = useMemo(() => {
    const densityFactor =
      (seed.branchDensity - SEED_RANGES.branchDensity.min) /
      (SEED_RANGES.branchDensity.max - SEED_RANGES.branchDensity.min);
    return Math.floor(300 + densityFactor * 500);
  }, [seed.branchDensity]);

  const HIGH_QUALITY = TOTAL_NODES <= 500;

  const applyBendToPosition = useCallback(
    (basePos: THREE.Vector3, bendX: number, bendZ: number, stemProgress: number): THREE.Vector3 => {
      const result = basePos.clone();
      const maxBendAngle = (15 * Math.PI) / 180;
      const bendStrength = stemProgress * stemProgress;
      result.x += bendX * maxBendAngle * bendStrength * 3;
      result.z += bendZ * maxBendAngle * bendStrength * 3;
      const yFromCenter = result.y + 2;
      result.x += bendX * maxBendAngle * yFromCenter * yFromCenter * 0.3;
      result.z += bendZ * maxBendAngle * yFromCenter * yFromCenter * 0.3;
      return result;
    },
    []
  );

  const generateTargetPositions = useCallback(
    (params: SeedParams): { positions: THREE.Vector3[]; colors: THREE.Color[]; sizes: number[] } => {
      const positions: THREE.Vector3[] = [];
      const colors: THREE.Color[] = [];
      const sizes: number[] = [];

      const nodeCount = TOTAL_NODES;

      for (let i = 0; i < nodeCount; i++) {
        const pos = generateSpiralPosition(i, nodeCount, params.spiralRadius, params.branchDensity);
        positions.push(pos);

        const progress = i / nodeCount;
        const color = getFluxColor(params.colorFlux, progress);
        colors.push(color);

        const size = randomRange(0.05, 0.2);
        sizes.push(size);
      }

      return { positions, colors, sizes };
    },
    [TOTAL_NODES]
  );

  const createStarField = useCallback((scene: THREE.Scene) => {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      const tint = Math.random();
      colors[i3] = brightness * (0.8 + tint * 0.2);
      colors[i3 + 1] = brightness * (0.85 + tint * 0.15);
      colors[i3 + 2] = brightness;
      sizes[i] = 1 + Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    gradient.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    starsRef.current = stars;
    return stars;
  }, []);

  const createStem = useCallback((group: THREE.Group) => {
    const stemHeight = 4.2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -stemHeight / 2, 0),
      new THREE.Vector3(0, -stemHeight / 4, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, stemHeight / 4, 0),
      new THREE.Vector3(0, stemHeight / 2, 0),
    ]);

    const geometry = new THREE.TubeGeometry(curve, 64, 0.03, 12, false);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#4A90D9'),
      transparent: true,
      opacity: 0.6,
      shininess: 100,
      emissive: new THREE.Color('#1A3A6A'),
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });

    const stem = new THREE.Mesh(geometry, material);
    group.add(stem);
    stemRef.current = stem;
    return stem;
  }, []);

  const createNodes = useCallback(
    (group: THREE.Group) => {
      nodesRef.current = [];

      const { positions, colors, sizes } = generateTargetPositions(seed);

      for (let i = 0; i < TOTAL_NODES; i++) {
        const pos = positions[i];
        const col = colors[i];
        const size = sizes[i];

        const sphereGeo = new THREE.SphereGeometry(size, HIGH_QUALITY ? 16 : 8, HIGH_QUALITY ? 12 : 6);
        const sphereMat = new THREE.MeshPhongMaterial({
          color: col,
          emissive: col.clone().multiplyScalar(0.4),
          emissiveIntensity: 0.5,
          shininess: 120,
          transparent: true,
          opacity: 0.95,
        });
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.position.copy(pos);
        mesh.userData.nodeId = i;
        group.add(mesh);

        const glowGeo = new THREE.SphereGeometry(size * 1.3, 12, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.copy(pos);
        group.add(glowMesh);

        nodesRef.current.push({
          id: i,
          mesh,
          glowMesh,
          basePosition: pos.clone(),
          currentPosition: pos.clone(),
          targetPosition: pos.clone(),
          baseSize: size,
          currentSize: size,
          targetSize: size,
          baseColor: col.clone(),
          currentColor: col.clone(),
          targetColor: col.clone(),
          scattered: false,
          scatterVelocity: new THREE.Vector3(),
          scatterTime: 0,
          hovered: false,
          pulsePhase: Math.random() * Math.PI * 2,
          stemProgress: i / TOTAL_NODES,
        });
      }

      return nodesRef.current;
    },
    [TOTAL_NODES, HIGH_QUALITY, seed, generateTargetPositions]
  );

  const createConnections = useCallback(
    (group: THREE.Group) => {
      if (!HIGH_QUALITY) return [];

      const lines: THREE.LineSegments[] = [];
      const nodes = nodesRef.current;

      const connectionThreshold = 0.6;
      const maxConnectionsPerNode = 4;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        const distances: { idx: number; dist: number }[] = [];

        for (let j = Math.max(0, i - 20); j < Math.min(nodes.length, i + 20); j++) {
          if (i === j) continue;
          const dist = node.basePosition.distanceTo(nodes[j].basePosition);
          if (dist < connectionThreshold) {
            distances.push({ idx: j, dist });
          }
        }

        distances.sort((a, b) => a.dist - b.dist);
        const connections = distances.slice(0, maxConnectionsPerNode);

        for (const conn of connections) {
          if (conn.idx < i) continue;

          const other = nodes[conn.idx];
          const points = [node.basePosition.clone(), other.basePosition.clone()];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);

          const lineColor = node.baseColor.clone().lerp(other.baseColor, 0.5);
          const material = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: 0.3,
            linewidth: 1,
          });

          const line = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([node.currentPosition, other.currentPosition]),
            material
          );
          (line as any).nodeAId = i;
          (line as any).nodeBId = conn.idx;
          group.add(line);
          lines.push(line);
        }
      }

      linesRef.current = lines;
      return lines;
    },
    [HIGH_QUALITY]
  );

  const setupLighting = useCallback((scene: THREE.Scene) => {
    const ambientLight = new THREE.AmbientLight(0x3a4a7a, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00e5ff, 1.5, 20, 2);
    pointLight1.position.set(-4, 3, -3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00e5, 1.2, 18, 2);
    pointLight2.position.set(4, -2, 4);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x5b8def, 0.8, 15, 2);
    pointLight3.position.set(0, 5, 0);
    scene.add(pointLight3);

    const rimLight = new THREE.DirectionalLight(0x8888ff, 0.5);
    rimLight.position.set(-5, -3, -7);
    scene.add(rimLight);
  }, []);

  const transitionToNewSeed = useCallback(() => {
    const newSeed = seedRef.current;
    const prevSeed = previousSeedRef.current;

    if (
      prevSeed.spiralRadius === newSeed.spiralRadius &&
      prevSeed.branchDensity === newSeed.branchDensity &&
      prevSeed.colorFlux === newSeed.colorFlux
    ) {
      return;
    }

    const { positions, colors, sizes } = generateTargetPositions(newSeed);

    const nodes = nodesRef.current;
    for (let i = 0; i < nodes.length && i < positions.length; i++) {
      const node = nodes[i];
      node.targetPosition.copy(positions[i]);
      node.targetColor.copy(colors[i]);
      node.targetSize = sizes[i];
      node.basePosition.copy(positions[i]);
      node.baseColor.copy(colors[i]);
      node.baseSize = sizes[i];
    }

    transitionProgressRef.current = 0;
    const duration = isTransitioning ? 800 : 500;
    const startTime = performance.now();

    const animateTransition = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      transitionProgressRef.current = eased;

      if (t < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        previousSeedRef.current = { ...newSeed };
      }
    };

    animateTransition();
  }, [generateTargetPositions, isTransitioning]);

  const triggerScatter = useCallback((centerNodeId: number) => {
    const nodes = nodesRef.current;
    const centerNode = nodes[centerNodeId];
    if (!centerNode) return;

    const centerPos = centerNode.currentPosition.clone();

    const distances: { id: number; dist: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (i === centerNodeId) continue;
      const dist = nodes[i].currentPosition.distanceTo(centerPos);
      distances.push({ id: i, dist });
    }
    distances.sort((a, b) => a.dist - b.dist);

    const scatterCount = Math.min(20, distances.length);
    const scatterSpeed = 0.5;

    for (let i = 0; i < scatterCount; i++) {
      const node = nodes[distances[i].id];
      const dir = node.currentPosition.clone().sub(centerPos);
      if (dir.lengthSq() < 0.0001) {
        dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      }
      dir.normalize().multiplyScalar(scatterSpeed * (1 - i / scatterCount * 0.5));

      node.scattered = true;
      node.scatterVelocity.copy(dir);
      node.scatterTime = 0;
    }

    centerNode.scattered = true;
    centerNode.scatterVelocity.set(0, scatterSpeed * 0.5, 0);
    centerNode.scatterTime = 0;
  }, []);

  const updateNodeScatter = useCallback((node: PlantNode, deltaTime: number) => {
    if (!node.scattered) return;

    node.scatterTime += deltaTime;
    const totalDuration = 1.5;
    const scatterPhase = Math.min(node.scatterTime / 1, 1);
    const returnPhase = node.scatterTime > 1 ? Math.min((node.scatterTime - 1) / 0.5, 1) : 0;

    const easeOut = 1 - Math.pow(1 - scatterPhase, 2);
    const easeIn = returnPhase * returnPhase;

    const velocityFactor = node.scatterTime < 1 ? 1 - easeOut * 0.8 : 0;
    node.currentPosition.addScaledVector(node.scatterVelocity, deltaTime * velocityFactor);

    if (node.scatterTime > 1) {
      const returnAmount = easeIn;
      node.currentPosition.lerp(node.targetPosition, returnAmount * deltaTime * 8);
    }

    if (node.scatterTime >= totalDuration) {
      node.scattered = false;
      node.currentPosition.copy(node.targetPosition);
      node.scatterVelocity.set(0, 0, 0);
    }
  }, []);

  const updateLinePositions = useCallback(() => {
    if (!HIGH_QUALITY) return;
    const nodes = nodesRef.current;
    const lines = linesRef.current;

    for (const line of lines) {
      const aId = (line as any).nodeAId;
      const bId = (line as any).nodeBId;
      if (aId === undefined || bId === undefined) continue;

      const nodeA = nodes[aId];
      const nodeB = nodes[bId];
      if (!nodeA || !nodeB) continue;

      const positions = line.geometry.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(0, nodeA.currentPosition.x, nodeA.currentPosition.y, nodeA.currentPosition.z);
      positions.setXYZ(1, nodeB.currentPosition.x, nodeB.currentPosition.y, nodeB.currentPosition.z);
      positions.needsUpdate = true;
    }
  }, [HIGH_QUALITY]);

  const handleNodeHover = useCallback(
    (nodeId: number) => {
      const nodes = nodesRef.current;

      if (hoveredNodeIdRef.current !== -1 && hoveredNodeIdRef.current !== nodeId) {
        const prevNode = nodes[hoveredNodeIdRef.current];
        if (prevNode) {
          prevNode.hovered = false;
          gsap.killTweensOf(prevNode.mesh.scale);
          gsap.to(prevNode.mesh.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.25,
            ease: 'power2.out',
          });
          const glowMat = prevNode.glowMesh.material as THREE.MeshBasicMaterial;
          gsap.to(glowMat, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.out',
          });
        }
      }

      if (nodeId === -1) {
        hoveredNodeIdRef.current = -1;
        return;
      }

      const node = nodes[nodeId];
      if (!node || node.hovered) return;

      node.hovered = true;
      hoveredNodeIdRef.current = nodeId;

      gsap.killTweensOf(node.mesh.scale);
      gsap.to(node.mesh.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 0.2,
        ease: 'back.out(1.7)',
      });

      const glowMat = node.glowMesh.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.4;
    },
    []
  );

  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!containerRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      mouseRef.current.set(x, y);

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersectPoint = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, intersectPoint);
      if (intersectPoint) {
        mouseWorldRef.current.copy(intersectPoint);
      }

      if (isDraggingRef.current) {
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        bendTargetRef.current.x = clamp(dx / 300, -1, 1);
        bendTargetRef.current.z = clamp(dy / 300, -1, 1);
      }

      if (plantGroupRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const meshes = nodesRef.current.map((n) => n.mesh);
        const intersects = raycasterRef.current.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const nodeId = hitMesh.userData.nodeId as number;
          handleNodeHover(nodeId);
          if (containerRef.current) {
            containerRef.current.style.cursor = 'pointer';
          }
        } else {
          handleNodeHover(-1);
          if (containerRef.current && !isDraggingRef.current) {
            containerRef.current.style.cursor = 'grab';
          }
        }
      }
    },
    [handleNodeHover]
  );

  const handlePointerDown = useCallback((event: PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current.set(event.clientX, event.clientY);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    const didMove =
      Math.abs(event.clientX - dragStartRef.current.x) > 3 ||
      Math.abs(event.clientY - dragStartRef.current.y) > 3;

    if (!didMove && hoveredNodeIdRef.current !== -1) {
      triggerScatter(hoveredNodeIdRef.current);
    }

    isDraggingRef.current = false;
    bendTargetRef.current.x = 0;
    bendTargetRef.current.z = 0;
    if (containerRef.current) {
      containerRef.current.style.cursor = hoveredNodeIdRef.current !== -1 ? 'pointer' : 'grab';
    }
  }, [triggerScatter]);

  const animate = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const deltaTime = Math.min(clockRef.current.getDelta(), 0.05);
    const elapsed = clockRef.current.elapsedTime;

    fpsCounterRef.current.frames++;
    if (elapsed - fpsCounterRef.current.lastTime >= 1) {
      fpsCounterRef.current.value = fpsCounterRef.current.frames;
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = elapsed;
    }

    const bendSmoothFactor = 1 - Math.pow(0.001, deltaTime / 0.3);
    bendCurrentRef.current.x = lerp(
      bendCurrentRef.current.x,
      bendTargetRef.current.x,
      bendSmoothFactor
    );
    bendCurrentRef.current.z = lerp(
      bendCurrentRef.current.z,
      bendTargetRef.current.z,
      bendSmoothFactor
    );

    if (starsRef.current) {
      starsRef.current.rotation.y = elapsed * 0.01;
      starsRef.current.rotation.x = Math.sin(elapsed * 0.005) * 0.05;
    }

    const nodes = nodesRef.current;
    const morphSpeed = 1 - Math.pow(0.001, deltaTime / 0.5);
    const pulsePeriod = 0.8;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (!node.scattered) {
        const bentTarget = applyBendToPosition(
          node.targetPosition,
          bendCurrentRef.current.x,
          bendCurrentRef.current.z,
          node.stemProgress
        );
        node.currentPosition.lerp(bentTarget, morphSpeed);
      } else {
        updateNodeScatter(node, deltaTime);
      }

      node.mesh.position.copy(node.currentPosition);
      node.glowMesh.position.copy(node.currentPosition);

      node.currentSize = lerp(node.currentSize, node.targetSize, morphSpeed);
      let displaySize = node.currentSize;

      if (node.hovered) {
        node.pulsePhase += deltaTime;
        const pulse = 1 + 0.3 * Math.sin((node.pulsePhase * Math.PI * 2) / pulsePeriod);
        displaySize *= pulse;
        const glowMat = node.glowMesh.material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.3 + 0.2 * Math.sin((node.pulsePhase * Math.PI * 2) / pulsePeriod);
        node.glowMesh.scale.setScalar(displaySize * 2 / node.currentSize);
      }

      const meshScale = node.hovered ? 1.5 : 1;
      const targetMeshScale = (displaySize / node.baseSize) * meshScale;
      node.mesh.scale.lerp(new THREE.Vector3(targetMeshScale, targetMeshScale, targetMeshScale), 0.15);

      node.currentColor.lerp(node.targetColor, morphSpeed);
      const meshMat = node.mesh.material as THREE.MeshPhongMaterial;
      meshMat.color.copy(node.currentColor);
      meshMat.emissive.copy(node.currentColor).multiplyScalar(0.4 + 0.1 * Math.sin(elapsed * 2 + i * 0.1));

      const glowMat = node.glowMesh.material as THREE.MeshBasicMaterial;
      glowMat.color.copy(node.currentColor);
    }

    if (plantGroupRef.current) {
      plantGroupRef.current.rotation.y = elapsed * 0.05;
      plantGroupRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.03;
    }

    updateLinePositions();

    if (cameraRef.current) {
      const camAngle = elapsed * 0.08;
      const camRadius = 8;
      cameraRef.current.position.x = Math.sin(camAngle) * camRadius;
      cameraRef.current.position.z = Math.cos(camAngle) * camRadius;
      cameraRef.current.position.y = 1 + Math.sin(elapsed * 0.15) * 0.5;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [applyBendToPosition, updateLinePositions, updateNodeScatter]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0a0e27, 0.025);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 1, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    setupLighting(scene);
    createStarField(scene);

    const plantGroup = new THREE.Group();
    scene.add(plantGroup);
    plantGroupRef.current = plantGroup;

    createNodes(plantGroup);
    createStem(plantGroup);
    createConnections(plantGroup);

    clockRef.current.start();
    animate();

    window.addEventListener('resize', handleResize);
    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);

      cancelAnimationFrame(animationIdRef.current);

      nodesRef.current.forEach((n) => {
        n.mesh.geometry.dispose();
        (n.mesh.material as THREE.Material).dispose();
        n.glowMesh.geometry.dispose();
        (n.glowMesh.material as THREE.Material).dispose();
      });
      linesRef.current.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      if (stemRef.current) {
        stemRef.current.geometry.dispose();
        (stemRef.current.material as THREE.Material).dispose();
      }
      if (starsRef.current) {
        starsRef.current.geometry.dispose();
        (starsRef.current.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    seedRef.current = seed;
    transitionToNewSeed();
  }, [seed, transitionToNewSeed]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    cursor: 'grab',
    touchAction: 'none',
  };

  const fpsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    color: 'rgba(150,180,255,0.6)',
    fontSize: '11px',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    zIndex: 5,
    textShadow: '0 0 8px rgba(0,0,0,0.8)',
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    color: 'rgba(150,180,255,0.6)',
    fontSize: '11px',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    zIndex: 5,
    textShadow: '0 0 8px rgba(0,0,0,0.8)',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={fpsStyle}>FPS: 60 | NODES: {TOTAL_NODES} | {HIGH_QUALITY ? 'HQ' : 'PERF'}</div>
      <div style={badgeStyle}>MOLECULAR GARDEN v1.0</div>
    </div>
  );
};

export default MoleculeGarden;
