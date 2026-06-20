import { useMemo } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useActivityStore } from './store';
import { formatRelativeTime } from '../../utils/format';

export function ActivityFeed() {
  const allActivities = useActivityStore((state) => state.activities);
  const activities = useMemo(() => allActivities.slice(0, 5), [allActivities]);

  return (
    <div className="activity-feed">
      <h3 className="activity-feed__title">活动动态</h3>
      {activities.length === 0 ? (
        <div className="activity-feed__empty">暂无活动记录</div>
      ) : (
        <ul className="activity-feed__list">
          {activities.map((activity) => (
            <li key={activity.id} className="activity-item">
              <div
                className={`activity-item__icon activity-item__icon--${activity.type}`}
              >
                {activity.type === 'like' ? (
                  <Heart size={14} fill="#E74C3C" color="#E74C3C" />
                ) : (
                  <MessageCircle size={14} color="#27AE60" fill="#27AE60" />
                )}
              </div>
              <div className="activity-item__content">
                <p className="activity-item__text">
                  <span className="activity-item__user">{activity.user}</span>
                  {activity.type === 'like' ? (
                    <>
                      <span> 赞了 </span>
                      <span className="activity-item__project">
                        "{activity.projectTitle}"
                      </span>
                    </>
                  ) : (
                    <>
                      <span> 评论了 </span>
                      <span className="activity-item__project">
                        "{activity.projectTitle}"
                      </span>
                      {activity.content && (
                        <span className="activity-item__comment">
                          ："{activity.content}"
                        </span>
                      )}
                    </>
                  )}
                </p>
                <span className="activity-item__time">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
