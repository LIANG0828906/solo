import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createParticles,
  updateParticles,
  setParticleCount,
  getParticleCount,
  togglePause,
  setParticleOpacity,
  setParticlesVisible,
  getParticleBaseCount,
  getParticleMidCount,
  getParticleMinCount
} from './particles';

type DisplayMode = 'particles' | 'texture' | 'blend';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let frequencyData: Uint8Array = new Uint8Array(0);
let microphoneStream: MediaStream | null = null;

let videoElement: HTMLVideoElement | null = null;
let videoTexture: THREE.VideoTexture | null = null;
let sphereMesh: THREE.Mesh | null = null;
let sphereMaterial: THREE.ShaderMaterial | null = null;

let currentMode: DisplayMode = 'particles';
let previousMode: DisplayMode = 'particles';
let modeTransitionProgress = 1;
let modeTransitioning = false;
let textureOpacity = 0.5;
let particleOpacity = 0.55;

let fps = 0;
let frameCount = 0;
let lastFpsUpdateTime = 0;
let adaptiveUpTimer = 0;
let lowFpsCounter = 0;
let highFpsCounter = 0;

let isStarted = false;
let buttonsDisabled = false;

const SPHERE_RADIUS = 5;
const FFT_SIZE = 256;
const MODE_TRANSITION_DURATION = 0.5;
const FPS_CHECK_INTERVAL = 2;

const sphereVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sphereFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uLowFrequency;
  uniform float uMidFrequency;
  uniform float uHighFrequency;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec2 uv = vUv;
    
    float distortAmount = uLowFrequency * 0.08;
    float waveSpeed = uTime * 1.5;
    
    uv.x += sin(uv.y * 12.0 + waveSpeed + vPosition.x * 0.3) * distortAmount;
    uv.y += cos(uv.x * 12.0 + waveSpeed + vPosition.y * 0.3) * distortAmount;
    
    uv.x = 1.0 - uv.x;
    
    vec4 texColor = texture2D(uTexture, uv);
    
    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    rim = pow(rim, 1.5);
    
    vec3 glowColor = vec3(0.0, 0.83, 1.0);
    vec3 finalColor = mix(texColor.rgb, glowColor, rim * 0.25 * uLowFrequency);
    
    float alpha = uOpacity * (0.6 + rim * 0.4);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function initScene(): void {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0D0D1A);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 2;
  controls.maxDistance = 20;
  controls.enablePan = false;

  createParticles(scene);
  createSphere();
  setDisplayMode('particles', true);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
}

function createSphere(): void {
  const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);
  geometry.scale(-1, 1, 1);

  videoElement = document.createElement('video');
  videoElement.width = 640;
  videoElement.height = 480;
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.muted = true;

  videoTexture = new THREE.VideoTexture(videoElement);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  sphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: videoTexture },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uLowFrequency: { value: 0 },
      uMidFrequency: { value: 0 },
      uHighFrequency: { value: 0 }
    },
    vertexShader: sphereVertexShader,
    fragmentShader: sphereFragmentShader,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false
  });

  sphereMesh = new THREE.Mesh(geometry, sphereMaterial);
  sphereMesh.visible = false;
  scene.add(sphereMesh);
}

async function initAudio(): Promise<void> {
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(microphoneStream);
    source.connect(analyser);

    frequencyData = new Uint8Array(analyser.frequencyBinCount);
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    alert('无法访问麦克风，请确保已授予权限。');
  }
}

async function initCamera(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });

    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play();
    }
  } catch (error) {
    console.error('Failed to initialize camera:', error);
    alert('无法访问摄像头，请确保已授予权限。');
  }
}

function getFrequencyBands(): { low: number; mid: number; high: number } {
  if (!analyser || !frequencyData) {
    return { low: 0, mid: 0, high: 0 };
  }

  analyser.getByteFrequencyData(frequencyData as unknown as Uint8Array);

  const binCount = frequencyData.length;
  const sampleRate = audioContext?.sampleRate || 44100;
  const binWidth = sampleRate / FFT_SIZE;

  const lowEndIndex = Math.min(binCount - 1, Math.floor(200 / binWidth));
  const midEndIndex = Math.min(binCount - 1, Math.floor(2000 / binWidth));
  const highEndIndex = Math.min(binCount - 1, Math.floor(8000 / binWidth));

  let lowSum = 0;
  let lowCount = 0;
  for (let i = 0; i <= lowEndIndex; i++) {
    lowSum += frequencyData[i];
    lowCount++;
  }
  const low = lowCount > 0 ? lowSum / lowCount / 255 : 0;

  let midSum = 0;
  let midCount = 0;
  for (let i = lowEndIndex + 1; i <= midEndIndex; i++) {
    midSum += frequencyData[i];
    midCount++;
  }
  const mid = midCount > 0 ? midSum / midCount / 255 : 0;

  let highSum = 0;
  let highCount = 0;
  for (let i = midEndIndex + 1; i <= highEndIndex; i++) {
    highSum += frequencyData[i];
    highCount++;
  }
  const high = highCount > 0 ? highSum / highCount / 255 : 0;

  return { low, mid, high };
}

