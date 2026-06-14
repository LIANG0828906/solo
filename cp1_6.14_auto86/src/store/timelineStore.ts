import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TimelineEvent, LayoutMode, TimelineFilters, SkillCategory } from '@/types';
import { ALL_CATEGORIES } from '@/types';

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<TimelineEvent[]>([]);
  const selectedEventId = ref<string | null>(null);
  const zoomLevel = ref<number>(1);
  const layout = ref<LayoutMode>('horizontal');
  const filters = ref<TimelineFilters>({
    categories: [...ALL_CATEGORIES],
    yearRange: [2015, 2026],
  });
  const modalVisible = ref<boolean>(false);
  const editingEvent = ref<TimelineEvent | null>(null);

  const sortedEvents = computed(() => {
    return [...events.value].sort((a, b) => a.startYear - b.startYear);
  });

  const filteredEvents = computed(() => {
    return sortedEvents.value.filter((event) => {
      const hasMatchingCategory = event.skills.some((skill) =>
        filters.value.categories.includes(skill.category),
      );
      const yearInRange =
        event.endYear >= filters.value.yearRange[0] &&
        event.startYear <= filters.value.yearRange[1];
      return hasMatchingCategory && yearInRange;
    });
  });

  const yearRangeBounds = computed(() => {
    if (sortedEvents.value.length === 0) {
      return [2015, 2026] as [number, number];
    }
    const minYear = Math.min(...sortedEvents.value.map((e) => e.startYear));
    const maxYear = Math.max(...sortedEvents.value.map((e) => e.endYear));
    return [minYear - 1, maxYear + 1] as [number, number];
  });

  function setEvents(newEvents: TimelineEvent[]) {
    events.value = newEvents;
    if (events.value.length > 0) {
      const minYear = Math.min(...events.value.map((e) => e.startYear));
      const maxYear = Math.max(...events.value.map((e) => e.endYear));
      filters.value.yearRange = [minYear, maxYear];
    }
  }

  function addEvent(event: TimelineEvent) {
    events.value.push(event);
  }

  function updateEvent(updated: TimelineEvent) {
    const idx = events.value.findIndex((e) => e.id === updated.id);
    if (idx !== -1) {
      events.value[idx] = updated;
    }
  }

  function removeEvent(id: string) {
    events.value = events.value.filter((e) => e.id !== id);
    if (selectedEventId.value === id) {
      selectedEventId.value = null;
    }
  }

  function setSelectedEvent(id: string | null) {
    selectedEventId.value = id;
  }

  function setZoom(level: number) {
    zoomLevel.value = Math.max(0.5, Math.min(2, level));
  }

  function setLayout(mode: LayoutMode) {
    layout.value = mode;
  }

  function toggleCategory(cat: SkillCategory) {
    const idx = filters.value.categories.indexOf(cat);
    if (idx === -1) {
      filters.value.categories.push(cat);
    } else {
      filters.value.categories.splice(idx, 1);
    }
  }

  function setAllCategories(enabled: boolean) {
    filters.value.categories = enabled ? [...ALL_CATEGORIES] : [];
  }

  function setYearRange(range: [number, number]) {
    filters.value.yearRange = range;
  }

  function openModal(event?: TimelineEvent) {
    editingEvent.value = event ?? null;
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
    editingEvent.value = null;
  }

  return {
    events,
    sortedEvents,
    filteredEvents,
    selectedEventId,
    zoomLevel,
    layout,
    filters,
    yearRangeBounds,
    modalVisible,
    editingEvent,
    setEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setSelectedEvent,
    setZoom,
    setLayout,
    toggleCategory,
    setAllCategories,
    setYearRange,
    openModal,
    closeModal,
  };
});
