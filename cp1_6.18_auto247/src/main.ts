import * as THREE from 'three';

// ============================================================
// 材质预设定义
// ============================================================
type TextureKey = 'silk' | 'linen' | 'wool';

interface TexturePreset {
  roughness: number;
  metalness: number;
  activeClass: string;
}

const TEXTURE_PRESETS: Record<TextureKey, TexturePreset> = {
  silk:  { roughness: 0.25, metalness: 0.35, activeClass: 'active-silk'  },
  linen: { roughness: 0.85, metalness: 0.00, activeClass: 'active-linen' },
  wool:  { roughness: 0.95, metalness: 0.00, activeClass: 'active-wool'  }
};

// ============================================================
// 正弦波参数（4个叠加）
// ============================================================
interface WaveParam {
  amplitude: number;     // 振幅 0.02-0.08
  frequency: number;     // 角频率 ω = 2π*f
  kx: number;            // X方向波数
  kz: number;            // Z方向波数
  phase: number;         // 初始相位
}

const WAVES: WaveParam[] = [
  { amplitude: 0.080, frequency: 2 * Math.PI * 0.5, kx:  1.2, kz:  0.8, phase: 0.0 },
  { amplitude: 0.055, frequency: 2 * Math.PI * 0.8, kx: -0.9, kz:  1.5, phase: 1.1 },
  { amplitude: 0.035, frequency: 2 * Math.PI * 1.2, kx:  1.8, kz: -1.1, phase: 2.3 },
  { amplitude: 0.020, frequency: 2 * Math.PI * 1.7, kx: -1.4, kz: -1.7, phase: 3.7 }
];

// ============================================================
// 运行时状态
// ============================================================
const state = {
  // 光球目标位置（鼠标映射）
  lightTarget: new THREE.Vector3(0, 2.0, 0),
  // 光球实际位置（带延迟跟随）
  lightCurrent: new THREE.Vector3(0, 2.0, 0),
  // 光球当前颜色
  lightColor: new THREE.Color('#FFF8E7'),
  // 光照强度倍数
  intensity: 1.0,
  // 当前材质目标参数
  targetRoughness: TEXTURE_PRESETS.silk.roughness,
  targetMetalness: TEXTURE_PRESETS.silk.metalness,
  // 当前织物尺寸与细分
  fabricSize: 2.0,
  fabricSegments: 64,
  // 活跃的材质键
  activeTexture: 'silk' as TextureKey
};

// ============================================================
// DOM 引用
// ============================================================
const container = document.getElementById('canvas-container');
if (!container) {
  throw new Error('Canvas container #canvas-container not found');
}
const textureBtns = document.querySelectorAll<HTMLButtonElement>('.texture-btn');
const slider = document.getElementById('intensity-slider') as HTMLInputElement | null;
const intensityLabel = document.getElementById('intensity-value') as HTMLSpanElement | null;

// ============================================================
// Three.js 核心对象
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ECECEC');

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 3.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// ============================================================
// 光照系统
// ============================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.35);
directionalLight.position.set(2, 4, 3);
scene.add(directionalLight);

// 交互式点光源（跟随光球）
const pointLight = new THREE.PointLight(0xFFF8E7, 2.5, 12, 1.8);
pointLight.position.copy(state.lightCurrent);
scene.add(pointLight);

// ============================================================
// 织物网格
// ============================================================
const fabricGeometry = new THREE.PlaneGeometry(
  state.fabricSize,
  state.fabricSize,
  state.fabricSegments,
  state.fabricSegments
);
// 绕X轴旋转-90度让织物躺在XZ平面上（Y为高度方向）
fabricGeometry.rotateX(-Math.PI / 2);
// 计算初始法向量
fabricGeometry.computeVertexNormals();

const fabricMaterial = new THREE.MeshStandardMaterial({
  color: '#D4C5A9',
  roughness: TEXTURE_PRESETS.silk.roughness,
  metalness: TEXTURE_PRESETS.silk.metalness,
  side: THREE.DoubleSide,
  flatShading: false
});

