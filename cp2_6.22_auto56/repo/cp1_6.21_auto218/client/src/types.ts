export interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
  replies: Comment[];
}

export interface Version {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

export const DOCUMENT_TYPES = ['技术方案', '会议记录', '分析报告', '未分类'];
