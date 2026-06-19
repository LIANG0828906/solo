import { ChefHat, Heart, MessageCircle } from 'lucide-react';
import type { Activity } from '../types';
import { socialFeed } from '../module2/socialFeed';

interface ActivityItemProps {
  activity: Activity;
  isNew?: boolean;
}

export default function ActivityItem({ activity, isNew }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'create':
        return <ChefHat className="w-4 h-4" />;
      case 'favorite':
        return <Heart className="w-4 h-4" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <ChefHat className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`activity-item ${isNew ? 'animate-[slideInFromTop_300ms_ease-out]' : ''}`}
    >
      <div className="activity-icon">
        {getIcon()}
      </div>
      <div className="activity-content">
        <p className="activity-title">
          {socialFeed.generateActivityText(activity)}
        </p>
        <p className="activity-time">
          {socialFeed.formatTimeAgo(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}
