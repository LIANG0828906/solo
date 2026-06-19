import { v4 as uuidv4 } from 'uuid';
import type {
  Proposal,
  ServiceItem,
  ClientAction,
  ProposalStatus,
  TemplateType,
} from '@/modules/proposal/types';

const STORAGE_KEY = 'freelanceflow_proposals';

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function readStorage(): Proposal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDefaultProposals();
    const parsed = JSON.parse(raw) as Proposal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(proposals: Proposal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  } catch {
    console.warn('Failed to persist to localStorage');
  }
}

function seedDefaultProposals(): Proposal[] {
  const now = Date.now();
  const seed: Proposal[] = [
    {
      id: uuidv4(),
      title: '企业官网设计与开发',
      clientName: '星辰科技有限公司',
      template: 'business',
      status: 'feedback',
      shareLink: `https://share.freelanceflow.app/${uuidv4().slice(0, 8)}`,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 3600000 * 24,
      services: [
        { id: uuidv4(), name: 'UI/UX 设计', description: '含首页及4个内页的全套设计稿', unitPrice: 8000, quantity: 1 },
        { id: uuidv4(), name: '前端开发', description: '响应式React开发，兼容主流浏览器', unitPrice: 600, quantity: 20 },
        { id: uuidv4(), name: '后端接口对接', description: 'API联调与数据渲染', unitPrice: 500, quantity: 8 },
      ],
      actions: [
        { id: uuidv4(), type: 'view', timestamp: now - 86400000 * 2 },
        { id: uuidv4(), type: 'feedback', timestamp: now - 3600000 * 26, message: '设计风格很好，希望首页的Banner更有科技感，颜色再深蓝一些。' },
      ],
    },
    {
      id: uuidv4(),
      title: '品牌 Logo 与 VI 设计',
      clientName: '橙意咖啡',
      template: 'dark',
      status: 'decided',
      shareLink: `https://share.freelanceflow.app/${uuidv4().slice(0, 8)}`,
      createdAt: now - 86400000 * 12,
      updatedAt: now - 3600000 * 6,
      services: [
        { id: uuidv4(), name: 'Logo 设计', description: '3套原创方案 + 2轮修改', unitPrice: 5000, quantity: 1 },
        { id: uuidv4(), name: '基础 VI 应用', description: '名片、纸杯、菜单、门头', unitPrice: 3000, quantity: 1 },
      ],
      actions: [
        { id: uuidv4(), type: 'view', timestamp: now - 86400000 * 10 },
        { id: uuidv4(), type: 'feedback', timestamp: now - 86400000 * 7, message: '第二套方案不错，把颜色调暖一点。' },
        { id: uuidv4(), type: 'decision', timestamp: now - 3600000 * 6, decision: 'accepted' },
      ],
    },
    {
      id: uuidv4(),
      title: '数据可视化大屏',
      clientName: '博远数据研究院',
      template: 'minimal',
      status: 'sent',
      shareLink: `https://share.freelanceflow.app/${uuidv4().slice(0, 8)}`,
      createdAt: now - 3600000 * 8,
      updatedAt: now - 3600000 * 8,
      services: [
        { id: uuidv4(), name: '大屏整体设计', description: '4K 分辨率适配，ECharts 定制', unitPrice: 12000, quantity: 1 },
        { id: uuidv4(), name: '动效与交互', description: '交互动画与特效处理', unitPrice: 3000, quantity: 2 },
      ],
      actions: [],
    },
  ];
  writeStorage(seed);
  return seed;
}

export async function getProposals(): Promise<Proposal[]> {
  return delay(readStorage().sort((a, b) => b.updatedAt - a.updatedAt));
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  const found = readStorage().find((p) => p.id === id) ?? null;
  return delay(found);
}

export async function createProposal(data: {
  title: string;
  clientName: string;
  template: TemplateType;
  services: ServiceItem[];
}): Promise<Proposal> {
  const now = Date.now();
  const proposal: Proposal = {
    id: uuidv4(),
    title: data.title,
    clientName: data.clientName,
    template: data.template,
    services: data.services,
    status: 'sent',
    shareLink: `https://share.freelanceflow.app/${uuidv4().slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
    actions: [],
  };
  const list = readStorage();
  list.push(proposal);
  writeStorage(list);
  return delay(proposal, 200);
}

export async function updateProposal(
  id: string,
  data: Partial<Pick<Proposal, 'title' | 'clientName' | 'template' | 'services'>>,
): Promise<Proposal | null> {
  const list = readStorage();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return delay(null);
  list[idx] = { ...list[idx], ...data, updatedAt: Date.now() };
  writeStorage(list);
  return delay(list[idx]);
}

export async function deleteProposal(id: string): Promise<boolean> {
  const list = readStorage();
  const next = list.filter((p) => p.id !== id);
  writeStorage(next);
  return delay(next.length !== list.length);
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus,
): Promise<Proposal | null> {
  const list = readStorage();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return delay(null);
  list[idx] = { ...list[idx], status, updatedAt: Date.now() };
  writeStorage(list);
  return delay(list[idx]);
}

export async function addClientAction(
  proposalId: string,
  action: Omit<ClientAction, 'id' | 'timestamp'>,
): Promise<Proposal | null> {
  const list = readStorage();
  const idx = list.findIndex((p) => p.id === proposalId);
  if (idx === -1) return delay(null);
  const newAction: ClientAction = {
    ...action,
    id: uuidv4(),
    timestamp: Date.now(),
  };
  const actions = [newAction, ...list[idx].actions];
  let status = list[idx].status;
  if (action.type === 'view' && status === 'sent') status = 'viewed';
  if (action.type === 'feedback') status = 'feedback';
  if (action.type === 'decision') status = 'decided';
  list[idx] = { ...list[idx], actions, status, updatedAt: Date.now() };
  writeStorage(list);
  return delay(list[idx]);
}

export async function searchProposals(
  keyword: string,
  status?: ProposalStatus,
): Promise<Proposal[]> {
  const all = readStorage();
  const kw = keyword.trim().toLowerCase();
  const result = all.filter((p) => {
    const matchKw =
      !kw ||
      p.title.toLowerCase().includes(kw) ||
      p.clientName.toLowerCase().includes(kw);
    const matchStatus = !status || p.status === status;
    return matchKw && matchStatus;
  });
  return delay(result.sort((a, b) => b.updatedAt - a.updatedAt), 80);
}

export function calculateTotal(services: ServiceItem[]): number {
  return services.reduce((sum, s) => sum + (Number(s.unitPrice) || 0) * (Number(s.quantity) || 0), 0);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
