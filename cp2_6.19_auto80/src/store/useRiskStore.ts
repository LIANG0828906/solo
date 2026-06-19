import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Risk, RiskStore, RiskLevel, ViewMode } from '@/types';

const generateMockData = (): Risk[] => {
  const levels: RiskLevel[] = ['high', 'medium', 'low'];
  const statuses: Risk['status'][] = ['pending', 'in-progress', 'closed'];
  const owners = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
  const titles = [
    '接口响应超时风险',
    '数据库连接池耗尽',
    '第三方依赖版本冲突',
    '需求变更导致进度延误',
    '测试环境不稳定',
    '上线部署脚本不完善',
    '安全漏洞未及时修复',
    '文档缺失导致交接困难',
    '性能指标未达预期',
    '跨团队协作沟通不畅',
    '资源不足影响开发进度',
    '代码评审积压',
    'CI/CD流水线频繁失败',
    '用户反馈问题堆积',
    '技术债务累积',
  ];
  const impacts = [
    '影响核心业务流程',
    '可能导致数据不一致',
    '影响用户体验',
    '增加后续维护成本',
    '存在安全隐患',
    '影响团队交付效率',
  ];

  const today = new Date();
  const risks: Risk[] = [];

  for (let i = 0; i < 50; i++) {
    const createdAt = new Date(today);
    createdAt.setDate(today.getDate() - Math.floor(Math.random() * 30));
    
    const expectedCloseDate = new Date(createdAt);
    expectedCloseDate.setDate(createdAt.getDate() + Math.floor(Math.random() * 20) + 1);

    risks.push({
      id: uuidv4(),
      title: titles[Math.floor(Math.random() * titles.length)] + ` #${i + 1}`,
      level: levels[Math.floor(Math.random() * levels.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      impact: impacts[Math.floor(Math.random() * impacts.length)],
      owner: owners[Math.floor(Math.random() * owners.length)],
      createdAt: createdAt.toISOString().split('T')[0],
      expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
    });
  }

  return risks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const useRiskStore = create<RiskStore>((set) => ({
  risks: generateMockData(),
  viewMode: 'board' as ViewMode,
  filter: {},

  addRisk: (risk) =>
    set((state) => ({
      risks: [
        {
          ...risk,
          id: uuidv4(),
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.risks,
      ],
    })),

  updateRisk: (id, updates) =>
    set((state) => ({
      risks: state.risks.map((risk) =>
        risk.id === id ? { ...risk, ...updates } : risk
      ),
    })),

  deleteRisk: (id) =>
    set((state) => ({
      risks: state.risks.filter((risk) => risk.id !== id),
    })),

  setViewMode: (mode) =>
    set(() => ({
      viewMode: mode,
    })),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),
}));
