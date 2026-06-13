import { v4 as uuidv4 } from 'uuid';
import type { Objective, KeyResult, CheckInRecord, CreateObjectiveRequest, UpdateObjectiveRequest, CheckInRequest } from '../types';

const generateId = (): string => uuidv4();

const now = new Date().toISOString();

const initialKeyResults1: KeyResult[] = [
  { id: generateId(), title: '用户满意度NPS达到50+', currentValue: 42, targetValue: 50, confidence: 4, unit: '分' },
  { id: generateId(), title: '核心流程转化率提升15%', currentValue: 68, targetValue: 75, confidence: 3, unit: '%' },
  { id: generateId(), title: '用户反馈响应时间<24小时', currentValue: 32, targetValue: 100, confidence: 5, unit: '%' }
];

const initialKeyResults2: KeyResult[] = [
  { id: generateId(), title: '新增用户10000人', currentValue: 7500, targetValue: 10000, confidence: 3, unit: '人' },
  { id: generateId(), title: 'DAU达到3000', currentValue: 2100, targetValue: 3000, confidence: 2, unit: '人' }
];

const initialKeyResults3: KeyResult[] = [
  { id: generateId(), title: '系统可用性99.9%', currentValue: 99.5, targetValue: 99.9, confidence: 4, unit: '%' },
  { id: generateId(), title: 'API响应时间<100ms', currentValue: 150, targetValue: 100, confidence: 3, unit: 'ms' },
  { id: generateId(), title: '安全漏洞0个', currentValue: 2, targetValue: 0, confidence: 5, unit: '个' }
];

const initialKeyResults4: KeyResult[] = [
  { id: generateId(), title: '完成5个新功能开发', currentValue: 5, targetValue: 5, confidence: 5, unit: '个' },
  { id: generateId(), title: '代码测试覆盖率80%', currentValue: 82, targetValue: 80, confidence: 5, unit: '%' }
];

const initialCheckIns: CheckInRecord[] = [
  { id: generateId(), keyResultId: initialKeyResults1[0].id, date: '2026-04-07', percentComplete: 75, note: '本周完成了3个体验优化', updatedBy: '张明' },
  { id: generateId(), keyResultId: initialKeyResults1[0].id, date: '2026-04-14', percentComplete: 80, note: 'NPS提升至42', updatedBy: '张明' },
  { id: generateId(), keyResultId: initialKeyResults1[0].id, date: '2026-04-21', percentComplete: 84, note: '完成支付流程重构', updatedBy: '张明' },
  { id: generateId(), keyResultId: initialKeyResults1[1].id, date: '2026-04-07', percentComplete: 70, note: '优化了注册流程', updatedBy: '李华' },
  { id: generateId(), keyResultId: initialKeyResults1[1].id, date: '2026-04-14', percentComplete: 85, note: '简化了3个操作步骤', updatedBy: '李华' },
  { id: generateId(), keyResultId: initialKeyResults1[2].id, date: '2026-04-14', percentComplete: 32, note: '建立了客服轮班机制', updatedBy: '王芳' },
  { id: generateId(), keyResultId: initialKeyResults2[0].id, date: '2026-04-07', percentComplete: 60, note: '投放了2个渠道广告', updatedBy: '赵强' },
  { id: generateId(), keyResultId: initialKeyResults2[0].id, date: '2026-04-14', percentComplete: 75, note: '新增用户7500', updatedBy: '赵强' },
  { id: generateId(), keyResultId: initialKeyResults2[1].id, date: '2026-04-07', percentComplete: 50, note: '优化了推送策略', updatedBy: '赵强' },
  { id: generateId(), keyResultId: initialKeyResults2[1].id, date: '2026-04-14', percentComplete: 70, note: 'DAU达到2100', updatedBy: '赵强' },
  { id: generateId(), keyResultId: initialKeyResults3[0].id, date: '2026-04-07', percentComplete: 95, note: '修复了2个高可用问题', updatedBy: '陈伟' },
  { id: generateId(), keyResultId: initialKeyResults3[0].id, date: '2026-04-14', percentComplete: 99, note: '系统可用性99.5%', updatedBy: '陈伟' },
  { id: generateId(), keyResultId: initialKeyResults3[1].id, date: '2026-04-07', percentComplete: 40, note: '优化了数据库查询', updatedBy: '陈伟' },
  { id: generateId(), keyResultId: initialKeyResults3[2].id, date: '2026-04-14', percentComplete: 50, note: '修复了2个安全漏洞', updatedBy: '陈伟' }
];

