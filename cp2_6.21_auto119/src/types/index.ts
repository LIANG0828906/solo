export interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  categories: string[];
  addedAt?: number;
}

export interface BookmarkTreeNode {
  id: string;
  title: string;
  type: 'folder' | 'bookmark';
  url?: string;
  addedAt?: number;
  children: BookmarkTreeNode[];
}

export interface CategoryRule {
  id: string;
  name: string;
  type: 'url' | 'title';
  keyword: string;
  category: string;
}

export interface CategoryNode {
  name: string;
  bookmarks: Bookmark[];
  children: CategoryNode[];
}

export interface BookmarkState {
  bookmarkTree: CategoryNode[];
  bookmarkFolderTree: BookmarkTreeNode[];
  allBookmarks: Bookmark[];
  searchKeyword: string;
  selectedCategory: string | null;
  selectedBookmark: Bookmark | null;
  rules: CategoryRule[];
  deletedBookmark: { bookmark: Bookmark; index: number } | null;
  showSettings: boolean;
  showDetailPanel: boolean;
  importCount: number;
}

export interface BookmarkActions {
  importBookmarks: (html: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedBookmark: (bookmark: Bookmark | null) => void;
  setShowDetailPanel: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  addRule: (rule: Omit<CategoryRule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<CategoryRule>) => void;
  deleteRule: (id: string) => void;
  deleteBookmark: (id: string) => void;
  undoDelete: () => void;
  clearDeletedBookmark: () => void;
  reclassifyBookmarks: () => void;
}
