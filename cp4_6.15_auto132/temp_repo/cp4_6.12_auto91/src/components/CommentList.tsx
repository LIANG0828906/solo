import type { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#ffeaa7',
      '#dfe6e9',
      '#a29bfe',
      '#fd79a8',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (sortedComments.length === 0) {
    return (
      <div
        className="text-center py-8 rounded-lg"
        style={{ backgroundColor: '#1a1a