const fabricMesh = new THREE.Mesh(fabricGeometry, fabricMaterial);
scene.add(fabricMesh);

// 缓存position属性引用以避免每帧查询
const positionAttr = fabricGeometry.getAttribute('position') as THREE.BufferAttribute;
const vertexCount = positionAttr.count;

// 预分配临时变量（性能优化）
const _tmpVec3A = new THREE.Vector3();
const _tmpVec3B = new THREE.Vector3();
const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color('#FFF8E7');
const _whiteColor = new THREE.Color('#FFF8E7');
const _rainbowColor = new THREE.Color();

// ============================================================
// 光球视觉 Mesh
// ============================================================
const lightBallGeo = new THREE.SphereGeometry(0.075, 24, 24);
const lightBallMat = new THREE.MeshBasicMaterial({
  color: '#FFF8E7',
  transparent: true,
  opacity: 0.95
});
const lightBall = new THREE.Mesh(lightBallGeo, lightBallMat);
lightBall.position.copy(state.lightCurrent);
scene.add(lightBall);

// 光球外层光晕（稍微放大的半透明球）
const glowGeo = new THREE.SphereGeometry(0.14, 24, 24);
const glowMat = new THREE.MeshBasicMaterial({
  color: '#FFF8E7',
  transparent: true,
  opacity: 0.22,
  depthWrite: false
});
const glowBall = new THREE.Mesh(glowGeo, glowMat);
glowBall.position.copy(state.lightCurrent);
scene.add(glowBall);

// ============================================================
// 鼠标事件监听 → 更新光球目标位置和颜色
// ============================================================
const MAPPING_RANGE = 1.5; // XZ轴映射范围 [-1.5, 1.5]
let mouseNdcX = 0;
let mouseNdcY = 0;

function updateMouseFromEvent(clientX: number, clientY: number): void {
  // 归一化到 [-1, 1]，Y翻转（屏幕Y向下→NDC Y向上）
  mouseNdcX = (clientX / window.innerWidth) * 2 - 1;
  mouseNdcY = -((clientY / window.innerHeight) * 2 - 1);
  // 映射到3D世界坐标（织物上方 XZ 平面）
  state.lightTarget.x = mouseNdcX * MAPPING_RANGE;
  state.lightTarget.z = mouseNdcY * MAPPING_RANGE;
  state.lightTarget.y = 2.0;
}

function handleMouseMove(e: MouseEvent): void {
  updateMouseFromEvent(e.clientX, e.clientY);
}

function handleTouchMove(e: TouchEvent): void {
  if (e.touches.length > 0) {
    const t = e.touches[0];
    updateMouseFromEvent(t.clientX, t.clientY);
  }
}

window.addEventListener('mousemove', handleMouseMove, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: true });

// ============================================================
// 控制面板：材质切换
// ============================================================
function setActiveTextureUI(key: TextureKey): void {
  textureBtns.forEach(btn => {
    const btnKey = btn.dataset.texture as TextureKey | undefined;
    if (!btnKey) return;
    // 移除所有 active 类
    for (const preset of Object.values(TEXTURE_PRESETS)) {
      btn.classList.remove(preset.activeClass);
    }
    if (btnKey === key) {
      btn.classList.add(TEXTURE_PRESETS[key].activeClass);
    }
    // 亚麻在深色背景上用白字
    btn.style.color = (btnKey === key && key === 'linen') ? '#fff' : '#333';
  });
}

textureBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.texture as TextureKey | undefined;
    if (!key || !TEXTURE_PRESETS[key]) return;
    const preset = TEXTURE_PRESETS[key];
    state.targetRoughness = preset.roughness;
    state.targetMetalness = preset.metalness;
    state.activeTexture = key;
    setActiveTextureUI(key);
  });
});

