import { v4 as uuidv4 } from 'uuid';
import type { BoardState, Card, Column, Label, Subtask, Comment, Priority } from './types';

const labels: Label[] = [
  { id: 'label-1', name: '前端', color: '#6C63FF' },
  { id: 'label-2', name: '后端', color: '#00D9FF' },
  { id: 'label-3', name: '设计', color: '#FF6B9D' },
  { id: 'label-4', name: '测试', color: '#4ADE80' },
  { id: 'label-5', name: '文档', color: '#FBBF24' },
];

const createSubtask = (title: string, completed: boolean = false): Subtask => ({
  id: uuidv4(),
  title,
  completed,
});

const createComment = (author: string, content: string, daysAgo: number = 0): Comment => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: uuidv4(),
    author,
    content,
    createdAt: date,
  };
};

const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const initialColumns: Column[] = [
  { id: 'col-todo', title: '待办', cardIds: [] },
  { id: 'col-inprogress', title: '进行中', cardIds: [] },
  { id: 'col-review', title: '审查', cardIds: [] },
  { id: 'col-done', title: '已完成', cardIds: [] },
];

const createCard = (
  columnId: string,
  title: string,
  description: string,
  priority: Priority,
  labelIds: string[],
  dueDateDays: number | null,
  subtasks: Subtask[] = [],
  comments: Comment[] = []
): Card => ({
  id: uuidv4(),
  title,
  description,
  priority,
  labels: labelIds,
  dueDate: dueDateDays !== null ? addDays(dueDateDays) : null,
  subtasks,
  comments,
  columnId,
});

export const createInitialBoard = (): BoardState => {
  const cards: Record<string, Card> = {};
  const columns = [...initialColumns];

  const todoCards = [
    createCard(
      'col-todo',
      '设计用户头像组件',
      '设计一个支持首字母和图片两种模式的用户头像组件，需要支持不同尺寸和状态。',
      'medium',
      ['label-3'],
      7,
      [
        createSubtask('设计头像样式'),
        createSubtask('添加首字母生成逻辑'),
        createSubtask('支持图片加载失败回退'),
      ],
      [createComment('张设计', '这个组件需要考虑各种尺寸', 2)]
    ),
    createCard(
      'col-todo',
      '编写API文档',
      '为用户模块的REST API编写详细文档，包括请求参数、响应格式和错误码。',
      'low',
      ['label-5'],
      14,
      [createSubtask('用户注册接口'), createSubtask('用户登录接口')],
      []
    ),
    createCard(
      'col-todo',
      '优化数据库查询性能',
      '分析慢查询日志，优化主要业务表的索引设计。',
      'high',
      ['label-2'],
      5,
      [createSubtask('分析慢查询日志'), createSubtask('优化索引设计'), createSubtask('压测验证')],
      [createComment('李后端', '需要先拿到DBA权限', 1)]
    ),
  ];

  const inProgressCards = [
    createCard(
      'col-inprogress',
      '实现登录页面',
      '开发用户登录页面，包含邮箱密码登录、忘记密码和注册入口。',
      'high',
      ['label-1'],
      2,
      [
        createSubtask('页面布局', true),
        createSubtask('表单验证', true),
        createSubtask('对接登录API'),
        createSubtask('错误提示处理'),
      ],
      [
        createComment('王前端', '表单验证用了react-hook-form', 1),
        createComment('赵产品', '记得加记住密码功能', 0),
      ]
    ),
    createCard(
      'col-inprogress',
      '实现拖拽排序功能',
      '使用react-beautiful-dnd实现任务卡片的拖拽排序。',
      'medium',
      ['label-1'],
      4,
      [createSubtask('安装依赖'), createSubtask('实现列内排序'), createSubtask('实现跨列拖拽')],
      []
    ),
  ];

  const reviewCards = [
    createCard(
      'col-review',
      '用户列表页面',
      '用户管理模块的列表页面，支持搜索、筛选和分页。',
      'medium',
      ['label-1', 'label-2'],
      1,
      [
        createSubtask('列表展示', true),
        createSubtask('搜索功能', true),
        createSubtask('分页组件', true),
        createSubtask('筛选条件', true),
      ],
      [createComment('钱测试', '基本功能都测过了，准备提测', 0)]
    ),
  ];

  const doneCards = [
    createCard(
      'col-done',
      '项目环境搭建',
      '初始化React + TypeScript项目，配置ESLint和Prettier。',
      'high',
      ['label-1'],
      null,
      [createSubtask('初始化项目', true), createSubtask('配置ESLint', true), createSubtask('配置Prettier', true)],
      [createComment('王前端', '已完成，大家拉一下代码', 5)]
    ),
    createCard(
      'col-done',
      '需求评审会议',
      '召开需求评审会议，确认第一期迭代需求范围。',
      'medium',
      ['label-5'],
      null,
      [createSubtask('准备需求文档', true), createSubtask('召开评审会', true), createSubtask('整理会议纪要', true)],
      []
    ),
  ];

  const allCards = [...todoCards, ...inProgressCards, ...reviewCards, ...doneCards];
  
  allCards.forEach(card => {
    cards[card.id] = card;
  });

  columns[0].cardIds = todoCards.map(c => c.id);
  columns[1].cardIds = inProgressCards.map(c => c.id);
  columns[2].cardIds = reviewCards.map(c => c.id);
  columns[3].cardIds = doneCards.map(c => c.id);

  return {
    columns,
    cards,
    labels,
    projectName: '数字看板应用',
    projectDescription: '团队项目冲刺看板 - 可视化工作进展，提升协作效率',
  };
};

export const createEmptyCard = (columnId: string): Omit<Card, 'id'> => ({
  title: '',
  description: '',
  priority: 'medium' as Priority,
  labels: [],
  dueDate: null,
  subtasks: [],
  comments: [],
  columnId,
});
