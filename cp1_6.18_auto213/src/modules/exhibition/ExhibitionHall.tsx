import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createProceduralModel, disposeModel, loadGLTFModel, type LoadProgress } from './artifactLoader';
import type { Artifact } from '../../types';

interface ExhibitionHallProps {
  selectedEventId: string | null;
  artifactData: Artifact | null;
  isLoading: boolean;
  onLoadingComplete: () => void;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const ExhibitionHall: React.FC<ExhibitionHallProps> = ({
  selectedEventId,
  artifactData,
  isLoading,
  onLoadingComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnglesRef = useRef({ theta: 0, phi: toRadians(15) });
  const cameraDistanceRef = useRef(5);
  const isVisibleRef = useRef(true);

  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const canvas = document.createElement('canvas');
    canvas.className = 'exhibition-canvas';

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333355);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const groundGeo = new THREE.CircleGeometry(10, 64);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x0A0F2E,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    containerRef.current.appendChild(canvas);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const delta = clock.getDelta();

      if (modelRef.current) {
        modelRef.current.rotation.y += delta * (2 * Math.PI / 12);
      }

      const { theta, phi } = cameraAnglesRef.current;
      const distance = cameraDistanceRef.current;
      camera.position.x = distance * Math.sin(theta) * Math.cos(phi);
      camera.position.y = 2 + distance * Math.sin(phi);
      camera.position.z = distance * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (modelRef.current) {
        scene.remove(modelRef.current);
        disposeModel(modelRef.current);
      }
      
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      cameraAnglesRef.current.theta -= deltaX * 0.005;
      cameraAnglesRef.current.phi += deltaY * 0.005;

      cameraAnglesRef.current.theta = Math.max(
        toRadians(-90),
        Math.min(toRadians(90), cameraAnglesRef.current.theta)
      );
      cameraAnglesRef.current.phi = Math.max(
        toRadians(-30),
        Math.min(toRadians(30), cameraAnglesRef.current.phi)
      );

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current += e.deltaY * 0.005;
      cameraDistanceRef.current = Math.max(0.5, Math.min(3, cameraDistanceRef.current));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId || !artifactData || !sceneRef.current) return;

    const loadModel = async () => {
      setLoadProgress(null);

      try {
        let model: THREE.Group;
        
        try {
          model = await loadGLTFModel(artifactData.modelPath, (progress) => {
            setLoadProgress(progress);
          });
        } catch {
          model = createProceduralModel(artifactData.modelType);
        }

        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
          disposeModel(modelRef.current);
        }

        modelRef.current = model;
        if (sceneRef.current) {
          sceneRef.current.add(model);
        }
        
        cameraAnglesRef.current = { theta: 0, phi: toRadians(15) };
        cameraDistanceRef.current = 5;

        onLoadingComplete();
      } catch (error) {
        console.error('模型加载失败:', error);
        onLoadingComplete();
      }
    };

    loadModel();
  }, [selectedEventId, artifactData, onLoadingComplete]);

  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0A0F2E 0%, #1A237E 100%)',
        cursor: isLoading ? 'progress' : 'grab'
      }}
    >
      {isLoading && (
        <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`}>
          <div>
            <div className="loading-spinner" />
            {loadProgress && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#64FFDA',
                textAlign: 'center'
              }}>
                {Math.round(loadProgress.percentage)}%
              </div>
            )}
          </div>
        </div>
      )}
      
      {!selectedEventId && (
        <div className="scene-placeholder">
          点击下方时间轴节点开始探索古代文明
        </div>
      )}
    </div>
  );
};
