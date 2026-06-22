import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type {
  Portfolio,
  Photo,
  Inquiry,
  Project,
  ProjectStatus,
  StatusChangeLog,
  AppState,
} from './types';

const SAMPLE_PORTFOLIOS: Portfolio[] = [
  {
    id: uuidv4(),
    name: '婚纱摄影',
    description: '记录人生中最浪漫的时刻，用镜头定格永恒的爱情。',
    tags: ['浪漫', '复古风'],
    coverPhotoId: null,
    photos: [],
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: uuidv4(),
    name: '人像写真',
    description: '捕捉每个人独特的气质与个性，展现真实的自我。',
    tags: ['极简', '自然光'],
    coverPhotoId: null,
    photos: [],
    createdAt: new Date('2026-02-20').toISOString(),
    updatedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: uuidv4(),
    name: '商业广告',
    description: '为品牌打造视觉冲击力强的商业影像作品。',
    tags: ['时尚', '创意'],
    coverPhotoId: null,
    photos: [],
    createdAt: new Date('2026-03-10').toISOString(),
    updatedAt: new Date('2026-03-10').toISOString(),
  },
];

const CLIENT_NAMES = ['张小明', '李婉清', '王思远', '陈雅婷', '刘宇航', '赵子琪', '孙博文', '周雨桐'];
const PROJECT_TYPES = ['婚纱摄影', '个人写真', '商业拍摄', '活动跟拍', '产品摄影', '家庭合影'];
const MESSAGES = [
  '您好！我想咨询一下婚纱摄影的套餐，下个月婚礼，请问还有档期吗？',
  '请问可以拍一组室内极简风格的个人写真吗？预算大概在3000左右。',
  '我们是一家服装品牌，需要拍摄秋冬新品图册，能否报价？',
  '宝宝周岁了，想拍一组有纪念意义的亲子照片，请问怎么收费？',
  '公司年会需要一位摄影师跟拍，时间定在本月底，请回复具体方案。',
];

const generateRandomInquiries = (): Inquiry[] => {
  const inquiries: Inquiry[] = [];
  for (let i = 0; i < 5; i++) {
    inquiries.push({
      id: uuidv4(),
      clientName: CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)],
      email: `client${i + 1}${Math.floor(Math.random() * 1000)}@example.com`,
      projectType: PROJECT_TYPES[Math.floor(Math.random() * PROJECT_TYPES.length)],
      message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 72 * 60 * 60 * 1000)).toISOString(),
      isRead: Math.random() > 0.5,
    });
  }
  return inquiries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const SAMPLE_PROJECTS: Project[] = [
  {
    id: uuidv4(),
    name: '王先生&李小姐婚纱拍摄',
    clientName: '王先生',
    deadline: new Date('2026-07-15').toISOString(),
    previewImage: '',
    status: 'pending',
    statusUpdatedAt: new Date('2026-06-01').toISOString(),
    createdAt: new Date('2026-05-28').toISOString(),
  },
  {
    id: uuidv4(),
    name: '星辰科技产品宣传照',
    clientName: '星辰科技',
    deadline: new Date('2026-06-30').toISOString(),
    previewImage: '',
    status: 'inProgress',
    statusUpdatedAt: new Date('2026-06-05').toISOString(),
    createdAt: new Date('2026-05-20').toISOString(),
  },
  {
    id: uuidv4(),
    name: '张女士个人写真集',
    clientName: '张雅婷',
    deadline: new Date('2026-06-10').toISOString(),
    previewImage: '',
    status: 'inProgress',
    statusUpdatedAt: new Date('2026-06-08').toISOString(),
    createdAt: new Date('2026-05-15').toISOString(),
  },
  {
    id: uuidv4(),
    name: '云端品牌秋冬画册',
    clientName: '云端服饰',
    deadline: new Date('2026-05-25').toISOString(),
    previewImage: '',
    status: 'completed',
    statusUpdatedAt: new Date('2026-05-20').toISOString(),
    createdAt: new Date('2026-04-10').toISOString(),
  },
  {
    id: uuidv4(),
    name: '刘先生家庭合影',
    clientName: '刘先生',
    deadline: new Date('2026-05-05').toISOString(),
    previewImage: '',
    status: 'completed',
    statusUpdatedAt: new Date('2026-04-28').toISOString(),
    createdAt: new Date('2026-04-01').toISOString(),
  },
];

