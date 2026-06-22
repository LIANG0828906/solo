import type { Volunteer, Project, Task, TaskClaim, TimeTransaction } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function daysAgo(days: number, hours = 0, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

const mockVolunteers: Volunteer[] = [
  {
    id: generateId(),
    name: '张三',
    contact: 'zhangsan@example.com',
    tags: ['教育', '社区服务', '环保'],
    balance_hours: 24.5,
    donated_hours: 56,
    completed_hours: 80.5,
    created_at: daysAgo(60),
    last_active_at: daysAgo(0, -2),
  },
  {
    id: generateId(),
    name: '李四',
    contact: 'lisi@example.com',
    tags: ['动物保护', '教育'],
    balance_hours: 12,
    donated_hours: 32,
    completed_hours: 44,
    created_at: daysAgo(45),
    last_active_at: daysAgo(1),
  },
  {
    id: generateId(),
    name: '王五',
    contact: 'wangwu@example.com',
    tags: ['社区服务', '老人陪伴'],
    balance_hours: 38,
    donated_hours: 78,
    completed_hours: 116,
    created_at: daysAgo(90),
    last_active_at: daysAgo(0, -5),
  },
  {
    id: generateId(),
    name: '赵六',
    contact: 'zhaoliu@example.com',
    tags: ['环保', '植树造林'],
    balance_hours: 8,
    donated_hours: 18,
    completed_hours: 26,
    created_at: daysAgo(20),
    last_active_at: daysAgo(0, -8),
  },
  {
    id: generateId(),
    name: 'Alice Chen',
    contact: 'alice@example.com',
    tags: ['教育', '翻译', '文化交流'],
    balance_hours: 45,
    donated_hours: 92,
    completed_hours: 137,
    created_at: daysAgo(120),
    last_active_at: daysAgo(0, -1),
  },
  {
    id: generateId(),
    name: 'Bob Wang',
    contact: 'bob@example.com',
    tags: ['技术支持', 'IT培训'],
    balance_hours: 15,
    donated_hours: 40,
    completed_hours: 55,
    created_at: daysAgo(35),
    last_active_at: daysAgo(2),
  },
  {
    id: generateId(),
    name: '陈七',
    contact: 'chenqi@example.com',
    tags: ['医疗服务', '急救培训'],
    balance_hours: 28,
    donated_hours: 65,
    completed_hours: 93,
    created_at: daysAgo(75),
    last_active_at: daysAgo(0, -12),
  },
  {
    id: generateId(),
    name: '周八',
    contact: 'zhouba@example.com',
    tags: ['儿童关怀', '教育'],
    balance_hours: 6,
    donated_hours: 12,
    completed_hours: 18,
    created_at: daysAgo(10),
    last_active_at: daysAgo(0, -20),
  },
];

const project1Id = generateId();
const project2Id = generateId();
const project3Id = generateId();
const project4Id = generateId();

const mockProjects: Project[] = [
  {
    id: project1Id,
    name: '乡村小学图书馆建设',
    description: '为偏远地区的乡村小学建立小型图书馆，提供图书捐赠和阅读推广活动，帮助孩子们拓宽视野。',
    cover_image: 'https://picsum.photos/seed/library/800/400',
    required_hours: 200,
    achieved_hours: 145,
    deadline: daysAgo(-30),
    created_at: daysAgo(40),
    status: 'active',
  },
  {
    id: project2Id,
    name: '流浪动物救助站志愿服务',
    description: '协助流浪动物救助站进行日常喂养、清洁、遛狗等工作，同时参与领养宣传活动。',
    cover_image: 'https://picsum.photos/seed/animals/800/400',
    required_hours: 150,
    achieved_hours: 98,
    deadline: daysAgo(-45),
    created_at: daysAgo(25),
    status: 'active',
  },
  {
    id: project3Id,
    name: '社区老人关怀计划',
    description: '定期探访社区独居老人，提供陪伴、生活照料和精神慰藉服务，组织老年人活动。',
    cover_image: 'https://picsum.photos/seed/elderly/800/400',
    required_hours: 300,
    achieved_hours: 300,
    deadline: daysAgo(5),
    created_at: daysAgo(90),
    status: 'closed',
  },
  {
    id: project4Id,
    name: '城市公园绿化行动',
    description: '参与城市公园的植树、除草、垃圾分类等环保活动，共同维护绿色城市环境。',
    cover_image: 'https://picsum.photos/seed/green/800/400',
    required_hours: 180,
    achieved_hours: 72,
    deadline: daysAgo(-60),
    created_at: daysAgo(15),
    status: 'active',
  },
];

const mockTasks: Task[] = [
  { id: generateId(), project_id: project1Id, title: '图书分类整理', required_hours: 4, status: 'completed' },
  { id: generateId(), project_id: project1Id, title: '阅读推广活动策划', required_hours: 8, status: 'in_progress' },
  { id: generateId(), project_id: project1Id, title: '图书运输搬运', required_hours: 6, status: 'open' },
  { id: generateId(), project_id: project2Id, title: '周末动物喂养', required_hours: 3, status: 'in_progress' },
  { id: generateId(), project_id: project2Id, title: '救助站清洁', required_hours: 5, status: 'completed' },
  { id: generateId(), project_id: project2Id, title: '领养日活动协助', required_hours: 8, status: 'open' },
  { id: generateId(), project_id: project3Id, title: '老人日常探访', required_hours: 2, status: 'completed' },
  { id: generateId(), project_id: project3Id, title: '老年智能手机教学', required_hours: 4, status: 'completed' },
  { id: generateId(), project_id: project3Id, title: '社区联欢会组织', required_hours: 10, status: 'completed' },
  { id: generateId(), project_id: project4Id, title: '春季植树活动', required_hours: 6, status: 'open' },
  { id: generateId(), project_id: project4Id, title: '公园垃圾分类宣传', required_hours: 4, status: 'in_progress' },
];

const mockTaskClaims: TaskClaim[] = [
  {
    id: generateId(),
    task_id: mockTasks[0].id,
    volunteer_id: mockVolunteers[0].id,
    claimed_at: daysAgo(5, 2),
    status: 'approved',
    proof_text: '完成500本图书分类整理工作，按类别上架完毕。',
    proof_image: 'https://picsum.photos/seed/proof1/600/400',
  },
  {
    id: generateId(),
    task_id: mockTasks[1].id,
    volunteer_id: mockVolunteers[4].id,
    claimed_at: daysAgo(2, 1),
    status: 'in_progress',
    proof_text: '',
    proof_image: '',
  },
  {
    id: generateId(),
    task_id: mockTasks[3].id,
    volunteer_id: mockVolunteers[1].id,
    claimed_at: daysAgo(0, 3),
    status: 'submitted',
    proof_text: '完成周六全天喂养工作，共照顾15只狗狗和8只猫咪。',
    proof_image: 'https://picsum.photos/seed/proof2/600/400',
  },
  {
    id: generateId(),
    task_id: mockTasks[4].id,
    volunteer_id: mockVolunteers[2].id,
    claimed_at: daysAgo(3, 4),
    status: 'approved',
    proof_text: '深度清洁救助站3个区域，消毒工作已完成。',
    proof_image: 'https://picsum.photos/seed/proof3/600/400',
  },
  {
    id: generateId(),
    task_id: mockTasks[6].id,
    volunteer_id: mockVolunteers[6].id,
    claimed_at: daysAgo(4, 6),
    status: 'approved',
    proof_text: '探访3位独居老人，帮助代购生活用品。',
    proof_image: 'https://picsum.photos/seed/proof4/600/400',
  },
  {
    id: generateId(),
    task_id: mockTasks[7].id,
    volunteer_id: mockVolunteers[5].id,
    claimed_at: daysAgo(6, 8),
    status: 'approved',
    proof_text: '完成8位老人的智能手机基础教学课程。',
    proof_image: 'https://picsum.photos/seed/proof5/600/400',
  },
  {
    id: generateId(),
    task_id: mockTasks[10].id,
    volunteer_id: mockVolunteers[3].id,
    claimed_at: daysAgo(1, 2),
    status: 'in_progress',
    proof_text: '',
    proof_image: '',
  },
];

const mockTimeTransactions: TimeTransaction[] = [
  { id: generateId(), volunteer_id: mockVolunteers[0].id, project_id: project1Id, type: 'complete', hours: 4, created_at: daysAgo(6, 10), description: '图书分类整理' },
  { id: generateId(), volunteer_id: mockVolunteers[0].id, project_id: project3Id, type: 'donate', hours: 6, created_at: daysAgo(5, 3), description: '社区老人探访小时捐赠' },
  { id: generateId(), volunteer_id: mockVolunteers[2].id, project_id: project2Id, type: 'complete', hours: 5, created_at: daysAgo(4, 5), description: '救助站清洁服务' },
  { id: generateId(), volunteer_id: mockVolunteers[4].id, project_id: project1Id, type: 'donate', hours: 8, created_at: daysAgo(4, 12), description: '阅读推广活动策划捐赠' },
  { id: generateId(), volunteer_id: mockVolunteers[6].id, project_id: project3Id, type: 'complete', hours: 2, created_at: daysAgo(5, 2), description: '老人日常探访' },
  { id: generateId(), volunteer_id: mockVolunteers[5].id, project_id: project3Id, type: 'complete', hours: 4, created_at: daysAgo(7, 8), description: '智能手机教学' },
  { id: generateId(), volunteer_id: mockVolunteers[1].id, project_id: project2Id, type: 'donate', hours: 3, created_at: daysAgo(3, 4), description: '周末喂养小时捐赠' },
  { id: generateId(), volunteer_id: mockVolunteers[2].id, project_id: project4Id, type: 'complete', hours: 6, created_at: daysAgo(2, 6), description: '公园绿化志愿服务' },
  { id: generateId(), volunteer_id: mockVolunteers[4].id, project_id: project2Id, type: 'refund', hours: 2, created_at: daysAgo(1, 10), description: '活动取消退款' },
  { id: generateId(), volunteer_id: mockVolunteers[3].id, project_id: project4Id, type: 'donate', hours: 4, created_at: daysAgo(1, 3), description: '垃圾分类宣传小时捐赠' },
  { id: generateId(), volunteer_id: mockVolunteers[6].id, project_id: project1Id, type: 'complete', hours: 3, created_at: daysAgo(0, 5), description: '图书上架协助' },
  { id: generateId(), volunteer_id: mockVolunteers[0].id, project_id: project4Id, type: 'donate', hours: 5, created_at: daysAgo(0, 2), description: '植树活动小时捐赠' },
];

interface StoreActions {
  setVolunteers?: (volunteers: Volunteer[]) => void;
  setProjects?: (projects: Project[]) => void;
  setTasks?: (tasks: Task[]) => void;
  setTaskClaims?: (taskClaims: TaskClaim[]) => void;
  setTimeTransactions?: (transactions: TimeTransaction[]) => void;
  [key: string]: any;
}

export async function seedMockData(storeActions: StoreActions): Promise<boolean> {
  const { getStoreData, setStoreData } = await import('./db');
  const seeded = await getStoreData('seeded');
  if (seeded) return false;

  if (storeActions.setVolunteers) {
    storeActions.setVolunteers(mockVolunteers);
  }
  if (storeActions.setProjects) {
    storeActions.setProjects(mockProjects);
  }
  if (storeActions.setTasks) {
    storeActions.setTasks(mockTasks);
  }
  if (storeActions.setTaskClaims) {
    storeActions.setTaskClaims(mockTaskClaims);
  }
  if (storeActions.setTimeTransactions) {
    storeActions.setTimeTransactions(mockTimeTransactions);
  }

  await setStoreData('seeded', true);
  return true;
}

export { mockVolunteers, mockProjects, mockTasks, mockTaskClaims, mockTimeTransactions };
