export type RiskLevel = 'high' | 'medium' | 'low';
export type RiskStatus = 'pending' | 'in-progress' | 'closed';
export type ViewMode = 'board' | 'waterfall' | 'gantt';

export interface Risk {
  id: string;
  title: string;
  level: RiskLevel;
  status: RiskStatus;
  impact: string;
  owner: string;
  createdAt: string;
  expectedCloseDate: string;
}

export interface RiskStore {
  risks: Risk[];
  viewMode: ViewMode;
  filter: {
    level?: RiskLevel;
    status?: RiskStatus;
  };
  addRisk: (risk: Omit<Risk, 'id' | 'createdAt'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: Partial<RiskStore['filter']>) => void;
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  high: '#e94560',
  medium: '#ffd700',
  low: '#ffa500',
};

export const STATUS_LABELS: Record<RiskStatus, string> = {
  pending: '待处理',
  'in-progress': '处理中',
  closed: '已关闭',
};

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  board: '状态看板',
  waterfall: '等级瀑布流',
  gantt: '时间甘特图',
};
