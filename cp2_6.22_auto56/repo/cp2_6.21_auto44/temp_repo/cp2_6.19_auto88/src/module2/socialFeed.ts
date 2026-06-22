import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow, formatISO } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import * as db from '../utils/db';
import type { Activity, ActivityType } from '../types';

function generateId(): string {
  return uuidv4();
}

function getCurrentTimestamp(): string {
  return formatISO(new Date());
}

async function addActivity(
  type: ActivityType,
  userId: string,
  userName: string,
  recipeId: string,
  recipeTitle: string,
  content?: string
): Promise<Activity> {
  try {
    const activity: Activity = {
      id: generateId(),
      type,
      userId,
      userName,
      recipeId,
      recipeTitle,
      content,
      createdAt: getCurrentTimestamp(),
    };

    await db.add('activities', activity);
    return activity;
  } catch (error) {
    console.error('Failed to add activity:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add activity');
  }
}

async function getActivities(limit: number = 20): Promise<Activity[]> {
  try {
    const activities = await db.getAll<Activity>('activities');
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get activities:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get activities');
  }
}

async function getActivitiesByUser(userId: string, limit: number = 20): Promise<Activity[]> {
  try {
    const activities = await db.getByIndex<Activity>('activities', 'userId', userId);
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get activities by user:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get activities by user');
  }
}

function formatTimeAgo(date: string | Date): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(targetDate, {
      locale: zhCN,
      addSuffix: true,
    });
  } catch (error) {
    console.error('Failed to format time:', error);
    return '未知时间';
  }
}

function generateActivityText(activity: Activity): string {
  const { type, userName, recipeTitle } = activity;
  switch (type) {
    case 'create':
      return `${userName} 创建了食谱 ${recipeTitle}`;
    case 'favorite':
      return `${userName} 收藏了 ${recipeTitle}`;
    case 'comment':
      return `${userName} 评论了 ${recipeTitle}`;
    default:
      return `${userName} 操作了 ${recipeTitle}`;
  }
}

export const socialFeed = {
  addActivity,
  getActivities,
  getActivitiesByUser,
  formatTimeAgo,
  generateActivityText,
};
