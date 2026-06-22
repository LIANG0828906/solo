import { onMounted, watch } from 'vue';
import { useTimelineStore } from '@/store/timelineStore';
import type { TimelineEvent, SkillCategory } from '@/types';

const STORAGE_KEY = 'timeline_events_v1';

const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    startYear: 2015,
    endYear: 2017,
    position: '前端实习生',
    company: '启明科技',
    description: '参与公司官网重构，负责响应式布局和基础组件开发。使用 jQuery + Bootstrap 完成多个页面模块，协助完成 IE8 兼容性适配工作，期间学习了现代前端工程化流程。',
    skills: [
      { name: 'HTML5', category: 'frontend' as SkillCategory },
      { name: 'CSS3', category: 'frontend' as SkillCategory },
      { name: 'jQuery', category: 'frontend' as SkillCategory },
      { name: 'Bootstrap', category: 'frontend' as SkillCategory },
    ],
  },
  {
    id: 'evt-2',
    startYear: 2017,
    endYear: 2018,
    position: 'UI 设计师',
    company: '创艺工作室',
    description: '负责移动 App 的视觉设计和原型输出，产出高保真设计稿 80+ 张，参与用户研究和可用性测试，推动设计规范建立。',
    skills: [
      { name: 'Figma', category: 'design' as SkillCategory },
      { name: 'Sketch', category: 'design' as SkillCategory },
      { name: 'Photoshop', category: 'design' as SkillCategory },
      { name: '设计系统', category: 'design' as SkillCategory },
    ],
  },
  {
    id: 'evt-3',
    startYear: 2018,
    endYear: 2019,
    position: '初级前端工程师',
    company: '云栖网络',
    description: '从设计转岗开发，全面接手 SaaS 产品前端开发。基于 Vue 2 搭建业务组件库，落地 30+ 通用组件，将开发效率提升 40%。',
    skills: [
      { name: 'Vue 2', category: 'frontend' as SkillCategory },
      { name: 'JavaScript', category: 'frontend' as SkillCategory },
      { name: 'Webpack', category: 'frontend' as SkillCategory },
      { name: 'Sass', category: 'frontend' as SkillCategory },
    ],
  },
  {
    id: 'evt-4',
    startYear: 2019,
    endYear: 2020,
    position: '后端开发工程师',
    company: '极智数据',
    description: '参与数据平台后端服务开发，使用 Node.js 构建 RESTful API，设计 MySQL 数据表结构，完成日处理百万级日志的采集系统。',
    skills: [
      { name: 'Node.js', category: 'backend' as SkillCategory },
      { name: 'Express', category: 'backend' as SkillCategory },
      { name: 'MySQL', category: 'backend' as SkillCategory },
      { name: 'Redis', category: 'backend' as SkillCategory },
    ],
  },
  {
    id: 'evt-5',
    startYear: 2020,
    endYear: 2021,
    position: '全栈工程师',
    company: '创客云',
    description: '负责创业平台全栈开发，独立完成 MVP 版本从 0 到 1。前端使用 React + TypeScript，后端使用 NestJS + PostgreSQL，部署上线后首月获得 5000+ 注册用户。',
    skills: [
      { name: 'React', category: 'frontend' as SkillCategory },
      { name: 'TypeScript', category: 'frontend' as SkillCategory },
      { name: 'NestJS', category: 'backend' as SkillCategory },
      { name: 'PostgreSQL', category: 'backend' as SkillCategory },
      { name: 'Docker', category: 'other' as SkillCategory },
    ],
  },
  {
    id: 'evt-6',
    startYear: 2021,
    endYear: 2022,
    position: '产品经理',
    company: '未来出行',
    description: '从技术转岗产品，负责网约车司机端 App 核心模块。完成 10+ 核心需求的产品设计，推动关键指标提升 25%，协同跨部门完成大版本迭代。',
    skills: [
      { name: '需求分析', category: 'product' as SkillCategory },
      { name: 'Axure', category: 'product' as SkillCategory },
      { name: '数据分析', category: 'product' as SkillCategory },
      { name: '项目管理', category: 'product' as SkillCategory },
    ],
  },
  {
    id: 'evt-7',
    startYear: 2022,
    endYear: 2023,
    position: '高级前端工程师',
    company: '蓝鲸互娱',
    description: '负责游戏社区 Web 端架构升级，主导从 Vue 2 迁移到 Vue 3 + Vite，构建时间从 3 分钟降至 20 秒。设计并实现低代码页面搭建系统。',
    skills: [
      { name: 'Vue 3', category: 'frontend' as SkillCategory },
      { name: 'Vite', category: 'frontend' as SkillCategory },
      { name: 'Pinia', category: 'frontend' as SkillCategory },
      { name: '低代码', category: 'other' as SkillCategory },
    ],
  },
  {
    id: 'evt-8',
    startYear: 2023,
    endYear: 2024,
    position: '高级产品设计师',
    company: '灵动设计',
    description: '主导 B 端设计系统建设，完成 200+ 组件资产沉淀，制定设计 Token 规范，与前端团队协作实现 Design to Code 自动化流程。',
    skills: [
      { name: 'Figma', category: 'design' as SkillCategory },
      { name: '设计系统', category: 'design' as SkillCategory },
      { name: 'Design Token', category: 'design' as SkillCategory },
      { name: 'B 端设计', category: 'design' as SkillCategory },
    ],
  },
  {
    id: 'evt-9',
    startYear: 2024,
    endYear: 2025,
    position: '前端技术专家',
    company: '星海实验室',
    description: '负责 AI 产品前端技术选型和架构设计，带领 8 人团队完成多模态对话系统开发，推动前端工程化和监控体系建设，获得公司技术突破奖。',
    skills: [
      { name: 'Next.js', category: 'frontend' as SkillCategory },
      { name: 'TypeScript', category: 'frontend' as SkillCategory },
      { name: '微前端', category: 'frontend' as SkillCategory },
      { name: '团队管理', category: 'other' as SkillCategory },
      { name: 'AI 应用', category: 'other' as SkillCategory },
    ],
  },
  {
    id: 'evt-10',
    startYear: 2025,
    endYear: 2026,
    position: '技术产品总监',
    company: '数智未来',
    description: '统筹技术与产品双团队，负责公司核心产品线战略规划。推动从 0 到 1 构建开发者生态平台，实现年收入 5000 万突破。',
    skills: [
      { name: '产品战略', category: 'product' as SkillCategory },
      { name: '技术架构', category: 'backend' as SkillCategory },
      { name: '团队建设', category: 'other' as SkillCategory },
      { name: '商业化', category: 'product' as SkillCategory },
    ],
  },
];

export function useTimelineData() {
  const store = useTimelineStore();

  function loadEvents(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TimelineEvent[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          store.setEvents(parsed);
          return;
        }
      }
    } catch (_e) {
      // fallback to sample data
    }
    store.setEvents(JSON.parse(JSON.stringify(SAMPLE_EVENTS)));
    persistEvents();
  }

  function persistEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.events));
    } catch (_e) {
      // ignore storage errors
    }
  }

  function resetToSample(): void {
    store.setEvents(JSON.parse(JSON.stringify(SAMPLE_EVENTS)));
    persistEvents();
  }

  function saveEvent(event: TimelineEvent): void {
    const exists = store.events.some((e) => e.id === event.id);
    if (exists) {
      store.updateEvent(event);
    } else {
      store.addEvent(event);
    }
    persistEvents();
  }

  function deleteEvent(id: string): void {
    store.removeEvent(id);
    persistEvents();
  }

  function generateId(): string {
    return 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  onMounted(() => {
    loadEvents();
  });

  watch(
    () => store.events,
    () => persistEvents(),
    { deep: true },
  );

  return {
    loadEvents,
    persistEvents,
    resetToSample,
    saveEvent,
    deleteEvent,
    generateId,
  };
}
