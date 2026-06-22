import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OceanConfig, ViewMode } from './OceanConfig';
import { TerrainGenerator } from './TerrainGenerator';
import { CurrentParticleSystem } from './CurrentParticleSystem';

const waveVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uFrequency;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * uFrequency + uTime) * cos(pos.z * uFrequency * 0.8 + uTime * 0.7) * uAmplitude;
    wave += sin(pos.x * uFrequency * 1.5 + uTime * 1.2) * cos(pos.z * uFrequency * 1.2 + uTime * 0.9) * uAmplitude * 0.5;
    pos.y += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const waveFragmentShader = `
  varying vec2 vUv;
  varying float vWave;
  uniform float uAmplitude;
  void main() {
    float t = (vWave / uAmplitude + 1.0) * 0.5;
    vec3 color1 = vec3(0.1, 0.4, 0.8);
    vec3 color2 = vec3(0.0, 0.75, 1.0);
    vec3 color = mix(color1, color2, t);
    gl_FragColor = vec4(color, 0.35);
  }
`;

export default function OceanExplorerApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<TerrainGenerator | null>(null);
  const particlesRef = useRef<CurrentParticleSystem | null>(null);
  const waveMeshRef = useRef<THREE.Mesh | null>(null);
  const waveUniformsRef = useRef<Record<string, THREE.IUniform> | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const simulationTimeRef = useRef(0);
  const timeScaleRef = useRef<number>(OceanConfig.TIME_SCALE_DEFAULT);
  const isPausedRef = useRef(false);
  const viewModeRef = useRef<ViewMode>('free');
  const cameraAnimRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    elapsed: number;
    duration: number;
  }>({ active: false, startPos: new THREE.Vector3(), endPos: new THREE.Vector3(), startTarget: new THREE.Vector3(), endTarget: new THREE.Vector3(), elapsed: 0, duration: 1 });

  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const timeSliderRef = useRef<HTMLInputElement>(null);
  const viewSelectRef = useRef<HTMLSelectElement>(null);
  const pauseBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0B1A);
    scene.fog = new THREE.FogExp2(0x0A0B1A, 0.004);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(150, 120, 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.rotateSpeed = 0.005;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x88CCFF, 0.8);
    dirLight.position.set(80, 150, 60);
    scene.add(dirLight);

    const terrain = new TerrainGenerator({
      size: OceanConfig.GRID_SIZE,
      segments: OceanConfig.SEGMENTS,
      seed: OceanConfig.NOISE_SEED,
    });
    const terrainMesh = terrain.generate();
    scene.add(terrainMesh);
    terrainRef.current = terrain;

    const particles = new CurrentParticleSystem(terrain, {
      count: OceanConfig.PARTICLE_COUNT,
      size: OceanConfig.PARTICLE_SIZE,
    });
    scene.add(particles.getPoints());
    particlesRef.current = particles;

    const waveGeometry = new THREE.PlaneGeometry(OceanConfig.GRID_SIZE, OceanConfig.GRID_SIZE, 64, 64);
    waveGeometry.rotateX(-Math.PI / 2);
    const waveUniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uAmplitude: { value: 3 },
      uFrequency: { value: 0.05 },
    };
    waveUniformsRef.current = waveUniforms;
    const waveMaterial = new THREE.ShaderMaterial({
      vertexShader: waveVertexShader,
      fragmentShader: waveFragmentShader,
      uniforms: waveUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial);
    waveMesh.position.y = 15;
    scene.add(waveMesh);
    waveMeshRef.current = waveMesh;

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      if (!isPausedRef.current) {
        simulationTimeRef.current += delta * timeScaleRef.current;
        if (particlesRef.current) {
          particlesRef.current.update(delta, timeScaleRef.current, simulationTimeRef.current);
        }
        if (waveUniformsRef.current) {
          waveUniformsRef.current.uTime.value = simulationTimeRef.current;
          waveUniformsRef.current.uAmplitude.value = 2 + Math.sin(simulationTimeRef.current * 0.1) * 1.5;
          waveUniformsRef.current.uFrequency.value = 0.04 + timeScaleRef.current * 0.005;
        }
      }

      if (cameraAnimRef.current.active && camera && controls) {
        cameraAnimRef.current.elapsed += delta;
        const t = Math.min(cameraAnimRef.current.elapsed / cameraAnimRef.current.duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(cameraAnimRef.current.startPos, cameraAnimRef.current.endPos, ease);
        controls.target.lerpVectors(cameraAnimRef.current.startTarget, cameraAnimRef.current.endTarget, ease);
        if (t >= 1) {
          cameraAnimRef.current.active = false;
        }
      }

      if (controls && viewModeRef.current === 'free') {
        controls.update();
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      terrainRef.current?.dispose();
      particlesRef.current?.dispose();
      if (waveMeshRef.current) {
        waveMeshRef.current.geometry.dispose();
        (waveMeshRef.current.material as THREE.Material).dispose();
      }
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      if (rendererRef.current?.domElement && containerRef.current?.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  const handleTimeScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    timeScaleRef.current = val;
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = val.toFixed(1) + 'x';
    }
  };

  const startCameraAnimation = (targetPos: THREE.Vector3, targetLook: THREE.Vector3) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraAnimRef.current = {
      active: true,
      startPos: cameraRef.current.position.clone(),
      endPos: targetPos.clone(),
      startTarget: controlsRef.current.target.clone(),
      endTarget: targetLook.clone(),
      elapsed: 0,
      duration: OceanConfig.CAMERA_ANIM_DURATION,
    };
  };

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as ViewMode;
    viewModeRef.current = mode;
    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'free';
    }
    if (mode === 'top') {
      startCameraAnimation(new THREE.Vector3(0, 200, 0.01), new THREE.Vector3(0, 0, 0));
    } else if (mode === 'side') {
      const angle = (30 * Math.PI) / 180;
      const dist = 200;
      startCameraAnimation(
        new THREE.Vector3(dist * Math.cos(angle), dist * Math.sin(angle * 0.5), 0),
        new THREE.Vector3(0, 0, 0)
      );
    }
  };

  const handlePauseToggle = () => {
    isPausedRef.current = !isPausedRef.current;
    if (pauseBtnRef.current) {
      pauseBtnRef.current.textContent = isPausedRef.current ? '继续' : '暂停';
      pauseBtnRef.current.style.background = isPausedRef.current ? '#00BFFF20' : '#1A1B35';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          width: 220,
          padding: 16,
          background: '#00000080',
          borderRadius: 8,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#CCCCCC' }}>视角模式</span>
          <select
            ref={viewSelectRef}
            onChange={handleViewChange}
            defaultValue="free"
            style={{
              background: '#1A1B35',
              color: '#FFFFFF',
              border: '1px solid #00BFFF40',
              borderRadius: 4,
              padding: '6px 8px',
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="top">俯视</option>
            <option value="side">侧视</option>
            <option value="free">自由视角</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#CCCCCC' }}>
            时间流速：<span ref={timeLabelRef} style={{ color: '#FFFFFF' }}>1.0x</span>
          </span>
          <input
            ref={timeSliderRef}
            type="range"
            min={OceanConfig.TIME_SCALE_MIN}
            max={OceanConfig.TIME_SCALE_MAX}
            step={0.1}
            defaultValue={OceanConfig.TIME_SCALE_DEFAULT}
            onChange={handleTimeScaleChange}
            style={{
              width: 200,
              appearance: 'none',
              WebkitAppearance: 'none',
              height: 4,
              background: '#FFFFFF20',
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <button
          ref={pauseBtnRef}
          onClick={handlePauseToggle}
          style={{
            width: 60,
            height: 30,
            background: '#1A1B35',
            border: '1px solid #FFFFFF30',
            borderRadius: 4,
            color: '#FFFFFF',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          暂停
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00BFFF;
          cursor: pointer;
          transition: filter 0.2s;
          border: none;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          filter: brightness(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00BFFF;
          cursor: pointer;
          border: none;
          transition: filter 0.2s;
        }
        input[type="range"]::-moz-range-thumb:hover {
          filter: brightness(1.2);
        }
        select option:hover {
          background: #00BFFF20;
        }
        select option {
          background: #1A1B35;
          color: #FFFFFF;
        }
        button:hover {
          filter: brightness(1.15);
        }
      `}</style>
    </div>
  );
}
