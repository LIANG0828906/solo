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
  const skirtingMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5D4037' }), []);

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

      <mesh position={[0, 0.1, -ROOM_SIZE / 2 + 0.01]}>
        <boxGeometry args={[ROOM_SIZE, 0.2, 0.05]} />
        <primitive object={skirtingMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, ROOM_SIZE / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[ROOM_SIZE, 0.2, 0.05]} />
        <primitive object={skirtingMaterial} attach="material" />
      </mesh>
      <mesh position={[-ROOM_SIZE / 2 + 0.01, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_SIZE, 0.2, 0.05]} />
        <primitive object={skirtingMaterial} attach="material" />
      </mesh>
      <mesh position={[ROOM_SIZE / 2 - 0.01, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_SIZE, 0.2, 0.05]} />
        <primitive object={skirtingMaterial} attach="material" />
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
  onClick,
}: {
  placement: PlacementWithArtwork;
  onHover: (artwork: Artwork) => void;
  onLeave: () => void;
  onClick: (artwork: Artwork) => void;
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

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHover(artwork);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    onLeave();
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(artwork);
  };

  return (
    <group ref={meshRef} position={position as [number, number, number]} rotation={rotation as [number, number, number]}>
      <mesh position={[0, 0, -frameDepth / 2]} castShadow>
        <boxGeometry args={[frameWidth + borderWidth * 2, frameHeight + borderWidth * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0, 0.001]} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick}>
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
  const touchStartRef = useRef<{ [key: number]: { x: number; y: number } }>({});

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
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        touchStartRef.current[touch.identifier] = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        mouseDownRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastMouseRef.current.x;
        const dy = e.touches[0].clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        yawRef.current -= dx * MOUSE_SENSITIVITY;
        pitchRef.current -= dy * MOUSE_SENSITIVITY;
        pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const start1 = touchStartRef.current[touch1.identifier];
        const start2 = touchStartRef.current[touch2.identifier];

        if (start1 && start2) {
          const avgX = (touch1.clientX + touch2.clientX) / 2;
          const avgStartX = (start1.x + start2.x) / 2;
          const avgY = (touch1.clientY + touch2.clientY) / 2;
          const avgStartY = (start1.y + start2.y) / 2;

          const dx = avgX - avgStartX;
          const dy = avgY - avgStartY;

          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
          const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);

          const move = new THREE.Vector3();
          move.addScaledVector(right, -dx * 0.01);
          move.addScaledVector(forward, -dy * 0.01);

          if (move.length() > 0) {
            move.normalize().multiplyScalar(MOVE_SPEED * 0.5);
            const newPos = camera.position.clone().add(move);
            newPos.y = PLAYER_HEIGHT;
            const halfRoom = ROOM_SIZE / 2 - COLLISION_RADIUS;
            newPos.x = Math.max(-halfRoom, Math.min(halfRoom, newPos.x));
            newPos.z = Math.max(-halfRoom, Math.min(halfRoom, newPos.z));
            camera.position.copy(newPos);
          }

          touchStartRef.current[touch1.identifier] = { x: touch1.clientX, y: touch1.clientY };
          touchStartRef.current[touch2.identifier] = { x: touch2.clientX, y: touch2.clientY };
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

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
  onArtworkClick,
}: {
  placements: PlacementWithArtwork[];
  onArtworkHover: (artwork: Artwork) => void;
  onArtworkLeave: () => void;
  onArtworkClick: (artwork: Artwork) => void;
}) {
  const hoverTimerRef = useRef<number | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);
  const hoverTriggeredRef = useRef(false);

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
        if (dot > 0.7) {
          closest = p;
          closestDist = dist;
        }
      }
    }

    if (closest && closest.artworkId !== lastHoveredIdRef.current) {
      lastHoveredIdRef.current = closest.artworkId;
      hoverTriggeredRef.current = false;

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }

      hoverTimerRef.current = window.setTimeout(() => {
        if (!hoverTriggeredRef.current) {
          hoverTriggeredRef.current = true;
          const artwork: Artwork = {
            id: closest!.artworkId,
            title: closest!.title,
            artistName: closest!.artistName,
            year: closest!.year,
            price: closest!.price,
            width: closest!.width,
            height: closest!.height,
            imageUrl: closest!.imageUrl,
            status: 'approved',
            hueShift: closest!.hueShift,
          };
          onArtworkHover(artwork);
        }
      }, HOVER_DELAY);
    } else if (!closest && lastHoveredIdRef.current) {
      lastHoveredIdRef.current = null;
      hoverTriggeredRef.current = false;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      onArtworkLeave();
    }
  }, [placements, onArtworkHover, onArtworkLeave]);

  const handleArtworkClick = (artwork: Artwork) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTriggeredRef.current = true;
    onArtworkClick(artwork);
  };

  return (
    <>
      <FirstPersonControls hoverCheck={checkHover} />
      <Suspense fallback={null}>
        {placements.map((placement) => (
          <ArtworkMesh
            key={placement.id}
            placement={placement}
            onHover={onArtworkHover}
            onLeave={onArtworkLeave}
            onClick={handleArtworkClick}
          />
        ))}
      </Suspense>
    </>
  );
}

