import { Repo, Issue, PullRequest, LabelName, LABEL_COLORS, PRStatus, IssueLabel } from '../types';

const REPO_COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];

const LABEL_POOL: LabelName[] = ['bug', 'enhancement', 'documentation', 'help wanted'];

const AUTHORS = ['alice-dev', 'bob-coder', 'charlie-engineer', 'diana-maintainer', 'ethan-contributor'];

const ISSUE_TITLES = [
  '登录页面在Safari浏览器下样式错乱',
  '首页加载速度优化建议',
  '用户资料页缺少头像上传功能',
  '表格组件的滚动条在暗色主题下不可见',
  '国际化：新增法语支持',
  'REST API文档示例代码过时',
  '移动端导航菜单点击无反馈',
  '搜索框支持拼音模糊匹配',
  '路由懒加载导致的首屏闪烁问题',
  '数据导出CSV格式编码异常',
  '组件库：新增时间范围选择器',
  '性能：长列表虚拟滚动实现',
  '全局错误边界未捕获异步异常',
  '权限控制：新增访客角色',
  '通知中心支持消息分组',
  '图表组件X轴标签文字拥挤',
  '深色主题切换时过渡动画卡顿',
  'WebSocket断线重连机制优化',
  '批量操作的确认对话框文案优化',
  '富文本编辑器图片上传大小限制',
  '键盘快捷键与浏览器默认冲突',
  '历史数据归档清理策略',
];

const PR_TITLES = [
  '修复用户信息修改后不刷新的bug',
  '优化数据库查询索引',
  '新增订单导出Excel功能',
  '重构用户模块状态管理',
  '升级React至18版本',
  '修复移动端适配问题',
  '完善单元测试覆盖',
  '添加E2E测试用例',
  '重构API层错误处理',
  '新增暗黑主题配色方案',
  '优化首页首屏加载速度',
  '修复国际化文案缺失问题',
  '新增OAuth2第三方登录',
  '优化Webpack构建配置',
  '修复内存泄漏问题',
  '新增WebPush推送通知',
  '重构表单校验逻辑',
  '添加请求防重放机制',
  '优化图片懒加载策略',
  '修复日期选择器时区问题',
];

const DESCRIPTIONS = [
  `## 问题描述\n\n在 **Safari 17.x** 版本中登录页面的输入框边框样式显示异常，圆角被裁切。\n\n## 复现步骤\n\n1. 打开 Safari 访问登录页\n2. 聚焦邮箱输入框\n3. 观察边框显示\n\n## 预期行为\n\n边框应保持 4px 圆角正常显示。\n\n## 环境信息\n\n- macOS 14.2\n- Safari 17.2`,
  `## 优化方案\n\n\`\`\`javascript\n// 建议启用 React.lazy 进行代码分割\nconst Dashboard = lazy(() => import('./pages/Dashboard'));\n\`\`\`\n\n同时考虑将首页非首屏组件延迟挂载。`,
  `## 功能需求\n\n- 支持拖拽上传图片\n- 支持裁剪为正方形头像\n- 预览调整后效果\n- 大小限制 2MB 以内\n\n## 参考实现\n\n可使用 **react-image-crop** 库实现裁剪功能。`,
  `## 建议\n\n新增基于 IntersectionObserver 的虚拟滚动组件，当列表超过 100 条时自动启用，提升滚动性能。\n\n\`\`\`tsx\ninterface VirtualListProps<T> {\n  items: T[];\n  itemHeight: number;\n  renderItem: (item: T) => ReactNode;\n}\n\`\`\``,
];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seedRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(rand() * days));
  d.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60), 0, 0);
  return d.toISOString();
}

function makeLabels(count: number): IssueLabel[] {
  const shuffled = [...LABEL_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count).map((name) => ({ name, color: LABEL_COLORS[name] }));
}

export function createInitialRepos(): Repo[] {
  const raw = [
    { owner: 'facebook', name: 'react' },
    { owner: 'vuejs', name: 'core' },
    { owner: 'vitejs', name: 'vite' },
  ];
  return raw.map((r, i) => ({
    id: `repo-${i + 1}`,
    owner: r.owner,
    name: r.name,
    fullName: `${r.owner}/${r.name}`,
    openIssuesCount: 0,
    color: REPO_COLORS[i % REPO_COLORS.length],
  }));
}

export function createInitialIssues(repos: Repo[]): Issue[] {
  const issues: Issue[] = [];
  let issueNumber = 100;
  repos.forEach((repo) => {
    const count = 8 + Math.floor(rand() * 6);
    for (let i = 0; i < count; i++) {
      issueNumber++;
      issues.push({
        id: `issue-${repo.id}-${issueNumber}`,
        repoId: repo.id,
        number: issueNumber,
        title: ISSUE_TITLES[(i * 3 + repos.indexOf(repo)) % ISSUE_TITLES.length],
        description: DESCRIPTIONS[i % DESCRIPTIONS.length],
        createdAt: daysAgo(30),
        labels: makeLabels(1 + Math.floor(rand() * 3)),
        commentsCount: Math.floor(rand() * 25),
        isOpen: rand() > 0.15,
      });
    }
  });
  repos.forEach((repo) => {
    repo.openIssuesCount = issues.filter((i) => i.repoId === repo.id && i.isOpen).length;
  });
  return issues;
}

export function createInitialPRs(repos: Repo[]): PullRequest[] {
  const prs: PullRequest[] = [];
  let prNumber = 500;
  const statuses: PRStatus[] = ['unreviewed', 'changes_requested', 'ready_to_merge', 'merged'];
  repos.forEach((repo) => {
    const count = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      prNumber++;
      const status = statuses[Math.floor(rand() * statuses.length)];
      const createdAt = daysAgo(14);
      const mergedAt = status === 'merged' ? daysAgo(7) : undefined;
      prs.push({
        id: `pr-${repo.id}-${prNumber}`,
        repoId: repo.id,
        number: prNumber,
        title: PR_TITLES[(i * 2 + repos.indexOf(repo)) % PR_TITLES.length],
        author: pick(AUTHORS),
        status,
        createdAt,
        mergedAt,
        linesAdded: 50 + Math.floor(rand() * 151),
        linesDeleted: Math.floor(rand() * 80),
      });
    }
  });
  return prs;
}