interface Store extends AppState {
  hydrate: () => Promise<void>;
  addPortfolio: (name: string, description: string, tags: string[]) => Promise<void>;
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  addPhoto: (portfolioId: string, photo: Omit<Photo, 'id' | 'uploadedAt' | 'order'>) => Promise<void>;
  deletePhoto: (portfolioId: string, photoId: string) => Promise<void>;
  reorderPhotos: (portfolioId: string, photoIds: string[]) => Promise<void>;
  setCoverPhoto: (portfolioId: string, photoId: string | null) => Promise<void>;
  regenerateInquiries: () => void;
  markInquiryRead: (id: string) => Promise<void>;
  markAllInquiriesRead: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'statusUpdatedAt' | 'createdAt'>) => Promise<void>;
  updateProjectStatus: (id: string, newStatus: ProjectStatus) => Promise<void>;
  persist: () => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  portfolios: [],
  inquiries: [],
  projects: [],
  statusChangeLogs: [],

  hydrate: async () => {
    try {
      const saved = await idbGet('photographer-admin-state') as AppState | undefined;
      if (saved) {
        const newInquiries = generateRandomInquiries();
        set({
          portfolios: saved.portfolios,
          inquiries: newInquiries,
          projects: saved.projects,
          statusChangeLogs: saved.statusChangeLogs,
        });
      } else {
        set({
          portfolios: SAMPLE_PORTFOLIOS,
          inquiries: generateRandomInquiries(),
          projects: SAMPLE_PROJECTS,
          statusChangeLogs: [],
        });
      }
      void get().persist();
    } catch {
      set({
        portfolios: SAMPLE_PORTFOLIOS,
        inquiries: generateRandomInquiries(),
        projects: SAMPLE_PROJECTS,
        statusChangeLogs: [],
      });
    }
  },

  addPortfolio: async (name, description, tags) => {
    const now = new Date().toISOString();
    const portfolio: Portfolio = {
      id: uuidv4(),
      name,
      description,
      tags,
      coverPhotoId: null,
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ portfolios: [...s.portfolios, portfolio] }));
    await get().persist();
  },

  updatePortfolio: async (id, data) => {
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }));
    await get().persist();
  },

  deletePortfolio: async (id) => {
    set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) }));
    await get().persist();
  },

  addPhoto: async (portfolioId, photo) => {
    const now = new Date().toISOString();
    set((s) => ({
      portfolios: s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const newPhoto: Photo = {
          ...photo,
          id: uuidv4(),
          uploadedAt: now,
          order: p.photos.length,
        };
        return {
          ...p,
          photos: [...p.photos, newPhoto],
          coverPhotoId: p.coverPhotoId ?? newPhoto.id,
          updatedAt: now,
        };
      }),
    }));
    await get().persist();
  },

  deletePhoto: async (portfolioId, photoId) => {
    const now = new Date().toISOString();
    set((s) => ({
      portfolios: s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const newPhotos = p.photos.filter((ph) => ph.id !== photoId);
        return {
          ...p,
          photos: newPhotos,
          coverPhotoId: p.coverPhotoId === photoId ? newPhotos[0]?.id ?? null : p.coverPhotoId,
          updatedAt: now,
        };
      }),
    }));
    await get().persist();
  },

  reorderPhotos: async (portfolioId, photoIds) => {
    const now = new Date().toISOString();
    set((s) => ({
      portfolios: s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const ordered = photoIds.map((id, idx) => {
          const photo = p.photos.find((ph) => ph.id === id)!;
          return { ...photo, order: idx };
        });
        return { ...p, photos: ordered, updatedAt: now };
      }),
    }));
    await get().persist();
  },

  setCoverPhoto: async (portfolioId, photoId) => {
    const now = new Date().toISOString();
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === portfolioId ? { ...p, coverPhotoId: photoId, updatedAt: now } : p
      ),
    }));
    await get().persist();
  },

  regenerateInquiries: () => {
    set({ inquiries: generateRandomInquiries() });
  },

  markInquiryRead: async (id) => {
    set((s) => ({
      inquiries: s.inquiries.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
    }));
    await get().persist();
  },

  markAllInquiriesRead: async () => {
    set((s) => ({
      inquiries: s.inquiries.map((i) => ({ ...i, isRead: true })),
    }));
    await get().persist();
  },

  addProject: async (project) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      statusUpdatedAt: now,
      createdAt: now,
    };
    set((s) => ({ projects: [...s.projects, newProject] }));
    await get().persist();
  },

  updateProjectStatus: async (id, newStatus) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const now = new Date().toISOString();
    const log: StatusChangeLog = {
      id: uuidv4(),
      projectId: id,
      projectName: project.name,
      fromStatus: project.status,
      toStatus: newStatus,
      timestamp: now,
    };

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: newStatus, statusUpdatedAt: now } : p
      ),
      statusChangeLogs: [log, ...s.statusChangeLogs].slice(0, 50),
    }));
    await get().persist();
  },

  persist: async () => {
    try {
      const { portfolios, projects, statusChangeLogs } = get();
      await idbSet('photographer-admin-state', {
        portfolios,
        inquiries: [],
        projects,
        statusChangeLogs,
      });
    } catch {
      // ignore persist errors
    }
  },
}));
