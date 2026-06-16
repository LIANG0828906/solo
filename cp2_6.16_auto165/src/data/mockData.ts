import { v4 as uuidv4 } from 'uuid';
import type {
  Volunteer,
  Project,
  Task,
  TaskClaim,
  Transaction,
} from '@/types';

interface SeedActions {
  addVolunteer: (data: Omit<Volunteer, 'id' | 'balance' | 'donated_hours' | 'completed_hours' | 'created_at' | 'last_active'> & Partial<Pick<Volunteer, 'balance' | 'donated_hours' | 'completed_hours'>>) => void;
  createProject: (data: Omit<Project, 'id' | 'achieved_hours' | 'status' | 'created_at'>, tasks?: Omit<Task, 'id' | 'project_id' | 'status' | 'created_at'>[]) => void;
}

const volunteerSeeds = [
  { name: '李明', email: 'liming@example.com', balance: 150, donated_hours: 85, completed_hours: 42 },
  { name: '王芳', email: 'wangfang@example.com', balance: 120, donated_hours: 72, completed_hours: 38 },
  { name: '张伟', email: 'zhangwei@example.com', balance: 200, donated_hours: 95, completed_hours: 51 },
  { name: '刘洋', email: 'liuyang@example.com', balance: 80, donated_hours: 45, completed_hours: 28 },
  { name: '陈静', email: 'chenjing@example.com', balance: 180, donated_hours: 110, completed_hours: 62 },
  { name: '赵强', email: 'zhaoqiang@example.com', balance: 95, donated_hours: 38, completed_hours: 22 },
  { name: '孙丽', email: 'sunli@example.com', balance: 140, donated_hours: 68, completed_hours: 35 },
  { name: '周杰', email: 'zhoujie@example.com', balance: 110, donated_hours: 52, completed_hours: 29 },
];

const projectSeeds = [
  {
    title: '社区图书馆建设',
    description: '为乡村小学建立图书馆，提供课外读物和学习资源，帮助孩子们拓宽视野。',
    goal_hours: 200,
    category: '教育',
    tasks: [
      { title: '图书分类整理', description: '对捐赠图书进行分类、编目和上架', required_hours: 8 },
      { title: '阅读空间布置', description: '设计并布置温馨的阅读角落', required_hours: 12 },
      { title: '读书活动策划', description: '组织周末亲子阅读分享活动', required_hours: 6 },
    ],
  },
  {
    title: '城市公园清洁行动',
    description: '组织志愿者清理城市公园垃圾，维护公共环境，倡导环保意识。',
    goal_hours: 150,
    category: '环保',
    tasks: [
      { title: '垃圾捡拾清理', description: '沿公园步道捡拾分类各类垃圾', required_hours: 4 },
      { title: '绿化养护', description: '协助公园园艺师进行植物养护', required_hours: 6 },
    ],
  },
  {
    title: '老人陪伴计划',
    description: '定期探望社区独居老人，提供陪伴聊天、生活帮助等服务。',
    goal_hours: 300,
    category: '关爱',
    tasks: [
      { title: '日常陪伴探访', description: '上门与老人聊天解闷，帮助做家务', required_hours: 3 },
      { title: '智能手机教学', description: '教老人使用智能手机与家人视频', required_hours: 2 },
      { title: '节庆活动组织', description: '为老人组织生日会和节日庆祝', required_hours: 5 },
    ],
  },
  {
    title: '流浪动物救助站',
    description: '帮助流浪动物救助站进行日常照料、清洁和领养推广工作。',
    goal_hours: 180,
    category: '动物保护',
    tasks: [
      { title: '动物喂食清洁', description: '给猫狗喂食、清洁笼子和活动区域', required_hours: 4 },
      { title: '领养信息发布', description: '拍摄动物照片并在社交平台发布领养信息', required_hours: 3 },
    ],
  },
];

export function seedMockData(actions: SeedActions): void {
  volunteerSeeds.forEach((v) => {
    actions.addVolunteer({
      name: v.name,
      email: v.email,
      balance: v.balance,
      donated_hours: v.donated_hours,
      completed_hours: v.completed_hours,
    });
  });

  projectSeeds.forEach((p) => {
    actions.createProject(
      {
        title: p.title,
        description: p.description,
        goal_hours: p.goal_hours,
        category: p.category,
      },
      p.tasks
    );
  });
}

export { uuidv4 };
