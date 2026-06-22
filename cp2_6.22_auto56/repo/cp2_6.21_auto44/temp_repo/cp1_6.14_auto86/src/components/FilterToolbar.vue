<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, LayoutGrid, Rows3, RotateCcw, ZoomIn, ZoomOut } from 'lucide-vue-next';
import { useTimelineStore } from '@/store/timelineStore';
import { SKILL_CATEGORY_META, ALL_CATEGORIES } from '@/types';
import type { SkillCategory } from '@/types';
import { useTimelineData } from '@/composables/useTimelineData';

const store = useTimelineStore();
const { resetToSample } = useTimelineData();

const draggingThumb = ref<'min' | 'max' | null>(null);
const thumbEl = ref<HTMLDivElement | null>(null);

const allSelected = computed({
  get: () => store.filters.categories.length === ALL_CATEGORIES.length,
  set: (v: boolean) => store.setAllCategories(v),
});

const isCategorySelected = (cat: SkillCategory) =>
  store.filters.categories.includes(cat);

const minYear = computed(() => store.yearRangeBounds[0]);
const maxYear = computed(() => store.yearRangeBounds[1]);
const startYear = computed(() => store.filters.yearRange[0]);
const endYear = computed(() => store.filters.yearRange[1]);

const trackPercent = (year: number) => {
  const total = maxYear.value - minYear.value;
  return total === 0 ? 0 : ((year - minYear.value) / total) * 100;
};

function onTrackMouseDown(e: MouseEvent) {
  if (!thumbEl.value) return;
  const rect = thumbEl.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  const year = Math.round(minYear.value + pct * (maxYear.value - minYear.value));
  const diffStart = Math.abs(year - startYear.value);
  const diffEnd = Math.abs(year - endYear.value);
  if (diffStart <= diffEnd) {
    draggingThumb.value = 'min';
    updateMinYear(year);
  } else {
    draggingThumb.value = 'max';
    updateMaxYear(year);
  }
  window.addEventListener('mousemove', onTrackMouseMove);
  window.addEventListener('mouseup', onTrackMouseUp);
}

function onTrackMouseMove(e: MouseEvent) {
  if (!thumbEl.value || !draggingThumb.value) return;
  const rect = thumbEl.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  const year = Math.round(minYear.value + pct * (maxYear.value - minYear.value));
  if (draggingThumb.value === 'min') {
    updateMinYear(year);
  } else {
    updateMaxYear(year);
  }
}

function onTrackMouseUp() {
  draggingThumb.value = null;
  window.removeEventListener('mousemove', onTrackMouseMove);
  window.removeEventListener('mouseup', onTrackMouseUp);
}

function updateMinYear(year: number) {
  const newMin = Math.min(year, endYear.value);
  store.setYearRange([newMin, endYear.value]);
}

function updateMaxYear(year: number) {
  const newMax = Math.max(year, startYear.value);
  store.setYearRange([startYear.value, newMax]);
}

function openAddModal() {
  store.openModal();
}

function toggleLayout() {
  store.setLayout(store.layout === 'horizontal' ? 'vertical' : 'horizontal');
}

function zoomIn() {
  store.setZoom(store.zoomLevel + 0.2);
}

