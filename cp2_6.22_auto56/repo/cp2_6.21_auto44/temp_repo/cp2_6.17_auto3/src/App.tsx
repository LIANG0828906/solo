import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useEvolutionStore } from './evolution/EvolutionStore';
import { BioCreature } from './evolution/BioCreature';
import GeneticsPanel from './genetics/GeneticsPanel';
import type { Genotype } from './evolution/EvolutionEngine';

export default function App(): JSX.Element {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const creaturesRef = useRef<Map<string, BioCreature>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const lastGenerationTimeRef = useRef<number>(0);
  const autoRotateRef = useRef<boolean>(true);
  const cameraAngleRef = useRef<number>(0);
  const jumpLineMeshRef = useRef<THREE.Line | null>(null);
  const [, forceUpdate] = useState(0);

  const {
    initEngine,
    startEvolution,
    pauseEvolution,
    resetEvolution,
    nextGeneration,
    selectIndividual,
    jumpToGeneration,
    clearJumpLine,
    population,
    history,
    currentGeneration,
    maxGenerations,
    viewedGeneration,
    isEvolving,
    generationSpeed,
    selectedIndividualId,
    jumpLine,
    mutationAlert,
  } = useEvolutionStore();

  useEffect(() => {
    initEngine();

    const timer = setTimeout(() => {
      startEvolution();
    }, 1000);

    return () => clearTimeout(timer);
  }, [initEngine, startEvolution]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0c29);
    scene.fog = new THREE.Fog(0x0f0c29, 20, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x7c4dff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    const gridHelper = new THREE.GridHelper(30, 30, 0x333333, 0x333333);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const groundGeo = new THREE.CircleGeometry(15, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.51;
    ground.receiveShadow = true;
    scene.add(ground);

    const handleResize = (): void => {
      if (!canvasRef.current || !camera || !renderer) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const handleControlsChange = (): void => {
      autoRotateRef.current = false;
    };

    controls.addEventListener('change', handleControlsChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', handleControlsChange);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
      if (canvasRef.current && renderer.domElement.parentNode === canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !population.length) return;

    const scene = sceneRef.current;
    const radius = 10;

    const existingIds = new Set(creaturesRef.current.keys());
    const newIds = new Set(population.map((ind) => ind.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const creature = creaturesRef.current.get(id);
        if (creature) {
          scene.remove(creature.group);
          creature.dispose();
          creaturesRef.current.delete(id);
        }
      }
    });

    population.forEach((individual, index) => {
      const angle = (index / population.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const targetPos = new THREE.Vector3(x, 0, z);

      if (creaturesRef.current.has(individual.id)) {
        const creature = creaturesRef.current.get(individual.id)!;
        creature.update(individual);
        creature.setTargetPosition(targetPos);
      } else {
        const creature = new BioCreature();
        creature.update(individual);
        creature.group.position.set(x, 0, z);
        creature.group.lookAt(0, 0, 0);
        creature.group.rotation.y += Math.PI;
        creature.group.userData = { id: individual.id, index };
        creature.setTargetPosition(targetPos);
        scene.add(creature.group);
        creaturesRef.current.set(individual.id, creature);
      }
    });

    forceUpdate((n) => n + 1);
  }, [population]);

  useEffect(() => {
    creaturesRef.current.forEach((creature, id) => {
      const individual = population.find((ind) => ind.id === id);
      if (individual) {
        creature.update(individual);
      }
      creature.highlight(id === selectedIndividualId);
    });

    if (mutationAlert && mutationAlert.visible) {
      const creature = creaturesRef.current.get(mutationAlert.id);
      if (creature) {
        creature.playMutationAnimation();
      }
    }
  }, [selectedIndividualId, population, mutationAlert]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (jumpLineMeshRef.current) {
      scene.remove(jumpLineMeshRef.current);
      if (jumpLineMeshRef.current instanceof THREE.Line) {
        jumpLineMeshRef.current.geometry.dispose();
        (jumpLineMeshRef.current.material as THREE.Material).dispose();
      } else if (jumpLineMeshRef.current instanceof THREE.Mesh) {
        jumpLineMeshRef.current.geometry.dispose();
        (jumpLineMeshRef.current.material as THREE.Material).dispose();
      }
      jumpLineMeshRef.current = null;
    }

    if (jumpLine) {
      const startAngle = ((jumpLine.from - 1) / maxGenerations) * Math.PI * 2 - Math.PI / 2;
      const endAngle = ((jumpLine.to - 1) / maxGenerations) * Math.PI * 2 - Math.PI / 2;

      const arcRadius = 12;
      const peakHeight = 15;

      const fromPos = new THREE.Vector3(
        Math.cos(startAngle) * arcRadius,
        0,
        Math.sin(startAngle) * arcRadius
      );
      const endPos = new THREE.Vector3(
        Math.cos(endAngle) * arcRadius,
        0,
        Math.sin(endAngle) * arcRadius
      );

      const midAngle = (startAngle + endAngle) / 2;
      const midPos = new THREE.Vector3(
        Math.cos(midAngle) * arcRadius,
        peakHeight,
        Math.sin(midAngle) * arcRadius
      );

      const curve = new THREE.CatmullRomCurve3([fromPos, midPos, endPos], false, 'catmullrom', 0.5);
      const sampledPoints = curve.getPoints(60);

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(sampledPoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x7c4dff,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      jumpLineMeshRef.current = line;

      const sphereGeo = new THREE.SphereGeometry(0.4, 12, 8);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x7c4dff,
        transparent: true,
        opacity: 0.8,
      });

      const startSphere = new THREE.Mesh(sphereGeo, sphereMat);
      startSphere.position.copy(fromPos);
      scene.add(startSphere);

      const endSphere = new THREE.Mesh(sphereGeo.clone(), sphereMat.clone());
      endSphere.position.copy(endPos);
      scene.add(endSphere);

      setTimeout(() => {
        if (jumpLineMeshRef.current) {
          scene.remove(jumpLineMeshRef.current);
          if (jumpLineMeshRef.current instanceof THREE.Line) {
            jumpLineMeshRef.current.geometry.dispose();
            (jumpLineMeshRef.current.material as THREE.Material).dispose();
          }
          jumpLineMeshRef.current = null;
        }
        scene.remove(startSphere);
        scene.remove(endSphere);
        startSphere.geometry.dispose();
        (startSphere.material as THREE.Material).dispose();
        endSphere.geometry.dispose();
        (endSphere.material as THREE.Material).dispose();
        clearJumpLine();
      }, 2500);
    }
  }, [jumpLine, maxGenerations, clearJumpLine]);

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const controls = controlsRef.current;

    const animate = (): void => {
      animationIdRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();

      if (isEvolving) {
        lastGenerationTimeRef.current += delta * generationSpeed;
        if (lastGenerationTimeRef.current >= 2.0 && currentGeneration < maxGenerations) {
          lastGenerationTimeRef.current = 0;
          nextGeneration();
        }
      }

      if (autoRotateRef.current && !selectedIndividualId) {
        cameraAngleRef.current += delta * 0.15;
        const radius = 25;
        const height = 15;
        camera.position.x = Math.cos(cameraAngleRef.current) * radius;
        camera.position.z = Math.sin(cameraAngleRef.current) * radius;
        camera.position.y = height;
        camera.lookAt(0, 0, 0);
      }

      creaturesRef.current.forEach((creature) => {
        creature.animate(delta);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isEvolving, currentGeneration, maxGenerations, generationSpeed, nextGeneration, selectedIndividualId]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    const handleClick = (event: MouseEvent): void => {
      if (!canvasRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData.id) {
          obj = obj.parent;
        }

        if (obj && obj.userData.id) {
          const clickedId = obj.userData.id as string;
          selectIndividual(selectedIndividualId === clickedId ? null : clickedId);
          autoRotateRef.current = false;
        }
      } else {
        selectIndividual(null);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
    };
  }, [selectIndividual, selectedIndividualId]);

  const handleTimelineClick = (gen: number): void => {
    if (gen <= history.length) {
      jumpToGeneration(gen);
      autoRotateRef.current = false;
    }
  };

  const formatFitness = (individual: Genotype): string => {
    return (individual.fitness * 100).toFixed(0);
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#0F0C29] font-['Inter']">
      <div className="flex-1 flex flex-row min-h-0">
        <div
          ref={canvasRef}
          className="relative flex-1 min-w-[600px]"
          style={{
            background: 'linear-gradient(180deg, #0F0C29 0%, #302B63 100%)',
          }}
        >
          <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-3">
            <h1 className="text-xl font-bold text-white font-['Space_Grotesk']">
              🦎 MorphMuseum
            </h1>
            <p className="text-xs text-white/60">生物进化可视化</p>
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] text-white/60">当前代</p>
              <p className="text-lg font-bold text-[#7C4DFF] font-mono">
                {viewedGeneration} / {maxGenerations}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] text-white/60">种群</p>
              <p className="text-lg font-bold text-white font-mono">
                {population.length}
              </p>
            </div>
            {selectedIndividualId && (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-[10px] text-white/60">选中个体</p>
                <p className="text-sm font-mono text-[#7C4DFF]">
                  #{selectedIndividualId.slice(0, 8)}
                </p>
              </div>
            )}
          </div>

          <div className="absolute bottom-[140px] left-4 z-10 flex flex-col gap-2">
            <button
              onClick={isEvolving ? pauseEvolution : startEvolution}
              className="bg-[#7C4DFF] hover:bg-[#6B3EE8] text-white px-4 py-2 rounded-lg
                text-sm font-semibold transition-all duration-200
                hover:scale-105 active:scale-95 shadow-lg shadow-[#7C4DFF]/30"
              disabled={viewedGeneration !== currentGeneration}
            >
              {isEvolving ? '⏸ 暂停' : '▶ 继续'}
            </button>
            <button
              onClick={resetEvolution}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg
                text-sm font-semibold transition-all duration-200
                hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              🔄 重置
            </button>
            <button
              onClick={() => { autoRotateRef.current = true; }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg
                text-sm font-semibold transition-all duration-200
                hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              🎥 自动视角
            </button>
          </div>

          {viewedGeneration !== currentGeneration && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10
              bg-[#7C4DFF]/90 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-sm font-semibold text-white">
                🔍 正在查看第 {viewedGeneration} 代 (当前: {currentGeneration})
              </p>
              <button
                onClick={() => jumpToGeneration(currentGeneration)}
                className="mt-2 w-full bg-white/20 hover:bg-white/30 rounded-lg py-1 text-xs"
              >
                返回当前代
              </button>
            </div>
          )}

          {population.length > 0 && (
            <div className="absolute bottom-[140px] right-4 z-10 bg-black/40 backdrop-blur-sm rounded-xl p-3 w-48">
              <p className="text-[10px] text-white/60 mb-2">适应度 Top 3</p>
              {population.slice(0, 3).map((ind, idx) => (
                <div
                  key={ind.id}
                  className={`flex justify-between items-center py-1 text-xs
                    ${selectedIndividualId === ind.id ? 'text-[#7C4DFF]' : 'text-white/80'}`}
                >
                  <span>#{idx + 1} {ind.id.slice(0, 6)}</span>
                  <span className="font-mono">{formatFitness(ind)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-[30%] min-w-[350px] border-l border-white/10">
          <GeneticsPanel />
        </div>
      </div>

      <div className="h-[120px] bg-[#1E1E2E]/90 backdrop-blur-md border-t border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white/90">
            ⏱️ 进化时间轴
          </h3>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#7C4DFF]"></span>
              查看中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-white"></span>
              当前代
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-white/30"></span>
              已进化
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 rounded-full"></div>
          <div className="flex justify-between items-center relative px-2">
            {Array.from({ length: maxGenerations }, (_, i) => i + 1).map((gen) => {
              const isViewed = gen === viewedGeneration;
              const isCurrent = gen === currentGeneration;
              const isPast = gen <= history.length;

              return (
                <button
                  key={gen}
                  onClick={() => handleTimelineClick(gen)}
                  disabled={!isPast}
                  className={`relative flex flex-col items-center gap-1 transition-all duration-300
                    ${isPast ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-30'}
                    ${isViewed ? 'scale-110' : ''}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300
                      ${isViewed ? 'bg-[#7C4DFF] ring-4 ring-[#7C4DFF]/30 scale-125' : ''}
                      ${isCurrent && !isViewed ? 'bg-white' : ''}
                      ${isPast && !isCurrent && !isViewed ? 'bg-white/30 hover:bg-white/50' : ''}
                      ${!isPast ? 'bg-white/10' : ''}`}
                  ></div>
                  <span
                    className={`text-[10px] transition-all duration-300
                      ${isViewed || isCurrent ? 'text-white font-bold' : 'text-white/40'}`}
                  >
                    {gen}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-white/40">
          <span>远古形态</span>
          <span>点击任意代回溯查看</span>
          <span>未来形态</span>
        </div>
      </div>
    </div>
  );
}
