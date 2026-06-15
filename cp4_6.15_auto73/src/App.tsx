import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { ArtEngine } from '@/module-art/core/ArtEngine';
import { GalleryBuilder, type ArtworkPosition } from '@/module-art/gallery/GalleryBuilder';
import { DynamicArt } from '@/module-art/artworks/DynamicArt';
import { useArtInteraction } from '@/module-interaction/hooks/useArtInteraction';
import ArtDetailPanel from '@/module-interaction/ui/ArtDetailPanel';
import NavigationPanel from '@/module-interaction/ui/NavigationPanel';
import { useGalleryStore } from '@/store/useGalleryStore';
import type { Artwork } from '@/types';

interface DynamicArtInstance {
  canvas: HTMLCanvasElement;
  dynamicArt: DynamicArt;
  texture: THREE.CanvasTexture;
}

interface ArtworkSeedData {
  name: string;
  description: string;
  seed: number;
}

const ARTWORK_SEED_DATA: ArtworkSeedData[] = [
  {
    name: '星云律动',
    description:
      '在宇宙深处捕捉到的星云脉动轨迹，色彩以深邃的紫罗兰和幽蓝为主调，粒子如同星际尘埃般缓缓流动，呈现出宇宙诞生之初的混沌与秩序的完美交融。',
    seed: 1,
  },
  {
    name: '数字涟漪',
    description:
      '当数据汇入信息之海，激起层层数字涟漪。翠绿色调如同代码的脉搏，几何图形的有序变换展现出算法世界的内在韵律与结构美学。',
    seed: 2,
  },
  {
    name: '量子之舞',
    description:
      '微观世界中粒子的概率云舞蹈，橙红色彩映射能量跃迁的瞬间光辉。形状的随机涌现与消散，完美诠释了量子叠加态的神秘与美丽。',
    seed: 3,
  },
  {
    name: '幻境流光',
    description:
      '梦境与现实边界处的流光幻影，粉紫色调编织出超现实的视觉诗篇。粒子轨迹如思绪般蜿蜒流转，带领观者进入超越时空的意识维度。',
    seed: 4,
  },
  {
    name: '永恒回旋',
    description:
      '时间之环的无限循环，金黄与靛蓝的交织象征着光明与黑暗的永恒对话。几何图形的回旋运动，诉说着万物周而复始的哲学奥义。',
    seed: 5,
  },
  {
    name: '极光漫舞',
    description:
      '极地夜空中舞动的神秘光幕，青绿色调如精灵般跳跃闪烁。粒子的流动重现了太阳风与地球磁场相遇时，那令人屏息的大自然光舞奇迹。',
    seed: 6,
  },
];