// ============================================================
// 控制面板：光照强度滑块
// ============================================================
function updateSliderFill(value: number): void {
  if (!slider) return;
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const pct = ((value - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', `${pct}%`);
}

if (slider && intensityLabel) {
  const applyValue = (v: number) => {
    state.intensity = v;
    intensityLabel.textContent = v.toFixed(2);
    updateSliderFill(v);
  };
  slider.addEventListener('input', () => {
    applyValue(parseFloat(slider.value));
  });
  // 初始化
  applyValue(parseFloat(slider.value));
}

// ============================================================
// 窗口尺寸变化
// ============================================================
let resizeRafId = 0;
function handleResize(): void {
  cancelAnimationFrame(resizeRafId);
  resizeRafId = requestAnimationFrame(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
window.addEventListener('resize', handleResize);

// ============================================================
// HSL 彩虹颜色计算
// ============================================================
const TWO_PI = Math.PI * 2;

function computeLightColor(): THREE.Color {
  // 距中心距离比例 t ∈ [0, 1]
  const dx = mouseNdcX;
  const dy = mouseNdcY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const t = Math.min(1, dist / Math.SQRT2);

  if (t < 0.001) {
    return _whiteColor;
  }

  // 色相环：按鼠标在圆周上的角度
  const angle = Math.atan2(dy, dx);            // [-π, π]
  const hue = (angle + Math.PI) / TWO_PI;      // [0, 1]

  // 饱和度：t 越大越饱和（85%），靠近中心降低到白
  const saturation = 0.2 + t * 0.65;           // 0.2 → 0.85

  // 亮度：中心偏高亮（96%）→ t 大时降到 65%
  const lightness = 0.96 - t * 0.31;           // 0.96 → 0.65

  _rainbowColor.setHSL(hue, saturation, lightness);

  // 非常靠近中心时与白色混合，保证过渡柔和
  if (t < 0.15) {
    const mixT = t / 0.15;
    return _tmpColorA.copy(_whiteColor).lerp(_rainbowColor, mixT);
  }
  return _rainbowColor;
}

// ============================================================
// 织物顶点波动更新
// ============================================================
function updateFabricVertices(time: number): void {
  const posArr = positionAttr.array as Float32Array;

  for (let i = 0; i < vertexCount; i++) {
    const i3 = i * 3;
    const x = posArr[i3];
    const z = posArr[i3 + 2];

    let y = 0;
    for (let w = 0; w < 4; w++) {
      const wave = WAVES[w];
      y += wave.amplitude * Math.sin(
        wave.frequency * time +
        wave.kx * x +
        wave.kz * z +
        wave.phase
      );
    }
    posArr[i3 + 1] = y;
  }
  positionAttr.needsUpdate = true;
  fabricGeometry.computeVertexNormals();
}

// ============================================================
// 动画循环
// ============================================================
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  // --- 1. 光球位置平滑跟随（τ = 0.1s） ---
  const followFactor = 1 - Math.exp(-dt / 0.1);
  state.lightCurrent.lerp(state.lightTarget, followFactor);

  // 同步光球 Mesh 位置
  lightBall.position.copy(state.lightCurrent);
  glowBall.position.copy(state.lightCurrent);

  // --- 2. 光球颜色更新（基于鼠标位置） ---
  const targetLightColor = computeLightColor();
  // 颜色也做一点平滑过渡
  _tmpColorA.copy(state.lightColor).lerp(targetLightColor, 1 - Math.exp(-dt / 0.08));
  state.lightColor.copy(_tmpColorA);

  lightBallMat.color.copy(state.lightColor);
  glowMat.color.copy(state.lightColor);

  // --- 3. 点光源同步位置、颜色、强度 ---
  pointLight.position.copy(state.lightCurrent);
  pointLight.color.copy(state.lightColor);
  // 基础强度 2.5 × 用户滑块倍数
  pointLight.intensity = 2.5 * state.intensity;

  // --- 4. 织物材质参数平滑过渡（τ = 0.5s） ---
  const matFactor = 1 - Math.exp(-dt / 0.5);
  fabricMaterial.roughness += (state.targetRoughness - fabricMaterial.roughness) * matFactor;
  fabricMaterial.metalness += (state.targetMetalness - fabricMaterial.metalness) * matFactor;

  // --- 5. 织物顶点波动动画 ---
  updateFabricVertices(elapsed);

  // --- 6. 渲染 ---
  renderer.render(scene, camera);
}

animate();
