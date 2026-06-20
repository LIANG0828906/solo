<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { songs } from '@/data/songs'
import SongCard from '@/components/SongCard.vue'
import { useGameStore } from '@/stores/gameStore'
import type { Song } from '@/types'
import { Play, Sparkles, Music2 } from 'lucide-vue-next'

const router = useRouter()
const store = useGameStore()
const selectedSong = ref<Song | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0
let ctx: CanvasRenderingContext2D | null = null

const stars = ref<Array<{x: number; y: number; size: number; twinkle: number; speed: number}>>([])

function initStars() {
  stars.value = Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 2 + 0.5,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.5 + 0.3
  }))
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
}

function renderStars(time: number) {
  if (!ctx || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  ctx.clearRect(0, 0, w, h)
  for (const s of stars.value) {
    const a = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 * s.speed + s.twinkle))
    ctx.beginPath()
    ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200, 220, 255, ${a})`
    ctx.fill()
  }
  animId = requestAnimationFrame(renderStars)
}

onMounted(() => {
  initStars()
  initCanvas()
  animId = requestAnimationFrame(renderStars)
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', initCanvas)
})

function handleSelect(song: Song) {
  selectedSong.value = song
}

function startGame() {
  if (!selectedSong.value) return
  store.resetGame()
  store.initEngine()
  store.startGame(selectedSong.value)
  router.push(`/game/${selectedSong.value.id}`)
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden"
       style="background: radial-gradient(ellipse at 50% 20%, #1a1a4e 0%, #0d0a2e 50%, #05030f 100%);">
    <canvas ref="canvasRef" class="absolute inset-0 pointer-events-none" />

    <div class="relative z-10 flex flex-col min-h-screen">
      <!-- Header -->
      <header class="pt-12 pb-8 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
             style="background: rgba(100,150,255,0.1); border: 1px solid rgba(100,150,255,0.2);">
          <Sparkles :size="14" style="color: #a855f7" />
          <span class="text-xs text-white/70 tracking-wider">MUSIC × WORDS × PUZZLE</span>
        </div>
        <h1
          class="text-4xl md:text-5xl font-bold mb-3"
          style="background: linear-gradient(135deg, #4facfe 0%, #a855f7 40%, #ff6bd6 100%);
                 -webkit-background-clip: text; background-clip: text; color: transparent;
                 text-shadow: 0 0 60px rgba(160, 100, 255, 0.4);"
        >
          音乐节奏文字解谜
        </h1>
        <p class="text-sm md:text-base text-white/50 max-w-md mx-auto px-6">
          在音乐中捕捉文字碎片，拼出歌词的旋律
        </p>
      </header>

      <!-- Song list -->
      <section class="flex-1 px-4 md:px-12 pb-6">
        <div class="flex items-center gap-2 mb-5 px-2">
          <Music2 :size="18" class="text-blue-400" />
          <span class="text-sm font-medium text-white/70">选择你的歌曲</span>
        </div>

        <div
          class="flex gap-6 px-4 py-8 overflow-x-auto snap-x snap-mandatory
                 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div class="w-[calc(50vw-120px)] shrink-0" />
          <div class="flex gap-6 snap-center">
            <SongCard
              v-for="song in songs"
              :key="song.id"
              :song="song"
              :selected="selectedSong?.id === song.id"
              @select="handleSelect"
              class="snap-center"
            />
          </div>
          <div class="w-[calc(50vw-120px)] shrink-0" />
        </div>
      </section>

      <!-- Start Button -->
      <footer class="pb-12 px-6">
        <div class="max-w-md mx-auto">
          <button
            v-if="selectedSong"
            @click="startGame"
            class="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-lg
                   transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] animate-[pulse_2s_ease-in-out_infinite]"
            :style="{
              background: selectedSong.coverGradient,
              boxShadow: '0 8px 40px rgba(150,120,255,0.45)'
            }"
          >
            <Play :size="22" fill="white" />
            <span>开始游戏</span>
            <span class="text-white/60 text-sm font-normal">{{ selectedSong.title }}</span>
          </button>
          <div
            v-else
            class="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white/40 border border-white/10 bg-white/5"
          >
            <span>← 左右滑动并点击选择一首歌曲</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
