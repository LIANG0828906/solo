<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { WordFragment, Particle } from '@/types'

const store = useGameStore()
const stageRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const shakeActive = ref(false)
let animId = 0
let ctx: CanvasRenderingContext2D | null = null

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight
  ctx = canvas.getContext('2d')
}

function drawStars(time: number) {
  if (!ctx || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  ctx.clearRect(0, 0, w, h)

  const stars = store.engine.getStars()
  for (const star of stars) {
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 * star.speed + star.twinkle))
    ctx.beginPath()
    ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`
    ctx.fill()
  }

  const particles = store.particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.beginPath()
    ctx.arc(p.x * w / 100, p.y * h / 100, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '')
    const r = parseInt(p.color.slice(1, 3), 16) || 255
    const g = parseInt(p.color.slice(3, 5), 16) || 255
    const b = parseInt(p.color.slice(5, 7), 16) || 255
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.fill()
  }
}

function renderLoop(time: number) {
  drawStars(time)
  animId = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  initCanvas()
  animId = requestAnimationFrame(renderLoop)
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', initCanvas)
})

function onFragmentClick(frag: WordFragment) {
  if (frag.captured) return
  store.captureFragment(frag.id)
}

function onCapturedWordClick(index: number) {
  store.removeCapturedWord(index)
}

watch(() => store.state.gameStatus, (status) => {
  if (status === 'failed') {
    shakeActive.value = true
    setTimeout(() => { shakeActive.value = false }, 500)
  }
})

watch(() => store.state.sectionProgress, () => {
  // force re-render sync
})
</script>

<template>
  <div
    ref="stageRef"
    class="word-field relative w-full h-full overflow-hidden rounded-2xl"
    :class="{ 'screen-shake': shakeActive }"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 w-full h-full pointer-events-none"
    />

    <!-- Floating fragments -->
    <div class="absolute inset-0" style="width: 80%; left: 10%;">
      <div
        v-for="frag in store.fragments.filter(f => !f.captured)"
        :key="frag.id"
        class="fragment absolute cursor-pointer select-none transition-transform duration-150 hover:scale-125 active:scale-95"
        :style="{
          left: frag.x + '%',
          top: frag.y + '%',
          fontSize: frag.size + 'px',
          color: frag.color,
          opacity: frag.opacity,
          transform: `rotate(${frag.rotation}deg)`,
          textShadow: `0 0 10px ${frag.glowColor}, 0 0 20px ${frag.glowColor}, 0 0 40px ${frag.glowColor}`,
          willChange: 'transform, opacity',
        }"
        @click="onFragmentClick(frag)"
      >
        {{ frag.text }}
      </div>
    </div>

    <!-- Combination area -->
    <div class="absolute bottom-0 left-0 right-0 p-3">
      <div class="combo-area flex items-center justify-center gap-2 min-h-[56px] px-4 py-3 rounded-t-xl bg-white/5 backdrop-blur-xl border border-white/10 border-b-0"
           style="box-shadow: 0 -4px 30px rgba(100, 150, 255, 0.1);">
        <div
          v-for="(word, index) in store.capturedWords"
          :key="'cap-' + index"
          class="captured-word px-2 py-1 rounded-lg bg-white/10 border border-white/20 cursor-pointer text-sm hover:bg-red-500/20 hover:border-red-400/30 transition-all duration-200"
          :style="{ textShadow: '0 0 8px rgba(100,150,255,0.5)' }"
          @click="onCapturedWordClick(index)"
        >
          {{ word }}
        </div>
        <div v-if="store.capturedWords.length === 0" class="text-white/20 text-xs">
          点击上方文字碎片组合歌词...
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.word-field {
  background: radial-gradient(ellipse at center, #0c1445 0%, #1a0a2e 60%, #0a0a1a 100%);
}

.fragment {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 600;
  letter-spacing: 0.05em;
  -webkit-font-smoothing: antialiased;
}

.screen-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-8px) translateY(2px); }
  20% { transform: translateX(8px) translateY(-2px); }
  30% { transform: translateX(-6px) translateY(1px); }
  40% { transform: translateX(6px) translateY(-1px); }
  50% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  70% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  90% { transform: translateX(-1px); }
}

.combo-area {
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 100%);
}

@media (max-width: 640px) {
  .fragment {
    font-size: inherit;
  }
  .combo-area {
    gap: 4px;
    padding: 8px;
    min-height: 44px;
  }
  .captured-word {
    font-size: 12px;
    padding: 2px 6px;
  }
}
</style>
