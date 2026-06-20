<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { Play, Pause, Music2 } from 'lucide-vue-next'

const store = useGameStore()
</script>

<template>
  <div class="music-player flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
    <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30">
      <Music2 :size="16" class="text-blue-300" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xs text-white/80 truncate max-w-[120px]" style="text-shadow: 0 0 8px rgba(100,150,255,0.5)">
          {{ store.currentSong?.title || '未选择歌曲' }}
        </span>
        <span class="text-xs text-white/40">-</span>
        <span class="text-xs text-white/50 truncate max-w-[80px]">{{ store.currentSong?.artist || '' }}</span>
      </div>
      <div class="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          :style="{ width: (store.songProgress * 100) + '%', background: 'linear-gradient(90deg, #4facfe, #a855f7)' }"
        />
      </div>
    </div>
    <button
      v-if="store.currentSong"
      @click="store.isPlaying ? store.pauseGame() : store.resumeGame()"
      class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 transition-all duration-200"
    >
      <Pause v-if="store.isPlaying" :size="14" class="text-white" />
      <Play v-else :size="14" class="text-white ml-0.5" />
    </button>
  </div>
</template>