let lastTime = 0;
let totalTime = 0;

function animate(currentTime: number): void {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  totalTime += deltaTime;

  frameCount++;
  if (currentTime - lastFpsUpdateTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdateTime = currentTime;
    updateFpsDisplay();
  }

  if (modeTransitioning) {
    modeTransitionProgress += deltaTime / MODE_TRANSITION_DURATION;
    if (modeTransitionProgress >= 1) {
      modeTransitionProgress = 1;
      modeTransitioning = false;
      applyFinalModeState();
    }
    updateTransitionOpacity();
  }

  const bands = getFrequencyBands();

  if (frequencyData && analyser && frequencyData.length > 0) {
    updateParticles(frequencyData, bands.low, bands.mid, bands.high, deltaTime);
  }

  if (sphereMaterial && sphereMaterial.uniforms) {
    sphereMaterial.uniforms.uTime.value = totalTime;
    sphereMaterial.uniforms.uLowFrequency.value = bands.low;
    sphereMaterial.uniforms.uMidFrequency.value = bands.mid;
    sphereMaterial.uniforms.uHighFrequency.value = bands.high;
    sphereMaterial.uniforms.uOpacity.value = getEffectiveTextureOpacity();
  }

  controls.update();
  renderer.render(scene, camera);

  updateAdaptiveParticles(deltaTime);
}

function getEffectiveTextureOpacity(): number {
  if (!modeTransitioning) {
    switch (currentMode) {
      case 'particles':
        return 0;
      case 'texture':
        return textureOpacity;
      case 'blend':
        return textureOpacity;
      default:
        return textureOpacity;
    }
  }

  const t = easeInOutCubic(modeTransitionProgress);

  const fromOpacity = getModeTextureOpacity(previousMode);
  const toOpacity = getModeTextureOpacity(currentMode);

  return fromOpacity + (toOpacity - fromOpacity) * t;
}

function getModeTextureOpacity(mode: DisplayMode): number {
  switch (mode) {
    case 'particles':
      return 0;
    case 'texture':
      return textureOpacity;
    case 'blend':
      return textureOpacity;
    default:
      return textureOpacity;
  }
}

function getEffectiveParticleOpacity(): number {
  if (!modeTransitioning) {
    switch (currentMode) {
      case 'particles':
        return 1;
      case 'texture':
        return 0;
      case 'blend':
        return particleOpacity;
      default:
        return 1;
    }
  }

  const t = easeInOutCubic(modeTransitionProgress);

  const fromOpacity = getModeParticleOpacity(previousMode);
  const toOpacity = getModeParticleOpacity(currentMode);

  return fromOpacity + (toOpacity - fromOpacity) * t;
}

