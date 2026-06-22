import { create } from 'zustand';
import { loadFromStorage, saveToStorage, uuidV4 } from '@/utils/helpers';
import { SimilarIssue, TagSuggestion } from '@/api/similarity';

export type IssueTag = 'Bug' | '增强' | '文档' | '优化' | '其他' | '已标记重复';
export type IssueStatus = '待处理' | '进行中' | '已完成';

export interface Comment {
  id: string;
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
  updatedAt: string;
  comments: Comment[];
}

interface IssueState {
  issues: Issue[];
  selectedIssueId: string | null;
  selectedIssueIds: Set<string>;
  similarIssues: SimilarIssue[];
  suggestedTags: TagSuggestion[];
  searchQuery: string;
  statusFilter: '全部' | IssueStatus;
  tagFilter: '全部' | IssueTag;
  loading: boolean;

  addIssue: (data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateIssue: (id: string, data: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  selectIssue: (id: string | null) => void;
  toggleIssueSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  setSimilarIssues: (items: SimilarIssue[]) => void;
  setSuggestedTags: (items: TagSuggestion[]) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: '全部' | IssueStatus) => void;
  setTagFilter: (t: '全部' | IssueTag) => void;
  setLoading: (l: boolean) => void;
  addComment: (issueId: string, content: string) => void;

  batchUpdateStatus: (ids: string[], status: IssueStatus) => void;
  batchAddTag: (ids: string[], tag: IssueTag) => void;
  batchClose: (ids: string[]) => void;

  getFilteredIssues: () => Issue[];
  getSelectedIssues: () => Issue[];
}

const MOCK_ISSUES: Issue[] = [
  {
    id: '1',
    title: '登录页面在Safari浏览器上样式错乱',
    description: '当用户使用Safari 15及以上版本访问登录页面时，输入框和按钮的位置会出现偏移，影响用户体验。尝试调整CSS但没有效果。',
    tags: ['Bug'],
    status: '待处理',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    comments: [],
  },
  {
    id: '2',
    title: '新增用户头像上传功能',
    description: '希望能够支持用户上传自定义头像，支持JPG、PNG格式，最大尺寸2MB。需要提供裁剪和预览功能。',
    tags: ['增强'],
    status: '进行中',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    comments: [
      {
        id: 'c1',
        content: '开始开发这个功能了',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
    ],
  },
  {
    id: '3',
    title: '完善API文档的错误码说明',
    description: '当前API文档缺少详细的错误码说明，用户遇到问题时无法快速定位原因。需要补充所有接口的错误码列表和处理建议。',
    tags: ['文档'],
    status: '待处理',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    comments: [],
  },
  {
    id: '4',
    title: '优化列表页加载性能',
    description: '列表页数据量大时加载速度较慢，建议增加虚拟滚动或分页，减少一次性渲染的DOM节点数量。',
    tags: ['优化'],
    status: '进行中',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    comments: [],
  },
  {
    id: '5',
    title: 'Safari浏览器登录页面样式异常',
    description: '在Safari浏览器中，登录表单的布局出现问题，按钮和输入框不对齐。看起来和之前那个Bug类似。',
    tags: ['其他'],
    status: '待处理',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    comments: [],
  },
  {
    id: '6',
    title: '关于项目架构设计的讨论',
    description: '想和大家讨论一下是否要引入微前端架构，当前项目越来越大，维护起来有些困难。',
    tags: ['其他'],
    status: '待处理',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    comments: [],
  },
];

function generateMockIssues(): Issue[] {
  const result = [...MOCK_ISSUES];
  const samples = [
    { title: '数据导出功能需要支持Excel格式', tag: '增强' as IssueTag, desc: '用户希望能够将报表数据导出为Excel格式，方便进行二次分析和处理。' },
    { title: '首页加载速度慢需要优化', tag: '优化' as IssueTag, desc: '首页首次加载时间超过5秒，严重影响用户体验，需要进行性能优化。' },
    { title: '用户反馈注册流程过于复杂', tag: '增强' as IssueTag, desc: '新用户注册需要填写太多信息，建议简化注册流程，支持第三方登录。' },
    { title: '移动端页面显示错误', tag: 'Bug' as IssueTag, desc: '在iPhone SE等小屏幕设备上，页面布局出现错乱，部分按钮无法点击。' },
    { title: '更新README中的安装说明', tag: '文档' as IssueTag, desc: 'README中的安装步骤已经过时，需要更新为最新的安装指南。' },
  ];

  for (let i = 0; i < 50; i++) {
    const sample = samples[i % samples.length];
    result.push({
      id: `mock-${i + 10}`,
      title: `${sample.title} #${i + 1}`,
      description: sample.desc + ' 这是一个自动生成的示例Issue，用于测试列表渲染性能。',
      tags: [sample.tag],
      status: (['待处理', '进行中', '已完成'] as IssueStatus[])[i % 3],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * (i + 1) * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * (i + 1)).toISOString(),
      comments: [],
    });
  }
  return result;
}

const storedIssues = loadFromStorage<Issue[]>([] as any);
const initialIssues: Issue[] = (storedIssues && Array.isArray(storedIssues) && storedIssues.length > 0) ? storedIssues : generateMockIssues();

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: initialIssues,
  selectedIssueId: null,
  selectedIssueIds: new Set(),
  similarIssues: [],
  suggestedTags: [],
  searchQuery: '',
  statusFilter: '全部',
  tagFilter: '全部',
  loading: false,

