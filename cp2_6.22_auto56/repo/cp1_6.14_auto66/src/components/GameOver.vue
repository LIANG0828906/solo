<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { RotateCcw, Home, Trophy, Zap, Music } from 'lucide-vue-next'

const store = useGameStore()
const router = useRouter()
const displayScore = ref(0)

onMounted(() => {
  const target = store.score
  if (target === 0) return
  const step = Math.max(1, Math.ceil(target / 60))
  const interval = setInterval(() => {
    displayScore.value += step
    if (displayScore.value >= target) {
      displayScore.value = target
      clearInterval(interval)
    }
  }, 25)
})

function restart() {
  const song = store.currentSong
  if (song) {
    store.resetGame()
    setTimeout(() => store.startGame(song), 100)
  }
}

function goHome() {
  store.resetGame()
  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
       style="background: rgba(5, 8, 25, 0.85); backdrop-filter: blur(10px);">
    <div
      class="w-full max-w-md rounded-3xl overflow-hidden animate-[fadeIn_0.4s_ease]"
      style="background: linear-gradient(145deg, rgba(40,25,80,0.9), rgba(20,15,50,0.9));
             border: 1px solid rgba(255,255,255,0.1);
             box-shadow: 0 20px 80px rgba(100,100,255,0.25);">

      <!-- Header -->
      <div class="relative px-8 pt-10 pb-6 text-center">
        <div class="absolute top-0 left-0 right-0 h-32 opacity-40"
             :style="{ background: store.currentSong?.coverGradient }" />
        <div class="relative z-10">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
               style="background: linear-gradient(135deg, rgba(255,215,100,0.3), rgba(255,100,150,0.3));
                      border: 1px solid rgba(255,255,255,0.15);">
            <Trophy :size="32" style="color: #ffd966; filter: drop-shadow(0 0 10px rgba(255,215,100,0.5))" />
          </div>
          <h2 class="text-2xl font-bold text-white mb-1"
              style="text-shadow: 0 0 20px rgba(150,180,255,0.4);">
            {{ store.lives <= 0 ? '游戏结束' : '通关完成！' }}
          </h2>
          <p class="text-sm text-white/50">{{ store.currentSong?.title }} - {{ store.currentSong?.artist }}</p>
        </div>
      </div>

      <!-- Score -->
      <div class="px-8 pb-6 text-center">
        <div class="text-xs text-white/40 mb-1 tracking-wider">最终得分</div>
        <div
          class="text-6xl font-bold mb-4 tabular-nums"
          style="background: linear-gradient(135deg, #4facfe 0%, #a855f7 50%, #ff6bd6 100%);
                 -webkit-background-clip: text; background-clip: text; color: transparent;
                 text-shadow: 0 0 40px rgba(150,100,255,0.3);"
        >
          {{ displayScore }}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div class="flex items-center justify-center gap-2 mb-1">
              <Music :size="14" class="text-blue-400" />
              <span class="text-[10px] text-white/50 tracking-wider">完成小节</span>
            </div>
            <div class="text-xl font-bold text-white/90">{{ store.completedSections }}</div>
          </div>
          <div class="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div class="flex items-center justify-center gap-2 mb-1">
              <Zap :size="14" class="text-amber-400" />
              <span class="text-[10px] text-white/50 tracking-wider">最高连击</span>
            </div>
            <div class="text-xl font-bold text-white/90">{{ store.maxCombo }}</div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
          <button
            @click="restart"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-white
                   transition-all duration-200 hover:scale-105 active:scale-95"
            style="background: linear-gradient(135deg, #4facfe, #a855f7);
                   box-shadow: 0 4px 20px rgba(120,100,255,0.4);"
          >
            <RotateCcw :size="16" />
            重新开始
          </button>
          <button
            @click="goHome"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-white/80
                   bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95"
          >
            <Home :size="16" />
            返回选歌
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
