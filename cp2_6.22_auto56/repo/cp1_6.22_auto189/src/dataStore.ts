export interface Portfolio {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  workCount: number;
  createdAt: string;
}

export interface Work {
  id: string;
  portfolioId: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: 'illustration' | 'commercial' | 'other';
  expectedDate: string;
  description: string;
  status: 'pending' | 'contacted' | 'completed';
  createdAt: string;
}

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const initialPortfolios: Portfolio[] = [
  {
    id: 'p1',
    name: '人物插画',
    description: '各种风格的人物肖像插画作品',
    coverImage: 'https://picsum.photos/seed/portrait/400/400',
    workCount: 4,
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'p2',
    name: '风景水彩',
    description: '自然风光水彩画作品集',
    coverImage: 'https://picsum.photos/seed/landscape/400/400',
    workCount: 3,
    createdAt: new Date('2024-02-20').toISOString(),
  },
  {
    id: 'p3',
    name: '商业海报',
    description: '商业品牌海报设计作品',
    coverImage: 'https://picsum.photos/seed/poster/400/400',
    workCount: 3,
    createdAt: new Date('2024-03-10').toISOString(),
  },
];

const initialWorks: Work[] = [
  {
    id: 'w1',
    portfolioId: 'p1',
    title: '少女肖像',
    description: '一幅温柔的少女肖像画，使用柔和的粉色调',
    imageUrl: 'https://picsum.photos/seed/girl1/800/1000',
    thumbnailUrl: 'https://picsum.photos/seed/girl1/400/500',
    tags: ['人物', '肖像', '粉色'],
    likes: 128,
    isLiked: false,
    createdAt: new Date('2024-01-20').toISOString(),
  },
  {
    id: 'w2',
    portfolioId: 'p1',
    title: '都市青年',
    description: '现代都市风格的青年人物插画',
    imageUrl: 'https://picsum.photos/seed/boy1/800/800',
    thumbnailUrl: 'https://picsum.photos/seed/boy1/400/400',
    tags: ['人物', '现代', '都市'],
    likes: 89,
    isLiked: false,
    createdAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: 'w3',
    portfolioId: 'p1',
    title: '古风美人',
    description: '中国风古典美人插画',
    imageUrl: 'https://picsum.photos/seed/ancient1/800/1200',
    thumbnailUrl: 'https://picsum.photos/seed/ancient1/400/600',
    tags: ['人物', '古风', '传统'],
    likes: 256,
    isLiked: false,
    createdAt: new Date('2024-02-15').toISOString(),
  },
  {
    id: 'w4',
    portfolioId: 'p1',
    title: '奇幻角色',
    description: '奇幻风格的角色设计',
    imageUrl: 'https://picsum.photos/seed/fantasy1/800/900',
    thumbnailUrl: 'https://picsum.photos/seed/fantasy1/400/450',
    tags: ['人物', '奇幻', '角色设计'],
    likes: 178,
    isLiked: false,
    createdAt: new Date('2024-03-01').toISOString(),
  },
  {
    id: 'w5',
    portfolioId: 'p2',
    title: '山间晨雾',
    description: '清晨山间云雾缭绕的水彩风景',
    imageUrl: 'https://picsum.photos/seed/mountain1/1200/800',
    thumbnailUrl: 'https://picsum.photos/seed/mountain1/600/400',
    tags: ['风景', '山水', '水彩'],
    likes: 203,
    isLiked: false,
    createdAt: new Date('2024-02-25').toISOString(),
  },
  {
    id: 'w6',
    portfolioId: 'p2',
    title: '海边日落',
    description: '金色夕阳下的海岸线',
    imageUrl: 'https://picsum.photos/seed/sunset1/1200/700',
    thumbnailUrl: 'https://picsum.photos/seed/sunset1/600/350',
    tags: ['风景', '海洋', '日落'],
    likes: 312,
    isLiked: false,
    createdAt: new Date('2024-03-05').toISOString(),
  },
  {
    id: 'w7',
    portfolioId: 'p2',
    title: '森林小径',
    description: '幽静的森林小路水彩画',
    imageUrl: 'https://picsum.photos/seed/forest1/1000/800',
    thumbnailUrl: 'https://picsum.photos/seed/forest1/500/400',
    tags: ['风景', '森林', '自然'],
    likes: 167,
    isLiked: false,
    createdAt: new Date('2024-03-15').toISOString(),
  },
  {
    id: 'w8',
    portfolioId: 'p3',
    title: '音乐节海报',
    description: '夏日音乐节活动宣传海报',
    imageUrl: 'https://picsum.photos/seed/music1/600/800',
    thumbnailUrl: 'https://picsum.photos/seed/music1/300/400',
    tags: ['海报', '音乐', '活动'],
    likes: 145,
    isLiked: false,
    createdAt: new Date('2024-03-20').toISOString(),
  },
  {
    id: 'w9',
    portfolioId: 'p3',
    title: '品牌宣传画',
    description: '咖啡品牌的宣传插画',
    imageUrl: 'https://picsum.photos/seed/coffee1/600/900',
    thumbnailUrl: 'https://picsum.photos/seed/coffee1/300/450',
    tags: ['海报', '品牌', '商业'],
    likes: 98,
    isLiked: false,
    createdAt: new Date('2024-04-01').toISOString(),
  },
  {
    id: 'w10',
    portfolioId: 'p3',
    title: '展览海报',
    description: '艺术展览活动海报设计',
    imageUrl: 'https://picsum.photos/seed/art1/600/850',
    thumbnailUrl: 'https://picsum.photos/seed/art1/300/425',
    tags: ['海报', '展览', '艺术'],
    likes: 187,
    isLiked: false,
    createdAt: new Date('2024-04-10').toISOString(),
  },
];