let objectives: Objective[] = [
  {
    id: generateId(),
    title: '提升产品用户体验',
    description: '通过优化核心流程和减少用户摩擦点，提升整体产品满意度',
    owner: '张明',
    quarter: 'Q2',
    year: 2026,
    status: 'in_progress',
    keyResults: initialKeyResults1,
    checkIns: initialCheckIns.filter(c => initialKeyResults1.some(kr => kr.id === c.keyResultId)),
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: now
  },
  {
    id: generateId(),
    title: '扩大用户规模',
    description: '通过市场推广和产品优化，实现用户数量的快速增长',
    owner: '赵强',
    quarter: 'Q2',
    year: 2026,
    status: 'at_risk',
    keyResults: initialKeyResults2,
    checkIns: initialCheckIns.filter(c => initialKeyResults2.some(kr => kr.id === c.keyResultId)),
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: now
  },
  {
    id: generateId(),
    title: '提升系统稳定性',
    description: '加强基础设施建设，保障系统高可用和高性能',
    owner: '陈伟',
    quarter: 'Q2',
    year: 2026,
    status: 'in_progress',
    keyResults: initialKeyResults3,
    checkIns: initialCheckIns.filter(c => initialKeyResults3.some(kr => kr.id === c.keyResultId)),
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: now
  },
  {
    id: generateId(),
    title: '完成Q1功能交付',
    description: '按计划完成Q1所有计划功能的开发和上线',
    owner: '刘洋',
    quarter: 'Q1',
    year: 2026,
    status: 'completed',
    keyResults: initialKeyResults4,
    checkIns: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-31T00:00:00Z'
  }
];

export const getAllObjectives = (): Objective[] => {
  return objectives;
};

export const getObjectiveById = (id: string): Objective | undefined => {
  return objectives.find(obj => obj.id === id);
};

export const createObjective = (request: CreateObjectiveRequest): Objective => {
  const newObjective: Objective = {
    id: generateId(),
    title: request.title,
    description: request.description,
    owner: request.owner,
    quarter: request.quarter,
    year: request.year,
    status: 'not_started',
    keyResults: request.keyResults.map(kr => ({ ...kr, id: generateId() })),
    checkIns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  objectives.push(newObjective);
  return newObjective;
};

export const updateObjective = (id: string, request: UpdateObjectiveRequest): Objective | undefined => {
  const index = objectives.findIndex(obj => obj.id === id);
  if (index === -1) return undefined;
  
  objectives[index] = {
    ...objectives[index],
    ...request,
    updatedAt: new Date().toISOString()
  };
  return objectives[index];
};

export const deleteObjective = (id: string): boolean => {
  const index = objectives.findIndex(obj => obj.id === id);
  if (index === -1) return false;
  objectives.splice(index, 1);
  return true;
};

export const addCheckIn = (objectiveId: string, request: CheckInRequest): Objective | undefined => {
  const objective = objectives.find(obj => obj.id === objectiveId);
  if (!objective) return undefined;
  
  const kr = objective.keyResults.find(k => k.id === request.keyResultId);
  if (!kr) return undefined;
  
  const checkIn: CheckInRecord = {
    id: generateId(),
    keyResultId: request.keyResultId,
    date: new Date().toISOString().split('T')[0],
    percentComplete: request.percentComplete,
    note: request.note,
    updatedBy: request.updatedBy
  };
  
  kr.currentValue = (request.percentComplete / 100) * kr.targetValue;
  objective.checkIns.push(checkIn);
  objective.updatedAt = new Date().toISOString();
  
  const overallProgress = calculateObjectiveProgress(objective);
  if (overallProgress >= 100) {
    objective.status = 'completed';
  } else if (overallProgress > 0) {
    if (kr.confidence <= 2) {
      objective.status = 'at_risk';
    } else {
      objective.status = 'in_progress';
    }
  }
  
  return objective;
};

export const calculateObjectiveProgress = (objective: Objective): number => {
  if (objective.keyResults.length === 0) return 0;
  const total = objective.keyResults.reduce((sum, kr) => {
    const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
    return sum + progress;
  }, 0);
  return Math.round(total / objective.keyResults.length);
};

export const calculateKRProgress = (kr: KeyResult): number => {
  return Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100);
};
