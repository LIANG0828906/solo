import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import './App.css';
import { createBuildingModel, getRoofDimensions, BuildingParams } from './BuildingModel';
import {
  calculateSunPosition,
  createSunLight,
  updateSunLight,
  CITIES,
  SunPositionResult,
} from './SunSimulator';
import { createEnergyPanels, EnergyPanelStats } from './EnergyPanel';

interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const VIEW_PRESETS = {
  overview: {
    position: new THREE.Vector3(0, 20, 0.01),
    target: new THREE.Vector3(0, 3, 0),
  },
  pedestrian: {
    position: new THREE.Vector3(5, 1.6, 5),
    target: new THREE.Vector3(0, 3, 0),
  },
};

function dayOfYearToDate(day: number): Date {
  const date = new Date(2025, 0, 1);
  date.setDate(day);
  return date;
}

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const panelsGroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<ReturnType<typeof createSunLight> | null>(null);
  const animationIdRef = useRef<number>(0);
  const guiRef = useRef<GUI | null>(null);

  const paramsRef = useRef({
    city: '北京',
    dayOfYear: 172,
    hour: 12,
    rotation: 0,
    panelDensity: 60,
  });

  const cameraAnimRef = useRef<{
    from: CameraState;
    to: CameraState;
    progress: number;
    duration: number;
    startTime: number;
  } | null>(null);

  const currentViewRef = useRef<string>('default');
  const [activeView, setActiveView] = useState<string>('default');

  const [panelStats, setPanelStats] = useState<EnergyPanelStats>({
    totalArea: 0,
    panelCount: 0,
    dailyEnergy: 0,
    roofArea: 0,
    usableRoofArea: 0,
  });

  const [sunInfo, setSunInfo] = useState<{
    altitude: number;
    daylightHours: number;
    sunriseHour: number;
    sunsetHour: number;
  }>({
    altitude: 0,
    daylightHours: 0,
    sunriseHour: 0,
    sunsetHour: 0,
  });

  const [displayParams, setDisplayParams] = useState({
    city: '北京',
    date: formatDate(dayOfYearToDate(172)),
    time: formatTime(12),
  });

  const [updateKey, setUpdateKey] = useState(0);

  const buildingParams: BuildingParams = {
    width: 8,
    depth: 8,
    floorHeight: 3,
    floors: 3,
  };

  const triggerDisplayUpdate = useCallback(() => {
    setDisplayParams({
      city: paramsRef.current.city,
      date: formatDate(dayOfYearToDate(paramsRef.current.dayOfYear)),
      time: formatTime(paramsRef.current.hour),
    });
    setUpdateKey((k) => k + 1);
  }, []);

  const updatePanels = useCallback((sunResult: SunPositionResult) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (panelsGroupRef.current) {
      scene.remove(panelsGroupRef.current);
      panelsGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const roofDims = getRoofDimensions(buildingParams);
    const panelsResult = createEnergyPanels(
      roofDims.width,
      roofDims.depth,
      roofDims.height,
      paramsRef.current.panelDensity,
      sunResult.averageSunHours
    );

    panelsGroupRef.current = panelsResult.container;
    panelsGroupRef.current.rotation.y = (paramsRef.current.rotation * Math.PI) / 180;
    scene.add(panelsGroupRef.current);
    setPanelStats(panelsResult.stats);
  }, []);

  const updateBuildingRotation = useCallback(() => {
    if (buildingGroupRef.current) {
      buildingGroupRef.current.rotation.y = (paramsRef.current.rotation * Math.PI) / 180;
    }
    if (panelsGroupRef.current) {
      panelsGroupRef.current.rotation.y = (paramsRef.current.rotation * Math.PI) / 180;
    }
  }, []);

  const switchView = useCallback((view: 'overview' | 'pedestrian') => {
    const camera = cameraRef.current;
    if (!camera) return;

    const preset = VIEW_PRESETS[view];
    const targetCameraPos = preset.position.clone();

    if (view === 'overview') {
      targetCameraPos.x = Math.sin((paramsRef.current.rotation * Math.PI) / 180) * 0.5;
      targetCameraPos.z = Math.cos((paramsRef.current.rotation * Math.PI) / 180) * 0.5 + 0.01;
    } else if (view === 'pedestrian') {
      const angle = (paramsRef.current.rotation * Math.PI) / 180 + Math.PI / 4;
      targetCameraPos.x = Math.cos(angle) * 5;
      targetCameraPos.z = Math.sin(angle) * 5;
      targetCameraPos.y = 1.6;
    }

    cameraAnimRef.current = {
      from: {
        position: camera.position.clone(),
        target: new THREE.Vector3(0, 3, 0),
      },
      to: {
        position: targetCameraPos,
        target: preset.target.clone(),
      },
      progress: 0,
      duration: 1000,
      startTime: performance.now(),
    };

    currentViewRef.current = view;
    setActiveView(view);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const canvas = document.createElement('canvas');
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(canvas);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    const gradient = bgCtx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, 2, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    bgTexture.needsUpdate = true;
    scene.background = bgTexture;

    const fog = new THREE.FogExp2(0x0f0c29, 0.015);
    scene.fog = fog;

    const groundSize = 80;
    const groundGridDivisions = 40;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundGridDivisions, groundGridDivisions);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      transparent: true,
      opacity: 0.2,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(groundSize, groundGridDivisions, 0x4caf50, 0x388e3c);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.y = 0.02;
    scene.add(axesHelper);

    const building = createBuildingModel(buildingParams);
    buildingGroupRef.current = building;
    scene.add(building);

    const lights = createSunLight();
    lightsRef.current = lights;
    scene.add(lights.ambientLight);
    scene.add(lights.directionalLight);
    scene.add(lights.sunSphere);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x388e3c, 0.3);
    scene.add(hemisphereLight);

    const city = CITIES[paramsRef.current.city];
    const date = dayOfYearToDate(paramsRef.current.dayOfYear);
    const initialSunResult = calculateSunPosition(city, date, paramsRef.current.hour);
    updateSunLight(lights, initialSunResult);
    updatePanels(initialSunResult);
    setSunInfo({
      altitude: initialSunResult.altitude,
      daylightHours: initialSunResult.daylightHours,
      sunriseHour: initialSunResult.sunriseHour,
      sunsetHour: initialSunResult.sunsetHour,
    });
    triggerDisplayUpdate();

    const gui = new GUI({ title: '控制面板', width: 280 });
    guiRef.current = gui;

    const controlObject = {
      城市: paramsRef.current.city,
      日期: paramsRef.current.dayOfYear,
      时间: paramsRef.current.hour,
      建筑朝向: paramsRef.current.rotation,
      面板密度: paramsRef.current.panelDensity,
      俯瞰视角: () => switchView('overview'),
      行人视角: () => switchView('pedestrian'),
    };

    gui
      .add(controlObject, '城市', Object.keys(CITIES))
      .name('城市')
      .onChange((value: string) => {
        paramsRef.current.city = value;
        const c = CITIES[value];
        const d = dayOfYearToDate(paramsRef.current.dayOfYear);
        const sunResult = calculateSunPosition(c, d, paramsRef.current.hour);
        if (lightsRef.current) {
          updateSunLight(lightsRef.current, sunResult);
        }
        updatePanels(sunResult);
        setSunInfo({
          altitude: sunResult.altitude,
          daylightHours: sunResult.daylightHours,
          sunriseHour: sunResult.sunriseHour,
          sunsetHour: sunResult.sunsetHour,
        });
        triggerDisplayUpdate();
      });

    gui
      .add(controlObject, '日期', 1, 365, 1)
      .name('日期 (1-365)')
      .onChange((value: number) => {
        paramsRef.current.dayOfYear = Math.floor(value);
        const c = CITIES[paramsRef.current.city];
        const d = dayOfYearToDate(paramsRef.current.dayOfYear);
        const sunResult = calculateSunPosition(c, d, paramsRef.current.hour);
        if (lightsRef.current) {
          updateSunLight(lightsRef.current, sunResult);
        }
        updatePanels(sunResult);
        setSunInfo({
          altitude: sunResult.altitude,
          daylightHours: sunResult.daylightHours,
          sunriseHour: sunResult.sunriseHour,
          sunsetHour: sunResult.sunsetHour,
        });
        triggerDisplayUpdate();
      });

    gui
      .add(controlObject, '时间', 6, 20, 0.1)
      .name('时间 (小时)')
      .onChange((value: number) => {
        paramsRef.current.hour = value;
        const c = CITIES[paramsRef.current.city];
        const d = dayOfYearToDate(paramsRef.current.dayOfYear);
        const sunResult = calculateSunPosition(c, d, value);
        if (lightsRef.current) {
          updateSunLight(lightsRef.current, sunResult);
        }
        setSunInfo({
          altitude: sunResult.altitude,
          daylightHours: sunResult.daylightHours,
          sunriseHour: sunResult.sunriseHour,
          sunsetHour: sunResult.sunsetHour,
        });
        triggerDisplayUpdate();
      });

    gui
      .add(controlObject, '建筑朝向', 0, 360, 15)
      .name('朝向 (度)')
      .onChange((value: number) => {
        paramsRef.current.rotation = value;
        updateBuildingRotation();
        triggerDisplayUpdate();
      });

    gui
      .add(controlObject, '面板密度', 20, 90, 10)
      .name('太阳能板密度 (%)')
      .onChange((value: number) => {
        paramsRef.current.panelDensity = Math.floor(value);
        const c = CITIES[paramsRef.current.city];
        const d = dayOfYearToDate(paramsRef.current.dayOfYear);
        const sunResult = calculateSunPosition(c, d, paramsRef.current.hour);
        updatePanels(sunResult);
        triggerDisplayUpdate();
      });

    const viewFolder = gui.addFolder('视角切换');
    viewFolder
      .add(controlObject, '俯瞰视角')
      .name('俯瞰');
    viewFolder
      .add(controlObject, '行人视角')
      .name('行人');
    viewFolder.open();

    gui.domElement.style.position = 'fixed';
    gui.domElement.style.top = '16px';
    gui.domElement.style.left = '16px';

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameInterval) return;
      lastFrameTime = currentTime - (deltaTime % frameInterval);

      if (cameraAnimRef.current && cameraRef.current) {
        const anim = cameraAnimRef.current;
        const elapsed = currentTime - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);

        const easedT = 1 - Math.pow(1 - t, 3);

        cameraRef.current.position.lerpVectors(anim.from.position, anim.to.position, easedT);

        const lookTarget = anim.from.target.clone().lerp(anim.to.target, easedT);
        cameraRef.current.lookAt(lookTarget);

        if (t >= 1) {
          cameraAnimRef.current = null;
        }
      }

      if (lightsRef.current?.directionalLight) {
        const c = CITIES[paramsRef.current.city];
        const d = dayOfYearToDate(paramsRef.current.dayOfYear);
        const sunResult = calculateSunPosition(c, d, paramsRef.current.hour);
        const dir = lightsRef.current.directionalLight.position.clone().normalize();
        const targetDir = sunResult.direction.clone().multiplyScalar(30);
        targetDir.y = Math.max(0.1, targetDir.y);
        lightsRef.current.directionalLight.position.lerp(targetDir, 0.15);
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);

      if (guiRef.current && w < 768) {
        guiRef.current.domElement.style.width = '240px';
      }
    };

    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') switchView('overview');
      if (e.key === '2') switchView('pedestrian');
    };
    window.addEventListener('keydown', handleKeyDown);

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 5 };
    let cameraDistance = 18;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        previousMouse = { x: e.clientX, y: e.clientY };
        cameraAnimRef.current = null;
        currentViewRef.current = 'custom';
        setActiveView('custom');
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      previousMouse = { x: e.clientX, y: e.clientY };

      cameraAngle.theta -= deltaX * 0.005;
      cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi + deltaY * 0.005));

      const x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
      const y = cameraDistance * Math.sin(cameraAngle.phi);
      const z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);

      cameraRef.current.position.set(x, y + 3, z);
      cameraRef.current.lookAt(0, 3, 0);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraAnimRef.current = null;
      currentViewRef.current = 'custom';
      setActiveView('custom');

      cameraDistance = Math.max(5, Math.min(50, cameraDistance + e.deltaY * 0.02));
      const x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
      const y = cameraDistance * Math.sin(cameraAngle.phi);
      const z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);
      cameraRef.current.position.set(x, y + 3, z);
      cameraRef.current.lookAt(0, 3, 0);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);

      if (guiRef.current) {
        guiRef.current.destroy();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [updatePanels, updateBuildingRotation, triggerDisplayUpdate, switchView]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <div className="info-panel">
        <h2>📊 模拟参数</h2>
        <div className="info-item">
          <span className="info-label">城市</span>
          <span className="info-value" key={`city-${updateKey}`}>{displayParams.city}</span>
        </div>
        <div className="info-item">
          <span className="info-label">日期</span>
          <span className="info-value" key={`date-${updateKey}`}>{displayParams.date}</span>
        </div>
        <div className="info-item">
          <span className="info-label">时间</span>
          <span className="info-value" key={`time-${updateKey}`}>{displayParams.time}</span>
        </div>
        <div className="info-item">
          <span className="info-label">太阳高度角</span>
          <span className="info-value" key={`alt-${updateKey}`}>{sunInfo.altitude.toFixed(1)}°</span>
        </div>
        <div className="info-item">
          <span className="info-label">日出时间</span>
          <span className="info-value" key={`sunrise-${updateKey}`}>{formatTime(sunInfo.sunriseHour)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">日落时间</span>
          <span className="info-value" key={`sunset-${updateKey}`}>{formatTime(sunInfo.sunsetHour)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">日照时长</span>
          <span className="info-value highlight" key={`daylight-${updateKey}`}>{sunInfo.daylightHours.toFixed(1)}h</span>
        </div>

        <h2 style={{ marginTop: '18px' }}>☀️ 能源统计</h2>
        <div className="info-item">
          <span className="info-label">屋顶总面积</span>
          <span className="info-value" key={`roof-${updateKey}`}>{panelStats.roofArea} m²</span>
        </div>
        <div className="info-item">
          <span className="info-label">可用安装面积</span>
          <span className="info-value" key={`usable-${updateKey}`}>{panelStats.usableRoofArea} m²</span>
        </div>
        <div className="info-item">
          <span className="info-label">面板总数</span>
          <span className="info-value" key={`count-${updateKey}`}>{panelStats.panelCount} 块</span>
        </div>
        <div className="info-item">
          <span className="info-label">面板总面积</span>
          <span className="info-value highlight" key={`area-${updateKey}`}>{panelStats.totalArea} m²</span>
        </div>
        <div className="info-item">
          <span className="info-label">日发电量</span>
          <span className="info-value energy" key={`energy-${updateKey}`}>{panelStats.dailyEnergy} kWh</span>
        </div>
      </div>

      <div className="view-controls">
        <button
          className={`view-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => switchView('overview')}
        >
          🏙️ 俯瞰视角
        </button>
        <button
          className={`view-btn ${activeView === 'pedestrian' ? 'active' : ''}`}
          onClick={() => switchView('pedestrian')}
        >
          🚶 行人视角
        </button>
      </div>
    </div>
  );
}
