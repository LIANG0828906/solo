import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer, type ScaleType } from './AudioAnalyzer';
import { TerrainMesh } from './TerrainMesh';
import { ParticleSystem } from './ParticleSystem';
import ControlPanel from './ControlPanel';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const terrainRef = useRef<TerrainMesh | null>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const beatLightRef = useRef<THREE.PointLight | null>(null);
  const beatLightTimerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [selectedScale, setSelectedScale] = useState<ScaleType | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1.0);

  const initThree = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A1128);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(4, 3.5, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    scene.add(ambientLight);

    const beatLight = new THREE.PointLight(0xFFFFFF, 0.6, 15, 2);
    beatLight.position.set(3, 3, 3);
    scene.add(beatLight);
    beatLightRef.current = beatLight;

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const analyzer = new AudioAnalyzer();
    analyzerRef.current = analyzer;

    const terrain = new TerrainMesh(scene);
    terrainRef.current = terrain;

    const particles = new ParticleSystem(scene);
    particlesRef.current = particles;

    analyzer.onBeat(() => {
      if (beatLightRef.current) {
        beatLightRef.current.intensity = 2.5;
        if (beatLightTimerRef.current !== null) {
          clearTimeout(beatLightTimerRef.current);
        }
        beatLightTimerRef.current = window.setTimeout(() => {
          if (beatLightRef.current) {
            beatLightRef.current.intensity = 0.6;
          }
        }, 100);
      }

      if (terrainRef.current && particlesRef.current && analyzerRef.current) {
        const peaks = terrainRef.current.getPeakPositions(20);
        const audioData = analyzerRef.current.getData();
        particlesRef.current.emit(peaks, audioData);
      }
    });

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = (time: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (analyzerRef.current && terrainRef.current) {
        const audioData = analyzerRef.current.getData();
        const scaleMode = analyzerRef.current.getScaleMode();
        const currentSpeed = analyzerRef.current.getSpeed();
        terrainRef.current.update(audioData, scaleMode, time, currentSpeed);

        if (audioData.beat) {
          if (beatLightRef.current) {
            beatLightRef.current.intensity = 2.5;
            if (beatLightTimerRef.current !== null) {
              clearTimeout(beatLightTimerRef.current);
            }
            beatLightTimerRef.current = window.setTimeout(() => {
              if (beatLightRef.current) {
                beatLightRef.current.intensity = 0.6;
              }
            }, 100);
          }

          if (terrainRef.current && particlesRef.current) {
            const peaks = terrainRef.current.getPeakPositions(20);
            particlesRef.current.emit(peaks, audioData);
          }
        }
      }

      if (particlesRef.current) {
        particlesRef.current.update(deltaTime);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (beatLightTimerRef.current !== null) {
        clearTimeout(beatLightTimerRef.current);
      }
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = initThree();
    return cleanup;
  }, [initThree]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (analyzerRef.current) {
      setSelectedScale(null);
      try {
        await analyzerRef.current.loadAudioFile(file);
      } catch (err) {
        console.error('Failed to load audio:', err);
      }
    }
  }, []);

  const handleScaleSelect = useCallback((scale: ScaleType | null) => {
    setSelectedScale(scale);
    if (analyzerRef.current) {
      analyzerRef.current.setScaleMode(scale);
    }
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    if (analyzerRef.current) {
      analyzerRef.current.setVolume(v);
    }
  }, []);

  const handleSpeedChange = useCallback((s: number) => {
    setSpeed(s);
    if (analyzerRef.current) {
      analyzerRef.current.setSpeed(s);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(4, 3.5, 4);
      controlsRef.current.target.set(0, 0.1, 0);
      controlsRef.current.update();
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <ControlPanel
        onFileUpload={handleFileUpload}
        onScaleSelect={handleScaleSelect}
        onVolumeChange={handleVolumeChange}
        onSpeedChange={handleSpeedChange}
        onResetView={handleResetView}
        selectedScale={selectedScale}
        volume={volume}
        speed={speed}
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;
