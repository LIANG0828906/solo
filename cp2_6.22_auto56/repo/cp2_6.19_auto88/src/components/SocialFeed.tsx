import { Users } from 'lucide-react';
import type { Activity } from '../types';
import ActivityItem from './ActivityItem';
import EmptyState from './EmptyState';

interface SocialFeedProps {
  activities: Activity[];
}

export default function SocialFeed({ activities }: SocialFeedProps) {
  const displayActivities = activities.slice(0, 20);

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="card p-4 sticky top-24">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">社区动态</h3>
        </div>
        
        {displayActivities.length === 0 ? (
          <EmptyState
            icon={<Users className="empty-state-icon" />}
            title="暂无动态"
            description="还没有任何活动动态，快去创建食谱或收藏美食吧！"
          />
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {displayActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isNew={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
