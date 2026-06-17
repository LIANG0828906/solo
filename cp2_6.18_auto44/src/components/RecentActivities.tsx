import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useRecentActivities } from '@/store/taskStore';
import { STATUS_LABELS } from '@/types';
import type { ActivityLog } from '@/types';

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RecentActivities: React.FC = () => {
  const activities = useRecentActivities(5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return '#64748B';
      case 'in-progress':
        return '#6366F1';
      case 'done':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="recent-activities">
        <h3 className="recent-activities-title">最近活动</h3>
        <div className="recent-activities-empty">
          暂无活动记录
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activities">
      <h3 className="recent-activities-title">最近活动</h3>
      <ul className="activity-list">
        {activities.map((activity: ActivityLog) => (
          <li key={activity.id} className="activity-item">
            <div className="activity-avatar">
              <div
                className="activity-avatar-circle"
                style={{
                  backgroundColor: getStatusColor(activity.newStatus),
                }}
              >
                {activity.operatorName.slice(-1)}
              </div>
            </div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="activity-operator">{activity.operatorName}</span>
                {' 将任务「'}
                <span className="activity-task-title">{activity.taskTitle}</span>
                {'」从 '}
                <span
                  className="activity-status"
                  style={{ color: getStatusColor(activity.oldStatus) }}
                >
                  {STATUS_LABELS[activity.oldStatus]}
                </span>
                <ArrowRight size={12} className="activity-arrow" />
                <span
                  className="activity-status"
                  style={{ color: getStatusColor(activity.newStatus) }}
                >
                  {STATUS_LABELS[activity.newStatus]}
                </span>
              </div>
              <div className="activity-time">
                <Clock size={12} />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(RecentActivities);
