import React, { useEffect, useRef, useState, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { PlacementWithArtwork, Artwork } from '../../types';
import { useGalleryStore } from '../../store';
import ArtworkDetail from './ArtworkDetail';

const ROOM_SIZE = 12;
const WALL_HEIGHT = 5;
const PLAYER_HEIGHT = 1.6;
const COLLISION_RADIUS = 0.5;
const MOVE_SPEED = 0.08;
const MOUSE_SENSITIVITY = 0.002;
const HOVER_DISTANCE = 2;
const HOVER_DELAY = 500;

function GalleryRoom() {
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FAFAF0', side: THREE.DoubleSide }), []);
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E8E8D8' }), []);
  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F5F5E8' }), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, ROOM_SIZE / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <mesh position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <mesh position={[ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_SIZE, WALL_HEIGHT]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <ambientLight intensity={0.6} />
      <pointLight position={[0, WALL_HEIGHT - 0.5, 0]} intensity={0.8} color="#FFF8E7" />
      <pointLight position={[0, WALL_HEIGHT - 0.5, -ROOM_SIZE / 4]} intensity={0.4} color="#FFF8E7" />
      <pointLight position={[0, WALL_HEIGHT - 0.5, ROOM_SIZE / 4]} intensity={0.4} color="#FFF8E7" />
    </group>
  );
}

function ArtworkMesh({
  placement,
  onHover,
  onLeave,
}: {
  placement: PlacementWithArtwork;
  onHover: (artwork: Artwork) => void;
  onLeave: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const frameWidth = placement.width / 50;
  const frameHeight = placement.height / 50;
  const frameDepth = 0.08;
  const borderWidth = 0.08;

  const frameColor = '#5D4037';

  const texture = useTexture(placement.imageUrl);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  const getWallPosition = useCallback(() => {
    const { wallIndex, posX, posY } = placement;
    const halfRoom = ROOM_SIZE / 2 - 0.05;

    switch (wallIndex) {
      case 0:
        return { position: [posX, posY, -halfRoom], rotation: [0, 0, (placement.rotation || 0) * Math.PI / 180] };
      case 1:
        return { position: [halfRoom, posY, -posX], rotation: [0, -Math.PI / 2, (placement.rotation || 0) * Math.PI / 180] };
      case 2:
        return { position: [-posX, posY, halfRoom], rotation: [0, Math.PI, (placement.rotation || 0) * Math.PI / 180] };
      case 3:
        return { position: [-halfRoom, posY, posX], rotation: [0, Math.PI / 2, (placement.rotation || 0) * Math.PI / 180] };
      default:
        return { position: [posX, posY, -halfRoom], rotation: [0, 0, 0] };
    }
  }, [placement]);

  const { position, rotation } = getWallPosition();

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    const artwork: Artwork = {
      id: placement.artworkId,
      title: placement.title,
      artistName: placement.artistName,
      year: placement.year,
      price: placement.price,
      width: placement.width,
      height: placement.height,
      imageUrl: placement.imageUrl,
      status: 'approved',
      hueShift: placement.hueShift,
    };
    onHover(artwork);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    onLeave();
  };

  return (
    <group ref={meshRef} position={position as [number, number, number]} rotation={rotation as [number, number, number]}>
      <mesh position={[0, 0, -frameDepth / 2]} castShadow>
        <boxGeometry args={[frameWidth + borderWidth * 2, frameHeight + borderWidth * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0, 0.001]} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          color={new THREE.Color().setHSL(0, 0, 1)}
        />
      </mesh>

      <mesh position={[0, -frameHeight / 2 - 0.05, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[frameWidth * 1.2, 0.3]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={hovered ? 0.15 : 0.08} />
      </mesh>
    </group>
  );
}

function FirstPersonControls({
  onPositionChange,
  hoverCheck,
}: {
  onPositionChange?: (pos: THREE.Vector3) => void;
  hoverCheck?: (pos: THREE.Vector3, dir: THREE.Vector3) => void;
}) {
  const { camera, gl } = useThree();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const velocityRef = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, ROOM_SIZE / 3);
    yawRef.current = Math.PI;
    camera.rotation.order = 'YXZ';

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= dx * MOUSE_SENSITIVITY;
      pitchRef.current -= dy * MOUSE_SENSITIVITY;
      pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        mouseDownRef.current = true;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      mouseDownRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!mouseDownRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      yawRef.current -= dx * MOUSE_SENSITIVITY;
      pitchRef.current -= dy * MOUSE_SENSITIVITY;
      pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [camera, gl]);

  useFrame(() => {
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);

    const move = new THREE.Vector3();
    if (keysRef.current['w']) move.add(forward);
    if (keysRef.current['s']) move.sub(forward);
    if (keysRef.current['a']) move.sub(right);
    if (keysRef.current['d']) move.add(right);

    if (move.length() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED);

      const newPos = camera.position.clone().add(move);
      newPos.y = PLAYER_HEIGHT;

      const halfRoom = ROOM_SIZE / 2 - COLLISION_RADIUS;
      newPos.x = Math.max(-halfRoom, Math.min(halfRoom, newPos.x));
      newPos.z = Math.max(-halfRoom, Math.min(halfRoom, newPos.z));

      camera.position.copy(newPos);
      if (onPositionChange) onPositionChange(newPos);
    }

    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    if (hoverCheck) hoverCheck(camera.position.clone(), dir);
  });

  return null;
}

function GalleryContent({
  placements,
  onArtworkHover,
  onArtworkLeave,
}: {
  placements: PlacementWithArtwork[];
  onArtworkHover: (artwork: Artwork) => void;
  onArtworkLeave: () => void;
}) {
  const hoverTimerRef = useRef<number | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);

  const checkHover = useCallback((pos: THREE.Vector3, dir: THREE.Vector3) => {
    let closest: PlacementWithArtwork | null = null;
    let closestDist = Infinity;

    for (const p of placements) {
      const halfRoom = ROOM_SIZE / 2 - 0.05;
      let artworkPos: THREE.Vector3;

      switch (p.wallIndex) {
        case 0:
          artworkPos = new THREE.Vector3(p.posX, p.posY, -halfRoom);
          break;
        case 1:
          artworkPos = new THREE.Vector3(halfRoom, p.posY, -p.posX);
          break;
        case 2:
          artworkPos = new THREE.Vector3(-p.posX, p.posY, halfRoom);
          break;
        case 3:
          artworkPos = new THREE.Vector3(-halfRoom, p.posY, p.posX);
          break;
        default:
          artworkPos = new THREE.Vector3(p.posX, p.posY, -halfRoom);
      }

      const dist = pos.distanceTo(artworkPos);
      if (dist < HOVER_DISTANCE && dist < closestDist) {
        const toArtwork = artworkPos.clone().sub(pos).normalize();
        const dot = dir.dot(toArtwork);
        if (dot > 0.5) {
          closest = p;
          closestDist = dist;
        }
      }
    }

    if (closest && closest.artworkId !== lastHoveredIdRef.current) {
      lastHoveredIdRef.current = closest.artworkId;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      const artwork: Artwork = {
        id: closest.artworkId,
        title: closest.title,
        artistName: closest.artistName,
        year: closest.year,
        price: closest.price,
        width: closest.width,
        height: closest.height,
        imageUrl: closest.imageUrl