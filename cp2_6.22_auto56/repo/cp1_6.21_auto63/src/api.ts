import { Task, Comment, TeamMember } from './types';

const API_BASE = '/api';

export const fetchAllTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/tasks`);
  if (!response.ok) {
    throw new Error('获取任务失败');
  }
  return response.json();
};

export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  const response = await fetch(`${API_BASE}/members`);
  if (!response.ok) {
    throw new Error('获取团队成员失败');
  }
  return response.json();
};

export const createTask = async (data: {
  title: string;
  description: string;
  assigneeId: string;
}): Promise<Task> => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '创建任务失败');
  }
  return response.json();
};

export const updateTaskStatus = async (
  taskId: string,
  data: { status: string; order: number }
): Promise<Task> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新任务状态失败');
  }
  return response.json();
};

export const addComment = async (
  taskId: string,
  data: { content: string; authorId: string }
): Promise<Comment> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '添加评论失败');
  }
  return response.json();
};

export const fetchStats = async (): Promise<{ completedThisWeek: number }> => {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    throw new Error('获取统计数据失败');
  }
  return response.json();
};
