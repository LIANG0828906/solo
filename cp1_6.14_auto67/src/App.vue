<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { ParticleEngine, Particle, HSLColor } from './particleEngine';
import { ShapeType } from './shapePoints';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const particleEngine = new ParticleEngine();
let animationFrameId: number = 0;
let lastTime: number = 0;

const currentShape = ref<ShapeType>('circle');
const particleCount = ref<number>(200);
const showLines = ref<boolean>(true);
const lineOpacity = ref<number>(1);

const offsetX = ref(0);
const offsetY = ref(0);
const scale = ref(1);

const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const velocityX = ref(0);
const velocityY = ref(0);

const hoveredParticleId = ref<number | null>(null);
const hoveredNeighborIds = ref<Set<number>>(new Set());

const shapes: { type: ShapeType; label: string }[] = [
  { type: 'circle', label: '圆形' },
  { type: 'heart', label: '心形' },
  { type: 'star', label: '星形' },
];

function hslToString(color: HSLColor, alpha: number = 1): string {
  return `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`;
}

function lerpHSL(color1: HSLColor, color2: HSLColor, t: number): HSLColor {
  let h1 = color1.h;
  let h2 = color2.h;
  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const h = (h1 + diff * t + 360) % 360;
  const s = color1.s + (color2.s - color1.s) * t;
  const l = color1.l + (color2.l - color1.l) * t;
  return { h, s, l };
}

function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const centerX = canvas.width / 2 + offsetX.value;
  const centerY = canvas.height / 2 + offsetY.value;
  return {
    x: (screenX - centerX) / scale.value,
    y: (screenY - centerY) / scale.value,
  };
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const now = performance.now();
  const deltaTime = lastTime ? now - lastTime : 16;
  lastTime = now;

  particleEngine.update(deltaTime, now);

  if (!isDragging.value) {
    if (Math.abs(velocityX.value) > 0.01 || Math.abs(velocityY.value) > 0.01) {
      offsetX.value += velocityX.value;
      offsetY.value += velocityY.value;
      velocityX.value *= 0.95;
      velocityY.value *= 0.95;
    }
  }

  if (showLines.value && lineOpacity.value < 1) {
    lineOpacity.value = Math.min(1, lineOpacity.value + deltaTime / 200);
  } else if (!showLines.value && lineOpacity.value > 0) {
    lineOpacity.value = Math.max(0, lineOpacity.value - deltaTime / 200);
  }

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX.value, canvas.height / 2 + offsetY.value);
  ctx.scale(scale.value, scale.value);

  const particles = particleEngine.getParticles();
  const activeParticles = particles.filter(p => !p.isRemoving);

  if (lineOpacity.value > 0) {
    const drawnPairs = new Set<string>();
    const maxLineDist = 80;

    for (const particle of activeParticles) {
      const neighbors = particleEngine.findNearestNeighbors(particle, 3);
      const pos1 = particleEngine.getJitteredPosition(particle, now);

      for (const neighbor of neighbors) {
        const pairKey = particle.id < neighbor.id
          ? `${particle.id}-${neighbor.id}`
          : `${neighbor.id}-${particle.id}`;

        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const pos2 = particleEngine.getJitteredPosition(neighbor, now);
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxLineDist) continue;

        const alpha = (1 - dist / maxLineDist) * 0.4 * lineOpacity.value;
        const isHoveredLine = hoveredParticleId.value !== null &&
          (particle.id === hoveredParticleId.value || neighbor.id === hoveredParticleId.value);

        const finalAlpha = isHoveredLine ? alpha * 2.5 : alpha;
        const mixedColor = lerpHSL(particle.color, neighbor.color, 0.5);

        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.strokeStyle = hslToString(mixedColor, finalAlpha);
        ctx.lineWidth = isHoveredLine ? 1.5 : 1;
        ctx.stroke();
      }
    }
  }

  for (const particle of particles) {
    let alpha = 1;

    if (particle.isRemoving) {
      alpha = 1 - particle.removeProgress;
    }
    if (particle.isAdding) {
      alpha = particle.addProgress;
    }

    if (alpha <= 0) continue;

    const pos = particleEngine.getJitteredPosition(particle, now);
    const isHovered = particle.id === hoveredParticleId.value;
    const size = isHovered ? particle.size * 1.5 : particle.size;

    if (isHovered) {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 3);
      gradient.addColorStop(0, hslToString(particle.color, 0.4));
      gradient.addColorStop(1, hslToString(particle.color, 0));
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fillStyle = hslToString(particle.color, alpha);
    ctx.fill();

    if (!isHovered) {
      const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2);
      glowGradient.addColorStop(0, hslToString(particle.color, 0.3 * alpha));
      glowGradient.addColorStop(1, hslToString(particle.color, 0));
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }
  }

  ctx.restore();

  animationFrameId = requestAnimationFrame(render);
}

