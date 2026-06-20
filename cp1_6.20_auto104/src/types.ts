export interface Project {
  id: string;
  name: string;
  engine: 'Unity' | 'Unreal' | 'Godot' | 'Custom';
  customEngine?: string;
  platforms: ('PC' | 'Mobile' | 'Console')[];
  releaseDate: string;
  description: string;
  createdAt: string;
}

export type MilestoneStatus = 'planning' | 'in_progress' | 'frozen' | 'completed';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: MilestoneStatus;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'design' | 'programming' | 'art' | 'audio' | 'qa';
export type TaskStatus = 'unassigned' | 'in_progress' | 'testing' | 'completed';

export interface Task {
  id: string;
  milestoneId: string;
  projectId: string;
  title: string;
  priority: TaskPriority;
  estimatedHours: number;
  assignee: string | null;
  taskType: TaskType;
  status: TaskStatus;
  assetIds: string[];
}

export type AssetStatus = 'in_production' | 'completed';

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | '3d_model' | 'audio' | 'other';
  status: AssetStatus;
}

export interface AppData {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  assets: Asset[];
}

export interface WsMessage {
  type: 'task:status_changed' | 'asset:status_changed' | 'milestone:updated';
  payload: Record<string, unknown>;
  projectId?: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  unassigned: '待分配',
  in_progress: '进行中',
  testing: '测试中',
  completed: '已完成',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  design: '策划',
  programming: '程序',
  art: '美术',
  audio: '音频',
  qa: 'QA',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  planning: '规划',
  in_progress: '进行中',
  frozen: '冻结',
  completed: '完成',
};

export const ASSET_TYPE_LABELS: Record<Asset['type'], string> = {
  image: '图片',
  '3d_model': '3D模型',
  audio: '音频',
  other: '其他',
};

export const ENGINE_LABELS: Record<Project['engine'], string> = {
  Unity: 'Unity',
  Unreal: 'Unreal',
  Godot: 'Godot',
  Custom: '自定义',
};

export const PLATFORM_LABELS: Record<'PC' | 'Mobile' | 'Console', string> = {
  PC: 'PC',
  Mobile: '手机',
  Console: '主机',
};
