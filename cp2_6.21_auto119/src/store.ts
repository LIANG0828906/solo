import { create } from 'zustand';
import type { Bookmark, BookmarkState, BookmarkActions, CategoryRule } from './types';
import { parseBookmarks } from './parser';
import { classifyBookmarks, defaultRules } from './ruleEngine';

export const useBookmarkStore = create<BookmarkState & BookmarkActions>()(
  (set, get) => ({
    bookmarkTree: [],
    allBookmarks: [],
    searchKeyword: '',
    selectedCategory: null,
    selectedBookmark: null,
    rules: defaultRules,
    deletedBookmark: null,
    showSettings: false,
    showDetailPanel: false,
    importCount: 0,

    importBookmarks: (html: string) => {
      const start = performance.now();
      const parsed = parseBookmarks(html);
      const parseTime = performance.now() - start;
      
      const classifyStart = performance.now();
      const { bookmarks, tree } = classifyBookmarks(parsed, get().rules);
      const classifyTime = performance.now() - classifyStart;
      
      console.log(`解析完成: ${parsed.length} 个书签, 耗时 ${parseTime.toFixed(2)}ms`);
      console.log(`分类完成, 耗时 ${classifyTime.toFixed(2)}ms`);
      console.log(`总耗时: ${(parseTime + classifyTime).toFixed(2)}ms`);

      set({
        allBookmarks: bookmarks,
        bookmarkTree: tree,
        importCount: parsed.length,
        selectedBookmark: null,
        showDetailPanel: false,
      });
    },

    reclassifyBookmarks: () => {
      const { allBookmarks, rules } = get();
      if (allBookmarks.length === 0) return;

      const rawBookmarks = allBookmarks.map(b => ({ ...b, categories: [] }));
      const { bookmarks, tree } = classifyBookmarks(rawBookmarks, rules);
      
      set({
        allBookmarks: bookmarks,
        bookmarkTree: tree,
      });
    },

    setSearchKeyword: (keyword: string) => {
      set({ searchKeyword: keyword });
    },

    setSelectedCategory: (category: string | null) => {
      set({ selectedCategory: category });
    },

    setSelectedBookmark: (bookmark: Bookmark | null) => {
      set({ selectedBookmark: bookmark });
    },

    setShowDetailPanel: (show: boolean) => {
      set({ showDetailPanel: show });
      if (!show) {
        set({ selectedBookmark: null });
      }
    },

    setShowSettings: (show: boolean) => {
      set({ showSettings: show });
    },

    addRule: (rule: Omit<CategoryRule, 'id'>) => {
      const newRule: CategoryRule = {
        ...rule,
        id: `rule-${crypto.randomUUID()}`,
      };
      set((state) => ({
        rules: [...state.rules, newRule],
      }));
      get().reclassifyBookmarks();
    },

    updateRule: (id: string, rule: Partial<CategoryRule>) => {
      set((state) => ({
        rules: state.rules.map((r) =>
          r.id === id ? { ...r, ...rule } : r
        ),
      }));
      get().reclassifyBookmarks();
    },

    deleteRule: (id: string) => {
      set((state) => ({
        rules: state.rules.filter((r) => r.id !== id),
      }));
      get().reclassifyBookmarks();
    },

    deleteBookmark: (id: string) => {
      const { allBookmarks } = get();
      const index = allBookmarks.findIndex((b) => b.id === id);
      if (index === -1) return;

      const bookmark = allBookmarks[index];
      const newBookmarks = [...allBookmarks];
      newBookmarks.splice(index, 1);

      const { tree } = classifyBookmarks(newBookmarks, get().rules);

      set({
        allBookmarks: newBookmarks,
        bookmarkTree: tree,
        deletedBookmark: { bookmark, index },
        selectedBookmark: null,
        showDetailPanel: false,
      });

      setTimeout(() => {
        if (get().deletedBookmark?.bookmark.id === id) {
          get().clearDeletedBookmark();
        }
      }, 5000);
    },

    undoDelete: () => {
      const { deletedBookmark, allBookmarks, rules } = get();
      if (!deletedBookmark) return;

      const { bookmark, index } = deletedBookmark;
      const newBookmarks = [...allBookmarks];
      newBookmarks.splice(index, 0, bookmark);

      const { tree } = classifyBookmarks(newBookmarks, rules);

      set({
        allBookmarks: newBookmarks,
        bookmarkTree: tree,
        deletedBookmark: null,
      });
    },

    clearDeletedBookmark: () => {
      set({ deletedBookmark: null });
    },
  })
);

export const useFilteredBookmarks = () => {
  return useBookmarkStore((state) => {
    const { allBookmarks, searchKeyword, selectedCategory } = state;
    
    if (allBookmarks.length === 0) return [];

    const keyword = searchKeyword.trim().toLowerCase();

    return allBookmarks.filter((bookmark) => {
      const matchesCategory = selectedCategory
        ? bookmark.categories.includes(selectedCategory)
        : true;

      const matchesSearch = keyword
        ? bookmark.title.toLowerCase().includes(keyword) ||
          bookmark.url.toLowerCase().includes(keyword)
        : true;

      return matchesCategory && matchesSearch;
    });
  });
};

export const useCategories = () => {
  return useBookmarkStore((state) =>
    state.bookmarkTree.map((node) => node.name)
  );
};
