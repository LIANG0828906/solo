export type TemplateType = 'minimal' | 'business' | 'dark';
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
  dark: '深色专业',
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
  accentAlt: string;
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  border: string;
  headerFont: string;
  bodyFont: string;
  headerBg: string;
  footerBg: string;
  tableHeadBg: string;
  tableStripe: string;
  dividerStyle: string;
}> = {
  minimal: {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#334155',
    accentAlt: '#64748b',
    bg: '#ffffff',
    bgAlt: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    headerBg: '#ffffff',
    footerBg: '#f8fafc',
    tableHeadBg: '#f1f5f9',
    tableStripe: 'rgba(241,245,249,0.5)',
    dividerStyle: 'solid',
  },
  business: {
    primary: '#0c2d57',
    secondary: '#1a4a8a',
    accent: '#c9a84c',
    accentAlt: '#e0c878',
    bg: '#f0f4f8',
    bgAlt: '#e8eef5',
    text: '#0c2d57',
    textMuted: '#4a6d9b',
    border: '#bfdbfe',
    headerFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    headerBg: 'linear-gradient(135deg, #0c2d57 0%, #1a4a8a 100%)',
    footerBg: 'linear-gradient(135deg, #0c2d57 0%, #1a4a8a 100%)',
    tableHeadBg: '#0c2d57',
    tableStripe: 'rgba(12,45,87,0.04)',
    dividerStyle: 'solid',
  },
  dark: {
    primary: '#2dd4bf',
    secondary: '#5eead4',
    accent: '#14b8a6',
    accentAlt: '#0d9488',
    bg: '#1e1e2e',
    bgAlt: '#262637',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    border: '#334155',
    headerFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    headerBg: 'linear-gradient(135deg, #1a1a2e 0%, #262637 100%)',
    footerBg: 'linear-gradient(135deg, #1a1a2e 0%, #262637 100%)',
    tableHeadBg: '#262637',
    tableStripe: 'rgba(45,212,191,0.04)',
    dividerStyle: 'dashed',
  },
};
