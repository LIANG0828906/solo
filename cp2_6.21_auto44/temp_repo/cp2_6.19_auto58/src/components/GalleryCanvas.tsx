import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useGalleryStore, Artwork, ENTRY_POSITION, ROOM_WIDTH, ROOM_DEPTH } from '../store/galleryStore';

const FRAME_SIZE = 1.5;
const FRAME_BORDER = 0.1;
const FRAME_DEPTH = 0.12;
const WALL_HEIGHT = 6;
const SLOT_COLS = 3;
const SLOT_ROWS = 2;
const COLLISION_DISTANCE = 0.8;
const MOVE_SPEED = 5;
const RUN_SPEED = 10;
const MOUSE_SENSITIVITY = 0.002;
const LIGHT_TRANSITION_DURATION = 1500;

interface FrameMesh extends THREE.Mesh {
  artworkId?: string;
}

interface FrameGroup extends THREE.Group {
  userData: {
    artworkId: string;
    originalPosition: THREE.Vector3;
    isHovered: boolean;
    glowMesh: THREE.Mesh;
  };
}

const GalleryCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameGroupsRef = useRef<Map<string, FrameGroup>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredFrameRef = useRef<FrameGroup | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const cameraPosRef = useRef<THREE.Vector3>(
    new THREE.Vector3(ENTRY_POSITION.x, ENTRY_POSITION.y, ENTRY_POSITION.z)
  );
  const cameraYawRef = useRef(0);
  const cameraPitchRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const isDraggingRef = useRef(false);

  const dayLightsRef = useRef<{
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
  } | null>(null);
  const nightLightsRef = useRef<{
    points: THREE.PointLight[];
    spots: THREE.SpotLight[];
  } | null>(null);
  const lightingTransitionRef = useRef<{
    progress: number;
    startMode: 'day' | 'night';
    targetMode: 'day' | 'night';
  } | null>(null);

  const lightingMode = useGalleryStore((state) => state.lightingMode);
  const artworks = useGalleryStore((state) => state.artworks);
  const setSelectedArtwork = useGalleryStore((state) => state.setSelectedArtwork);
  const resetCamera = useGalleryStore((state) => state.resetCamera);
  const selectedArtwork = useGalleryStore((state) => state.selectedArtwork);

  const getWallSlotPosition = useCallback(
    (wallIndex: number, slotIndex: number): { position: THREE.Vector3; rotation: THREE.Euler } => {
      const col = slotIndex % SLOT_COLS;
      const row = Math.floor(slotIndex / SLOT_COLS);
      const halfW = ROOM_WIDTH / 2;
      const halfD = ROOM_DEPTH / 2;
      void halfW;

      const colSpacing = (ROOM_WIDTH - 4) / (SLOT_COLS - 1);
      const rowSpacing = (WALL_HEIGHT - 3) / (SLOT_ROWS - 1);

      const xOffset = col * colSpacing - (ROOM_WIDTH - 4) / 2;
      const yOffset = row * rowSpacing + 1.5;

      let position = new THREE.Vector3();
      let rotation = new THREE.Euler();

      switch (wallIndex) {
        case 0:
          position.set(xOffset, yOffset, -halfD + 0.05);
          rotation.set(0, 0, 0);
          break;
        case 1:
          position.set(halfD - 0.05, yOffset, -xOffset);
          rotation.set(0, Math.PI / 2, 0);
          break;
        case 2:
          position.set(-xOffset, yOffset, halfD - 0.05);
          rotation.set(0, Math.PI, 0);
          break;
        case 3:
          position.set(-halfD + 0.05, yOffset, xOffset);
          rotation.set(0, -Math.PI / 2, 0);
          break;
      }

      return { position, rotation };
    },
    []
  );

  const createWoodFrameMaterial = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

    const gradient = ctx.createLinearGradient(0, 0, 128, 128);
    gradient.addColorStop(0, '#a0522d');
    gradient.addColorStop(0.3, '#8b4513');
    gradient.addColorStop(0.5, '#a0522d');
    gradient.addColorStop(0.7, '#6b3410');
    gradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(60, 30, 10, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      const y = Math.random() * 128;
      ctx.moveTo(0, y);
      for (let x = 0; x < 128; x += 10) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 4);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1,
    });
  }, []);

  const createFrame = useCallback(
    (artwork: Artwork): FrameGroup => {
      const group = new THREE.Group() as FrameGroup;

      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(artwork.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const borderSize = FRAME_SIZE + FRAME_BORDER * 2;
      const borderGeom = new THREE.BoxGeometry(borderSize, borderSize, FRAME_DEPTH);
      const borderMat = createWoodFrameMaterial();
      const borderMesh = new THREE.Mesh(borderGeom, borderMat);
      borderMesh.position.z = -FRAME_DEPTH / 2;
      group.add(borderMesh);

      const canvasGeom = new THREE.PlaneGeometry(FRAME_SIZE, FRAME_SIZE);
      const canvasMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.9,
        metalness: 0,
      });
      const canvasMesh: FrameMesh = new THREE.Mesh(canvasGeom, canvasMat);
      canvasMesh.artworkId = artwork.id;
      canvasMesh.position.z = 0.01;
      group.add(canvasMesh);

      const glowGeom = new THREE.PlaneGeometry(borderSize * 1.4, borderSize * 1.4);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      glowMesh.position.z = -0.2;
      group.add(glowMesh);

      const { position, rotation } = getWallSlotPosition(artwork.wallIndex, artwork.slotIndex);
      group.position.copy(position);
      group.rotation.copy(rotation);

      group.userData = {
        artworkId: artwork.id,
        originalPosition: position.clone(),
        isHovered: false,
        glowMesh,
      };

      return group;
    },
    [createWoodFrameMaterial, getWallSlotPosition]
  );

  const checkCollision = useCallback((position: THREE.Vector3): boolean => {
    const halfW = ROOM_WIDTH / 2;
    const halfD = ROOM_DEPTH / 2;
    return (
      position.x < -halfW + COLLISION_DISTANCE ||
      position.x > halfW - COLLISION_DISTANCE ||
      position.z < -halfD + COLLISION_DISTANCE ||
      position.z > halfD - COLLISION_DISTANCE
    );
  }, []);

  const createRoom = useCallback((scene: THREE.Scene) => {
    const halfW = ROOM_WIDTH / 2;
    const halfD = ROOM_DEPTH / 2;
    const halfH = WALL_HEIGHT / 2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0eb,
      roughness: 0.9,
      metalness: 0,
      side: THREE.BackSide,
    });

    const roomGeom = new THREE.BoxGeometry(ROOM_WIDTH, WALL_HEIGHT, ROOM_DEPTH);
    const roomMesh = new THREE.Mesh(roomGeom, wallMat);
    roomMesh.position.y = halfH;
    scene.add(roomMesh);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    if (floorCtx) {
      const floorGradient = floorCtx.createLinearGradient(0, 0, 0, 512);
      floorGradient.addColorStop(0, '#d4d4d4');
      floorGradient.addColorStop(0.5, '#c0c0c0');
      floorGradient.addColorStop(1, '#b8b8b8');
      floorCtx.fillStyle = floorGradient;
      floorCtx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 50; i++) {
        floorCtx.strokeStyle = `rgba(120, 120, 120, ${0.05 + Math.random() * 0.1})`;
        floorCtx.lineWidth = 0.5 + Math.random() * 2;
        floorCtx.beginPath();
        const y = Math.random() * 512;
        floorCtx.moveTo(0, y);
        for (let x = 0; x < 512; x += 20) {
          floorCtx.lineTo(x, y + (Math.random() - 0.5) * 6);
        }
        floorCtx.stroke();
      }
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    const floorGeom = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0.01;
    scene.add(floorMesh);

    const ceilingGeom = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f5,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = WALL_HEIGHT;
    scene.add(ceilingMesh);

    const skirtingMat = new THREE.MeshStandardMaterial({
      color: 0xd4c4b0,
      roughness: 0.8,
    });

    const skirtingHeight = 0.15;
    const skirtingGeom1 = new THREE.BoxGeometry(ROOM_WIDTH, skirtingHeight, 0.05);
    const skirtingGeom2 = new THREE.BoxGeometry(0.05, skirtingHeight, ROOM_DEPTH);

    [
      { pos: [0, skirtingHeight / 2, -halfD], rot: [0, 0, 0], geom: skirtingGeom1 },
      { pos: [0, skirtingHeight / 2, halfD], rot: [0, 0, 0], geom: skirtingGeom1 },
      { pos: [-halfW, skirtingHeight / 2, 0], rot: [0, 0, 0], geom: skirtingGeom2 },
      { pos: [halfW, skirtingHeight / 2, 0], rot: [0, 0, 0], geom: skirtingGeom2 },
    ].forEach(({ pos, geom }) => {
      const m = new THREE.Mesh(geom, skirtingMat);
      m.position.set(pos[0], pos[1], pos[2]);
      scene.add(m);
    });
  }, []);

  const setupLighting = useCallback((scene: THREE.Scene) => {
    const halfW = ROOM_WIDTH / 2;
    const halfD = ROOM_DEPTH / 2;

    const ambientDay = new THREE.AmbientLight(0xfff5e6, 0.6);
    scene.add(ambientDay);

    const directionalDay = new THREE.DirectionalLight(0xffe8cc, 0.8);
    directionalDay.position.set(5, 8, 5);
    directionalDay.castShadow = true;
    scene.add(directionalDay);

    dayLightsRef.current = { ambient: ambientDay, directional: directionalDay };

    const pointPositions = [
      [-halfW + 2, WALL_HEIGHT - 0.5, -halfD + 2],
      [halfW - 2, WALL_HEIGHT - 0.5, -halfD + 2],
      [-halfW + 2, WALL_HEIGHT - 0.5, halfD - 2],
      [halfW - 2, WALL_HEIGHT - 0.5, halfD - 2],
    ];

    const pointLights: THREE.PointLight[] = [];
    pointPositions.forEach((pos) => {
      const light = new THREE.PointLight(0x8899cc, 0, 15, 2);
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
      pointLights.push(light);
    });

    const spotPositions = [
      [0, WALL_HEIGHT - 0.3, -halfD + 1],
      [halfW - 1, WALL_HEIGHT - 0.3, 0],
      [0, WALL_HEIGHT - 0.3, halfD - 1],
      [-halfW + 1, WALL_HEIGHT - 0.3, 0],
    ];

    const spotTargets = [
      [0, WALL_HEIGHT / 2, -halfD + 0.1],
      [halfW - 0.1, WALL_HEIGHT / 2, 0],
      [0, WALL_HEIGHT / 2, halfD - 0.1],
      [-halfW + 0.1, WALL_HEIGHT / 2, 0],
    ];

    const spotLights: THREE.SpotLight[] = [];
    spotPositions.forEach((pos, i) => {
      const light = new THREE.SpotLight(0xaabbee, 0, 20, Math.PI / 5, 0.5, 1);
      light.position.set(pos[0], pos[1], pos[2]);
      light.target.position.set(spotTargets[i][0], spotTargets[i][1], spotTargets[i][2]);
      scene.add(light);
      scene.add(light.target);
      spotLights.push(light);
    });

    nightLightsRef.current = { points: pointLights, spots: spotLights };
  }, []);

  const updateLighting = useCallback((delta: number) => {
    const currentMode = useGalleryStore.getState().lightingMode;
    const transition = lightingTransitionRef.current;

    if (transition) {
      transition.progress += delta;
      const t = Math.min(transition.progress / (LIGHT_TRANSITION_DURATION / 1000), 1);
      const easeT = t * t * (3 - 2 * t);

      const dayIntensity = transition.targetMode === 'day' ? easeT : 1 - easeT;
      const nightIntensity = transition.targetMode === 'night' ? easeT : 1 - easeT;

      if (dayLightsRef.current) {
        dayLightsRef.current.ambient.intensity = 0.6 * dayIntensity;
        dayLightsRef.current.directional.intensity = 0.8 * dayIntensity;
      }
      if (nightLightsRef.current) {
        nightLightsRef.current.points.forEach((l) => (l.intensity = 1.0 * nightIntensity));
        nightLightsRef.current.spots.forEach((l) => (l.intensity = 1.5 * nightIntensity));
      }

      if (t >= 1) {
        lightingTransitionRef.current = null;
      }
    } else {
      if (dayLightsRef.current) {
        dayLightsRef.current.ambient.intensity = currentMode === 'day' ? 0.6 : 0;
        dayLightsRef.current.directional.intensity = currentMode === 'day' ? 0.8 : 0;
      }
      if (nightLightsRef.current) {
        nightLightsRef.current.points.forEach((l) => (l.intensity = currentMode === 'night' ? 1.0 : 0));
        nightLightsRef.current.spots.forEach((l) => (l.intensity = currentMode === 'night' ? 1.5 : 0));
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f0eb);
    scene.fog = new THREE.Fog(0xf5f0eb, 10, 40);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.copy(cameraPosRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    createRoom(scene);
    setupLighting(scene);

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      const speed = keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight')
        ? RUN_SPEED
        : MOVE_SPEED;

      const forward = new THREE.Vector3(
        -Math.sin(cameraYawRef.current),
        0,
        -Math.cos(cameraYawRef.current)
      );
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (keysRef.current.has('KeyW')) move.add(forward);
      if (keysRef.current.has('KeyS')) move.sub(forward);
      if (keysRef.current.has('KeyD')) move.add(right);
      if (keysRef.current.has('KeyA')) move.sub(right);

      if (move.length() > 0) {
        move.normalize().multiplyScalar(speed * delta);
        const newPos = cameraPosRef.current.clone().add(move);
        if (!checkCollision(newPos)) {
          cameraPosRef.current.copy(newPos);
        } else {
          const newPosX = cameraPosRef.current.clone();
          newPosX.x += move.x;
          if (!checkCollision(newPosX)) {
            cameraPosRef.current.x = newPosX.x;
          }
          const newPosZ = cameraPosRef.current.clone();
          newPosZ.z += move.z;
          if (!checkCollision(newPosZ)) {
            cameraPosRef.current.z = newPosZ.z;
          }
        }
      }

      camera.position.copy(cameraPosRef.current);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = cameraYawRef.current;
      camera.rotation.x = cameraPitchRef.current;

      frameGroupsRef.current.forEach((group) => {
        const targetZ = group.userData.isHovered ? 0.15 : 0;
        const currentZ = group.position.z - group.userData.originalPosition.z;
        group.position.z += (targetZ - currentZ) * delta * 8;

        const glowMat = group.userData.glowMesh.material as THREE.MeshBasicMaterial;
        const targetOpacity = group.userData.isHovered ? 0.4 : 0;
        glowMat.opacity += (targetOpacity - glowMat.opacity) * delta * 6;
      });

      updateLighting(delta);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [createRoom, setupLighting, checkCollision, updateLighting]);

  useEffect(() => {
    const prevMode = lightingTransitionRef.current?.startMode ||
      ((dayLightsRef.current?.ambient.intensity ?? 0) > 0 ? 'day' : 'night');
    if (prevMode !== lightingMode) {
      lightingTransitionRef.current = {
        progress: 0,
        startMode: prevMode,
        targetMode: lightingMode,
      };
    }
  }, [lightingMode]);

  useEffect(() => {
    const storePos = useGalleryStore.getState().cameraPosition;
    if (
      Math.abs(storePos.x - ENTRY_POSITION.x) < 0.001 &&
      Math.abs(storePos.z - ENTRY_POSITION.z) < 0.001
    ) {
      cameraPosRef.current.set(ENTRY_POSITION.x, ENTRY_POSITION.y, ENTRY_POSITION.z);
      cameraYawRef.current = 0;
      cameraPitchRef.current = 0;
    }
  }, [useGalleryStore.getState().cameraPosition]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const existingIds = new Set(frameGroupsRef.current.keys());
    const currentIds = new Set(artworks.map((a) => a.id));

    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const group = frameGroupsRef.current.get(id);
        if (group) {
          sceneRef.current!.remove(group);
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        frameGroupsRef.current.delete(id);
      }
    });

    artworks.forEach((artwork) => {
      if (!frameGroupsRef.current.has(artwork.id)) {
        const group = createFrame(artwork);
        sceneRef.current!.add(group);
        frameGroupsRef.current.set(artwork.id, group);
      }
    });
  }, [artworks, createFrame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedArtwork) return;
      keysRef.current.add(e.code);
      if (e.code === 'KeyC') {
        resetCamera();
        cameraPosRef.current.set(ENTRY_POSITION.x, ENTRY_POSITION.y, ENTRY_POSITION.z);
        cameraYawRef.current = 0;
        cameraPitchRef.current = 0;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCamera, selectedArtwork]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const domElement = rendererRef.current.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (selectedArtwork) return;
      if (e.button === 0) {
        isDraggingRef.current = true;
        domElement.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = false;
        domElement.style.cursor = 'default';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (selectedArtwork) return;

      if (isDraggingRef.current) {
        cameraYawRef.current -= e.movementX * MOUSE_SENSITIVITY;
        cameraPitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
        cameraPitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraPitchRef.current));
      }

      const rect = domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);
      const intersects = raycasterRef.current.intersectObjects(
        sceneRef.current!.children,
        true
      );

      const frameMeshes = intersects.filter(
        (i) => (i.object as FrameMesh).artworkId
      ) as THREE.Intersection<FrameMesh>[];

      let newHovered: FrameGroup | null = null;
      if (frameMeshes.length > 0) {
        const artworkId = frameMeshes[0].object.artworkId!;
        newHovered = frameGroupsRef.current.get(artworkId) || null;
        domElement.style.cursor = 'pointer';
      } else if (!isDraggingRef.current) {
        domElement.style.cursor = 'default';
      }

      if (hoveredFrameRef.current && hoveredFrameRef.current !== newHovered) {
        hoveredFrameRef.current.userData.isHovered = false;
      }
      if (newHovered && newHovered !== hoveredFrameRef.current) {
        newHovered.userData.isHovered = true;
      }
      hoveredFrameRef.current = newHovered;
    };

    const handleClick = (e: MouseEvent) => {
      if (selectedArtwork) return;
      if (isDraggingRef.current) return;

      const rect = domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);
      const intersects = raycasterRef.current.intersectObjects(
        sceneRef.current!.children,
        true
      );

      const frameMeshes = intersects.filter(
        (i) => (i.object as FrameMesh).artworkId
      ) as THREE.Intersection<FrameMesh>[];

      if (frameMeshes.length > 0) {
        const artworkId = frameMeshes[0].object.artworkId!;
        const artwork = artworks.find((a) => a.id === artworkId);
        if (artwork) {
          setSelectedArtwork(artwork);
        }
      }
    };

    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('click', handleClick);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('click', handleClick);
    };
  }, [artworks, setSelectedArtwork, selectedArtwork]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '100vh' }}
    />
  );
};

export default GalleryCanvas;
