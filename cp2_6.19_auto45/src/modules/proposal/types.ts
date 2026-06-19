export type TemplateType = 'minimal' | 'business' | 'creative';
export type ProposalStatus = 'sent' | 'viewed' | 'feedback' | 'decided';
export type DecisionResult = 'accepted' | 'rejected' | 'pending';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface ClientAction {
  id: string;
  type: 'view' | 'feedback' | 'decision';
  timestamp: number;
  message?: string;
  decision?: DecisionResult;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  template: TemplateType;
  services: ServiceItem[];
  status: ProposalStatus;
  shareLink: string;
  createdAt: number;
  updatedAt: number;
  actions: ClientAction[];
}

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  minimal: '简约白',
  business: '商务蓝',
  creative: '创意橙',
};

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  sent: '已发送',
  viewed: '已查看',
  feedback: '已反馈',
  decided: '已决策',
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  sent: '#64748b',
  viewed: '#10b981',
  feedback: '#f59e0b',
  decided: '#6366f1',
};

export const TEMPLATE_THEMES: Record<TemplateType, {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  border: string;
  headerFont: string;
  bodyFont: string;
}> = {
  minimal: {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#334155',
    bg: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
  },
  business: {
    primary: '#1d4ed8',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    bg: '#f8fafc',
    text: '#0f172a',
    border: '#bfdbfe',
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
  },
  creative: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    bg: '#fffbeb',
    text: '#431407',
    border: '#fed7aa',
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
  },
};
