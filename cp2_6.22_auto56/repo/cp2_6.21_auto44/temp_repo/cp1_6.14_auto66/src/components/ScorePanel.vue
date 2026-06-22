<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { Heart } from 'lucide-vue-next'

const store = useGameStore()
const displayScore = ref(0)
const scoreBounce = ref(false)

watch(() => store.score, (newScore) => {
  const diff = newScore - displayScore.value
  if (diff === 0) return
  const step = Math.max(1, Math.ceil(Math.abs(diff) / 10))
  const dir = diff > 0 ? 1 : -1
  const interval = setInterval(() => {
    displayScore.value += step * dir
    if ((dir > 0 && displayScore.value >= newScore) || (dir < 0 && displayScore.value <= newScore)) {
      displayScore.value = newScore
      clearInterval(interval)
    }
  }, 30)
  scoreBounce.value = true
  setTimeout(() => { scoreBounce.value = false }, 300)
})

const progressOffset = () => {
  const circumference = 2 * Math.PI * 18
  return circumference * (1 - store.songProgress)
}
</script>

<template>
  <div class="score-panel flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
    <!-- Lives -->
    <div class="flex items-center gap-1">
      <div
        v-for="i in 5"
        :key="'heart-' + i"
        class="heart-icon transition-all duration-300"
        :class="{
          'opacity-100 scale-100': i <= store.lives,
          'opacity-20 scale-75 heart-break': i > store.lives
        }"
      >
        <Heart
          :size="16"
          :class="i <= store.lives ? 'text-pink-500' : 'text-gray-600'"
          :fill="i <= store.lives ? 'currentColor' : 'none'"
          style="filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))"
        />
      </div>
    </div>

    <!-- Progress Ring -->
    <div class="relative w-10 h-10 flex items-center justify-center">
      <svg class="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2.5" />
        <circle
          cx="20" cy="20" r="18" fill="none" stroke="url(#progressGrad)" stroke-width="2.5"
          stroke-linecap="round"
          :stroke-dasharray="2 * Math.PI * 18"
          :stroke-dashoffset="progressOffset()"
          class="transition-all duration-500"
          style="filter: drop-shadow(0 0 3px rgba(79, 172, 254, 0.5))"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4facfe" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <span class="absolute text-[9px] text-white/60 font-mono">
        {{ Math.round(store.songProgress * 100) }}%
      </span>
    </div>

    <!-- Score -->
    <div class="flex items-baseline gap-1" :class="{ 'score-bounce': scoreBounce }">
      <span class="text-xs text-white/40">得分</span>
      <span class="text-lg font-bold text-white tabular-nums" style="text-shadow: 0 0 12px rgba(100,150,255,0.4)">
        {{ displayScore }}
      </span>
    </div>

    <!-- Combo -->
    <div v-if="store.combo > 1" class="flex items-center gap-1">
      <span class="text-xs text-amber-400/80 font-bold">x{{ store.combo }}</span>
      <span class="text-xs text-amber-400/50">连击</span>
    </div>
  </div>
</template>

<style scoped>
.heart-break {
  animation: heartBreak 0.4s ease-out;
}

@keyframes heartBreak {
  0% { transform: scale(1); opacity: 1; }
  30% { transform: scale(1.3); opacity: 0.8; }
  60% { transform: scale(0.5); opacity: 0.3; }
  100% { transform: scale(0.75); opacity: 0.2; }
}

.score-bounce {
  animation: scoreUp 0.3s ease-out;
}

@keyframes scoreUp {
  0% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
</style>
