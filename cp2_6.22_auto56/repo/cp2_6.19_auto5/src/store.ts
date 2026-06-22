import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Category, Snippet, SortOrder } from './types';

const now = Date.now();

const initialCategories: Category[] = [
  { id: 'cat-1', name: '工作文档', parentId: null, level: 0, isExpanded: true },
  { id: 'cat-1-1', name: '会议记录', parentId: 'cat-1', level: 1, isExpanded: false },
  { id: 'cat-1-2', name: '项目计划', parentId: 'cat-1', level: 1, isExpanded: false },
  { id: 'cat-1-1-1', name: '周会', parentId: 'cat-1-1', level: 2, isExpanded: false },
  { id: 'cat-2', name: '学习笔记', parentId: null, level: 0, isExpanded: true },
  { id: 'cat-2-1', name: '前端技术', parentId: 'cat-2', level: 1, isExpanded: false },
  { id: 'cat-2-2', name: '后端技术', parentId: 'cat-2', level: 1, isExpanded: false },
  { id: 'cat-3', name: '个人随笔', parentId: null, level: 0, isExpanded: false },
];

const initialSnippets: Snippet[] = [
  { id: 's1', title: 'React Hooks 最佳实践', content: '## React Hooks\n\n- 使用 `useState` 管理局部状态\n- 使用 `useEffect` 处理副作用\n- 自定义 Hook 提取复用逻辑', tags: ['react', 'hooks', '前端'], categoryId: 'cat-2-1', createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 2 },
  { id: 's2', title: 'TypeScript 类型体操', content: '## 常用工具类型\n\n- `Partial<T>` 将属性变为可选\n- `Pick<T, K>` 选取部分属性\n- `Omit<T, K>` 排除部分属性', tags: ['typescript', '类型', '前端'], categoryId: 'cat-2-1', createdAt: now - 86400000 * 4, updatedAt: now - 86400000 * 1 },
  { id: 's3', title: 'Vite 配置优化', content: '## Vite 优化策略\n\n1. 路径别名配置\n2. 代码分割\n3. 预构建依赖', tags: ['vite', '构建工具', '前端'], categoryId: 'cat-2-1', createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3 },
  { id: 's4', title: '周一例会纪要', content: '## 会议要点\n\n- 项目进度汇报\n- 下周计划讨论\n- 风险评估', tags: ['会议', '工作'], categoryId: 'cat-1-1-1', createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2 },
  { id: 's5', title: 'Q3 项目规划', content: '## Q3 目标\n\n1. 完成v2.0重构\n2. 性能优化30%\n3. 新增协作功能', tags: ['项目', '规划', '工作'], categoryId: 'cat-1-2', createdAt: now - 86400000 * 1, updatedAt: now - 86400000 * 1 },
  { id: 's6', title: 'Node.js 流式处理', content: '## Stream API\n\n- `Readable` 可读流\n- `Writable` 可写流\n- `Transform` 转换流', tags: ['node', 'stream', '后端'], categoryId: 'cat-2-2', createdAt: now - 86400000 * 6, updatedAt: now - 86400000 * 4 },
  { id: 's7', title: '数据库索引优化', content: '## 索引策略\n\n- B+树索引原理\n- 联合索引最左前缀\n- 覆盖索引减少回表', tags: ['数据库', '优化', '后端'], categoryId: 'cat-2-2', createdAt: now - 86400000 * 7, updatedAt: now - 86400000 * 5 },
  { id: 's8', title: '周末徒步日记', content: '## 秋日山行\n\n今天去了城郊的山间小道，落叶铺满了石板路，空气中弥漫着桂花的香气。', tags: ['生活', '随笔'], categoryId: 'cat-3', createdAt: now - 86400000 * 8, updatedAt: now - 86400000 * 8 },
  { id: 's9', title: 'CSS Grid 布局指南', content: '## Grid 核心概念\n\n- `grid-template-columns` 定义列\n- `grid-template-rows` 定义行\n- `gap` 设置间距', tags: ['css', '布局', '前端'], categoryId: 'cat-2-1', createdAt: now - 86400000 * 9, updatedAt: now - 86400000 * 6 },
  { id: 's10', title: 'API 设计规范', content: '## RESTful 设计原则\n\n1. 资源命名用名词复数\n2. HTTP方法语义化\n3. 版本化API路径', tags: ['api', '后端', '规范'], categoryId: 'cat-2-2', createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 7 },
  { id: 's11', title: '团队周报模板', content: '## 本周工作\n\n- 完成了XX模块开发\n- 修复了3个线上bug\n\n## 下周计划\n\n- 开始YY功能开发\n- 代码评审', tags: ['工作', '周报'], categoryId: 'cat-1-1-1', createdAt: now - 86400000 * 11, updatedAt: now - 86400000 * 9 },
  { id: 's12', title: '读书笔记：深入浅出Node.js', content: '## 核心要点\n\n- 事件循环机制\n- 模块系统演进\n- 进程与集群', tags: ['node', '读书', '后端'], categoryId: 'cat-2-2', createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 10 },
];

