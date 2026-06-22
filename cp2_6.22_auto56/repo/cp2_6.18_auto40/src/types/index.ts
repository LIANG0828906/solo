export interface User {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  radarScores: {
    frontend: number;
    backend: number;
    design: number;
    dataAnalysis: number;
    softSkills: number;
  };
}

export interface Skill {
  id: string;
  userId: string;
  title: string;
  tags: string[];
  description: string;
  category: string;
  createdAt: number;
}

export interface ExchangeRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  skillId: string;
  skillTitle: string;
  exchangeTime: string;
  note: string;
  createdAt: number;
}

export interface Message {
  id: string;
  type: 'invite' | 'accept' | 'reject' | 'system';
  fromUserId: string;
  toUserId: string;
  title: string;
  content: string;
  relatedSkillId?: string;
  relatedInviteId?: string;
  isRead: boolean;
  createdAt: number;
}

export interface Invite {
  id: string;
  fromUserId: string;
  toUserId: string;
  skillId: string;
  skillTitle: string;
  expectedTime: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export type RadarDimension = 'frontend' | 'backend' | 'design' | 'dataAnalysis' | 'softSkills';

export const RADAR_LABELS: Record<RadarDimension, string> = {
  frontend: '前端',
  backend: '后端',
  design: '设计',
  dataAnalysis: '数据分析',
  softSkills: '软技能',
};

export const CATEGORIES = [
  '编程开发',
  '设计创意',
  '音乐艺术',
  '语言学习',
  '生活技能',
  '运动健身',
  '学术知识',
  '职业技能',
];
