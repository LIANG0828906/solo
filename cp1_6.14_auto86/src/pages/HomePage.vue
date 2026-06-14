<script setup lang="ts">
import FilterToolbar from '@/components/FilterToolbar.vue';
import Timeline from '@/components/Timeline.vue';
import EventModal from '@/components/EventModal.vue';
import { useTimelineData } from '@/composables/useTimelineData';

useTimelineData();
</script>

<template>
  <div class="app-shell">
    <FilterToolbar />
    <main class="app-main">
      <Timeline />
    </main>
    <EventModal />
  </div>
</template>

<style scoped>
.app-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.app-main {
  flex: 1;
  width: 100%;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-shell {
    height: 100vh;
    height: 100dvh;
  }

  .app-main {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