const initialAppointments: Appointment[] = [
  {
    id: 'a1',
    name: '李明',
    email: 'liming@example.com',
    phone: '13800138001',
    serviceType: 'illustration',
    expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '需要一幅个人肖像插画作为生日礼物',
    status: 'pending',
    createdAt: new Date('2024-04-15').toISOString(),
  },
  {
    id: 'a2',
    name: '王芳',
    email: 'wangfang@example.com',
    phone: '13900139002',
    serviceType: 'commercial',
    expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '公司新品发布会需要系列宣传海报设计',
    status: 'contacted',
    createdAt: new Date('2024-04-18').toISOString(),
  },
];

let portfolios: Portfolio[] = [...initialPortfolios];
let works: Work[] = [...initialWorks];
let appointments: Appointment[] = [...initialAppointments];

export const dataStore = {
  getPortfolios: (): Portfolio[] => portfolios,
  getPortfolioById: (id: string): Portfolio | undefined => portfolios.find(p => p.id === id),
  
  getWorks: (portfolioId?: string): Work[] => {
    if (portfolioId) {
      return works.filter(w => w.portfolioId === portfolioId);
    }
    return [...works].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getWorkById: (id: string): Work | undefined => works.find(w => w.id === id),
  
  createWork: (work: Omit<Work, 'id' | 'likes' | 'isLiked' | 'createdAt'>): Work => {
    const newWork: Work = {
      ...work,
      id: generateId(),
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    works.push(newWork);
    
    const portfolio = portfolios.find(p => p.id === work.portfolioId);
    if (portfolio) {
      portfolio.workCount++;
    }
    
    return newWork;
  },
  
  updateWork: (id: string, updates: Partial<Work>): Work | undefined => {
    const index = works.findIndex(w => w.id === id);
    if (index !== -1) {
      works[index] = { ...works[index], ...updates };
      return works[index];
    }
    return undefined;
  },
  
  deleteWork: (id: string): boolean => {
    const index = works.findIndex(w => w.id === id);
    if (index !== -1) {
      const work = works[index];
      works.splice(index, 1);
      
      const portfolio = portfolios.find(p => p.id === work.portfolioId);
      if (portfolio) {
        portfolio.workCount--;
      }
      
      return true;
    }
    return false;
  },
  
  toggleLike: (id: string): { likes: number; isLiked: boolean } | undefined => {
    const work = works.find(w => w.id === id);
    if (work) {
      work.isLiked = !work.isLiked;
      work.likes += work.isLiked ? 1 : -1;
      return { likes: work.likes, isLiked: work.isLiked };
    }
    return undefined;
  },
  
  getAppointments: (): Appointment[] => [...appointments],
  
  createAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Appointment => {
    const newAppointment: Appointment = {
      ...appointment,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    appointments.push(newAppointment);
    return newAppointment;
  },
  
  updateAppointmentStatus: (id: string, status: Appointment['status']): Appointment | undefined => {
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = status;
      return appointments[index];
    }
    return undefined;
  },
};
