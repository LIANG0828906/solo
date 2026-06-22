export type InspirationStatus = '进行中' | '已实现' | '已归档';

export interface Inspiration {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: InspirationStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export const PRESET_TAGS = ['设计', '技术', '商业', '个人'];

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const initialData: Inspiration[] = [
  {
    id: '1',
    title: '暗色主题设计系统',
    content: '建立一套完整的暗色主题设计系统，包含主背景#0F172A、辅助背景#1E293B、强调色#6366F1。所有组件需要统一的间距、圆角和阴影规范，确保视觉一致性。考虑加入毛玻璃效果提升层次感。',
    tags: ['设计', '技术'],
    status: '进行中',
    images: [],
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: '2',
    title: '瀑布流布局优化方案',
    content: '使用CSS Columns实现高性能瀑布流，相比传统的Grid或JavaScript计算方案，性能提升30%以上。需要处理图片加载导致的高度变化问题，可先设置最小高度占位。',
    tags: ['技术'],
    status: '已实现',
    images: [],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: '3',
    title: '创意协作平台商业模式',
    content: '面向小型团队的SaaS产品，免费版支持50条灵感、3人协作。Pro版每人每月9.9元，无限灵感、高级统计、团队管理功能。企业版定制化部署，联系销售。',
    tags: ['商业'],
    status: '进行中',
    images: [],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: '4',
    title: '周末学习计划',
    content: '学习React 18新特性：并发模式、Suspense、自动批处理。实践项目：改造现有应用，引入useTransition优化列表渲染，使用useDeferredValue处理搜索防抖。',
    tags: ['个人', '技术'],
    status: '已归档',
    images: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: '5',
    title: 'Canvas图表性能优化',
    content: '使用原生Canvas绘制折线图和环形图，保证30fps以上帧率。优化策略：离屏Canvas预渲染静态元素、requestAnimationFrame批量重绘、脏矩形区域局部更新。',
    tags: ['技术'],
    status: '进行中',
    images: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: '6',
    title: '极简卡片动效设计',
    content: '卡片悬停时：阴影从4px偏移加深至8px偏移，同时上浮3px，使用0.3s cubic-bezier(0.4, 0, 0.2, 1)过渡曲线。避免过度动画，保持优雅克制的交互反馈。',
    tags: ['设计'],
    status: '已实现',
    images: [],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: '7',
    title: '移动端汉堡菜单交互',
    content: '768px断点触发导航栏折叠，汉堡按钮点击后侧边栏从左侧滑入，覆盖80%屏幕宽度。菜单背景采用毛玻璃效果，菜单项带展开过渡动画。',
    tags: ['设计', '技术'],
    status: '已实现',
    images: [],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: '8',
    title: '用户增长获客策略',
    content: '第一阶段：Product Hunt上线，目标500 upvotes。第二阶段：技术博客SEO优化，覆盖关键词如"灵感管理工具"、"创意收集app"。第三阶段：KOL合作，设计圈和技术圈各找5位博主测评。',
    tags: ['商业'],
    status: '已归档',
    images: [],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: '9',
    title: '旅行灵感收集',
    content: '下一次旅行目的地：冰岛。必去景点：蓝湖温泉、黄金圈、冰川徒步。需要准备的装备：防水冲锋衣、登山鞋、无人机。预算约2万元，计划明年9月出行。',
    tags: ['个人'],
    status: '进行中',
    images: [],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: '10',
    title: '读书清单2026',
    content: '今年计划读完20本书，已读8本。待读清单：《设计心理学》《代码整洁之道》《从0到1》《思考，快与慢》《原则》。每周读一本书，周末写读书笔记。',
    tags: ['个人'],
    status: '进行中',
    images: [],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: '11',
    title: '搜索防抖实现',
    content: '搜索输入框使用150ms延迟的debounce函数，减少API调用频率。用户停止输入150ms后才触发实际搜索请求。同时实现请求取消机制，避免旧请求覆盖新结果。',
    tags: ['技术'],
    status: '已实现',
    images: [],
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: '12',
    title: '品牌色彩心理学',
    content: '选择靛蓝#6366F1作为主色调：传达创造力、智慧和专业感。搭配紫色#8B5CF6强调艺术气息。避免过多颜色，整体保持克制统一，符合创意工作者的审美偏好。',
    tags: ['设计', '商业'],
    status: '已实现',
    images: [],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

let inspirations: Inspiration[] = [...initialData];

export const getData = (): Inspiration[] => inspirations;

export const setData = (data: Inspiration[]): void => {
  inspirations = data;
};

export const findById = (id: string): Inspiration | undefined => {
  return inspirations.find((i) => i.id === id);
};
