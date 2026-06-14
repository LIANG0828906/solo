<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import EventCard from './EventCard.vue';
import type { TimelineEvent } from '@/types';
import { SKILL_CATEGORY_META } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';

const store = useTimelineStore();

const scrollWrapRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(1200);

const sortedEvents = computed(() => store.sortedEvents);
const filteredEventIds = computed(() => new Set(store.filteredEvents.map((e) => e.id)));
const zoom = computed(() => store.zoomLevel);
const layout = computed(() => store.layout);

const cardWidth = computed(() => Math.max(150, 230 * zoom.value));
const nodeSpacing = computed(() => Math.max(120, 200 * zoom.value));
const trackHeight = 140;

function getPrimaryCategory(event: TimelineEvent) {
  if (event.skills.length === 0) return 'other';
  return event.skills[0].category;
}

function getNodeColor(event: TimelineEvent) {
  return SKILL_CATEGORY_META[getPrimaryCategory(event)].color;
}

function getMidYear(event: TimelineEvent) {
  return event.startYear;
}

function handleWheel(e: WheelEvent) {
  if (!scrollWrapRef.value) return;
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    store.setZoom(store.zoomLevel + delta);
  } else {
    if (layout.value === 'horizontal') {
      scrollWrapRef.value.scrollLeft += e.deltaY;
    }
  }
}

function handleMouseDown(e: MouseEvent) {
  if (!scrollWrapRef.value) return;
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: scrollWrapRef.value.scrollLeft,
    scrollTop: scrollWrapRef.value.scrollTop,
  };
  scrollWrapRef.value.style.cursor = 'grabbing';
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollWrapRef.value) return;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;
  scrollWrapRef.value.scrollLeft = dragStart.value.scrollLeft - dx;
  scrollWrapRef.value.scrollTop = dragStart.value.scrollTop - dy;
}

function handleMouseUp() {
  isDragging.value = false;
  if (scrollWrapRef.value) {
    scrollWrapRef.value.style.cursor = 'grab';
  }
}

function handleResize() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    if (window.innerWidth <= 1024 && store.layout === 'horizontal') {
      store.setLayout('vertical');
    } else if (window.innerWidth > 1024 && store.layout !== 'horizontal') {
      store.setLayout('horizontal');
    }
  }
}

function connectionGradient(from: TimelineEvent, to: TimelineEvent) {
  return `linear-gradient(90deg, ${getNodeColor(from)} 0%, ${getNodeColor(to)} 100%)`;
}

function verticalConnectionColor(from: TimelineEvent, to: TimelineEvent) {
  return `linear-gradient(180deg, ${getNodeColor(from)} 0%, ${getNodeColor(to)} 100%)`;
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('resize', handleResize);
});

watch(layout, () => {
  if (scrollWrapRef.value) {
    scrollWrapRef.value.scrollLeft = 0;
    scrollWrapRef.value.scrollTop = 0;
  }
});
</script>

