import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Terrain } from './terrain/Terrain';
import { ParticleSystem, ParticleStats } from './terrain/ParticleSystem';
import { useAudioStore, AudioParams } from './control/AudioController';
import './App.css';

interface OrbitState {
  theta: number;
  phi: number;
  radius: number;
  target: THREE.Vector3;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainRef = useRef<Terrain | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const orbitRef = useRef<OrbitState>({
    theta: Math.PI * 0.25,
    phi: Math.PI * 0.35,
    radius: 600,
    target: new THREE.Vector3(0, 0, 0)
  });
  
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  const [stats, setStats] = useState<ParticleStats>({ activeCount: 0, averageSpeed: 0, maxSpeed: 0 });
  const [fps, setFps] = useState(60);
  const statsRef = useRef(stats);
  const fpsRef = useRef(fps);
  statsRef.current = stats;
  fpsRef.current = fps;
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 20, y: null as number | null });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { frequency, amplitude, phase, setFrequency, setAmplitude, setPhase } = useAudioStore();
  
  const [displayFreq, setDisplayFreq] = useState(frequency);
  const [displayAmp, setDisplayAmp] = useState(amplitude);
  const [displayPhase, setDisplayPhase] = useState(phase);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);
  
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius, target } = orbitRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1A2E);
    scene.fog = new THREE.FogExp2(0x1A1A2E, 0.0012);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 5000);
    cameraRef.current = camera;
    updateCameraPosition();
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(200, 400, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.left = -400;
    directionalLight.shadow.camera.right = 400;
    directionalLight.shadow.camera.top = 400;
    directionalLight.shadow.camera.bottom = -400;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1500;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0x00D2FF, 0.15);
    fillLight.position.set(-200, 100, -200);
    scene.add(fillLight);
    
    const terrain = new Terrain();
    scene.add(terrain.mesh);
    scene.add(terrain.depositMesh);
    terrainRef.current = terrain;
    
    const particleSystem = new ParticleSystem(terrain, 2000);
    scene.add(particleSystem.points);
    particleSystemRef.current = particleSystem;
    
    const gridHelper = new THREE.GridHelper(600, 30, 0x0F3460, 0x0F3460);
    gridHelper.position.y = -35;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);
    
    const unsubscribe = useAudioStore.subscribe((params: AudioParams) => {
      terrain.updateParams(params);
      particleSystem.updateParams(params);
    });
    
    const initialParams: AudioParams = { frequency, amplitude, phase };
    terrain.updateParams(initialParams);
    particleSystem.updateParams(initialParams);
    
    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const deltaTime = lastTimeRef.current === 0 ? 0.016 : Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      
      terrain.update(deltaTime);
      particleSystem.update(deltaTime);
      
      const currentStats = particleSystem.getStats();
      const prevStats = statsRef.current;
      if (Math.abs(currentStats.activeCount - prevStats.activeCount) > 5 ||
          Math.abs(currentStats.averageSpeed - prevStats.averageSpeed) > 0.1) {
        setStats(currentStats);
      }
      
      const frameFps = Math.round(1 / deltaTime);
      if (Math.abs(frameFps - fpsRef.current) > 3) {
        setFps(frameFps);
      }
      
      renderer.render(scene, camera);
    };
    
    animationIdRef.current = requestAnimationFrame(animate);
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      unsubscribe();
      terrain.dispose();
      particleSystem.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isRightDraggingRef.current = true;
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    
    if (isDraggingRef.current) {
      const { theta, phi } = orbitRef.current;
      let newTheta = theta - deltaX * 0.005;
      let newPhi = phi - deltaY * 0.005;
      newPhi = Math.max(Math.PI / 4, Math.min(Math.PI * 3 / 4, newPhi));
      orbitRef.current.theta = newTheta;
      orbitRef.current.phi = newPhi;
      updateCameraPosition();
    }
    
    if (isRightDraggingRef.current) {
      const { radius, target, theta } = orbitRef.current;
      const panSpeed = radius * 0.001;
      const forward = new THREE.Vector3(
        -Math.sin(theta),
        0,
        -Math.cos(theta)
      ).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      target.add(right.multiplyScalar(-deltaX * panSpeed));
      target.add(forward.multiplyScalar(deltaY * panSpeed));
      updateCameraPosition();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 1.1;
    if (e.deltaY > 0) {
      orbitRef.current.radius = Math.min(orbitRef.current.radius * zoomSpeed, 1200);
    } else {
      orbitRef.current.radius = Math.max(orbitRef.current.radius / zoomSpeed, 200);
    }
    updateCameraPosition();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDisplayFreq(val);
    setFrequency(val);
    setAnimatingNumbers(true);
    setTimeout(() => setAnimatingNumbers(false), 100);
  };

  const handleAmpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDisplayAmp(val);
    setAmplitude(val);
    setAnimatingNumbers(true);
    setTimeout(() => setAnimatingNumbers(false), 100);
  };

  const handlePhaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDisplayPhase(val);
    setPhase(val);
    setAnimatingNumbers(true);
    setTimeout(() => setAnimatingNumbers(false), 100);
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
    if (!isMobile || !panelCollapsed) return;
    setIsDraggingPanel(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanelMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPanel) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    setPanelPos(prev => ({
      x: Math.max(0, Math.min(window.innerWidth - 60, prev.x + deltaX)),
      y: prev.y === null ? null : Math.max(0, Math.min(window.innerHeight - 60, prev.y + deltaY))
    }));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanelMouseUp = () => {
    setIsDraggingPanel(false);
  };

  return (
    <div
      className="app-container"
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => { handleMouseMove(e); handlePanelMouseMove(e); }}
      onMouseUp={() => { handleMouseUp(); handlePanelMouseUp(); }}
      onMouseLeave={() => { handleMouseUp(); handlePanelMouseUp(); }}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      <div ref={containerRef} className="canvas-container" />
      
      <div
        className="info-panel"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="info-title">SYSTEM STATUS</div>
        <div className={`info-row ${animatingNumbers ? 'scale-anim' : ''}`}>
          <span className="info-label">PARTICLES</span>
          <span className="info-value">{stats.activeCount.toLocaleString()}</span>
        </div>
        <div className={`info-row ${animatingNumbers ? 'scale-anim' : ''}`}>
          <span className="info-label">AVG FLOW</span>
          <span className="info-value">{stats.averageSpeed.toFixed(2)} u/s</span>
        </div>
        <div className={`info-row ${animatingNumbers ? 'scale-anim' : ''}`}>
          <span className="info-label">MAX FLOW</span>
          <span className="info-value">{stats.maxSpeed.toFixed(2)} u/s</span>
        </div>
        <div className="info-row fps-row">
          <span className="info-label">FPS</span>
          <span className={`info-value fps-value ${fps >= 55 ? 'fps-good' : fps >= 30 ? 'fps-warn' : 'fps-bad'}`}>
            {fps}
          </span>
        </div>
      </div>
      
      <div
        className={`control-panel ${panelCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
        style={{
          left: panelPos.x,
          ...(panelPos.y !== null ? { bottom: 'auto', top: panelPos.y } : {})
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className="panel-header"
          onMouseDown={handlePanelMouseDown}
          onClick={() => isMobile && setPanelCollapsed(!panelCollapsed)}
        >
          <div className="panel-icon">🎵</div>
          {!panelCollapsed && (
            <>
              <div className="panel-title">WAVE PARAMETERS</div>
              {!isMobile && (
                <div className="panel-collapse" onClick={(e) => { e.stopPropagation(); setPanelCollapsed(true); }}>
                  ×
                </div>
              )}
            </>
          )}
        </div>
        
        {!panelCollapsed && (
          <div className="panel-body">
            <div className="slider-group">
              <div className="slider-header">
                <label className="slider-label">FREQUENCY</label>
                <span className={`slider-value ${animatingNumbers ? 'scale-anim' : ''}`}>
                  {displayFreq.toFixed(1)} Hz
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="0.1"
                value={displayFreq}
                onChange={handleFreqChange}
                className="custom-slider"
              />
              <div className="slider-range">
                <span>20</span>
                <span>200</span>
              </div>
            </div>
            
            <div className="slider-group">
              <div className="slider-header">
                <label className="slider-label">AMPLITUDE</label>
                <span className={`slider-value ${animatingNumbers ? 'scale-anim' : ''}`}>
                  {displayAmp.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.01"
                value={displayAmp}
                onChange={handleAmpChange}
                className="custom-slider amplitude-slider"
              />
              <div className="slider-range">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
            
            <div className="slider-group">
              <div className="slider-header">
                <label className="slider-label">PHASE</label>
                <span className={`slider-value ${animatingNumbers ? 'scale-anim' : ''}`}>
                  {(displayPhase / Math.PI).toFixed(2)}π
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={(Math.PI * 2).toFixed(3)}
                step="0.01"
                value={displayPhase}
                onChange={handlePhaseChange}
                className="custom-slider phase-slider"
              />
              <div className="slider-range">
                <span>0</span>
                <span>2π</span>
              </div>
            </div>
            
            <div className="visual-indicator">
              <div className="wave-preview">
                <svg viewBox="0 0 200 40" className="wave-svg">
                  <path
                    d={Array.from({ length: 40 }, (_, i) => {
                      const x = i * 5;
                      const t = i / 40;
                      const y = 20 + Math.sin(t * Math.PI * 4 * (displayFreq / 60) + displayPhase) * (displayAmp * 1.5);
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4A90D9" />
                      <stop offset="100%" stopColor="#50E3C2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {panelCollapsed && !isMobile && (
        <button
          className="expand-btn"
          onClick={() => setPanelCollapsed(false)}
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          🎵
        </button>
      )}
      
      <div className="hint-panel">
        <span>🖱️ Left drag: Rotate</span>
        <span>🖱️ Right drag: Pan</span>
        <span>🔍 Scroll: Zoom</span>
      </div>
    </div>
  );
}

export default App;
