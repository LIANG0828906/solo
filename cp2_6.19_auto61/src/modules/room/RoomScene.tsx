import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useAppStore, Frame, Note } from '@/store/appStore';

interface RoomSceneProps {
  onFrameClick: (frameId: string) => void;
  onFrameContextMenu: (frameId: string, x: number, y: number) => void;
}

const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 3;
const ROOM_DEPTH = 8;
const HALF_W = ROOM_WIDTH / 2;
const HALF_D = ROOM_DEPTH / 2;
const CAM_Y = 1.6;
const BASE_SPEED = 3;
const CLAMP_X: [number, number] = [-4.5, 4.5];
const CLAMP_Z: [number, number] = [-3.5, 3.5];
const DRAG_THRESHOLD = 5;

function createFabricTexture(
  width: number,
  height: number,
  baseR: number,
  baseG: number,
  baseB: number,
  weaveIntensity: number = 6,
  grainIntensity: number = 4,
  stitchPattern: boolean = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let n = (Math.random() - 0.5) * grainIntensity;
      if (stitchPattern) {
        const weaveX = Math.sin(x * 0.18) * weaveIntensity * 0.5;
        const weaveY = Math.sin(y * 0.18) * weaveIntensity * 0.5;
        const crossHatch = ((x % 4 < 2 ? 1 : -1) * (y % 4 < 2 ? 1 : -1)) * weaveIntensity * 0.25;
        n += weaveX * 0.35 + weaveY * 0.35 + crossHatch;
        const threadLine =
          ((x % 8 === 0) || (y % 8 === 0)) ? weaveIntensity * 0.35 : 0;
        n -= threadLine * 0.25;
      }
      data[idx] = Math.max(0, Math.min(255, baseR + n));
      data[idx + 1] = Math.max(0, Math.min(255, baseG + n));
      data[idx + 2] = Math.max(0, Math.min(255, baseB + n));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWoodGrainTexture(
  width: number,
  height: number,
  baseR: number,
  baseG: number,
  baseB: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const wave1 = Math.sin((x + y * 0.35) * 0.14) * 4;
      const wave2 = Math.sin((x * 1.7 + y * 0.18) * 0.22) * 2.5;
      const grain = ((x * 7 + Math.floor(y / 3) * 13) % 11) * 0.35;
      const n = (Math.random() - 0.5) * 2 + wave1 + wave2 + grain;
      data[idx] = Math.max(0, Math.min(255, baseR + n));
      data[idx + 1] = Math.max(0, Math.min(255, baseG + n * 0.92));
      data[idx + 2] = Math.max(0, Math.min(255, baseB + n * 0.8));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createStuccoTexture(
  width: number,
  height: number,
  baseR: number,
  baseG: number,
  baseB: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const blotch = Math.sin(x * 0.08) * Math.cos(y * 0.09) * 5;
      const swirl = Math.sin((x + y) * 0.06) * 3;
      const n = (Math.random() - 0.5) * 3 + blotch + swirl;
      data[idx] = Math.max(0, Math.min(255, baseR + n));
      data[idx + 1] = Math.max(0, Math.min(255, baseG + n));
      data[idx + 2] = Math.max(0, Math.min(255, baseB + n * 0.95));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createNoteSprite(content: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#E6D54A';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 126);
  ctx.fillStyle = '#333333';
  const fontSize = 14;
  ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
  const maxWidth = 112;
  const lineHeight = fontSize + 4;
  const x = 8;
  let y = 22;
  let line = '';
  for (let i = 0; i < content.length; i++) {
    const testLine = line + content[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y);
      line = content[i];
      y += lineHeight;
      if (y > 118) break;
    } else {
      line = testLine;
    }
  }
  if (y <= 118 && line) {
    ctx.fillText(line, x, y);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.35, 0.35, 1);
  return sprite;
}

function getWallPositionAndRotation(frame: Frame): { pos: THREE.Vector3; rot: THREE.Euler } {
  switch (frame.wallId) {
    case 'north':
      return {
        pos: new THREE.Vector3(frame.positionX, frame.positionY, -HALF_D + 0.03),
        rot: new THREE.Euler(0, 0, 0),
      };
    case 'south':
      return {
        pos: new THREE.Vector3(frame.positionX, frame.positionY, HALF_D - 0.03),
        rot: new THREE.Euler(0, Math.PI, 0),
      };
    case 'west':
      return {
        pos: new THREE.Vector3(-HALF_W + 0.03, frame.positionY, frame.positionX),
        rot: new THREE.Euler(0, Math.PI / 2, 0),
      };
    case 'east':
      return {
        pos: new THREE.Vector3(HALF_W - 0.03, frame.positionY, frame.positionX),
        rot: new THREE.Euler(0, -Math.PI / 2, 0),
      };
  }
}

function getDragPlane(wallId: Frame['wallId']): THREE.Plane {
  switch (wallId) {
    case 'north': return new THREE.Plane(new THREE.Vector3(0, 0, 1), HALF_D - 0.03);
    case 'south': return new THREE.Plane(new THREE.Vector3(0, 0, -1), HALF_D - 0.03);
    case 'west': return new THREE.Plane(new THREE.Vector3(1, 0, 0), HALF_W - 0.03);
    case 'east': return new THREE.Plane(new THREE.Vector3(-1, 0, 0), HALF_W - 0.03);
  }
}

function clampDragPosition(wallId: Frame['wallId'], px: number, py: number): { x: number; y: number } {
  const xRange: [number, number] = [-3.8, 3.8];
  const zRange: [number, number] = [-2.8, 2.8];
  const yRange: [number, number] = [0.6, 2.4];
  let posX: number;
  let posY: number;
  if (wallId === 'north' || wallId === 'south') {
    posX = Math.max(xRange[0], Math.min(xRange[1], px));
    posY = Math.max(yRange[0], Math.min(yRange[1], py));
  } else {
    posX = Math.max(zRange[0], Math.min(zRange[1], px));
    posY = Math.max(yRange[0], Math.min(yRange[1], py));
  }
  return { x: posX, y: posY };
}

function getFacingWall(direction: THREE.Vector3): 'north' | 'south' | 'east' | 'west' {
  const dx = direction.x;
  const dz = direction.z;
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 'east' : 'west';
  }
  return dz > 0 ? 'south' : 'north';
}

const RoomScene: React.FC<RoomSceneProps> = ({ onFrameClick, onFrameContextMenu }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const textureLoaderRef = useRef(new THREE.TextureLoader());
  const loadedTexturesRef = useRef<Map<string, THREE.Texture>>(new Map());
  const noteSpritesRef = useRef<Map<string, THREE.Sprite[]>>(new Map());

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const prevTimeRef = useRef(0);
  const animFrameRef = useRef(0);

  const isDraggingRef = useRef(false);
  const dragFrameIdRef = useRef<string | null>(null);
  const dragFrameWallRef = useRef<Frame['wallId']>('north');
  const dragTargetPosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isRotatingRef = useRef(false);
  const hoveredFrameIdRef = useRef<string | null>(null);
  const hoveredOriginalYRef = useRef<number>(0);
  const targetHoverYRef = useRef(0);

  const facingWallRef = useRef<'north' | 'south' | 'east' | 'west'>('north');

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const storeFrames = useAppStore((s) => s.frames);
  const storeNotes = useAppStore((s) => s.notes);
  const removeFrame = useAppStore((s) => s.removeFrame);
  const updateFramePosition = useAppStore((s) => s.updateFramePosition);
  const setFacingWall = useAppStore((s) => s.setFacingWall);

  const disposeGroup = useCallback((group: THREE.Group) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
      if (child instanceof THREE.Sprite) {
        child.material?.map?.dispose();
        child.material?.dispose();
      }
    });
  }, []);

  const syncFrames = useCallback(
    (frames: Frame[], notes: Note[]) => {
      const scene = sceneRef.current;
      if (!scene) return;
      const currentIds = new Set(frames.map((f) => f.id));
      frameGroupsRef.current.forEach((group, id) => {
        if (!currentIds.has(id)) {
          scene.remove(group);
          disposeGroup(group);
          frameGroupsRef.current.delete(id);
          noteSpritesRef.current.delete(id);
        }
      });
      frames.forEach((frame) => {
        const { pos, rot } = getWallPositionAndRotation(frame);
        const existing = frameGroupsRef.current.get(frame.id);
        if (existing) {
          if (existing.userData._wallId !== frame.wallId || existing.userData._posX !== frame.positionX || existing.userData._posY !== frame.positionY) {
            existing.position.set(pos.x, pos.y, pos.z);
            existing.rotation.copy(rot);
            existing.userData._wallId = frame.wallId;
            existing.userData._posX = frame.positionX;
            existing.userData._posY = frame.positionY;
          }
        } else {
          const group = new THREE.Group();
          group.userData.frameId = frame.id;
          group.userData._wallId = frame.wallId;
          group.userData._posX = frame.positionX;
          group.userData._posY = frame.positionY;

          const borderGeo = new THREE.BoxGeometry(1.3, 1.0, 0.06);
          const borderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x000000 });
          const border = new THREE.Mesh(borderGeo, borderMat);
          group.add(border);

          const imageGeo = new THREE.PlaneGeometry(1.18, 0.88);
          const imageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.FrontSide });
          const imageMesh = new THREE.Mesh(imageGeo, imageMat);
          imageMesh.position.z = 0.035;
          group.add(imageMesh);

          const texture = textureLoaderRef.current.load(frame.imageUrl, (tex) => {
            imageMat.map = tex;
            imageMat.color.set(0xffffff);
            imageMat.needsUpdate = true;
          });
          loadedTexturesRef.current.set(frame.id, texture);

          group.position.set(pos.x, pos.y, pos.z);
          group.rotation.copy(rot);
          scene.add(group);
          frameGroupsRef.current.set(frame.id, group);
        }

        const group = frameGroupsRef.current.get(frame.id)!;
        const frameNotes = notes.filter((n) => n.frameId === frame.id);
        const existingSprites = noteSpritesRef.current.get(frame.id) || [];
        if (existingSprites.length > 0) {
          existingSprites.forEach((s) => {
            group.remove(s);
            s.material?.map?.dispose();
            s.material?.dispose();
          });
          noteSpritesRef.current.delete(frame.id);
        }
        if (frameNotes.length > 0) {
          const newSprites: THREE.Sprite[] = [];
          frameNotes.forEach((note) => {
            const sprite = createNoteSprite(note.content);
            sprite.position.set(0.5, -0.35, 0.04);
            group.add(sprite);
            newSprites.push(sprite);
          });
          noteSpritesRef.current.set(frame.id, newSprites);
        }
      });
    },
    [disposeGroup]
  );

  useEffect(() => {
    syncFrames(storeFrames, storeNotes);
  }, [storeFrames, storeNotes, syncFrames]);

  useEffect(() => {
    const container = containerRef.current;
    const minimapCanvas = minimapRef.current;
    if (!container || !minimapCanvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8a8078);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, CAM_Y, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffe8cc, 0.4);
    pointLight.position.set(0, ROOM_HEIGHT, 0);
    scene.add(pointLight);

    const wallTex = createFabricTexture(256, 256, 184, 175, 166, 7, 4, true);
    wallTex.repeat.set(3, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.DoubleSide, roughness: 0.92 });

    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMat);
    northWall.position.set(0, ROOM_HEIGHT / 2, -HALF_D);
    scene.add(northWall);

    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMat.clone());
    (southWall.material as THREE.MeshStandardMaterial).map = wallTex.clone();
    (southWall.material as THREE.MeshStandardMaterial).roughness = 0.92;
    southWall.position.set(0, ROOM_HEIGHT / 2, HALF_D);
    southWall.rotation.y = Math.PI;
    scene.add(southWall);

    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMat.clone());
    (westWall.material as THREE.MeshStandardMaterial).map = wallTex.clone();
    (westWall.material as THREE.MeshStandardMaterial).roughness = 0.92;
    westWall.position.set(-HALF_W, ROOM_HEIGHT / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    scene.add(westWall);

    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMat.clone());
    (eastWall.material as THREE.MeshStandardMaterial).map = wallTex.clone();
    (eastWall.material as THREE.MeshStandardMaterial).roughness = 0.92;
    eastWall.position.set(HALF_W, ROOM_HEIGHT / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    scene.add(eastWall);

    const floorTex = createWoodGrainTexture(256, 256, 160, 150, 136);
    floorTex.repeat.set(5, 4);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, side: THREE.DoubleSide, roughness: 0.85 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const ceilTex = createStuccoTexture(256, 256, 197, 189, 180);
    ceilTex.repeat.set(3, 3);
    const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, side: THREE.DoubleSide, roughness: 0.95 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM_HEIGHT;
    scene.add(ceiling);

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const allFrameGroups = Array.from(frameGroupsRef.current.values());
        const hits = raycasterRef.current.intersectObjects(allFrameGroups, true);
        if (hits.length > 0) {
          let hitObj: THREE.Object3D | null = hits[0].object;
          let frameId: string | null = null;
          while (hitObj) {
            if (hitObj.userData?.frameId) {
              frameId = hitObj.userData.frameId;
              break;
            }
            hitObj = hitObj.parent;
          }
          if (frameId) {
            isDraggingRef.current = true;
            dragFrameIdRef.current = frameId;
            const frame = storeFrames.find((f) => f.id === frameId);
            if (frame) {
              dragFrameWallRef.current = frame.wallId;
            }
          } else {
            isRotatingRef.current = true;
          }
        } else {
          isRotatingRef.current = true;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isRotatingRef.current) {
        const dx = e.movementX;
        const dy = e.movementY;
        yawRef.current -= dx * 0.003;
        pitchRef.current -= dy * 0.003;
        pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
      }

      if (isDraggingRef.current && dragFrameIdRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const plane = getDragPlane(dragFrameWallRef.current);
        const intersection = new THREE.Vector3();
        const ray = raycasterRef.current.ray;
        if (ray.intersectPlane(plane, intersection)) {
          let px: number, py: number;
          if (dragFrameWallRef.current === 'north' || dragFrameWallRef.current === 'south') {
            px = intersection.x;
            py = intersection.y;
          } else {
            px = intersection.z;
            py = intersection.y;
          }
          const clamped = clampDragPosition(dragFrameWallRef.current, px, py);
          dragTargetPosRef.current = { x: clamped.x, y: clamped.y };
        }
      }

      if (!isDraggingRef.current && !isRotatingRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const allFrameGroups = Array.from(frameGroupsRef.current.values());
        const hits = raycasterRef.current.intersectObjects(allFrameGroups, true);
        if (hits.length > 0) {
          let hitObj: THREE.Object3D | null = hits[0].object;
          let frameId: string | null = null;
          while (hitObj) {
            if (hitObj.userData?.frameId) {
              frameId = hitObj.userData.frameId;
              break;
            }
            hitObj = hitObj.parent;
          }
          if (frameId) {
            if (hoveredFrameIdRef.current !== frameId) {
              hoveredFrameIdRef.current = frameId;
              const g = frameGroupsRef.current.get(frameId);
              if (g) hoveredOriginalYRef.current = g.userData._posY ?? g.position.y;
              targetHoverYRef.current = 0.03;
            }
          } else {
            if (hoveredFrameIdRef.current) {
              hoveredFrameIdRef.current = null;
              targetHoverYRef.current = 0;
            }
          }
        } else {
          if (hoveredFrameIdRef.current) {
            hoveredFrameIdRef.current = null;
            targetHoverYRef.current = 0;
          }
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        const downPos = mouseDownPosRef.current;
        const wasClick = downPos
          ? Math.abs(e.clientX - downPos.x) < DRAG_THRESHOLD && Math.abs(e.clientY - downPos.y) < DRAG_THRESHOLD
          : false;

        if (isDraggingRef.current && dragFrameIdRef.current) {
          const group = frameGroupsRef.current.get(dragFrameIdRef.current);
          if (group) {
            const posX = group.userData._posX;
            const posY = group.userData._posY;
            updateFramePosition(dragFrameIdRef.current, posX, posY);
          }
          if (wasClick) {
            onFrameClick(dragFrameIdRef.current);
          }
        }

        isDraggingRef.current = false;
        dragFrameIdRef.current = null;
        isRotatingRef.current = false;
        mouseDownPosRef.current = null;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const allFrameGroups = Array.from(frameGroupsRef.current.values());
      const hits = raycasterRef.current.intersectObjects(allFrameGroups, true);
      if (hits.length > 0) {
        let hitObj: THREE.Object3D | null = hits[0].object;
        let frameId: string | null = null;
        while (hitObj) {
          if (hitObj.userData?.frameId) {
            frameId = hitObj.userData.frameId;
            break;
          }
          hitObj = hitObj.parent;
        }
        if (frameId) {
          onFrameContextMenu(frameId, e.clientX, e.clientY);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const drawMinimap = () => {
      const ctx = minimapCanvas.getContext('2d');
      if (!ctx) return;
      const mw = 200;
      const mh = 150;
      minimapCanvas.width = mw;
      minimapCanvas.height = mh;
      ctx.fillStyle = '#2a2520';
      ctx.fillRect(0, 0, mw, mh);
      const margin = 15;
      const drawW = mw - margin * 2;
      const drawH = mh - margin * 2;
      ctx.strokeStyle = '#B8AFA6';
      ctx.lineWidth = 2;
      ctx.strokeRect(margin, margin, drawW, drawH);

      storeFrames.forEach((frame) => {
        let mx: number, my: number;
        if (frame.wallId === 'north') {
          mx = margin + ((frame.positionX + HALF_W) / ROOM_WIDTH) * drawW;
          my = margin;
        } else if (frame.wallId === 'south') {
          mx = margin + ((frame.positionX + HALF_W) / ROOM_WIDTH) * drawW;
          my = margin + drawH;
        } else if (frame.wallId === 'west') {
          mx = margin;
          my = margin + ((frame.positionX + HALF_D) / ROOM_DEPTH) * drawH;
        } else {
          mx = margin + drawW;
          my = margin + ((frame.positionX + HALF_D) / ROOM_DEPTH) * drawH;
        }
        ctx.fillStyle = '#5b8def';
        ctx.fillRect(mx - 3, my - 3, 6, 6);
      });

      const px = margin + ((camera.position.x + HALF_W) / ROOM_WIDTH) * drawW;
      const py = margin + ((camera.position.z + HALF_D) / ROOM_DEPTH) * drawH;
      ctx.fillStyle = '#4cda6b';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      const dirLen = 10;
      const dirX = Math.sin(yawRef.current);
      const dirZ = -Math.cos(yawRef.current);
      ctx.strokeStyle = '#4cda6b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + dirX * dirLen, py + dirZ * dirLen);
      ctx.stroke();
    };

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = prevTimeRef.current ? (time - prevTimeRef.current) / 1000 : 0;
      prevTimeRef.current = time;

      const speed = BASE_SPEED * (keysRef.current.has('shift') ? 2 : 1) * dt;
      const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
      const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));

      if (keysRef.current.has('w')) camera.position.addScaledVector(forward, speed);
      if (keysRef.current.has('s')) camera.position.addScaledVector(forward, -speed);
      if (keysRef.current.has('a')) camera.position.addScaledVector(right, -speed);
      if (keysRef.current.has('d')) camera.position.addScaledVector(right, speed);

      camera.position.x = Math.max(CLAMP_X[0], Math.min(CLAMP_X[1], camera.position.x));
      camera.position.z = Math.max(CLAMP_Z[0], Math.min(CLAMP_Z[1], camera.position.z));
      camera.position.y = CAM_Y;

      const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      const wall = getFacingWall(camDir);
      if (wall !== facingWallRef.current) {
        facingWallRef.current = wall;
        setFacingWall(wall);
      }

      frameGroupsRef.current.forEach((group, id) => {
        const border = group.children[0] as THREE.Mesh;
        const mat = border.material as THREE.MeshStandardMaterial;
        const isDraggingThis = isDraggingRef.current && dragFrameIdRef.current === id;

        if (isDraggingThis && dragTargetPosRef.current) {
          const frame = storeFrames.find((f) => f.id === id);
          if (frame) {
            const { pos } = getWallPositionAndRotation({
              ...frame,
              positionX: dragTargetPosRef.current.x,
              positionY: dragTargetPosRef.current.y,
            });
            group.position.x += (pos.x - group.position.x) * 0.25;
            group.position.y += (pos.y + 0.06 - group.position.y) * 0.25;
            group.position.z += (pos.z - group.position.z) * 0.25;
            group.userData._posX = dragTargetPosRef.current.x;
            group.userData._posY = dragTargetPosRef.current.y;
          }
          const targetScale = 1.12;
          group.scale.x += (targetScale - group.scale.x) * 0.2;
          group.scale.y += (targetScale - group.scale.y) * 0.2;
          mat.emissive.lerp(new THREE.Color(0xc98f55), 0.35);
        } else if (id === hoveredFrameIdRef.current) {
          mat.emissive.lerp(new THREE.Color(0xd4a574), 0.15);
          const baseY = hoveredOriginalYRef.current;
          group.position.y += (baseY + targetHoverYRef.current - group.position.y) * 0.12;
          group.scale.x += (1.0 - group.scale.x) * 0.12;
          group.scale.y += (1.0 - group.scale.y) * 0.12;
        } else {
          mat.emissive.lerp(new THREE.Color(0x000000), 0.15);
          const frame = storeFrames.find((f) => f.id === id);
          if (frame && !isDraggingRef.current) {
            const targetY = frame.positionY;
            group.position.y += (targetY - group.position.y) * 0.12;
          }
          group.scale.x += (1.0 - group.scale.x) * 0.12;
          group.scale.y += (1.0 - group.scale.y) * 0.12;
        }
      });

      renderer.render(scene, camera);
      drawMinimap();
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const preventDefault = (e: Event) => e.preventDefault();
    container.addEventListener('contextmenu', preventDefault);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('contextmenu', preventDefault);

      loadedTexturesRef.current.forEach((tex) => tex.dispose());
      loadedTexturesRef.current.clear();
      frameGroupsRef.current.forEach((group) => {
        scene.remove(group);
        disposeGroup(group);
      });
      frameGroupsRef.current.clear();
      noteSpritesRef.current.clear();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => {
                m.map?.dispose();
                m.dispose();
              });
            } else {
              obj.material.map?.dispose();
              obj.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [storeFrames, storeNotes, onFrameClick, onFrameContextMenu, updateFramePosition, setFacingWall, disposeGroup]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <canvas
        ref={minimapRef}
        width={200}
        height={150}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 200,
          height: 150,
          pointerEvents: 'none',
          borderRadius: 6,
          opacity: 0.85,
        }}
      />
    </div>
  );
};

export default RoomScene;
