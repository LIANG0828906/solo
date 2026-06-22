import { create } from 'zustand';
import { uuidV4 } from '@/utils/helpers';
import { saveToStorage, loadFromStorage } from '@/utils/helpers';

export type IssueStatus = 'pending' | 'in-progress' | 'completed';
export type IssueTag = 'Bug' | '增强' | '文档' | '优化' | '其他';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  tags: IssueTag[];
  status: IssueStatus;
  createdAt: string;
  comments: Comment[];
  isDuplicate: boolean;
}

export interface SimilarIssueResult {
  issue: Issue;
  similarity: number;
}

export interface SuggestedTagResult {
  tag: IssueTag;
  confidence: number;
}

const STORAGE_KEY = 'issue-manager-data';

function generateSeedData(): Issue[] {
  const seeds: Array<{ title: string; description: string; tags: IssueTag[]; status: IssueStatus }> = [
    { title: '登录页面在Safari浏览器崩溃', description: '使用Safari 16.4版本访问登录页面时，点击登录按钮后浏览器直接崩溃。控制台显示WebAssembly相关错误信息。需要尽快修复以支持Safari用户。', tags: ['Bug'], status: 'pending' },
    { title: '添加暗色模式支持', description: '增强用户体验，添加暗色模式功能。应支持系统偏好自动切换，同时提供手动切换选项。需覆盖所有页面和组件。', tags: ['增强'], status: 'in-progress' },
    { title: 'API文档缺少认证说明', description: '当前API文档中没有关于OAuth2认证流程的说明，新开发者无法快速上手。需要补充完整的认证步骤和示例代码。', tags: ['文档'], status: 'pending' },
    { title: '首页加载速度优化', description: '首页加载时间超过5秒，需要优化资源加载顺序，启用懒加载，减少首屏渲染时间到2秒以内。当前Lighthouse评分仅45分。', tags: ['优化'], status: 'in-progress' },
    { title: '表单验证逻辑错误', description: '注册表单中邮箱验证正则表达式有误，导致部分合法邮箱被拒绝。例如user+tag@example.com格式无法通过验证。', tags: ['Bug'], status: 'pending' },
    { title: '增加批量导出CSV功能', description: '用户需要将数据列表导出为CSV文件。增强功能应支持自定义列选择、日期范围筛选、以及大数据量的分批导出。', tags: ['增强'], status: 'pending' },
    { title: '组件使用示例补充', description: '部分UI组件缺少使用示例，特别是表格组件和图表组件。需要添加交互式代码示例和属性说明。', tags: ['文档'], status: 'completed' },
    { title: '列表渲染性能优化', description: '当列表数据超过500条时出现明显卡顿。需要引入虚拟滚动技术，优化DOM节点数量，确保1000条数据仍流畅。', tags: ['优化'], status: 'pending' },
    { title: '移动端适配问题', description: '在iPhone 14 Pro上，导航菜单展开后会遮挡主要内容区域。下拉选择器在小屏幕上无法正常滚动。', tags: ['Bug'], status: 'in-progress' },
    { title: '支持多语言国际化', description: '增强应用的多语言支持，目前仅支持中文和英文。需添加日语、韩语支持，并优化翻译工作流。', tags: ['增强'], status: 'pending' },
    { title: '部署流程文档更新', description: '当前部署文档还停留在v1版本，需要更新到v3版本的Docker部署流程，包括环境变量配置和CI/CD管道说明。', tags: ['文档'], status: 'pending' },
    { title: '图片压缩优化', description: '用户上传的图片未经过压缩直接存储，导致存储空间快速增长。需要添加自动压缩功能，保持画质的同时减少50%体积。', tags: ['优化'], status: 'completed' },
    { title: '搜索功能在输入特殊字符时崩溃', description: '当搜索框输入特殊正则字符如*、+、?时，搜索功能会抛出异常导致页面白屏。需要对输入进行转义处理。', tags: ['Bug'], status: 'pending' },
    { title: '添加数据可视化仪表盘', description: '增强管理后台功能，添加数据可视化仪表盘。包含用户增长趋势、活跃度统计、收入分析等图表。', tags: ['增强'], status: 'in-progress' },
    { title: 'FAQ页面内容过时', description: 'FAQ页面中多个问题的答案已经不适用于当前版本，需要全面审查并更新。部分截图也已过时。', tags: ['文档'], status: 'pending' },
    { title: '数据库查询性能优化', description: '用户列表页面的数据库查询耗时超过3秒。需要添加索引、优化查询语句、引入查询缓存机制。', tags: ['优化'], status: 'pending' },
    { title: '文件上传进度条不显示', description: '大文件上传时进度条始终显示0%，上传完成后直接跳转到100%。用户无法判断上传是否在进行中。', tags: ['Bug'], status: 'pending' },
    { title: '新增快捷键支持', description: '增强操作效率，添加常用操作的快捷键支持，如Ctrl+N新建、Ctrl+S保存、Ctrl+K搜索等。需支持自定义快捷键。', tags: ['增强'], status: 'pending' },
    { title: '变更日志文档规范', description: '目前没有统一的变更日志格式，需要建立CHANGELOG.md规范，包括版本号、日期、变更类型和描述模板。', tags: ['文档'], status: 'completed' },
    { title: '内存泄漏问题优化', description: '长时间使用后页面内存占用持续增长，从初始200MB增长到2GB以上。需要排查未清理的定时器和事件监听器。', tags: ['优化'], status: 'in-progress' },
    { title: '登录页面在Chrome浏览器崩溃', description: '使用Chrome 118版本访问登录页面时，点击登录按钮后浏览器直接崩溃。控制台显示WebAssembly相关错误。', tags: ['Bug'], status: 'pending' },
    { title: '表单输入验证异常', description: '注册表单中邮箱验证正则有误，部分合法邮箱被拒绝。与之前的验证逻辑错误类似，但影响范围更大。', tags: ['Bug'], status: 'pending' },
  ];

  return seeds.map((s, i) => ({
    id: uuidV4(),
    title: s.title,
    description: s.description,
    tags: s.tags,
    status: s.status,
    createdAt: new Date(Date.now() - i * 3600000 * (1 + Math.random() * 5)).toISOString(),
    comments: i % 3 === 0 ? [{
      id: uuidV4(),
      author: '维护者',
      content: '已收到，正在排查中。',
      createdAt: new Date(Date.now() - i * 1800000).toISOString(),
    }] : [],
    isDuplicate: false,
  }));
}