const GalleryScene: React.FC = () => {
  const [placements, setPlacements] = useState<PlacementWithArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredArtwork, setHoveredArtwork] = useState<Artwork | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const setDetailArtwork = useGalleryStore((state) => state.setDetailArtwork);
  const setIsDetailVisible = useGalleryStore((state) => state.setIsDetailVisible);
  const isDetailVisible = useGalleryStore((state) => state.isDetailVisible);
  const detailArtwork = useGalleryStore((state) => state.detailArtwork);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await axios.get('/api/placements');
      setPlacements(response.data);
    } catch (error) {
      console.error('获取展厅布局失败:', error);
      const fallback: PlacementWithArtwork[] = [
        {
          id: 'demo1', artworkId: 'demo1', wallIndex: 0, posX: -3, posY: 1.5, rotation: -2,
          title: '晨曦之光', artistName: '李明', year: 2023, price: 2800,
          width: 80, height: 60, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serene%20landscape%20painting%20morning%20light&image_size=square_hd', hueShift: 5
        },
        {
          id: 'demo2', artworkId: 'demo2', wallIndex: 0, posX: 0, posY: 1.5, rotation: 1,
          title: '山涧溪流', artistName: '王芳', year: 2022, price: 3500,
          width: 100, height: 70, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stream%20flowing%20through%20mountain%20forest%20painting&image_size=square_hd', hueShift: -8
        },
        {
          id: 'demo3', artworkId: 'demo3', wallIndex: 0, posX: 3, posY: 1.5, rotation: -1,
          title: '城市印象', artistName: '张伟', year: 2024, price: 4200,
          width: 90, height: 65, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20city%20impressionist%20painting&image_size=square_hd', hueShift: 12
        },
        {
          id: 'demo4', artworkId: 'demo4', wallIndex: 1, posX: -3, posY: 1.5, rotation: 2,
          title: '秋日私语', artistName: '陈静', year: 2023, price: 3200,
          width: 70, height: 90, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=autumn%20garden%20warm%20colors%20painting&image_size=square_hd', hueShift: -3
        },
        {
          id: 'demo5', artworkId: 'demo5', wallIndex: 2, posX: -2, posY: 1.5, rotation: -1.5,
          title: '海洋深处', artistName: '赵强', year: 2024, price: 5000,
          width: 120, height: 80, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=deep%20ocean%20blue%20abstract%20painting&image_size=square_hd', hueShift: 8
        },
      ];
      setPlacements(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkHover = useCallback((artwork: Artwork) => {
    if (!isDetailVisible) {
      setHoveredArtwork(artwork);
      setDetailArtwork(artwork);
      setIsDetailVisible(true);
    }
  }, [isDetailVisible, setDetailArtwork, setIsDetailVisible]);

  const handleArtworkLeave = useCallback(() => {
    if (!selectedArtwork) {
      setHoveredArtwork(null);
      setIsDetailVisible(false);
      setTimeout(() => setDetailArtwork(null), 300);
    }
  }, [selectedArtwork, setIsDetailVisible, setDetailArtwork]);

  const handleArtworkClick = useCallback((artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setHoveredArtwork(artwork);
    setDetailArtwork(artwork);
    setIsDetailVisible(true);
  }, [setDetailArtwork, setIsDetailVisible]);

  const handleDetailClose = useCallback(() => {
    setSelectedArtwork(null);
    setHoveredArtwork(null);
    setIsDetailVisible(false);
    setTimeout(() => setDetailArtwork(null), 300);
  }, [setIsDetailVisible, setDetailArtwork]);

  if (loading) {
    return (
      <div className="gallery-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
          展厅加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <Canvas
        className="gallery-canvas"
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <GalleryRoom />
        <GalleryContent
          placements={placements}
          onArtworkHover={handleArtworkHover}
          onArtworkLeave={handleArtworkLeave}
          onArtworkClick={handleArtworkClick}
        />
      </Canvas>

      {isDetailVisible && detailArtwork && (
        <ArtworkDetail artwork={detailArtwork} onClose={handleDetailClose} />
      )}

      <div className="gallery-hint">
        {isMobile ? '单指滑动旋转视角，双指滑动移动' : 'WASD 移动，鼠标拖拽旋转视角，点击画作查看详情'}
      </div>

      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 50 }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '8px 16px' }}
          onClick={() => window.history.back()}
        >
          ← 返回
        </button>
      </div>
    </div>
  );
};

export default GalleryScene;