function zoomOut() {
  store.setZoom(store.zoomLevel - 0.2);
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-row">
      <div class="toolbar-left">
        <h1 class="app-title">
          <span class="title-dot" />
          职业履历时间线
        </h1>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" @click="zoomOut" title="缩小">
          <ZoomOut :size="16" />
        </button>
        <span class="zoom-label">{{ Math.round(store.zoomLevel * 100) }}%</span>
        <button class="tool-btn" @click="zoomIn" title="放大">
          <ZoomIn :size="16" />
        </button>
        <button class="tool-btn" @click="toggleLayout" :title="store.layout === 'horizontal' ? '切换垂直' : '切换水平'">
          <component :is="store.layout === 'horizontal' ? Rows3 : LayoutGrid" :size="16" />
        </button>
        <button class="tool-btn" @click="resetToSample" title="重置为示例">
          <RotateCcw :size="16" />
        </button>
        <button class="btn-primary" @click="openAddModal">
          <Plus :size="16" />
          添加事件
        </button>
      </div>
    </div>

    <div class="toolbar-row filter-row">
      <div class="categories">
        <label class="cat-label">技能类别</label>
        <label class="check-item" :class="{ checked: allSelected }">
          <input type="checkbox" v-model="allSelected" />
          <span class="check-box" />
          <span>全选</span>
        </label>
        <label
          v-for="cat in ALL_CATEGORIES"
          :key="cat"
          class="check-item"
          :class="{ checked: isCategorySelected(cat) }"
        >
          <input
            type="checkbox"
            :checked="isCategorySelected(cat)"
            @change="store.toggleCategory(cat)"
          />
          <span
            class="check-box"
            :style="{
              borderColor: SKILL_CATEGORY_META[cat].color,
              background: isCategorySelected(cat) ? SKILL_CATEGORY_META[cat].color : 'transparent',
            }"
          />
          <span>{{ SKILL_CATEGORY_META[cat].label }}</span>
        </label>
      </div>

      <div class="year-slider">
        <label class="cat-label">时间范围</label>
        <div class="slider-wrap">
          <div class="slider-track" ref="thumbEl" @mousedown="onTrackMouseDown">
            <div
              class="slider-fill"
              :style="{
                left: trackPercent(startYear) + '%',
                right: 100 - trackPercent(endYear) + '%',
              }"
            />
            <div
              class="thumb thumb-min"
              :class="{ dragging: draggingThumb === 'min' }"
              :style="{ left: trackPercent(startYear) + '%' }"
            >
              <div class="thumb-value">{{ startYear }}</div>
            </div>
            <div
              class="thumb thumb-max"
              :class="{ dragging: draggingThumb === 'max' }"
              :style="{ left: trackPercent(endYear) + '%' }"
            >
              <div class="thumb-value">{{ endYear }}</div>
            </div>
          </div>
          <div class="slider-labels">
            <span>{{ minYear }}</span>
            <span>{{ maxYear }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  background: #ffffff;
  padding: 16px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 10;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a237e;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.title-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a237e, #3949ab);
  box-shadow: 0 0 0 4px rgba(26, 35, 126, 0.12);
}

.tool-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #444;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms ease;
}

.tool-btn:hover {
  border-color: #1a237e;
  color: #1a237e;
  background: rgba(26, 35, 126, 0.05);
}

.zoom-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 36px;
  text-align: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: #1a237e;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-primary:hover {
  background: #283593;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 35, 126, 0.25);
}

.filter-row {
  align-items: flex-start;
}

.categories {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cat-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.check-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  user-select: none;
  transition: color 200ms ease;
}

.check-item input {
  display: none;
}

.check-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid #bbb;
  display: inline-block;
  position: relative;
  transition: all 200ms ease;
}

.check-item.checked .check-box::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.year-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
  max-width: 520px;
}

.slider-wrap {
  flex: 1;
  padding-top: 8px;
}

.slider-track {
  position: relative;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  cursor: pointer;
}

.slider-fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #1a237e, #5c6bc0);
  border-radius: 3px;
}

.thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1a237e;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: grab;
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.thumb.dragging {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
}

.thumb-value {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1a237e;
  color: #fff;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 600;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease, transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.thumb-value::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1a237e;
}

.thumb:hover .thumb-value,
.thumb.dragging .thumb-value {
  opacity: 1;
  transform: translateX(-50%) translateY(-2px);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 11px;
  color: #999;
}

@media (max-width: 768px) {
  .toolbar {
    padding: 12px 14px;
  }

  .filter-row {
    flex-direction: column;
    gap: 12px;
  }

  .year-slider {
    max-width: 100%;
    width: 100%;
  }
}
</style>