<template>
  <div class="timeline-root" ref="containerRef">
    <div
      ref="scrollWrapRef"
      class="scroll-wrap"
      :class="{ horizontal: layout === 'horizontal', vertical: layout === 'vertical' }"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
    >
      <div
        class="timeline-track horizontal-track"
        v-if="layout === 'horizontal'"
        :style="{
          width: sortedEvents.length * nodeSpacing + 400 + 'px',
          paddingLeft: '200px',
          paddingRight: '200px',
        }"
      >
        <div class="axis-line">
          <div
            v-for="(event, i) in sortedEvents"
            :key="'seg-' + event.id"
            class="axis-segment"
            :style="{
              left: i * nodeSpacing + 'px',
              width: nodeSpacing + 'px',
              background:
                i < sortedEvents.length - 1
                  ? connectionGradient(event, sortedEvents[i + 1])
                  : 'transparent',
            }"
          />
        </div>

        <div
          v-for="(event, i) in sortedEvents"
          :key="event.id"
          class="event-node horizontal-node"
          :style="{
            left: i * nodeSpacing + 'px',
            width: cardWidth + 'px',
          }"
        >
          <div
            class="node-circle"
            :style="{
              background: `radial-gradient(circle, ${getNodeColor(event)} 0%, ${getNodeColor(event)}55 50%, transparent 70%)`,
            }"
          >
            <div
              class="node-inner"
              :style="{ borderColor: getNodeColor(event) }"
            >
              {{ getMidYear(event) }}
            </div>
          </div>
          <div class="card-top" :class="{ 'on-bottom': i % 2 === 1 }">
            <EventCard
              :event="event"
              :isFiltered="!filteredEventIds.has(event.id)"
            />
          </div>
        </div>
      </div>

      <div class="timeline-track vertical-track" v-else>
        <div class="vertical-axis">
          <div
            v-for="(event, i) in sortedEvents"
            :key="'vseg-' + event.id"
            class="v-axis-segment"
            :style="{
              top: i * trackHeight + 'px',
              height: trackHeight + 'px',
              background:
                i < sortedEvents.length - 1
                  ? verticalConnectionColor(event, sortedEvents[i + 1])
                  : 'transparent',
            }"
          />
        </div>

        <div
          v-for="(event, i) in sortedEvents"
          :key="event.id"
          class="event-node vertical-node"
          :style="{ top: i * trackHeight + 'px' }"
        >
          <div
            class="node-circle"
            :style="{
              background: `radial-gradient(circle, ${getNodeColor(event)} 0%, ${getNodeColor(event)}55 50%, transparent 70%)`,
            }"
          >
            <div
              class="node-inner"
              :style="{ borderColor: getNodeColor(event) }"
            >
              {{ getMidYear(event) }}
            </div>
          </div>
          <div class="v-card-wrap">
            <EventCard
              :event="event"
              :isFiltered="!filteredEventIds.has(event.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-root {
  width: 100%;
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

.scroll-wrap {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: grab;
  position: relative;
  scroll-behavior: smooth;
}

.scroll-wrap:active {
  cursor: grabbing;
}

.timeline-track {
  position: relative;
  transition: opacity 300ms ease;
}

.horizontal-track {
  height: 100%;
  min-height: 500px;
  position: relative;
}

.axis-line {
  position: absolute;
  top: 50%;
  left: 0;
  height: 4px;
  width: 100%;
  transform: translateY(-50%);
}

.axis-segment {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 2px;
  transition: opacity 300ms ease;
}

.vertical-track {
  position: relative;
  padding: 40px 32px 80px;
  min-height: 100%;
}

.vertical-axis {
  position: absolute;
  left: 56px;
  top: 0;
  width: 4px;
  height: 100%;
}

.v-axis-segment {
  position: absolute;
  left: 0;
  width: 100%;
  border-radius: 2px;
}

.event-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.horizontal-node {
  top: 50%;
  transform: translateX(-50%);
}

.vertical-node {
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  height: 110px;
}

.node-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  z-index: 2;
  transition: transform 250ms ease;
}

.horizontal-node:hover .node-circle {
  transform: scale(1.08);
}

.node-inner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #1a237e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #1a237e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-top {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  transition: transform 300ms ease;
}

.card-top {
  bottom: calc(50% + 50px);
}

.card-top.on-bottom {
  bottom: auto;
  top: calc(50% + 50px);
}

.v-card-wrap {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .vertical-track {
    padding: 20px 16px 60px;
  }

  .vertical-axis {
    left: 36px;
  }

  .vertical-node {
    gap: 14px;
    height: auto;
    position: relative;
    top: auto !important;
    margin-bottom: 24px;
  }

  .node-circle {
    width: 56px;
    height: 56px;
  }

  .node-inner {
    width: 36px;
    height: 36px;
    font-size: 10px;
  }
}
</style>