function seededGenerateColors(seed: number): string[] {
  const mulberry32 = (s: number) => {
    let t = s >>> 0;
    return function () {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  const random = mulberry32(seed);
  const baseHue = random() * 360;
  const colorCount = 5 + Math.floor(random() * 3);
  const colors: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const hue = (baseHue + (i * 360) / colorCount) % 360;
    const saturation = 60 + Math.floor(random() * 30);
    const lightness = 50 + Math.floor(random() * 20);
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const hex = Math.round(255 * x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getDominantColorHex(colors: string[]): string {
  const firstColor = colors[0];
  const hslMatch = firstColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    return hslToHex(h, s, l);
  }
  return firstColor.startsWith('#') ? firstColor : '#ffffff';
}

const internalId = (index: number): string => `artwork-${index}`;

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const artEngineRef = useRef<ArtEngine | null>(null);
  const galleryBuilderRef = useRef<GalleryBuilder | null>(null);
  const dynamicArtInstancesRef = useRef<Map<string, DynamicArtInstance>>(new Map());
  const artworkPositionsRef = useRef<ArtworkPosition[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const internalToUuidRef = useRef<Map<string, string>>(new Map());
  const uuidToInternalRef = useRef<Map<string, string>>(new Map());
  const artworkIdToIndexRef = useRef<Map<string, number>>(new Map());

  const [interactiveObjects, setInteractiveObjects] = useState<THREE.Object3D[]>([]);
  const [sceneReady, setSceneReady] = useState(false);

  const {
    artworks,
    selectedArtworkId,
    hoveredArtworkId,
    setArtworks,
    setSelectedArtwork,
    setHoveredArtwork,
    setDetailPanelOpen,
  } = useGalleryStore();

  const selectedArtwork = useMemo(() => {
    if (!selectedArtworkId) return null;
    return artworks.find((a) => a.id === selectedArtworkId) ?? null;
  }, [selectedArtworkId, artworks]);

  const handleInteractionHover = useCallback(
    (internalArtworkId: string | null) => {
      if (internalArtworkId === null) {
        setHoveredArtwork(null);
        return;
      }
      const uuid = internalToUuidRef.current.get(internalArtworkId) ?? null;
      setHoveredArtwork(uuid);
    },
    [setHoveredArtwork]
  );

  const handleInteractionSelect = useCallback(
    (internalArtworkId: string | null) => {
      if (internalArtworkId === null) {
        setSelectedArtwork(null);
        setDetailPanelOpen(false);
        return;
      }
      const uuid = internalToUuidRef.current.get(internalArtworkId) ?? null;
      if (uuid) {
        setSelectedArtwork(uuid);
        setDetailPanelOpen(true);
      }
    },
    [setSelectedArtwork, setDetailPanelOpen]
  );

  useArtInteraction({
    scene: sceneReady ? artEngineRef.current?.getScene() ?? null : null,
    camera: sceneReady ? artEngineRef.current?.getCamera() ?? null : null,
    interactiveObjects,
    enabled: sceneReady,
    galleryBuilderRef,
    onHover: handleInteractionHover,
    onSelect: handleInteractionSelect,
  });

  useEffect(() => {
    if (!galleryBuilderRef.current) return;

    const internalSelectedId = selectedArtworkId
      ? uuidToInternalRef.current.get(selectedArtworkId) ?? null
      : null;
    galleryBuilderRef.current.setSelectedArtwork(internalSelectedId);

    if (selectedArtworkId) {
      const artwork = artworks.find((a) => a.id === selectedArtworkId);
      if (artwork) {
        const dominantColor = getDominantColorHex(artwork.colorPalette);
        galleryBuilderRef.current.setParticleColor(dominantColor);
      }
    } else {
      galleryBuilderRef.current.setParticleColor(0xffffff);
    }
  }, [selectedArtworkId, artworks]);

  useEffect(() => {
    if (!galleryBuilderRef.current) return;

    const internalHoveredId = hoveredArtworkId
      ? uuidToInternalRef.current.get(hoveredArtworkId) ?? null
      : null;
    galleryBuilderRef.current.setHoveredArtwork(internalHoveredId);
  }, [hoveredArtworkId]);

  useEffect(() => {
    artworks.forEach((artwork) => {
      const instance = dynamicArtInstancesRef.current.get(artwork.id);
      if (instance) {
        instance.dynamicArt.updateColors(artwork.colorPalette);
        instance.dynamicArt.updateParticleSpeed(artwork.particleSpeed);
      }
    });
  }, [artworks]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const artEngine = new ArtEngine(container);
    artEngine.init();
    artEngineRef.current = artEngine;

    const scene = artEngine.getScene();
    const camera = artEngine.getCamera();

    scene.userData.canvas = artEngine.getRenderer().domElement;

    const galleryBuilder = new GalleryBuilder(scene, {
      artworkCount: 6,
    });
    galleryBuilder.build();
    galleryBuilderRef.current = galleryBuilder;

    artworkPositionsRef.current = galleryBuilder.getArtworkPositions();

    const createdArtworks: Artwork[] = [];
    const frameGroups = galleryBuilder.getFrameGroups();

    artworkPositionsRef.current.forEach((pos, index) => {
      const seedData = ARTWORK_SEED_DATA[index];
      const colors = seededGenerateColors(seedData.seed);
      const speed = 0.8 + (seedData.seed % 5) * 0.15;
      const artworkUuid = uuidv4();
      const intId = internalId(index);

      internalToUuidRef.current.set(intId, artworkUuid);
      uuidToInternalRef.current.set(artworkUuid, intId);
      artworkIdToIndexRef.current.set(artworkUuid, index);

      const artwork: Artwork = {
        id: artworkUuid,
        name: seedData.name,
        author: '灵感画廊 AI 创作',
        description: seedData.description,
        colorPalette: [...colors],
        particleSpeed: speed,
        initialColorPalette: [...colors],
        initialParticleSpeed: speed,
      };
      createdArtworks.push(artwork);

      const group = pos.frameGroup;
      const frameGroupChildren = frameGroups[index]?.children ?? [];
      let canvasMesh: THREE.Mesh | null = null;

      for (const child of frameGroupChildren) {
        if (
          child instanceof THREE.Mesh &&
          (child.name === 'artwork-canvas' || child.userData?.type === 'canvas')
        ) {
          canvasMesh = child;
          break;
        }
      }

      if (!canvasMesh) {
        for (const child of group.children) {
          if (
            child instanceof THREE.Mesh &&
            (child.name === 'artwork-canvas' || child.userData?.type === 'canvas')
          ) {
            canvasMesh = child;
            break;
          }
        }
      }

      const dynamicCanvas = document.createElement('canvas');
      dynamicCanvas.width = 512;
      dynamicCanvas.height = 384;
      dynamicCanvas.style.width = '512px';
      dynamicCanvas.style.height = '384px';
      document.body.appendChild(dynamicCanvas);
      dynamicCanvas.style.position = 'absolute';
      dynamicCanvas.style.left = '-9999px';
      dynamicCanvas.style.top = '-9999px';

      const dynamicArt = new DynamicArt(dynamicCanvas, {
        colors: [...colors],
        particleSpeed: speed,
        seed: seedData.seed * 1000,
      });
      dynamicArt.start();

      const texture = new THREE.CanvasTexture(dynamicCanvas);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      if (canvasMesh && canvasMesh.material instanceof THREE.MeshBasicMaterial) {
        canvasMesh.material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });
      }

      dynamicArtInstancesRef.current.set(artworkUuid, {
        canvas: dynamicCanvas,
        dynamicArt,
        texture,
      });

      group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          child.userData.artworkId = intId;
        }
      });

      artworkPositionsRef.current[index] = {
        ...pos,
        id: artworkUuid,
      };
    });

    setArtworks(createdArtworks);

    const allObjects: THREE.Object3D[] = [];
    frameGroups.forEach((group) => {
      allObjects.push(group);
    });
    setInteractiveObjects(allObjects);

    artEngine.animate();
    setSceneReady(true);

    lastTimeRef.current = performance.now();

    const renderLoop = () => {
      const currentTime = performance.now();
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      const delta = deltaMs / 1000;

      if (galleryBuilderRef.current) {
        galleryBuilderRef.current.update(delta, camera);
      }

      dynamicArtInstancesRef.current.forEach((instance) => {
        instance.texture.needsUpdate = true;
      });

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };
    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      artEngine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      dynamicArtInstancesRef.current.forEach((instance) => {
        instance.dynamicArt.destroy();
        instance.texture.dispose();
        if (instance.canvas.parentNode) {
          instance.canvas.parentNode.removeChild(instance.canvas);
        }
      });
      dynamicArtInstancesRef.current.clear();

      if (galleryBuilderRef.current) {
        galleryBuilderRef.current.dispose();
        galleryBuilderRef.current = null;
      }

      artworkPositionsRef.current = [];
      internalToUuidRef.current.clear();
      uuidToInternalRef.current.clear();
      artworkIdToIndexRef.current.clear();

      if (artEngineRef.current) {
        artEngineRef.current.dispose();
        artEngineRef.current = null;
      }

      setSceneReady(false);
      setInteractiveObjects([]);
    };
  }, [setArtworks]);

  const handleFlyToArtwork = useCallback(
    (artworkId: string) => {
      if (!artEngineRef.current || !galleryBuilderRef.current) return;

      const index = artworkIdToIndexRef.current.get(artworkId);
      if (index === undefined) return;

      const framePositions = galleryBuilderRef.current.getArtworkPositions();
      const artworkPos = framePositions[index];
      if (!artworkPos) return;

      const framePosition = artworkPos.position.clone();
      const galleryCenter = new THREE.Vector3(0, 1.5, 0);

      const direction = new THREE.Vector3()
        .subVectors(galleryCenter, framePosition)
        .normalize();
      direction.y = 0;

      const cameraDistance = 3;
      const cameraPosition = new THREE.Vector3()
        .copy(framePosition)
        .add(direction.multiplyScalar(cameraDistance));
      cameraPosition.y = 1.5;

      const lookAtTarget = new THREE.Vector3().copy(framePosition);

      artEngineRef.current.flyTo(cameraPosition, lookAtTarget, 1500);

      window.setTimeout(() => {
        setSelectedArtwork(artworkId);
        setDetailPanelOpen(true);
      }, 1600);
    },
    [setSelectedArtwork, setDetailPanelOpen]
  );

  const handleCloseDetailPanel = useCallback(() => {
    setSelectedArtwork(null);
    setDetailPanelOpen(false);
  }, [setSelectedArtwork, setDetailPanelOpen]);

  return (
    <div
      className="app-container"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      />

      {sceneReady && (
        <>
          <NavigationPanel onFlyToArtwork={handleFlyToArtwork} />
          <ArtDetailPanel artwork={selectedArtwork} onClose={handleCloseDetailPanel} />
        </>
      )}

      {!sceneReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '24px',
              color: '#a78bfa',
              letterSpacing: '2px',
            }}
          >
            正在加载灵感画廊...
          </div>
        </div>
      )}
    </div>
  );
}