  addIssue: (data) => {
    const now = new Date().toISOString();
    const newIssue: Issue = {
      ...data,
      id: uuidV4(),
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    const issues = [...get().issues, newIssue];
    set({ issues });
    saveToStorage(issues);
  },

  updateIssue: (id, data) => {
    const issues = get().issues.map(issue =>
      issue.id === id ? { ...issue, ...data, updatedAt: new Date().toISOString() } : issue
    );
    set({ issues });
    saveToStorage(issues);
  },

  deleteIssue: (id) => {
    const issues = get().issues.filter(issue => issue.id !== id);
    const state = get();
    const selectedIssueId = state.selectedIssueId === id ? null : state.selectedIssueId;
    const selectedIssueIds = new Set(state.selectedIssueIds);
    selectedIssueIds.delete(id);
    set({ issues, selectedIssueId, selectedIssueIds });
    saveToStorage(issues);
  },

  selectIssue: (id) => set({ selectedIssueId: id, similarIssues: [], suggestedTags: [] }),

  toggleIssueSelection: (id) => {
    const set2 = new Set(get().selectedIssueIds);
    if (set2.has(id)) {
      set2.delete(id);
    } else {
      set2.add(id);
    }
    set({ selectedIssueIds: set2 });
  },

  clearSelection: () => set({ selectedIssueIds: new Set() }),

  selectAll: (ids) => set({ selectedIssueIds: new Set(ids) }),

  setSimilarIssues: (items) => set({ similarIssues: items }),

  setSuggestedTags: (items) => set({ suggestedTags: items }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setStatusFilter: (s) => set({ statusFilter: s }),

  setTagFilter: (t) => set({ tagFilter: t }),

  setLoading: (l) => set({ loading: l }),

  addComment: (issueId, content) => {
    const issues = get().issues.map(issue => {
      if (issue.id !== issueId) return issue;
      return {
        ...issue,
        comments: [...issue.comments, {
          id: uuidV4(),
          content,
          createdAt: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      };
    });
    set({ issues });
    saveToStorage(issues);
  },

  batchUpdateStatus: (ids, status) => {
    const issues = get().issues.map(issue =>
      ids.includes(issue.id) ? { ...issue, status, updatedAt: new Date().toISOString() } : issue
    );
    set({ issues, selectedIssueIds: new Set() });
    saveToStorage(issues);
  },

  batchAddTag: (ids, tag) => {
    const issues = get().issues.map(issue => {
      if (!ids.includes(issue.id)) return issue;
      const tags = issue.tags.includes(tag) ? issue.tags : [...issue.tags, tag];
      return { ...issue, tags, updatedAt: new Date().toISOString() };
    });
    set({ issues, selectedIssueIds: new Set() });
    saveToStorage(issues);
  },

  batchClose: (ids) => {
    const issues = get().issues.map(issue =>
      ids.includes(issue.id) ? { ...issue, status: '已完成' as IssueStatus, updatedAt: new Date().toISOString() } : issue
    );
    set({ issues, selectedIssueIds: new Set() });
    saveToStorage(issues);
  },

  getFilteredIssues: () => {
    const { issues, searchQuery, statusFilter, tagFilter } = get();
    return issues.filter(issue => {
      if (statusFilter !== '全部' && issue.status !== statusFilter) return false;
      if (tagFilter !== '全部' && !issue.tags.includes(tagFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q);
      }
      return true;
    });
  },

  getSelectedIssues: () => {
    const { issues, selectedIssueIds } = get();
    return issues.filter(i => selectedIssueIds.has(i.id));
  },
}));
