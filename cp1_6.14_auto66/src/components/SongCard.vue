<script setup lang="ts">
import type { Song } from '@/types'

interface Props {
  song: Song
  selected: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', song: Song): void
}>()

const genreLabel: Record<string, string> = {
  pop: '流行',
  folk: '民谣',
  electronic: '电子'
}
</script>

<template>
  <div
    class="song-card relative shrink-0 w-[220px] h-[300px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
    :class="{
      'scale-110 z-10': selected,
      'hover:scale-105 hover:-translate-y-2': !selected
    }"
    @click="emit('select', props.song)"
  >
    <!-- Gradient Cover -->
    <div
      class="absolute inset-0"
      :style="{ background: props.song.coverGradient }"
    />
    <!-- Overlay pattern -->
    <div class="absolute inset-0 bg-black/20" />
    <div class="absolute inset-0 opacity-30"
         style="background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%);" />

    <!-- Content -->
    <div class="relative z-10 flex flex-col h-full p-5">
      <div class="flex items-start justify-between">
        <span
          class="px-2 py-1 rounded-md text-[10px] font-medium text-white/90 backdrop-blur-sm"
          style="background: rgba(255,255,255,0.15); text-shadow: 0 0 8px rgba(255,255,255,0.3);"
        >
          {{ genreLabel[props.song.genre] }}
        </span>
        <div
          v-if="selected"
          class="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
          style="box-shadow: 0 0 15px rgba(255,255,255,0.6);"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#667eea">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 64 64" width="72" height="72" fill="rgba(255,255,255,0.85)" style="filter: drop-shadow(0 0 20px rgba(255,255,255,0.4))">
          <path d="M48 5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v13.4l-18.2-3.4a2 2 0 0 0-2.4 1.9L23.4 27a2 2 0 0 0 1.6 2.4l18 3.4c0.3 0.1 0.5 0.1 0.8 0.1a2 2 0 0 0 1.9-1.5l2.6-13.7A2 2 0 0 0 48 14V5zM24 40c-4.4 0-8 3.1-8 7s3.6 7 8 7 8-3.1 8-7-3.6-7-8-7zm26-12c-4.4 0-8 3.1-8 7s3.6 7 8 7 8-3.1 8-7-3.6-7-8-7z"/>
        </svg>
      </div>

      <div>
        <h3
          class="text-xl font-bold text-white mb-1"
          style="text-shadow: 0 2px 12px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.2);"
        >
          {{ props.song.title }}
        </h3>
        <p class="text-sm text-white/70">{{ props.song.artist }}</p>
      </div>
    </div>

    <!-- Selected glow -->
    <div
      v-if="selected"
      class="absolute inset-0 rounded-2xl pointer-events-none"
      style="box-shadow: inset 0 0 0 3px rgba(255,255,255,0.8), 0 0 40px rgba(150,180,255,0.5);"
    />
  </div>
</template>