interface AppState {
  categories: Category[];
  snippets: Snippet[];
  selectedCategoryId: string | null;
  selectedTags: string[];
  searchQuery: string;
  sortOrder: SortOrder;
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  editingSnippet: Snippet | null;
  isEditPanelOpen: boolean;
  isCreating: boolean;
  exportProgress: number;
  isExporting: boolean;

  selectCategory: (id: string | null) => void;
  toggleCategory: (id: string) => void;
  addCategory: (name: string, parentId: string | null) => void;
  deleteCategory: (id: string) => void;
  renameCategory: (id: string, name: string) => void;
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  reorderSnippets: (startIndex: number, endIndex: number) => void;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortOrder: (order: SortOrder) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileView: (isMobile: boolean) => void;
  setEditingSnippet: (snippet: Snippet | null) => void;
  setEditPanelOpen: (open: boolean) => void;
  setIsCreating: (creating: boolean) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (exporting: boolean) => void;
  openCreatePanel: () => void;
  openEditPanel: (snippet: Snippet) => void;
  closeEditPanel: () => void;
  startExport: () => void;
}

function getCategoryDescendantIds(categories: Category[], categoryId: string): string[] {
  const ids = [categoryId];
  const children = categories.filter(c => c.parentId === categoryId);
  for (const child of children) {
    ids.push(...getCategoryDescendantIds(categories, child.id));
  }
  return ids;
}