function handleResize() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  particleEngine.setCanvasSize(rect.width, rect.height);
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
  velocityX.value = 0;
  velocityY.value = 0;
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDragging.value) {
    const dx = e.clientX - lastMouseX.value;
    const dy = e.clientY - lastMouseY.value;

    offsetX.value += dx;
    offsetY.value += dy;

    velocityX.value = dx;
    velocityY.value = dy;

    lastMouseX.value = e.clientX;
    lastMouseY.value = e.clientY;
  } else {
    const worldPos = screenToWorld(mouseX, mouseY);
    const hovered = particleEngine.findParticleAtPosition(worldPos.x, worldPos.y, 10 / scale.value);

    if (hovered) {
      hoveredParticleId.value = hovered.id;
      const neighbors = particleEngine.findNearestNeighbors(hovered, 3);
      hoveredNeighborIds.value = new Set(neighbors.map(n => n.id));
    } else {
      hoveredParticleId.value = null;
      hoveredNeighborIds.value = new Set();
    }
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale.value = Math.max(0.5, Math.min(2, scale.value * delta));
}

function changeShape(shape: ShapeType) {
  if (shape === currentShape.value) return;
  currentShape.value = shape;
  particleEngine.changeShape(shape);
}

function updateParticleCount() {
  particleEngine.setCount(particleCount.value);
}

watch(particleCount, () => {
  updateParticleCount();
});

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  handleResize();
  particleEngine.init(particleCount.value, currentShape.value);

  window.addEventListener('resize', handleResize);
  canvas.addEventListener('wheel', handleWheel, { passive: false });

  animationFrameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);

  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('wheel', handleWheel);
  }
});
</script>

<template>
  <div class="app-container">
    <div ref="containerRef" class="canvas-container">
      <canvas
        ref="canvasRef"
        class="canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      />
    </div>

    <div class="control-bar">
      <div class="control-section">
        <span class="control-label">形状</span>
        <div class="shape-buttons">
          <button
            v-for="shape in shapes"
            :key="shape.type"
            :class="['shape-btn', { active: currentShape === shape.type }]"
            @click="changeShape(shape.type)"
          >
            {{ shape.label }}
            <span class="underline"></span>
          </button>
        </div>
      </div>

      <div class="control-section">
        <span class="control-label">粒子数量</span>
        <div class="slider-container">
          <input
            type="range"
            v-model.number="particleCount"
            min="50"
            max="500"
            step="50"
            class="slider"
          />
          <span class="slider-value">{{ particleCount }}</span>
        </div>
      </div>

      <div class="control-section">
        <span class="control-label">连线</span>
        <button
          :class="['toggle-switch', { active: showLines }]"
          @click="showLines = !showLines"
        >
          <span class="toggle-slider"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  background-color: #0d1117;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: calc(100vh - 100px);
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.control-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px 28px;
  background: rgba(22, 27, 34, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  color: #8b949e;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.shape-buttons {
  display: flex;
  gap: 4px;
}

.shape-btn {
  position: relative;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.shape-btn:hover {
  color: #c9d1d9;
  background: rgba(255, 255, 255, 0.05);
}

.shape-btn.active {
  color: #58a6ff;
}

.shape-btn .underline {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, #58a6ff, #1f6feb);
  border-radius: 1px;
  transition: transform 0.3s ease;
}

.shape-btn.active .underline {
  transform: translateX(-50%) scaleX(1);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  width: 120px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #58a6ff, #1f6feb);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(88, 166, 255, 0.6);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #58a6ff, #1f6feb);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(88, 166, 255, 0.4);
}

.slider-value {
  min-width: 32px;
  text-align: center;
  color: #c9d1d9;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}

.toggle-switch:hover {
  background: rgba(255, 255, 255, 0.15);
}

.toggle-switch.active {
  background: linear-gradient(135deg, #58a6ff, #1f6feb);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .control-bar {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    bottom: 16px;
    width: calc(100% - 32px);
    max-width: 400px;
  }

  .control-section {
    width: 100%;
    justify-content: space-between;
  }

  .slider {
    flex: 1;
  }
}
</style>
