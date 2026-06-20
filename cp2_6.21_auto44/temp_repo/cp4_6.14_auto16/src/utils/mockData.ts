import type { TeamMember, Task, HeatmapCell, ActivityType } from './types';

export const MOCK_MEMBERS: TeamMember[] = [
  { id: 'm-1', name: '张明', avatar: '张', color: '#6366f1' },
  { id: 'm-2', name: '李华', avatar: '李', color: '#ec4899' },
  { id: 'm-3', name: '王强', avatar: '王', color: '#14b8a6' },
  { id: 'm-4', name: '赵敏', avatar: '赵', color: '#f59e0b' },
  { id: 'm-5', name: '陈晨', avatar: '陈', color: '#8b5cf6' },
  { id: 'm-6', name: '刘洋', avatar: '刘', color: '#06b6d4' },
];

const today = new Date();
const formatDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const MOCK_TASKS: Task[] = [
  { id: 't-1', title: '完成首页UI设计稿', description: '设计并输出首页的高保真设计稿，包含响应式布局', assigneeId: 'm-1', priority: 'urgent', estimatedHours: 8, status: 'done', dueDate: formatDate(-2), createdAt: formatDate(-7), updatedAt: formatDate(-2), order: 0 },
  { id: 't-2', title: '用户登录模块开发', description: '实现JWT认证、密码加密、第三方登录接入', assigneeId: 'm-2', priority: 'high', estimatedHours: 12, status: 'done', dueDate: formatDate(-1), createdAt: formatDate(-6), updatedAt: formatDate(-1), order: 1 },
  { id: 't-3', title: '数据库架构设计', description: '设计核心业务表结构，建立索引优化方案', assigneeId: 'm-3', priority: 'high', estimatedHours: 10, status: 'done', dueDate: formatDate(0), createdAt: formatDate(-5), updatedAt: formatDate(0), order: 0 },
  { id: 't-4', title: '看板拖拽功能开发', description: '实现多泳道拖拽排序，状态自动更新', assigneeId: 'm-2', priority: 'urgent', estimatedHours: 16, status: 'review', dueDate: formatDate(1), createdAt: formatDate(-4), updatedAt: formatDate(0), order: 0 },
  { id: 't-5', title: 'API接口文档编写', description: '使用Swagger编写完整API文档', assigneeId: 'm-4', priority: 'medium', estimatedHours: 6, status: 'review', dueDate: formatDate(2), createdAt: formatDate(-3), updatedAt: formatDate(-1), order: 1 },
  { id: 't-6', title: '热力图组件开发', description: '实现7x24团队活动热力图，支持hover提示', assigneeId: 'm-5', priority: 'medium', estimatedHours: 8, status: 'in-progress', dueDate: formatDate(3), createdAt: formatDate(-2), updatedAt: formatDate(0), order: 0 },
  { id: 't-7', title: '负载均衡算法优化', description: '优化任务分配算法，考虑优先级权重', assigneeId: 'm-3', priority: 'high', estimatedHours: 10, status: 'in-progress', dueDate: formatDate(2), createdAt: formatDate(-1), updatedAt: formatDate(0), order: 1 },
  { id: 't-8', title: '移动端适配', description: '768px以下响应式布局适配', assigneeId: 'm-1', priority: 'medium', estimatedHours: 8, status: 'in-progress', dueDate: formatDate(4), createdAt: formatDate(-2), updatedAt: formatDate(-1), order: 2 },
  { id: 't-9', title: '任务编辑模态框', description: '毛玻璃背景，表单验证，双击触发', assigneeId: 'm-6', priority: 'low', estimatedHours: 4, status: 'in-progress', dueDate: formatDate(3), createdAt: formatDate(0), updatedAt: formatDate(0), order: 3 },
  { id: 't-10', title: '虚拟滚动性能优化', description: '100+卡片场景30fps保证', assigneeId: 'm-5', priority: 'high', estimatedHours: 12, status: 'todo', dueDate: formatDate(5), createdAt: formatDate(-1), updatedAt: formatDate(-1), order: 0 },
  { id: 't-11', title: '成员管理模块', description: '添加/删除团队成员，角色权限配置', assigneeId: null, priority: 'medium', estimatedHours: 8, status: 'todo', dueDate: formatDate(6), createdAt: formatDate(0), updatedAt: formatDate(0), order: 1 },
  { id: 't-12', title: '数据导出功能', description: '支持CSV/Excel导出任务报表', assigneeId: 'm-4', priority: 'low', estimatedHours: 5, status: 'todo', dueDate: formatDate(7), createdAt: formatDate(0), updatedAt: formatDate(0), order: 2 },
  { id: 't-13', title: '消息通知系统', description: '站内消息+邮件+WebSocket推送', assigneeId: null, priority: 'high', estimatedHours: 14, status: 'todo', dueDate: formatDate(8), createdAt: formatDate(0), updatedAt: formatDate(0), order: 3 },
  { id: 't-14', title: '单元测试覆盖率', description: '核心模块单元测试，覆盖率80%+', assigneeId: 'm-6', priority: 'medium', estimatedHours: 10, status: 'todo', dueDate: formatDate(9), createdAt: formatDate(0), updatedAt: formatDate(0), order: 4 },
  { id: 't-15', title: '暗色主题支持', description: '深浅色主题切换，持久化配置', assigneeId: null, priority: 'low', estimatedHours: 6, status: 'todo', dueDate: formatDate(10), createdAt: formatDate(0), updatedAt: formatDate(0), order: 5 },
  { id: 't-16', title: '代码规范审查', description: 'ESLint+Prettier配置，CI集成', assigneeId: 'm-1', priority: 'low', estimatedHours: 3, status: 'todo', dueDate: formatDate(1), createdAt: formatDate(0), updatedAt: formatDate(0), order: 6 },
  { id: 't-17', title: '项目部署脚本', description: 'Docker+Nginx自动化部署', assigneeId: 'm-3', priority: 'medium', estimatedHours: 7, status: 'review', dueDate: formatDate(1), createdAt: formatDate(-1), updatedAt: formatDate(0), order: 2 },
  { id: 't-18', title: '性能监控接入', description: 'Sentry错误监控+APM性能追踪', assigneeId: null, priority: 'low', estimatedHours: 4, status: 'todo', dueDate: formatDate(5), createdAt: formatDate(0), updatedAt: formatDate(0), order: 7 },
  { id: 't-19', title: '国际化多语言', description: '中文/英文/日文语言包', assigneeId: null, priority: 'low', estimatedHours: 8, status: 'todo', dueDate: formatDate(12), createdAt: formatDate(0), updatedAt: formatDate(0), order: 8 },
  { id: 't-20', title: '需求评审文档', description: '整理需求文档，输出评审PPT', assigneeId: 'm-4', priority: 'urgent', estimatedHours: 4, status: 'done', dueDate: formatDate(-3), createdAt: formatDate(-8), updatedAt: formatDate(-3), order: 2 },
];

const generateHeatmapData = (): HeatmapCell[] => {
  const result: HeatmapCell[] = [];
  const activityTypes: ActivityType[] = ['create', 'update', 'complete', 'comment'];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let count = 0;
      const activities: ActivityType[] = [];
      let peopleCount = 0;
      
      if (hour >= 9 && hour <= 18) {
        const baseChance = day < 5 ? 0.75 : 0.25;
        if (Math.random() < baseChance) {
          count = Math.floor(Math.random() * 8) + 1;
          peopleCount = Math.min(count, Math.floor(Math.random() * 4) + 1);
          const numTypes = Math.min(Math.floor(Math.random() * 3) + 1, count);
          for (let i = 0; i < numTypes; i++) {
            const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            if (!activities.includes(type)) {
              activities.push(type);
            }
          }
        }
      } else if (hour >= 20 && hour <= 23 && day < 5) {
        if (Math.random() < 0.2) {
          count = Math.floor(Math.random() * 3) + 1;
          peopleCount = 1;
          activities.push('update');
        }
      }
      
      result.push({ day, hour, count, activities, peopleCount });
    }
  }
  
  return result;
};

export const MOCK_HEATMAP_DATA: HeatmapCell[] = generateHeatmapData();