function getModeParticleOpacity(mode: DisplayMode): number {
  switch (mode) {
    case 'particles':
      return 1;
    case 'texture':
      return 0;
    case 'blend':
      return particleOpacity;
    default:
      return 1;
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateTransitionOpacity(): void {
  setParticleOpacity(getEffectiveParticleOpacity());
}

function applyFinalModeState(): void {
  setParticlesVisible(true);
  if (sphereMesh) sphereMesh.visible = true;

  switch (currentMode) {
    case 'particles':
      if (sphereMesh) sphereMesh.visible = false;
      setParticleOpacity(1);
      break;
    case 'texture':
      setParticlesVisible(false);
      if (sphereMesh) sphereMesh.visible = true;
      setParticleOpacity(0);
      break;
    case 'blend':
      setParticlesVisible(true);
      if (sphereMesh) sphereMesh.visible = true;
      setParticleOpacity(particleOpacity);
      break;
  }
}

function setDisplayMode(mode: DisplayMode, immediate = false): void {
  if (mode === currentMode && !immediate) return;

  previousMode = currentMode;
  currentMode = mode;

  updateModeButtons();

  if (immediate) {
    modeTransitionProgress = 1;
    modeTransitioning = false;
    applyFinalModeState();
  } else {
    modeTransitionProgress = 0;
    modeTransitioning = true;

    setParticlesVisible(true);
    if (sphereMesh) sphereMesh.visible = true;
    setParticleOpacity(getModeParticleOpacity(previousMode));
    updateTransitionOpacity();
  }
}

function updateModeButtons(): void {
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach((btn) => {
    const mode = (btn as HTMLElement).dataset.mode;
    if (mode === currentMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateFpsDisplay(): void {
  const fpsElement = document.getElementById('fps-number');
  const countElement = document.getElementById('particle-count');

  if (fpsElement) {
    fpsElement.textContent = fps.toString();
  }

  if (countElement) {
    countElement.textContent = `${getParticleCount()} 粒子`;
  }
}

function updateAdaptiveParticles(deltaTime: number): void {
  const baseCount = getParticleBaseCount();
  const midCount = getParticleMidCount();
  const minCount = getParticleMinCount();
  const currentCount = getParticleCount();

  if (fps > 0 && fps < 20) {
    lowFpsCounter += deltaTime;
    highFpsCounter = 0;
    if (lowFpsCounter >= FPS_CHECK_INTERVAL && currentCount > minCount) {
      setParticleCount(minCount);
      adaptiveUpTimer = 0;
      lowFpsCounter = 0;
      return;
    }
  } else if (fps > 0 && fps < 30) {
    lowFpsCounter += deltaTime;
    highFpsCounter = 0;
    if (lowFpsCounter >= FPS_CHECK_INTERVAL && currentCount > midCount) {
      setParticleCount(midCount);
      adaptiveUpTimer = 0;
      lowFpsCounter = 0;
      return;
    }
  } else if (fps > 45) {
    lowFpsCounter = 0;
    highFpsCounter += deltaTime;
    if (highFpsCounter >= FPS_CHECK_INTERVAL && currentCount < baseCount) {
      adaptiveUpTimer += deltaTime;
      if (adaptiveUpTimer >= 5) {
        adaptiveUpTimer = 0;
        highFpsCounter = 0;
        const newCount = Math.min(baseCount, currentCount + 500);
        setParticleCount(newCount);
      }
    }
  } else {
    lowFpsCounter = Math.max(0, lowFpsCounter - deltaTime * 0.5);
    highFpsCounter = Math.max(0, highFpsCounter - deltaTime * 0.5);
    adaptiveUpTimer = Math.max(0, adaptiveUpTimer - deltaTime * 0.2);
  }
}

function onWindowResize(): void {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event: KeyboardEvent): void {
  if (!isStarted) return;

  switch (event.code) {
    case 'Digit1':
      event.preventDefault();
      switchModeWithDebounce('particles');
      break;
    case 'Digit2':
      event.preventDefault();
      switchModeWithDebounce('texture');
      break;
    case 'Digit3':
      event.preventDefault();
      switchModeWithDebounce('blend');
      break;
    case 'Space':
      event.preventDefault();
      togglePause();
      break;
  }
}

function switchModeWithDebounce(mode: DisplayMode): void {
  if (buttonsDisabled || modeTransitioning || currentMode === mode) return;

  buttonsDisabled = true;
  setDisplayMode(mode);

  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach((btn) => {
    (btn as HTMLButtonElement).disabled = true;
  });

  setTimeout(() => {
    buttonsDisabled = false;
    buttons.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = false;
    });
  }, 300);
}

function setupUI(): void {
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
  const startOverlay = document.getElementById('start-overlay');
  const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
  const opacityValue = document.getElementById('opacity-value');

  if (startBtn && startOverlay) {
    startBtn.addEventListener('click', async () => {
      if (isStarted) return;

      startBtn.textContent = '正在启动...';
      startBtn.disabled = true;

      try {
        await initAudio();
        await initCamera();
        isStarted = true;
        startOverlay.classList.add('hidden');

        if (audioContext?.state === 'suspended') {
          audioContext.resume();
        }

        lastTime = performance.now();
        requestAnimationFrame(animate);
      } catch (error) {
        console.error('Failed to start:', error);
        startBtn.textContent = '重新尝试';
        startBtn.disabled = false;
      }
    });
  }

  if (opacitySlider && opacityValue) {
    const updateOpacity = (value: number) => {
      const normalized = (value + 1) / 2;
      textureOpacity = normalized;
      opacityValue.textContent = normalized.toFixed(2);

      if (!modeTransitioning && sphereMaterial && sphereMaterial.uniforms) {
        sphereMaterial.uniforms.uOpacity.value = getEffectiveTextureOpacity();
      }
    };

    updateOpacity(parseFloat(opacitySlider.value));

    opacitySlider.addEventListener('input', (e) => {
      updateOpacity(parseFloat((e.target as HTMLInputElement).value));
    });
  }

  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.mode as DisplayMode;
      if (mode) {
        switchModeWithDebounce(mode);
      }
    });
  });
}

function init(): void {
  initScene();
  setupUI();
}

init();
