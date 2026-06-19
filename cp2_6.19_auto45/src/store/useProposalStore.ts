import { create } from 'zustand';
import type { Proposal, ServiceItem, TemplateType, ProposalStatus } from '@/modules/proposal/types';

interface EditorState {
  id: string | null;
  title: string;
  clientName: string;
  template: TemplateType;
  services: ServiceItem[];
  shareLink: string;
  setId: (id: string | null) => void;
  setTitle: (v: string) => void;
  setClientName: (v: string) => void;
  setTemplate: (v: TemplateType) => void;
  addService: (item: ServiceItem) => void;
  updateService: (id: string, patch: Partial<ServiceItem>) => void;
  removeService: (id: string) => void;
  setServices: (items: ServiceItem[]) => void;
  setShareLink: (link: string) => void;
  reset: () => void;
  loadProposal: (p: Proposal) => void;
}

const DEFAULT_SERVICES: ServiceItem[] = [];

export const useProposalStore = create<EditorState>((set) => ({
  id: null,
  title: '',
  clientName: '',
  template: 'minimal',
  services: DEFAULT_SERVICES,
  shareLink: '',
  setId: (id) => set({ id }),
  setTitle: (title) => set({ title }),
  setClientName: (clientName) => set({ clientName }),
  setTemplate: (template) => set({ template }),
  addService: (item) =>
    set((s) => ({ services: s.services.length >= 10 ? s.services : [...s.services, item] })),
  updateService: (id, patch) =>
    set((s) => ({
      services: s.services.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),
  removeService: (id) => set((s) => ({ services: s.services.filter((it) => it.id !== id) })),
  setServices: (services) => set({ services }),
  setShareLink: (shareLink) => set({ shareLink }),
  reset: () =>
    set({
      id: null,
      title: '',
      clientName: '',
      template: 'minimal',
      services: [],
      shareLink: '',
    }),
  loadProposal: (p) =>
    set({
      id: p.id,
      title: p.title,
      clientName: p.clientName,
      template: p.template,
      services: p.services,
      shareLink: p.shareLink,
    }),
}));

interface DashboardState {
  keyword: string;
  statusFilter: ProposalStatus | 'all';
  setKeyword: (k: string) => void;
  setStatusFilter: (s: ProposalStatus | 'all') => void;
}

export const useDashboardFilter = create<DashboardState>((set) => ({
  keyword: '',
  statusFilter: 'all',
  setKeyword: (keyword) => set({ keyword }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
