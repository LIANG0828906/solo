<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { songs } from '@/data/songs'
import { useGameStore } from '@/stores/gameStore'
import ScorePanel from '@/components/ScorePanel.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
import WordField from '@/components/WordField.vue'
import GameOver from '@/components/GameOver.vue'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useGameStore()

onMounted(() => {
  const songId = route.params.songId as string
  const song = songs.find(s => s.id === songId)
  if (!song) {
    router.push('/')
    return
  }
  if (!store.currentSong || store.currentSong.id !== songId) {
    store.resetGame()
    store.initEngine()
    store.startGame(song)
  }
})

function goBack() {
  store.resetGame()
  router.push('/')
}

watch(() => store.gameStatus, (status) => {
  if (status === 'gameover') {
    // Game over handled by GameOver component
  }
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden flex flex-col"
       style="background: radial-gradient(ellipse at 50% 30%, #0e1850 0%, #0a0a2e 50%, #03030f 100%);">

    <!-- Top status bar -->
    <header class="relative z-20 px-4 py-3 md:px-8 md:py-5 flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
      <button
        @click="goBack"
        class="order-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
               text-white/70 text-sm hover:bg-white/10 transition-all duration-200"
      >
        <ArrowLeft :size="14" />
        <span>返回</span>
      </button>

      <div class="order-3 md:order-2 w-full md:w-auto md:flex-1 md:max-w-md mx-auto md:mx-4">
        <ScorePanel />
      </div>

      <div class="order-2 md:order-3 w-full md:w-auto md:max-w-xs">
        <MusicPlayer />
      </div>
    </header>

    <!-- Game stage -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 pb-4">
      <div class="w-full max-w-5xl h-[calc(100vh-180px)] md:h-[calc(100vh-160px)]">
        <WordField />
      </div>
    </main>

    <!-- Section indicator -->
    <div v-if="store.currentSong" class="fixed left-1/2 -translate-x-1/2 bottom-[100px] z-20 flex items-center gap-1.5">
      <div
        v-for="(_, i) in store.currentSong.sections"
        :key="'dot-' + i"
        class="w-2 h-2 rounded-full transition-all duration-500"
        :class="{
          'scale-125': i === store.currentSectionIndex,
          'bg-blue-400 shadow-[0_0_8px_rgba(79,172,254,0.8)]': i < store.completedSections,
          'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]': i === store.currentSectionIndex,
          'bg-white/20': i > store.currentSectionIndex
        }"
      />
    </div>

    <!-- Game Over Overlay -->
    <GameOver v-if="store.gameStatus === 'gameover'" />
  </div>
</template>
