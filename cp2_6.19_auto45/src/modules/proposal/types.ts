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
  business: '商务灰金',
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
  previewRadius: string;
  sectionRadius: string;
  cardShadow: string;
  titleWeight: number;
  priceWeight: number;
  priceDecor: 'underline' | 'shadow' | 'none';
  badgeRadius: string;
  tableBorderRadius: string;
  cellVerticalPad: string;
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
    previewRadius: '0px 0px 0px 0px',
    sectionRadius: '0px',
    cardShadow: 'none',
    titleWeight: 700,
    priceWeight: 700,
    priceDecor: 'none',
    badgeRadius: '4px',
    tableBorderRadius: '0px',
    cellVerticalPad: '12px',
  },
  business: {
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#d4a24c',
    accentAlt: '#b88634',
    bg: '#fafbfc',
    bgAlt: '#eef1f5',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#cfd6e2',
    headerFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    headerBg: '#1e293b',
    footerBg: '#1e293b',
    tableHeadBg: '#1e293b',
    tableStripe: 'rgba(212, 162, 76, 0.045)',
    dividerStyle: 'double',
    previewRadius: '0px 0px 0px 0px',
    sectionRadius: '0px',
    cardShadow: 'none',
    titleWeight: 800,
    priceWeight: 800,
    priceDecor: 'shadow',
    badgeRadius: '0px',
    tableBorderRadius: '0px',
    cellVerticalPad: '13px',
  },
  creative: {
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#ea580c',
    accentAlt: '#c2410c',
    bg: '#fff7ed',
    bgAlt: '#ffedd5',
    text: '#431407',
    textMuted: '#9a3412',
    border: '#fed7aa',
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    headerBg: 'linear-gradient(135deg, #f97316 0%, #fb923c 45%, #fbbf24 100%)',
    footerBg: '#fff7ed',
    tableHeadBg: '#ffedd5',
    tableStripe: 'rgba(249, 115, 22, 0.06)',
    dividerStyle: 'dotted',
    previewRadius: '28px',
    sectionRadius: '20px',
    cardShadow: '0 10px 32px rgba(249, 115, 22, 0.18)',
    titleWeight: 700,
    priceWeight: 900,
    priceDecor: 'underline',
    badgeRadius: '999px',
    tableBorderRadius: '16px',
    cellVerticalPad: '14px',
  },
};
