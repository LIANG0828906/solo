import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useArtworkStore } from '../../store/ArtworkStore';
import { AuthService } from '../auth/AuthService';
import { ArtworkRenderer, FrameData } from './ArtworkRenderer';
import type { Artwork, Gallery } from '../../shared/types';

interface ExhibitionCanvasProps {
  galleryId: string;
  onArtworkClick: (artwork: Artwork) => void;
}

interface HoveredArtworkInfo {
  artwork: Artwork;
  distance: number;
}

export const ExhibitionCanvas: React.FC<ExhibitionCanvasProps> = ({
  galleryId,
  onArtworkClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const framesRef = useRef<Map<string, FrameData>>(new Map());
  const highlightedRef = useRef<Set<string>>(new Set());

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const [hoveredInfo, setHoveredInfo] = useState<HoveredArtworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [fps, setFps] = useState(0);

  const gallery = useArtworkStore((s) =>
    s.galleries.find((g) => g.id === galleryId)
  );
  const artworks = gallery?.artworks || [];

  const ROOM_W = 24;
  const ROOM_H = 6;
  const ROOM_D = 24;
  const PLAYER_HEIGHT = 1.6;
  const MOVE_SPEED = 0.12;
  const PROXIMITY_THRESHOLD = 2;

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const initScene = useCallback(async () => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 15, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, PLAYER_HEIGHT - ROOM_H / 2, ROOM_D / 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.4);
    scene.add(hemi);

    const light1 = new THREE.PointLight(0xffd7a0, 0.7, 25, 1.8);
    light1.position.set(ROOM_W / 4, ROOM_H / 2 - 0.5, ROOM_D / 4);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 512;
    light1.shadow.mapSize.height = 512;
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffd7a0, 0.7, 25, 1.8);
    light2.position.set(-ROOM_W / 4, ROOM_H / 2 - 0.5, -ROOM_D / 4);
    light2.castShadow = true;
    light2.shadow.mapSize.width = 512;
    light2.shadow.mapSize.height = 512;
    scene.add(light2);

    const spotLight = new THREE.SpotLight(0xffffff, 0.5, 20, Math.PI / 4, 0.6, 1);
    spotLight.position.set(0, ROOM_H / 2 - 0.2, 0);
    spotLight.target.position.set(0, -ROOM_H / 2, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    const roomGroup = ArtworkRenderer.createRoom(ROOM_W, ROOM_H, ROOM_D, gallery?.wallColor || '#C4B7A6', 0.3);
    scene.add(roomGroup);

    const artworkGroups: THREE.Group[] = [];
    const perWall = Math.max(1, Math.ceil(artworks.length / 4));
    for (let idx = 0; idx < artworks.length; idx++) {
      const artwork = artworks[idx];
      const wallIdx = Math.floor(idx / perWall);
      const wallNum: Array<'front' | 'back' | 'left' | 'right'> = ['front', 'right', 'back', 'left'];
      const wall = wallNum[Math.min(wallIdx, 3)];
      const indexInWall = idx % perWall;
      const cols = Math.min(3, perWall);
      const col = indexInWall % cols;
      const row = Math.floor(indexInWall / cols);
      const x = (col - Math.floor(cols / 2)) * 3.5;
      const y = -row * 3;

      const frame = await ArtworkRenderer.createFrame(artwork, 2.5, 1.8);
      const { position, rotation } = ArtworkRenderer.getWallPosition(
        wall, x, y, ROOM_W, ROOM_H, ROOM_D, 30
      );
      frame.group.position.copy(position);
      frame.group.rotation.copy(rotation);
      frame.group.position.y += PLAYER_HEIGHT - ROOM_H / 2 + 0.3;
      scene.add(frame.group);
      artworkGroups.push(frame.group);
      framesRef.current.set(artwork.id, frame);
    }

    if (gallery) {
      const user = AuthService.getCurrentUser();
      if (user) {
        AuthService.addVisitedGallery({
          galleryId: gallery.id,
          galleryName: gallery.name,
          visitedAt: new Date().toISOString(),
          location: { lat: gallery.location.lat, lng: gallery.location.lng },
        });
      }
    }

    setLoading(false);

    let lastFrame = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastFrame) / 1000;
      lastFrame = now;
      frameCount++;
      fpsTimer += delta;
      if (fpsTimer >= 0.5) {
        setFps(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      const cam = cameraRef.current;
      const ren = rendererRef.current;
      const sc = sceneRef.current;
      if (!cam || !ren || !sc) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const keys = keysRef.current;
      const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (keys['w'] || keys['arrowup']) move.add(forward);
      if (keys['s'] || keys['arrowdown']) move.sub(forward);
      if (keys['d'] || keys['arrowright']) move.add(right);
      if (keys['a'] || keys['arrowleft']) move.sub(right);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(MOVE_SPEED);
        cam.position.x += move.x;
        cam.position.z += move.z;
        const newPos = ArtworkRenderer.checkCollision(cam.position, 0.6, ROOM_W, ROOM_D);
        cam.position.copy(newPos);
      }

      cam.rotation.order = 'YXZ';
      cam.rotation.y = yawRef.current;
      cam.rotation.x = pitchRef.current;

      let closestArtwork: Artwork | null = null;
      let closestDist = Infinity;
      framesRef.current.forEach((frame, id) => {
        const art = artworks.find(a => a.id === id);
        if (!art) return;
        const dist = cam.position.distanceTo(frame.group.position);
        const isHighlighted = dist < PROXIMITY_THRESHOLD;
        if (isHighlighted) {
          if (!highlightedRef.current.has(id)) {
            const fm = framesRef.current.get(id);
            if (fm) {
              const bm = fm.frameBorder.material as THREE.MeshPhongMaterial;
              bm.color.setHex(0xffd700);
              bm.emissive.setHex(0x332800);
            }
            highlightedRef.current.add(id);
          }
          if (dist < closestDist) {
            closestDist = dist;
            closestArtwork = art;
          }
        } else {
          if (highlightedRef.current.has(id)) {
            const fm = framesRef.current.get(id);
            if (fm) {
              const bm = fm.frameBorder.material as THREE.MeshPhongMaterial;
              bm.color.copy(fm.originalBorderColor);
              bm.emissive.setHex(0x000000);
            }
            highlightedRef.current.delete(id);
          }
        }
      });

      if (closestArtwork) {
        setHoveredInfo({ artwork: closestArtwork, distance: closestDist });
      } else {
        setHoveredInfo(null);
      }

      ren.render(sc, cam);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [galleryId, gallery, artworks]);

  useEffect(() => {
    initScene();
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      framesRef.current.forEach((f) => ArtworkRenderer.disposeFrame(f));
      framesRef.current.clear();
      highlightedRef.current.clear();
      if (rendererRef.current && containerRef.current) {
        if (rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, [initScene]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { mouseDownRef.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (mouseDownRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        yawRef.current += dx * 0.003;
        pitchRef.current -= dy * 0.003;
        pitchRef.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchRef.current));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
      if (rendererRef.current && cameraRef.current && containerRef.current) {
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes: THREE.Object3D[] = [];
      framesRef.current.forEach((f) => meshes.push(...f.group.children));
      const intersects = raycasterRef.current.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.artworkId) {
          obj = obj.parent;
        }
        if (obj.userData.artworkId) {
          const art = artworks.find(a => a.id === obj.userData.artworkId);
          if (art) onArtworkClick(art);
        }
      }
    };
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
    };
  }, [artworks, onArtworkClick]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: mouseDownRef.current ? 'grabbing' : 'grab' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, border: '3px solid #FFD700', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#E0E0E0', fontSize: 14 }}>画廊加载中...</div>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(44,44,44,0.8)', borderRadius: 12, padding: '8px 14px', fontSize: 12, color: '#E0E0E0', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,215,0,0.2)' }}>
        <div><strong>操作提示</strong></div>
        <div style={{ marginTop: 4, color: '#A0A0A0' }}>WASD 移动 · 鼠标拖拽旋转 · 点击画作查看评论</div>
      </div>
      {fps > 0 && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(44,44,44,0.8)', borderRadius: 12, padding: '6px 12px', fontSize: 12, color: fps >= 30 ? '#4ECDC4' : '#FF6B6B', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,215,0,0.2)' }}>
          {fps} FPS
        </div>
      )}
      {hoveredInfo && (
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'rgba(44,44,44,0.95)', borderRadius: 12, padding: '14px 20px', border: '2px solid #FFD700', backdropFilter: 'blur(10px)', minWidth: 300, maxWidth: 420 }}>
          <div style={{ color: '#FFD700', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{hoveredInfo.artwork.title}</div>
          <div style={{ color: '#A0A0A0', fontSize: 13, marginBottom: 8 }}>作者：{hoveredInfo.artwork.authorName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#FFB800', fontSize: 14 }}>
              {'★'.repeat(Math.round(hoveredInfo.artwork.averageRating))}
              <span style={{ color: '#666' }}>{'★'.repeat(5 - Math.round(hoveredInfo.artwork.averageRating))}</span>
              <span style={{ marginLeft: 6, color: '#E0E0E0' }}>{hoveredInfo.artwork.averageRating.toFixed(1)}</span>
            </div>
            <div style={{ color: '#C0C0C0', fontSize: 13 }}>❤ {hoveredInfo.artwork.likes}</div>
            <div style={{ color: '#C0C0C0', fontSize: 13 }}>💬 {hoveredInfo.artwork.commentCount}</div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
