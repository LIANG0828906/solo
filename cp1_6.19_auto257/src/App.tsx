import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import SeasonControl from './components/SeasonControl';
import { PlantScene, PlantObject } from './scenes/PlantScene';
import { PollinatorModule } from './modules/PollinatorModule';
import { useSeasonStore } from './store/seasonStore';
import { PlantType, plantNames, plantInfo, seasonThemeColors } from './utils/colorPalette';

interface PlantInfoCard {
  plant: PlantObject;
  position: { x: number; y: number };
}

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const plantSceneRef = useRef<PlantScene | null>(null);
  const pollinatorModuleRef = useRef<PollinatorModule | null>(null);
  const animationFrameRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isTransitioningRef = useRef<boolean>(false);

  const [selectedPlant, setSelectedPlant] = useState<PlantInfoCard | null>(null);
  const { currentSeason, transitionProgress, updateTransitionProgress } = useSeasonStore();

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1A2E);
    scene.fog = new THREE.Fog(0x1A1A2E, 15, 30);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    const plantScene = new PlantScene(scene);
    plantSceneRef.current = plantScene;

    const plantPositions = plantScene.getPlantPositions();
    const pollinatorModule = new PollinatorModule(scene, plantPositions);
    pollinatorModuleRef.current = pollinatorModule;

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const animate = useCallback(() => {
    const animateLoop = () => {
      animationFrameRef.current = requestAnimationFrame(animateLoop);

      const deltaTime = clockRef.current.getDelta();

      if (plantSceneRef.current) {
        plantSceneRef.current.update(deltaTime);
      }

      if (pollinatorModuleRef.current) {
        pollinatorModuleRef.current.update(deltaTime);
      }

      if (isTransitioningRef.current) {
        const progress = useSeasonStore.getState().transitionProgress;
        if (progress < 1) {
          updateTransitionProgress(Math.min(progress + deltaTime * 0.5, 1));
        } else {
          isTransitioningRef.current = false;
        }
      }

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animateLoop();
  }, [updateTransitionProgress]);

  const handleSeasonChange = useCallback(() => {
    isTransitioningRef.current = true;
    const seasonColor = seasonThemeColors[currentSeason];
    
    if (sceneRef.current) {
      const newBgColor = new THREE.Color(0x1A1A2E);
      gsap.to(sceneRef.current.background, {
        r: newBgColor.r,
        g: newBgColor.g,
        b: newBgColor.b,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [currentSeason]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !plantSceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const hitPlant = plantSceneRef.current.raycast(raycasterRef.current);

    if (hitPlant) {
      setSelectedPlant({
        plant: hitPlant,
        position: { x: event.clientX, y: event.clientY }
      });

      const targetPosition = hitPlant.centerPosition.clone();
      const offset = new THREE.Vector3(2.5, 2.5, 2.5);
      const newCameraPos = targetPosition.clone().add(offset);

      if (cameraRef.current) {
        gsap.to(cameraRef.current.position, {
          x: newCameraPos.x,
          y: newCameraPos.y,
          z: newCameraPos.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (cameraRef.current) {
              cameraRef.current.lookAt(targetPosition);
            }
          }
        });
      }
    } else {
      setSelectedPlant(null);

      if (cameraRef.current) {
        gsap.to(cameraRef.current.position, {
          x: 0,
          y: 8,
          z: 12,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (cameraRef.current) {
              cameraRef.current.lookAt(0, 1.5, 0);
            }
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    const cleanup = initScene();
    animate();

    const unsubscribe = useSeasonStore.subscribe((state, prevState) => {
      if (state.currentSeason !== prevState.currentSeason) {
        handleSeasonChange();
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      unsubscribe();
      cleanup?.();

      if (plantSceneRef.current) {
        plantSceneRef.current.dispose();
      }
      if (pollinatorModuleRef.current) {
        pollinatorModuleRef.current.dispose();
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, animate, handleSeasonChange]);

  const handleCardClose = useCallback(() => {
    setSelectedPlant(null);
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container" ref={containerRef} onClick={handleCanvasClick} />
      
      <div className="season-control-wrapper">
        <SeasonControl />
      </div>

      {selectedPlant && (
        <div
          className="plant-info-card"
          style={{
            position: 'fixed',
            left: `${selectedPlant.position.x + 10}px`,
            top: `${selectedPlant.position.y - 100}px`,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            minWidth: '240px',
            zIndex: 1000,
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#1A1A2E'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {plantNames[selectedPlant.plant.type]}
            </h3>
            <button
              onClick={handleCardClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, color: '#555' }}>当前状态：</span>
            <span>{plantInfo[selectedPlant.plant.type].description[currentSeason]}</span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, color: '#555' }}>适宜温度：</span>
            <span>{plantInfo[selectedPlant.plant.type].temperature}</span>
          </div>
          
          <div>
            <span style={{ fontWeight: 500, color: '#555' }}>适宜湿度：</span>
            <span>{plantInfo[selectedPlant.plant.type].humidity}</span>
          </div>
        </div>
      )}

      <div className="title-overlay">
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 300, letterSpacing: '2px' }}>
          植物园四季交互可视化
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
          点击季节按钮切换 · 点击植物查看详情
        </p>
      </div>

      <style>{`
        .app-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: #1A1A2E;
          color: #EAEAEA;
          overflow: hidden;
        }

        .scene-container {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }

        .season-control-wrapper {
          position: fixed;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          z-index: 100;
        }

        .title-overlay {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 50;
          pointer-events: none;
        }

        @media (max-width: 1000px) {
          .season-control-wrapper {
            top: 0;
            left: 50%;
            transform: translateX(-50%);
          }

          .title-overlay {
            top: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
