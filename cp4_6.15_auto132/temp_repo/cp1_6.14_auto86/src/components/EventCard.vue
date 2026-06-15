<script setup lang="ts">
import { ref, computed } from 'vue';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next';
import type { TimelineEvent } from '@/types';
import { SKILL_CATEGORY_META } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';

interface Props {
  event: TimelineEvent;
  isFiltered: boolean;
}

const props = defineProps<Props>();
const store = useTimelineStore();
const expanded = ref(false);
const detailsRef = ref<HTMLElement | null>(null);

const primaryCategory = computed(() => {
  if (props.event.skills.length === 0) return 'other';
  return props.event.skills[0].category;
});

const categoryColor = computed(() => SKILL_CATEGORY_META[primaryCategory.value].color);

const yearText = computed(() => {
  if (props.event.startYear === props.event.endYear) {
    return String(props.event.startYear);
  }
  return `${props.event.startYear} - ${props.event.endYear}`;
});

function toggleExpand() {
  expanded.value = !expanded.value;
}

function handleEdit(e: Event) {
  e.stopPropagation();
  store.openModal(props.event);
}

function handleDelete(e: Event) {
  e.stopPropagation();
  if (confirm(`确定删除「${props.event.position}」这条履历吗？`)) {
    store.removeEvent(props.event.id);
  }
}
</script>

<template>
  <div
    class="event-card"
    :class="{ expanded, filtered: isFiltered }"
    :style="{ '--card-color': categoryColor }"
    @click="toggleExpand"
  >
    <div class="card-header">
      <div class="card-year">{{ yearText }}</div>
      <div class="card-actions">
        <button class="icon-btn" @click="handleEdit" aria-label="编辑">
          <Pencil :size="16" />
        </button>
        <button class="icon-btn" @click="handleDelete" aria-label="删除">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
    <div class="card-title">{{ event.position }}</div>
    <div class="card-company">{{ event.company }}</div>
    <div class="expand-toggle">
      <component :is="expanded ? ChevronUp : ChevronDown" :size="16" />
      <span>{{ expanded ? '收起' : '详情' }}</span>
    </div>
    <div
      ref="detailsRef"
      class="card-details"
      :class="{ 'is-visible': expanded }"
    >
      <p class="description">{{ event.description }}</p>
      <div class="skills-wrap" v-if="event.skills.length > 0">
        <span
          v-for="skill in event.skills"
          :key="skill.name"
          class="skill-tag"
          :style="{
            color: SKILL_CATEGORY_META[skill.category].color,
            backgroundColor: SKILL_CATEGORY_META[skill.category].bgColor,
          }"
        >
          {{ skill.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 250ms ease, box-shadow 250ms ease, opacity 300ms ease;
  min-width: 150px;
  overflow: hidden;
  will-change: transform;
}

.event-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 2px solid transparent;
  pointer-events: none;
  transition: border-color 250ms ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
}

.event-card:hover::before {
  border-color: var(--card-color);
}

.event-card.filtered {
  opacity: 0.25;
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-year {
  font-size: 13px;
  font-weight: 600;
  color: var(--card-color);
  letter-spacing: 0.5px;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 200ms ease;
}

.event-card:hover .card-actions {
  opacity: 1;
}

.icon-btn {
  border: none;
  background: transparent;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;
}

.icon-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.icon-btn:nth-child(2):hover {
  background: #ffe5e5;
  color: #d32f2f;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.card-company {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.expand-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1a237e;
  font-weight: 500;
}

.card-details {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 250ms ease, opacity 250ms ease;
  opacity: 0;
}

.card-details.is-visible {
  grid-template-rows: 1fr;
  opacity: 1;
}

.card-details > * {
  overflow: hidden;
}

.description {
  margin: 12px 0 10px;
  font-size: 13px;
  line-height: 1.65;
  color: #444;
  animation: fadeIn 250ms ease;
}

.skills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  animation: fadeIn 250ms ease;
}

.skill-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