interface IssueStore {
  issues: Issue[];
  selectedIssueIds: Set<string>;
  searchQuery: string;
  statusFilter: IssueStatus | 'all';
  tagFilter: IssueTag | 'all';
  isLoading: boolean;
  toastMessage: string | null;
  similarIssuesMap: Record<string, SimilarIssueResult[]>;
  suggestedTagsMap: Record<string, SuggestedTagResult[]>;

  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'comments' | 'isDuplicate'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  setSimilarIssues: (id: string, similar: SimilarIssueResult[]) => void;
  setSuggestedTags: (id: string, tags: SuggestedTagResult[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: IssueStatus | 'all') => void;
  setTagFilter: (filter: IssueTag | 'all') => void;
  setIsLoading: (loading: boolean) => void;
  showToast: (message: string) => void;
  addComment: (issueId: string, content: string) => void;
  filteredIssues: () => Issue[];
  initFromStorage: () => void;
}

const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  selectedIssueIds: new Set<string>(),
  searchQuery: '',
  statusFilter: 'all',
  tagFilter: 'all',
  isLoading: true,
  toastMessage: null,
  similarIssuesMap: {},
  suggestedTagsMap: {},

  initFromStorage: () => {
    const stored = loadFromStorage<Issue[]>(STORAGE_KEY);
    const issues = stored && stored.length > 0 ? stored : generateSeedData();
    set({ issues, isLoading: false });
  },

  addIssue: (issue) => {
    const newIssue: Issue = {
      ...issue,
      id: uuidV4(),
      createdAt: new Date().toISOString(),
      comments: [],
      isDuplicate: false,
    };
    const issues = [newIssue, ...get().issues];
    set({ issues });
    saveToStorage(STORAGE_KEY, issues);
  },

  updateIssue: (id, updates) => {
    const issues = get().issues.map((i) => (i.id === id ? { ...i, ...updates } : i));
    set({ issues });
    saveToStorage(STORAGE_KEY, issues);
  },

  deleteIssue: (id) => {
    const issues = get().issues.filter((i) => i.id !== id);
    set({ issues });
    saveToStorage(STORAGE_KEY, issues);
  },

  setSimilarIssues: (id, similar) => {
    set({ similarIssuesMap: { ...get().similarIssuesMap, [id]: similar } });
  },

  setSuggestedTags: (id, tags) => {
    set({ suggestedTagsMap: { ...get().suggestedTagsMap, [id]: tags } });
  },

  toggleSelect: (id) => {
    const next = new Set(get().selectedIssueIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIssueIds: next });
  },

  clearSelection: () => {
    set({ selectedIssueIds: new Set<string>() });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setTagFilter: (filter) => set({ tagFilter: filter }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },

  addComment: (issueId, content) => {
    const issues = get().issues.map((i) => {
      if (i.id !== issueId) return i;
      return {
        ...i,
        comments: [
          ...i.comments,
          { id: uuidV4(), author: '当前用户', content, createdAt: new Date().toISOString() },
        ],
      };
    });
    set({ issues });
    saveToStorage(STORAGE_KEY, issues);
  },

  filteredIssues: () => {
    const { issues, searchQuery, statusFilter, tagFilter } = get();
    return issues.filter((issue) => {
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      const matchesTag = tagFilter === 'all' || issue.tags.includes(tagFilter as IssueTag);
      return matchesSearch && matchesStatus && matchesTag;
    });
  },
}));

export { useIssueStore };