export const useStore = create<AppState>((set, get) => ({
  categories: initialCategories,
  snippets: initialSnippets,
  selectedCategoryId: null,
  selectedTags: [],
  searchQuery: '',
  sortOrder: 'createdAt',
  sidebarWidth: 240,
  isSidebarCollapsed: false,
  isMobileView: false,
  editingSnippet: null,
  isEditPanelOpen: false,
  isCreating: false,
  exportProgress: 0,
  isExporting: false,

  selectCategory: (id) => set({ selectedCategoryId: id }),

  toggleCategory: (id) => set(state => ({
    categories: state.categories.map(c =>
      c.id === id ? { ...c, isExpanded: !c.isExpanded } : c
    ),
  })),

  addCategory: (name, parentId) => set(state => {
    const parent = state.categories.find(c => c.id === parentId);
    const level = parent ? Math.min(parent.level + 1, 2) : 0;
    if (parent && parent.level >= 2) return state;
    return {
      categories: [...state.categories, {
        id: uuidv4(),
        name,
        parentId,
        level,
        isExpanded: false,
      }],
    };
  }),

  deleteCategory: (id) => set(state => {
    const descendantIds = getCategoryDescendantIds(state.categories, id);
    return {
      categories: state.categories.filter(c => !descendantIds.includes(c.id)),
      snippets: state.snippets.map(s =>
        descendantIds.includes(s.categoryId ?? '') ? { ...s, categoryId: null } : s
      ),
      selectedCategoryId: state.selectedCategoryId === id ? null : state.selectedCategoryId,
    };
  }),

  renameCategory: (id, name) => set(state => ({
    categories: state.categories.map(c =>
      c.id === id ? { ...c, name } : c
    ),
  })),

  addSnippet: (snippet) => set(state => ({
    snippets: [...state.snippets, {
      ...snippet,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }],
  })),

  updateSnippet: (id, updates) => set(state => ({
    snippets: state.snippets.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
    ),
  })),

  deleteSnippet: (id) => set(state => ({
    snippets: state.snippets.filter(s => s.id !== id),
  })),

  reorderSnippets: (startIndex, endIndex) => set(state => {
    const newSnippets = [...state.snippets];
    const [removed] = newSnippets.splice(startIndex, 1);
    newSnippets.splice(endIndex, 0, removed);
    return { snippets: newSnippets };
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),

  toggleTag: (tag) => set(state => ({
    selectedTags: state.selectedTags.includes(tag)
      ? state.selectedTags.filter(t => t !== tag)
      : [...state.selectedTags, tag],
  })),

  setSortOrder: (order) => set({ sortOrder: order }),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(480, width)) }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setMobileView: (isMobile) => set({ isMobileView: isMobile }),
  setEditingSnippet: (snippet) => set({ editingSnippet: snippet }),
  setEditPanelOpen: (open) => set({ isEditPanelOpen: open }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),

  openCreatePanel: () => set({
    isEditPanelOpen: true,
    isCreating: true,
    editingSnippet: null,
  }),

  openEditPanel: (snippet) => set({
    isEditPanelOpen: true,
    isCreating: false,
    editingSnippet: { ...snippet },
  }),

  closeEditPanel: () => set({
    isEditPanelOpen: false,
    isCreating: false,
    editingSnippet: null,
  }),

  startExport: () => {
    set({ isExporting: true, exportProgress: 0 });
    const startTime = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      set({ exportProgress: progress });
      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        const state = get();
        const categoryId = state.selectedCategoryId;
        let exportSnippets = state.snippets;
        if (categoryId) {
          const descendantIds = getCategoryDescendantIds(state.categories, categoryId);
          exportSnippets = exportSnippets.filter(s =>
            descendantIds.includes(s.categoryId ?? '')
          );
        }
        const exportData = exportSnippets.map(s => ({
          title: s.title,
          content: s.content,
          tags: s.tags,
          createdAt: new Date(s.createdAt).toISOString(),
        }));
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'snippets-export.json';
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => {
          set({ isExporting: false, exportProgress: 0 });
        }, 300);
      }
    };
    requestAnimationFrame(animate);
  },
}));

export function getFilteredSnippets(): Snippet[] {
  const state = useStore.getState();
  const { snippets, selectedCategoryId, selectedTags, searchQuery, sortOrder, categories } = state;

  let filtered = [...snippets];

  if (selectedCategoryId) {
    const descendantIds = getCategoryDescendantIds(categories, selectedCategoryId);
    filtered = filtered.filter(s => descendantIds.includes(s.categoryId ?? ''));
  }

  if (selectedTags.length > 0) {
    filtered = filtered.filter(s =>
      selectedTags.some(tag => s.tags.includes(tag))
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }

  switch (sortOrder) {
    case 'createdAt':
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'updatedAt':
      filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      break;
    case 'alphabetical':
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
      break;
  }

  return filtered;
}

export function getAllTags(): string[] {
  const snippets = useStore.getState().snippets;
  const tagSet = new Set<string>();
  snippets.forEach(s => s.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getVisibleCategories(): Category[] {
  const { categories } = useStore.getState();
  const visible: Category[] = [];
  const expandedIds = new Set(
    categories.filter(c => c.isExpanded).map(c => c.id)
  );

  function walk(parentId: string | null) {
    const children = categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    for (const child of children) {
      visible.push(child);
      if (child.isExpanded) {
        walk(child.id);
      }
    }
  }

  walk(null);
  return visible;
}
