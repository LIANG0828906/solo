import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Bookmark } from '@/shared/types';
import { bookmarkApi } from '@/shared/api';

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<Bookmark[]>(bookmarkApi.getAll());
  const activeGroup = ref<string>('');

  const groups = computed(() => bookmarkApi.getGroups());

  const filteredBookmarks = computed(() => {
    if (!activeGroup.value) return bookmarks.value;
    return bookmarks.value.filter(b => b.group === activeGroup.value);
  });

  function load() {
    bookmarks.value = bookmarkApi.getAll();
  }

  function create(data: { title: string; url: string; favicon: string; group: string }) {
    const bookmark = bookmarkApi.create(data);
    bookmarks.value.push(bookmark);
    return bookmark;
  }

  function update(id: string, data: Partial<Bookmark>) {
    const result = bookmarkApi.update(id, data);
    if (result) {
      const idx = bookmarks.value.findIndex(b => b.id === id);
      if (idx !== -1) bookmarks.value[idx] = result;
    }
    return result;
  }

  function remove(id: string) {
    const success = bookmarkApi.delete(id);
    if (success) {
      bookmarks.value = bookmarks.value.filter(b => b.id !== id);
    }
    return success;
  }

  function addGroup(name: string) {
    if (!groups.value.includes(name)) {
      activeGroup.value = name;
    }
  }

  return { bookmarks, activeGroup, groups, filteredBookmarks, load, create, update, remove, addGroup };
});
