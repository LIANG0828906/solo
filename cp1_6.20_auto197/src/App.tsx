import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import ControlPanel from './ui/ControlPanel';
import { generateSedimentLayers, SedimentLayer } from './data/sedimentData';
import {
  generateCubicBlock,
  CubicBlockResult,
  setBlockOpacity,
  highlightLayer
} from './scene/CubicBlock';
import {
  createCrossSectionManager,
  CrossSectionManager
} from './scene/CrossSection';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  layerName: string;
  depth: number;
}

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const blockRef = useRef<CubicBlockResult | null>(null);
  const sectionManagerRef = useRef<CrossSectionManager | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const animationIdRef = useRef<number>(0);

  const targetRotationRef = useRef({ x: -Math.PI / 4, y: Math.PI / 4 });
  const currentRotationRef = useRef({ x: -Math.PI / 4, y: Math.PI / 4 });
  const targetDistanceRef = useRef(25);
  const currentDistanceRef = useRef(25);
  const targetPanRef = useRef({ x: 0, y: 0 });
  const currentPanRef = useRef({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isSectionDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dragStartPointRef = useRef<THREE.Vector3 | null>(null);
  const dragCurrentPointRef = useRef<THREE.Vector3 | null>(null);
  const tempSectionRef = useRef<THREE.Group | null>(null);

  const [layers, setLayers] = useState<SedimentLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    layerName: '',
    depth: 0
  });

  const BLOCK_SIZE = 10;
  const HALF_SIZE = BLOCK_SIZE / 2;

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e2233);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(15, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 60;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.25);
    fillLight.position.set(-10, 8, -12);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0xffddaa, 0.15);
    bottomLight.position.set(0, -15, 0);
    scene.add(bottomLight);

    const sedimentLayers = generateSedimentLayers();
    setLayers(sedimentLayers);

    const cubicBlock = generateCubicBlock(sedimentLayers);
    scene.add(cubicBlock.group);
    blockRef.current = cubicBlock;

    const gridHelper = new THREE.GridHelper(30, 30, 0x4a90c4, 0x2a3050);
    gridHelper.position.y = -HALF_SIZE - 0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(HALF_SIZE + 3.5, HALF_SIZE + 3.5, -HALF_SIZE - 3.5);
    scene.add(axesHelper);

    const axesGroup = new THREE.Group();
    const xLabel = createTextSprite('X', '#ff5555');
    xLabel.position.set(3.5, 0, 0);
    const yLabel = createTextSprite('Y', '#55ff55');
    yLabel.position.set(0, 3.5, 0);
    const zLabel = createTextSprite('Z', '#5555ff');
    zLabel.position.set(0, 0, 3.5);
    axesGroup.add(xLabel, yLabel, zLabel);
    axesGroup.position.copy(axesHelper.position);
    scene.add(axesGroup);

    const sectionManager = createCrossSectionManager(scene, sedimentLayers);
    sectionManagerRef.current = sectionManager;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;
      currentDistanceRef.current += (targetDistanceRef.current - currentDistanceRef.current) * 0.1;
      currentPanRef.current.x += (targetPanRef.current.x - currentPanRef.current.x) * 0.1;
      currentPanRef.current.y += (targetPanRef.current.y - currentPanRef.current.y) * 0.1;

      const r = currentDistanceRef.current;
      const theta = currentRotationRef.current.y;
      const phi = currentRotationRef.current.x;

      camera.position.x = currentPanRef.current.x + r * Math.cos(phi) * Math.sin(theta);
      camera.position.y = currentPanRef.current.y + r * Math.sin(phi);
      camera.position.z = r * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(currentPanRef.current.x, currentPanRef.current.y, 0);

      if (tempSectionRef.current && dragCurrentPointRef.current && dragStartPointRef.current) {
        updateTempSection(dragStartPointRef.current, dragCurrentPointRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();
  }, []);

  const createTextSprite = (text: string, color: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(1.2, 1.2, 1);
    return sprite;
  };

  const updateTempSection = (startPoint: THREE.Vector3, currentPoint: THREE.Vector3) => {
    if (!tempSectionRef.current || !sceneRef.current) return;

    const dx = Math.abs(currentPoint.x - startPoint.x);
    const dz = Math.abs(currentPoint.z - startPoint.z);
    const orientation: 'x' | 'z' = dx >= dz ? 'x' : 'z';
    const position = orientation === 'x' ? (startPoint.x + currentPoint.x) / 2 : (startPoint.z + currentPoint.z) / 2;
    const clampedPos = Math.max(-HALF_SIZE + 0.1, Math.min(HALF_SIZE - 0.1, position));

    tempSectionRef.current.position.set(0, 0, 0);
    tempSectionRef.current.rotation.set(0, 0, 0);

    if (orientation === 'x') {
      tempSectionRef.current.position.x = clampedPos;
      tempSectionRef.current.rotation.y = Math.PI / 2;
    } else {
      tempSectionRef.current.position.z = clampedPos;
    }
  };

  useEffect(() => {
    initScene();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      sectionManagerRef.current?.dispose();
    };
  }, [initScene]);

  useEffect(() => {
    if (blockRef.current) {
      setBlockOpacity(blockRef.current, opacity);
    }
    if (gridHelperRef.current) {
      const targetOpacity = opacity < 0.95 ? 0.4 : 0;
      (gridHelperRef.current.material as THREE.Material).opacity = targetOpacity;
    }
  }, [opacity]);

  useEffect(() => {
    if (blockRef.current) {
      highlightLayer(blockRef.current, selectedLayerId);
    }
  }, [selectedLayerId]);

  const raycastToBlock = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current || !blockRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes: THREE.Mesh[] = [];
    blockRef.current.layerMeshes.forEach((m) => meshes.push(m));
    const sectionMeshes = sectionManagerRef.current?.getAll().map((s) => s.textureMesh) || [];

    const allMeshes = [...meshes, ...sectionMeshes];
    const intersects = raycaster.intersectObjects(allMeshes, false);

    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 2) {
      isPanningRef.current = true;
      return;
    }

    if (e.button === 0 && e.shiftKey) {
      const hitPoint = raycastToBlock(e.clientX, e.clientY);
      if (hitPoint && sceneRef.current && blockRef.current) {
        isSectionDraggingRef.current = true;
        dragStartPointRef.current = hitPoint.clone();
        dragCurrentPointRef.current = hitPoint.clone();

        const planeGeometry = new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE);
        const planeMaterial = new THREE.MeshBasicMaterial({
          color: 0x9b59b6,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

        const borderPoints: THREE.Vector3[] = [];
        const hs = HALF_SIZE;
        const corners = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs], [-hs, -hs]];
        corners.forEach(([a, b]) => borderPoints.push(new THREE.Vector3(a, b, 0)));
        const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const border = new THREE.Line(borderGeometry, new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          linewidth: 2
        }));
        border.position.z = 0.01;

        const tempGroup = new THREE.Group();
        tempGroup.add(planeMesh);
        tempGroup.add(border);
        sceneRef.current.add(tempGroup);
        tempSectionRef.current = tempGroup;

        updateTempSection(dragStartPointRef.current, dragCurrentPointRef.current);
      }
      return;
    }

    if (e.button === 0) {
      isDraggingRef.current = true;
    }
  }, [raycastToBlock]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    if (isSectionDraggingRef.current && sceneRef.current) {
      const hitPoint = raycastToBlock(e.clientX, e.clientY);
      if (hitPoint) {
        dragCurrentPointRef.current = hitPoint.clone();
      } else {
        if (containerRef.current && cameraRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, cameraRef.current);
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const target = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, target);
          if (target) {
            dragCurrentPointRef.current = target.clone();
          }
        }
      }
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isDraggingRef.current) {
      targetRotationRef.current.y += dx * 0.008;
      targetRotationRef.current.x += dy * 0.008;
      const maxPhi = Math.PI / 2 - 0.05;
      const minPhi = -Math.PI / 2 + 0.05;
      targetRotationRef.current.x = Math.max(minPhi, Math.min(maxPhi, targetRotationRef.current.x));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isPanningRef.current) {
      const panSpeed = currentDistanceRef.current * 0.0015;
      const forward = new THREE.Vector3();
      cameraRef.current?.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      targetPanRef.current.x += (-dx * panSpeed) * right.x;
      targetPanRef.current.y += (dy * panSpeed) * up.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDraggingRef.current && !isPanningRef.current && !isSectionDraggingRef.current && sectionManagerRef.current) {
      const hitPoint = raycastToBlock(e.clientX, e.clientY);
      if (hitPoint) {
        const sectionHit = sectionManagerRef.current.getTextureMeshAtPoint(hitPoint);
        if (sectionHit && blockRef.current) {
          const worldYFromBottom = sectionHit.localY + HALF_SIZE;
          const layer = layers.find(
            (l) => worldYFromBottom >= l.yStart && worldYFromBottom <= l.yEnd
          );
          if (layer) {
            const depth = (BLOCK_SIZE - worldYFromBottom) * 10;
            setTooltip({
              visible: true,
              x: e.clientX + 12,
              y: e.clientY + 12,
              layerName: layer.name,
              depth: parseFloat(depth.toFixed(1))
            });
            if (containerRef.current) {
              containerRef.current.style.cursor = 'crosshair';
            }
            return;
          }
        }
      }
      if (containerRef.current) {
        containerRef.current.style.cursor = isDraggingRef.current || isPanningRef.current ? 'grabbing' : 'default';
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  }, [raycastToBlock, layers]);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (isSectionDraggingRef.current && dragStartPointRef.current && dragCurrentPointRef.current && sceneRef.current) {
      const start = dragStartPointRef.current;
      const end = dragCurrentPointRef.current;
      const dx = Math.abs(end.x - start.x);
      const dz = Math.abs(end.z - start.z);
      const dragDistance = Math.sqrt(dx * dx + dz * dz);

      if (dragDistance > 0.5 && sectionManagerRef.current) {
        const orientation: 'x' | 'z' = dx >= dz ? 'x' : 'z';
        const position = orientation === 'x' ? (start.x + end.x) / 2 : (start.z + end.z) / 2;
        sectionManagerRef.current.add(position, orientation);
      }

      if (tempSectionRef.current) {
        sceneRef.current.remove(tempSectionRef.current);
        tempSectionRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          }
        });
        tempSectionRef.current = null;
      }

      isSectionDraggingRef.current = false;
      dragStartPointRef.current = null;
      dragCurrentPointRef.current = null;
    }

    isDraggingRef.current = false;
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    targetDistanceRef.current = Math.max(12, Math.min(60, targetDistanceRef.current * zoomFactor));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleReset = useCallback(() => {
    targetRotationRef.current = { x: -Math.PI / 4, y: Math.PI / 4 };
    targetDistanceRef.current = 25;
    targetPanRef.current = { x: 0, y: 0 };
    setOpacity(1.0);
    setSelectedLayerId(null);
    sectionManagerRef.current?.removeAll();
  }, []);

  const selectStyle: React.CSSProperties = {
    transition: 'all 0.2s ease-out'
  };

  void selectStyle;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          isPanningRef.current = false;
          if (containerRef.current) {
            containerRef.current.style.cursor = 'default';
          }
          setTooltip((prev) => ({ ...prev, visible: false }));
        }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      <ControlPanel
        layers={layers}
        selectedLayerId={selectedLayerId}
        opacity={opacity}
        onLayerSelect={setSelectedLayerId}
        onOpacityChange={setOpacity}
        onResetView={handleReset}
      />

      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#1e2233',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.layerName}</div>
          <div style={{ color: '#5a6080', fontSize: 13 }}>
            距地表深度: <span style={{ fontWeight: 600, color: '#4a90c4' }}>{tooltip.depth} m</span>
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = '#357abd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#4a90c4';
        }}
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#4a90c4',
          border: 'none',
          color: '#ffffff',
          fontSize: 24,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(74, 144, 196, 0.5), 0 0 0 0 rgba(74, 144, 196, 0.6)',
          animation: 'pulse 2s ease-in-out infinite',
          transition: 'all 0.2s ease-out'
        }}
        title="重置视角与切面"
      >
        ⟲
      </button>

      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'rgba(30, 34, 51, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '14px 18px',
          color: '#e8e8ed',
          zIndex: 100,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.6
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          地质三维可视化
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
          沉积层剖面分析
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          块体尺寸: 100m × 100m × 100m | 岩层: {layers.length} 层
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(74, 144, 196, 0.5), 0 0 0 0 rgba(74, 144, 196, 0.5);
          }
          50% {
            box-shadow: 0 4px 20px rgba(74, 144, 196, 0.7), 0 0 0 12px rgba(74, 144, 196, 0);
          }
        }
        select:hover {
          border-color: rgba(74, 144, 196, 0.6) !important;
          background: rgba(74, 144, 196, 0.1) !important;
        }
        select:focus {
          border-color: #4a90c4 !important;
          box-shadow: 0 0 0 2px rgba(74, 144, 196, 0.25);
        }
        button:hover {
          filter: brightness(1.1);
        }
        input[type="range"]::-webkit-slider-thumb {
          transition: all 0.2s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default App;
