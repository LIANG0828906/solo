import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore } from './store';
import { StorageUnit } from './types';
import { calculateUtilization, getUtilizationColor } from './utils';
import { Info, Package } from 'lucide-react';

const ThreeViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationIdRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const { units, highlightedUnitId, searchQuery } = useStore();
  const [hoveredUnit, setHoveredUnit] = useState<StorageUnit | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      if (a.id === highlightedUnitId) return 1;
      if (b.id === highlightedUnitId) return -1;
      return 0;
    });
  }, [units, highlightedUnitId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, dimensions.height);
      gradient.addColorStop(0, '#2c2c2c');
      gradient.addColorStop(1, '#1a1a1a');
      context.fillStyle = gradient;
      context.fillRect(0, 0, dimensions.width, dimensions.height);
      const texture = new THREE.CanvasTexture(canvas);
      scene.background = texture;
    }
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      dimensions.width / dimensions.height,
      0.1,
      5000
    );
    const distance = 400;
    camera.position.set(
      distance * Math.cos(Math.PI / 4) * Math.sin(Math.PI / 4),
      distance * Math.cos(Math.PI / 4),
      distance * Math.sin(Math.PI / 4) * Math.sin(Math.PI / 4)
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.3);
    rimLight.position.set(-100, 50, -100);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(400, 40, 0x444444, 0x333333);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    meshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      mesh.geometry.dispose();
    });
    meshesRef.current.clear();

    const matchesSearch = (unit: StorageUnit): boolean => {
      if (!searchQuery.trim()) return false;
      const q = searchQuery.toLowerCase();
      return (
        unit.name.toLowerCase().includes(q) ||
        unit.items.some((item) => item.name.toLowerCase().includes(q))
      );
    };

    sortedUnits.forEach((unit) => {
      const utilization = calculateUtilization(unit);
      const baseColor = getUtilizationColor(utilization);
      const isHighlighted = unit.id === highlightedUnitId;
      const isSearched = matchesSearch(unit);
      const shouldGlow = isHighlighted || isSearched;

      const scale = 0.5;
      const w = unit.width * scale;
      const h = unit.height * scale;
      const d = unit.depth * scale;
      const x = (unit.x - 150) * scale;
      const z = (unit.y - 100) * scale;
      const y = h / 2;

      const geometry = new THREE.BoxGeometry(w, h, d);
      const color = new THREE.Color(baseColor);

      const materials = [
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.8),
          transparent: true,
          opacity: shouldGlow ? 0.85 : 0.7,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.8),
          transparent: true,
          opacity: shouldGlow ? 0.85 : 0.7,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(1.1),
          transparent: true,
          opacity: shouldGlow ? 0.9 : 0.75,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.4,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.6),
          transparent: true,
          opacity: shouldGlow ? 0.85 : 0.7,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.9),
          transparent: true,
          opacity: shouldGlow ? 0.85 : 0.7,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.7),
          transparent: true,
          opacity: shouldGlow ? 0.85 : 0.7,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: THREE.DoubleSide,
        }),
      ];

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { unitId: unit.id };

      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: shouldGlow ? 0xffffff : 0xaaaaaa,
        transparent: true,
        opacity: shouldGlow ? 0.9 : 0.4,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      mesh.add(edges);

      if (shouldGlow) {
        const glowGeometry = new THREE.BoxGeometry(w * 1.08, h * 1.08, d * 1.08);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff88,
          transparent: true,
          opacity: 0.25,
          side: THREE.BackSide,
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glowMesh);
      }

      scene.add(mesh);
      meshesRef.current.set(unit.id, mesh);
    });
  }, [sortedUnits, highlightedUnitId, searchQuery]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !rendererRef.current) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = Array.from(meshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const unitId = mesh.userData.unitId;
        const unit = units.find((u) => u.id === unitId);
        if (unit) {
          setHoveredUnit(unit);
          setTooltipPos({ x: event.clientX, y: event.clientY });
        }
      } else {
        setHoveredUnit(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredUnit(null);
    };

    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [units, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />

      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none">
        拖拽旋转视角 · 滚轮缩放
      </div>

      {hoveredUnit && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '8px',
            padding: '12px 16px',
            minWidth: '240px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getUtilizationColor(calculateUtilization(hoveredUnit)) }}
            />
            <Info size={16} className="text-gray-600" />
            <span className="font-semibold text-gray-800">{hoveredUnit.name}</span>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1.5">空间利用率</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${calculateUtilization(hoveredUnit)}%`,
                    background: getUtilizationColor(calculateUtilization(hoveredUnit)),
                  }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 w-12 text-right">
                {calculateUtilization(hoveredUnit).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-2">
            尺寸: {hoveredUnit.width} × {hoveredUnit.depth} × {hoveredUnit.height} cm
          </div>

          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Package size={13} />
              <span>物品清单 ({hoveredUnit.items.length})</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {hoveredUnit.items.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-1">暂无物品</div>
              ) : (
                hoveredUnit.items.map((item) => (
                  <div key={item.id} className="text-xs text-gray-600 flex justify-between py-0.5">
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-gray-400 ml-2">×{item.quantity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeViewer;
